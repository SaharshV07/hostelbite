"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderRouter = void 0;
const express_1 = require("express");
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const orderService_1 = require("../services/orderService");
exports.orderRouter = (0, express_1.Router)();
// 1. Validate Cart & Preview Itemized Breakdown
exports.orderRouter.post('/validate-cart', auth_1.requireAuth, (req, res, next) => {
    try {
        const { vendorId, items } = req.body;
        if (!vendorId || !items || !Array.isArray(items)) {
            res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'vendorId and items array are required.' }
            });
            return;
        }
        const calculated = orderService_1.OrderService.calculateOrderTotal(vendorId, items);
        res.json({
            success: true,
            data: {
                vendorId,
                vendorName: calculated.vendor.business_name,
                subtotal: calculated.subtotal,
                deliveryFee: calculated.deliveryFee,
                platformFee: calculated.platformFee,
                totalAmount: calculated.totalAmount,
                minimumOrderValue: Number(calculated.vendor.minimum_order_value),
                items: calculated.resolvedItems.map(ri => ({
                    itemId: ri.item.id,
                    name: ri.item.name,
                    price: ri.item.price,
                    quantity: ri.quantity,
                    subtotal: ri.subtotal,
                    customizationNotes: ri.customizationNotes
                }))
            }
        });
    }
    catch (err) {
        res.status(400).json({
            success: false,
            error: { code: 'CART_VALIDATION_FAILED', message: err.message }
        });
    }
});
// 2. Create Pending Order
exports.orderRouter.post('/', auth_1.requireAuth, (req, res, next) => {
    try {
        const { vendorId, items, deliveryPoint, deliverySlot, specialInstructions } = req.body;
        if (!vendorId || !items || !Array.isArray(items) || items.length === 0) {
            res.status(400).json({
                success: false,
                error: { code: 'EMPTY_CART', message: 'Cart cannot be empty. Select items to order.' }
            });
            return;
        }
        if (!deliveryPoint || deliveryPoint.trim().length === 0) {
            res.status(400).json({
                success: false,
                error: { code: 'MISSING_DELIVERY_POINT', message: 'Please specify your hostel room or delivery point.' }
            });
            return;
        }
        const result = orderService_1.OrderService.createPendingOrder({
            studentId: req.user.userId,
            vendorId,
            deliveryPoint: deliveryPoint.trim(),
            deliverySlot,
            specialInstructions,
            items
        });
        res.status(201).json({
            success: true,
            data: {
                order: result.order,
                items: result.items
            },
            message: 'Order created with Payment Pending status. Please complete payment.'
        });
    }
    catch (err) {
        res.status(400).json({
            success: false,
            error: { code: 'ORDER_CREATION_FAILED', message: err.message }
        });
    }
});
// 3. List Orders (Role Filtered)
exports.orderRouter.get('/', auth_1.requireAuth, (req, res, next) => {
    try {
        const userRole = req.user.role;
        const userId = req.user.userId;
        const { status, limit = 50 } = req.query;
        let sql = `
      SELECT o.*,
             u.name as student_name, u.mobile as student_mobile, u.hostel_block as student_block, u.room_number as student_room,
             v.business_name as vendor_name,
             p.payment_method, p.payment_status,
             da.agent_id as delivery_agent_id, du.name as delivery_agent_name,
             (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o
      JOIN users u ON o.student_id = u.id
      JOIN vendors v ON o.vendor_id = v.id
      LEFT JOIN payments p ON o.id = p.order_id
      LEFT JOIN delivery_assignments da ON o.id = da.order_id
      LEFT JOIN users du ON da.agent_id = du.id
      WHERE 1=1
    `;
        const params = [];
        if (userRole === 'student') {
            sql += ` AND o.student_id = ?`;
            params.push(userId);
        }
        else if (userRole === 'vendor') {
            const vendor = database_1.db.queryOne(`SELECT id FROM vendors WHERE user_id = ?`, [userId]);
            if (!vendor) {
                res.json({ success: true, data: { orders: [] } });
                return;
            }
            sql += ` AND o.vendor_id = ? AND o.status != 'Payment Pending'`;
            params.push(vendor.id);
        }
        else if (userRole === 'delivery') {
            sql += ` AND (o.status IN ('Ready', 'Out for Delivery', 'Delivered') OR da.agent_id = ?)`;
            params.push(userId);
        }
        if (status) {
            sql += ` AND o.status = ?`;
            params.push(status);
        }
        sql += ` ORDER BY o.order_date DESC LIMIT ?`;
        params.push(Number(limit));
        const orders = database_1.db.queryAll(sql, params);
        res.json({ success: true, data: { orders } });
    }
    catch (err) {
        next(err);
    }
});
// 4. Get Single Order Details
exports.orderRouter.get('/:id', auth_1.requireAuth, (req, res, next) => {
    try {
        const order = orderService_1.OrderService.getOrderDetails(req.params.id);
        if (!order) {
            res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Order not found.' }
            });
            return;
        }
        // Role security check
        const userRole = req.user.role;
        const userId = req.user.userId;
        if (userRole === 'student' && order.student_id !== userId) {
            res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied.' } });
            return;
        }
        if (userRole === 'vendor') {
            const vendor = database_1.db.queryOne(`SELECT id FROM vendors WHERE user_id = ?`, [userId]);
            if (!vendor || order.vendor_id !== vendor.id) {
                res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied.' } });
                return;
            }
        }
        res.json({ success: true, data: { order } });
    }
    catch (err) {
        next(err);
    }
});
// 5. Update Order Status
exports.orderRouter.post('/:id/status', auth_1.requireAuth, (req, res, next) => {
    try {
        const { status, reason } = req.body;
        if (!status) {
            res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Target status is required.' }
            });
            return;
        }
        const updated = orderService_1.OrderService.updateOrderStatus(req.params.id, status, req.user.role, req.user.userId, reason);
        res.json({
            success: true,
            data: { order: updated },
            message: `Order status advanced to "${status}".`
        });
    }
    catch (err) {
        res.status(400).json({
            success: false,
            error: { code: 'TRANSITION_ERROR', message: err.message }
        });
    }
});
// 6. Cancel Order
exports.orderRouter.post('/:id/cancel', auth_1.requireAuth, (req, res, next) => {
    try {
        const { reason } = req.body;
        const updated = orderService_1.OrderService.updateOrderStatus(req.params.id, 'Cancelled', req.user.role, req.user.userId, reason || 'Cancelled by user');
        res.json({
            success: true,
            data: { order: updated },
            message: 'Order cancelled successfully. Any payment has been refunded to your wallet.'
        });
    }
    catch (err) {
        res.status(400).json({
            success: false,
            error: { code: 'CANCELLATION_FAILED', message: err.message }
        });
    }
});
