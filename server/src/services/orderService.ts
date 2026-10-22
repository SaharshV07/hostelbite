import { db } from '../config/database';
import { Order, OrderItem, OrderStatus, MenuItem, Vendor, User } from '../types';
import { NotificationService } from './notificationService';
import { PaymentService } from './paymentService';

export interface CreateOrderInputItem {
  itemId: string;
  quantity: number;
  customizationNotes?: string;
}

export interface CreateOrderInput {
  studentId: string;
  vendorId: string;
  deliveryPoint: string;
  deliverySlot?: string;
  specialInstructions?: string;
  items: CreateOrderInputItem[];
}

export class OrderService {
  public static readonly DELIVERY_FEE = 15.0;
  public static readonly PLATFORM_FEE = 5.0;

  public static readonly VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    'Payment Pending': ['Placed', 'Cancelled'],
    'Placed': ['Accepted', 'Cancelled'],
    'Accepted': ['Preparing', 'Cancelled'],
    'Preparing': ['Ready'],
    'Ready': ['Out for Delivery', 'Cancelled'],
    'Out for Delivery': ['Delivered'],
    'Delivered': ['Disputed'],
    'Cancelled': [],
    'Disputed': ['Delivered']
  };

  public static isValidTransition(current: OrderStatus, next: OrderStatus): boolean {
    const allowed = this.VALID_TRANSITIONS[current] || [];
    return allowed.includes(next);
  }

  public static calculateOrderTotal(vendorId: string, items: CreateOrderInputItem[]): {
    subtotal: number;
    deliveryFee: number;
    platformFee: number;
    totalAmount: number;
    resolvedItems: Array<{
      item: MenuItem;
      quantity: number;
      subtotal: number;
      customizationNotes?: string;
    }>;
    vendor: Vendor;
  } {
    if (!items || items.length === 0) {
      throw new Error('Order must contain at least one menu item.');
    }

    const vendor = db.queryOne<Vendor>(`SELECT * FROM vendors WHERE id = ?`, [vendorId]);
    if (!vendor) {
      throw new Error('Vendor not found.');
    }

    if (vendor.status !== 'approved') {
      throw new Error('Vendor is not currently active for orders.');
    }

    if (!vendor.accepting_orders) {
      throw new Error(`${vendor.business_name} is temporarily not accepting new orders.`);
    }

    let subtotal = 0;
    const resolvedItems: Array<{
      item: MenuItem;
      quantity: number;
      subtotal: number;
      customizationNotes?: string;
    }> = [];

    for (const inputItem of items) {
      if (inputItem.quantity <= 0) {
        throw new Error('Item quantity must be greater than zero.');
      }

      const menuItem = db.queryOne<MenuItem>(`SELECT * FROM menu_items WHERE id = ?`, [inputItem.itemId]);
      if (!menuItem) {
        throw new Error(`Menu item not found: ${inputItem.itemId}`);
      }

      if (menuItem.vendor_id !== vendorId) {
        throw new Error(`All items must belong to the same vendor (${vendor.business_name}). Single-vendor cart rule violated.`);
      }

      if (!menuItem.availability) {
        throw new Error(`Item "${menuItem.name}" is currently marked out of stock by the kitchen.`);
      }

      const lineSubtotal = Number((menuItem.price * inputItem.quantity).toFixed(2));
      subtotal += lineSubtotal;

      resolvedItems.push({
        item: menuItem,
        quantity: inputItem.quantity,
        subtotal: lineSubtotal,
        customizationNotes: inputItem.customizationNotes
      });
    }

    subtotal = Number(subtotal.toFixed(2));

    if (subtotal < Number(vendor.minimum_order_value)) {
      throw new Error(`Minimum order value for ${vendor.business_name} is ₹${Number(vendor.minimum_order_value).toFixed(2)}. Current subtotal is ₹${subtotal.toFixed(2)}.`);
    }

    const deliveryFee = this.DELIVERY_FEE;
    const platformFee = this.PLATFORM_FEE;
    const totalAmount = Number((subtotal + deliveryFee + platformFee).toFixed(2));

    return {
      subtotal,
      deliveryFee,
      platformFee,
      totalAmount,
      resolvedItems,
      vendor
    };
  }

  public static createPendingOrder(input: CreateOrderInput): { order: Order; items: OrderItem[] } {
    return db.transaction(() => {
      const student = db.queryOne<User>(`SELECT * FROM users WHERE id = ?`, [input.studentId]);
      if (!student) {
        throw new Error('Student user not found.');
      }

      const calculated = this.calculateOrderTotal(input.vendorId, input.items);

      const orderCount = db.queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM orders`)?.count || 0;
      const orderId = `HB-${new Date().getFullYear()}-${String(1001 + Number(orderCount)).padStart(4, '0')}`;

      const deliverySlot = input.deliverySlot || 'Immediate';
      const specialInstructions = input.specialInstructions || null;

      db.execute(
        `INSERT INTO orders (
          id, student_id, vendor_id, delivery_point, delivery_slot,
          subtotal, delivery_fee, platform_fee, total_amount, status,
          special_instructions, order_date, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Payment Pending', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          orderId,
          input.studentId,
          input.vendorId,
          input.deliveryPoint,
          deliverySlot,
          calculated.subtotal,
          calculated.deliveryFee,
          calculated.platformFee,
          calculated.totalAmount,
          specialInstructions
        ]
      );

      const createdItems: OrderItem[] = [];
      for (const resItem of calculated.resolvedItems) {
        const orderItemId = `oi_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        db.execute(
          `INSERT INTO order_items (
            id, order_id, item_id, item_name, quantity, unit_price, subtotal, customization_notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            orderItemId,
            orderId,
            resItem.item.id,
            resItem.item.name,
            resItem.quantity,
            resItem.item.price,
            resItem.subtotal,
            resItem.customizationNotes || null
          ]
        );

        createdItems.push({
          id: orderItemId,
          order_id: orderId,
          item_id: resItem.item.id,
          item_name: resItem.item.name,
          quantity: resItem.quantity,
          unit_price: resItem.item.price,
          subtotal: resItem.subtotal,
          customization_notes: resItem.customizationNotes || null
        });
      }

      const fullOrder = db.queryOne<Order>(`SELECT * FROM orders WHERE id = ?`, [orderId])!;
      return { order: fullOrder, items: createdItems };
    });
  }

  public static confirmPaidOrder(orderId: string): Order {
    return db.transaction(() => {
      const order = db.queryOne<Order>(`SELECT * FROM orders WHERE id = ?`, [orderId]);
      if (!order) {
        throw new Error('Order not found.');
      }

      if (order.status !== 'Payment Pending') {
        return order; // already confirmed or moved
      }

      db.execute(
        `UPDATE orders SET status = 'Placed', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [orderId]
      );

      // Notify vendor
      const vendor = db.queryOne<Vendor>(`SELECT * FROM vendors WHERE id = ?`, [order.vendor_id]);
      if (vendor) {
        NotificationService.createNotification(
          vendor.user_id,
          'New Order Received!',
          `Order #${order.id} for ₹${Number(order.total_amount).toFixed(2)} is confirmed and waiting for your acceptance.`,
          'order',
          `/vendor/orders`
        );
      }

      // Notify student
      NotificationService.createNotification(
        order.student_id,
        'Order Placed Successfully',
        `Your order #${order.id} has been placed with ${vendor?.business_name || 'the kitchen'}. Delivery to: ${order.delivery_point}.`,
        'order',
        `/orders/${order.id}`
      );

      return db.queryOne<Order>(`SELECT * FROM orders WHERE id = ?`, [orderId])!;
    });
  }

  public static updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    actorRole: string,
    actorId: string,
    reason?: string
  ): Order {
    return db.transaction(() => {
      const order = db.queryOne<Order>(`SELECT * FROM orders WHERE id = ?`, [orderId]);
      if (!order) {
        throw new Error('Order not found.');
      }

      if (!this.isValidTransition(order.status, newStatus)) {
        throw new Error(`Invalid status transition from "${order.status}" to "${newStatus}".`);
      }

      const vendor = db.queryOne<Vendor>(`SELECT * FROM vendors WHERE id = ?`, [order.vendor_id]);

      // Role authorization for status changes
      if (actorRole === 'student') {
        if (newStatus === 'Cancelled') {
          if (order.status !== 'Placed') {
            throw new Error('Students can only cancel orders while in "Placed" state prior to vendor acceptance.');
          }
          if (order.student_id !== actorId) {
            throw new Error('Unauthorized to cancel this order.');
          }
        } else {
          throw new Error('Students cannot perform this status update.');
        }
      } else if (actorRole === 'vendor') {
        if (vendor && vendor.user_id !== actorId) {
          throw new Error('You can only update orders for your own food outlet.');
        }
        if (!['Accepted', 'Preparing', 'Ready', 'Cancelled'].includes(newStatus)) {
          throw new Error(`Vendors cannot update order status to "${newStatus}".`);
        }
      } else if (actorRole === 'delivery') {
        if (!['Out for Delivery', 'Delivered'].includes(newStatus)) {
          throw new Error(`Delivery personnel cannot update order status to "${newStatus}".`);
        }
      }

      // Handle cancellation & automatic refund if paid
      if (newStatus === 'Cancelled') {
        db.execute(
          `UPDATE orders SET status = 'Cancelled', cancellation_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [reason || 'Cancelled by user/vendor', orderId]
        );

        // Refund to wallet if order was paid
        const payment = db.queryOne<{ payment_status: string }>(`SELECT payment_status FROM payments WHERE order_id = ?`, [orderId]);
        if (payment && payment.payment_status === 'Success') {
          PaymentService.refundToWallet(
            order.student_id,
            order.id,
            Number(order.total_amount),
            reason ? `Order cancelled: ${reason}` : 'Order cancelled'
          );
        }

        NotificationService.createNotification(
          order.student_id,
          'Order Cancelled',
          `Order #${order.id} was cancelled. ${reason ? 'Reason: ' + reason : ''}`,
          'order',
          `/orders/${order.id}`
        );

        return db.queryOne<Order>(`SELECT * FROM orders WHERE id = ?`, [orderId])!;
      }

      // Normal state update
      db.execute(
        `UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [newStatus, orderId]
      );

      // Trigger notifications according to status
      if (newStatus === 'Accepted') {
        NotificationService.createNotification(
          order.student_id,
          'Order Accepted by Kitchen',
          `${vendor?.business_name || 'Vendor'} has accepted order #${order.id}. Kitchen prep starting soon.`,
          'order',
          `/orders/${order.id}`
        );
      } else if (newStatus === 'Preparing') {
        NotificationService.createNotification(
          order.student_id,
          'Food Being Prepared',
          `Your meal for order #${order.id} is now cooking!`,
          'order',
          `/orders/${order.id}`
        );
      } else if (newStatus === 'Ready') {
        NotificationService.createNotification(
          order.student_id,
          'Order Ready for Pickup',
          `Order #${order.id} is packed and ready for delivery courier dispatch.`,
          'order',
          `/orders/${order.id}`
        );
        // Alert delivery agents
        const deliveryAgents = db.queryAll<User>(`SELECT id FROM users WHERE role = 'delivery' AND status = 'active'`);
        for (const agent of deliveryAgents) {
          NotificationService.createNotification(
            agent.id,
            'New Delivery Available!',
            `Order #${order.id} from ${vendor?.business_name || 'Campus Kitchen'} is ready for pickup to ${order.delivery_point}.`,
            'delivery',
            `/delivery`
          );
        }
      } else if (newStatus === 'Out for Delivery') {
        NotificationService.createNotification(
          order.student_id,
          'Out for Delivery!',
          `Your order #${order.id} has been picked up and is on the way to ${order.delivery_point}.`,
          'delivery',
          `/orders/${order.id}`
        );
      } else if (newStatus === 'Delivered') {
        NotificationService.createNotification(
          order.student_id,
          'Order Delivered - Enjoy your meal!',
          `Order #${order.id} has been delivered at ${order.delivery_point}. Please rate your experience!`,
          'order',
          `/orders/${order.id}`
        );
        if (vendor) {
          NotificationService.createNotification(
            vendor.user_id,
            'Order Delivered',
            `Order #${order.id} was successfully delivered to the student.`,
            'order'
          );
        }
      }

      return db.queryOne<Order>(`SELECT * FROM orders WHERE id = ?`, [orderId])!;
    });
  }

  public static getOrderDetails(orderId: string): Order | null {
    const order = db.queryOne<Order>(
      `SELECT o.*, 
              u.name as student_name, u.email as student_email, u.mobile as student_mobile,
              u.hostel_block as student_block, u.room_number as student_room,
              v.business_name as vendor_name,
              da.agent_id as delivery_agent_id, da.status as delivery_status,
              du.name as delivery_agent_name
       FROM orders o
       JOIN users u ON o.student_id = u.id
       JOIN vendors v ON o.vendor_id = v.id
       LEFT JOIN delivery_assignments da ON o.id = da.order_id
       LEFT JOIN users du ON da.agent_id = du.id
       WHERE o.id = ?`,
      [orderId]
    );

    if (!order) return null;

    order.items = db.queryAll<OrderItem>(
      `SELECT * FROM order_items WHERE order_id = ?`,
      [orderId]
    );

    order.payment = db.queryOne<any>(
      `SELECT * FROM payments WHERE order_id = ?`,
      [orderId]
    );

    return order;
  }
}
