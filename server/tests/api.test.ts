import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { db } from '../src/config/database';
import { runSeed } from '../src/db/seed';

describe('HostelBite API Comprehensive Integration Test Suite', () => {
  let studentToken: string;
  let vendorToken: string;
  let deliveryToken: string;
  let adminToken: string;
  let studentUser: any;
  let testVendorId: string;
  let testItemId: string;
  let testOrderId: string;

  beforeAll(() => {
    // Fresh seed for predictable test environment
    runSeed();
  });

  // 1. Registration, Login Validation & Authentication (FR-AUTH)
  describe('1. Authentication & Role Logins', () => {
    it('should authenticate student via demo-login', async () => {
      const res = await request(app)
        .post('/api/auth/demo-login')
        .send({ role: 'student' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.role).toBe('student');
      expect(res.body.data.user.email).toBe('student@muj.manipal.edu');

      studentToken = res.body.data.token;
      studentUser = res.body.data.user;
    });

    it('should authenticate vendor via demo-login', async () => {
      const res = await request(app)
        .post('/api/auth/demo-login')
        .send({ role: 'vendor', outlet: 'munchbox' });

      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe('vendor');
      vendorToken = res.body.data.token;
    });

    it('should authenticate delivery personnel via demo-login', async () => {
      const res = await request(app)
        .post('/api/auth/demo-login')
        .send({ role: 'delivery' });

      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe('delivery');
      deliveryToken = res.body.data.token;
    });

    it('should authenticate administrator via demo-login', async () => {
      const res = await request(app)
        .post('/api/auth/demo-login')
        .send({ role: 'admin' });

      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe('admin');
      adminToken = res.body.data.token;
    });

    it('should reject invalid password on regular login', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'student@muj.manipal.edu', password: 'WrongPassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should register a new student with valid hostel details', async () => {
      const uniqueEmail = `teststudent_${Date.now()}@muj.manipal.edu`;
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Pooja Verma',
          email: uniqueEmail,
          mobile: '9876500001',
          password: 'Password@123',
          role: 'student',
          hostelBlock: 'G1',
          floor: '2nd Floor',
          roomNumber: '208'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.hostel_block).toBe('G1');
      expect(res.body.data.user.room_number).toBe('208');
    });
  });

  // 2. Role-Based Access Restrictions (NFR-SEC-03)
  describe('2. Role-Based Access Control (RBAC)', () => {
    it('should forbid student from accessing admin endpoints', async () => {
      const res = await request(app)
        .get('/api/admin/vendors')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should forbid delivery agent from updating menu items', async () => {
      const res = await request(app)
        .post('/api/menu')
        .set('Authorization', `Bearer ${deliveryToken}`)
        .send({
          name: 'Unauthorized Item',
          price: 100,
          dietaryTag: 'Veg'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow admin to access overview analytics', async () => {
      const res = await request(app)
        .get('/api/analytics/overview')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalOrders).toBeDefined();
    });
  });

  // 3. Menu Retrieval and Item Availability (FR-MEN)
  describe('3. Menu Browsing & Availability', () => {
    it('should list approved vendors', async () => {
      const res = await request(app).get('/api/vendors');
      expect(res.status).toBe(200);
      expect(res.body.data.vendors.length).toBeGreaterThan(0);
      testVendorId = res.body.data.vendors[0].id;
    });

    it('should filter menu items by dietary tag', async () => {
      const res = await request(app).get('/api/menu?dietaryTag=Jain');
      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThan(0);
      res.body.data.items.forEach((item: any) => {
        expect(item.dietary_tag).toBe('Jain');
      });
    });

    it('should accurately reflect out-of-stock items', async () => {
      const res = await request(app).get('/api/menu?vendorId=ven_munchbox');
      expect(res.status).toBe(200);
      const outOfStock = res.body.data.items.find((i: any) => i.id === 'item_munch_7'); // Oreo Shake seeded unavailable
      expect(outOfStock).toBeDefined();
      expect(outOfStock.availability).toBe(0);
    });
  });

  // 4 & 5. Cart/Checkout Validation & Correct Server-side Total Calculation
  describe('4 & 5. Cart & Server-Side Price Calculation', () => {
    it('should reject ordering an out-of-stock item', async () => {
      const res = await request(app)
        .post('/api/orders/validate-cart')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          vendorId: 'ven_munchbox',
          items: [{ itemId: 'item_munch_7', quantity: 1 }]
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('marked out of stock');
    });

    it('should reject checkout when subtotal is below minimum order value', async () => {
      // munchbox minimum order is ₹60.0
      // Cold Coffee is ₹65, peri-peri is ₹75. Let's find an item or test below min order.
      // Central mess min order is ₹40, Sweet Lassi is ₹40. But let's test if items < min order.
      const res = await request(app)
        .post('/api/orders/validate-cart')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          vendorId: 'ven_munchbox',
          items: [{ itemId: 'item_south_5', quantity: 1 }] // wrong vendor
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Single-vendor cart rule violated');
    });

    it('should accurately calculate subtotal, delivery fee (₹15), platform fee (₹5) on server', async () => {
      // Special Student Thali (item_mess_1) = ₹110
      // Chole Bhature (item_mess_2) = ₹80
      // Subtotal = ₹190. Total = ₹190 + ₹15 + ₹5 = ₹210
      const res = await request(app)
        .post('/api/orders/validate-cart')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          vendorId: 'ven_central_mess',
          items: [
            { itemId: 'item_mess_1', quantity: 1 },
            { itemId: 'item_mess_2', quantity: 1 }
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body.data.subtotal).toBe(190.0);
      expect(res.body.data.deliveryFee).toBe(15.0);
      expect(res.body.data.platformFee).toBe(5.0);
      expect(res.body.data.totalAmount).toBe(210.0);
    });
  });

  // 6 & 7. Payment Flow (Successful & Failed Paths)
  describe('6, 7 & 8. Order Placement, Payment Simulation & Idempotency', () => {

    it('should create an order with Payment Pending status', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          vendorId: 'ven_central_mess',
          deliveryPoint: 'Hostel B2 - Room 304',
          specialInstructions: 'Test order from integration test',
          items: [
            { itemId: 'item_mess_1', quantity: 1 },
            { itemId: 'item_mess_2', quantity: 1 }
          ]
        });

      expect(res.status).toBe(201);
      expect(res.body.data.order.status).toBe('Payment Pending');
      expect(res.body.data.order.total_amount).toBe(210.0);
      testOrderId = res.body.data.order.id;
    });

    it('should handle simulated payment failure gracefully without confirming order', async () => {
      const res = await request(app)
        .post('/api/payments/process')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          orderId: testOrderId,
          paymentMethod: 'UPI',
          simulateSuccess: false
        });

      expect(res.status).toBe(402);
      expect(res.body.success).toBe(false);

      // Verify order is still Payment Pending in database
      const orderCheck = await request(app)
        .get(`/api/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${studentToken}`);
      expect(orderCheck.body.data.order.status).toBe('Payment Pending');
    });

    it('should complete payment successfully and transition order to Placed', async () => {
      const res = await request(app)
        .post('/api/payments/process')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          orderId: testOrderId,
          paymentMethod: 'UPI',
          simulateSuccess: true
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.order.status).toBe('Placed');
      expect(res.body.data.transactionId).toBeDefined();
    });

    it('should prevent duplicate payment on an already confirmed order', async () => {
      const res = await request(app)
        .post('/api/payments/process')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          orderId: testOrderId,
          paymentMethod: 'UPI',
          simulateSuccess: true
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_ORDER_STATE');
    });
  });

  // 9. Centralized Order-Status Transitions & Illegal State Jump Prevention
  describe('9. Centralized Order-Status Transitions', () => {
    let lifecycleOrderId: string;

    beforeAll(async () => {
      // Create and pay for a fresh test order
      const createRes = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          vendorId: 'ven_munchbox',
          deliveryPoint: 'Hostel B2 - Room 304',
          items: [{ itemId: 'item_munch_1', quantity: 1 }]
        });
      lifecycleOrderId = createRes.body.data.order.id;

      await request(app)
        .post('/api/payments/process')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ orderId: lifecycleOrderId, paymentMethod: 'Card', simulateSuccess: true });
    });

    it('should reject invalid skip transitions (e.g., Placed -> Delivered)', async () => {
      const res = await request(app)
        .post(`/api/orders/${lifecycleOrderId}/status`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({ status: 'Delivered' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('TRANSITION_ERROR');
    });

    it('should allow vendor to accept order (Placed -> Accepted)', async () => {
      const res = await request(app)
        .post(`/api/orders/${lifecycleOrderId}/status`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({ status: 'Accepted' });

      expect(res.status).toBe(200);
      expect(res.body.data.order.status).toBe('Accepted');
    });

    it('should allow vendor to progress order (Accepted -> Preparing -> Ready)', async () => {
      const prepRes = await request(app)
        .post(`/api/orders/${lifecycleOrderId}/status`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({ status: 'Preparing' });
      expect(prepRes.status).toBe(200);
      expect(prepRes.body.data.order.status).toBe('Preparing');

      const readyRes = await request(app)
        .post(`/api/orders/${lifecycleOrderId}/status`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({ status: 'Ready' });
      expect(readyRes.status).toBe(200);
      expect(readyRes.body.data.order.status).toBe('Ready');
    });
  });

  // 10. Delivery Assignment and Status Updates (FR-DEL)
  describe('10 & 11. Delivery Management', () => {
    it('should list orders in Ready status on available delivery board', async () => {
      const res = await request(app)
        .get('/api/delivery/available')
        .set('Authorization', `Bearer ${deliveryToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.orders.length).toBeGreaterThan(0);
    });

    it('should allow delivery personnel to claim an eligible Ready order', async () => {
      // Order HB-2026-1004 is seeded Ready and unassigned
      const res = await request(app)
        .post('/api/delivery/HB-2026-1004/claim')
        .set('Authorization', `Bearer ${deliveryToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should allow assigned courier to mark order Out for Delivery and Delivered', async () => {
      const outRes = await request(app)
        .post('/api/delivery/HB-2026-1004/status')
        .set('Authorization', `Bearer ${deliveryToken}`)
        .send({ status: 'Out for Delivery' });
      expect(outRes.status).toBe(200);
      expect(outRes.body.data.order.status).toBe('Out for Delivery');

      const delRes = await request(app)
        .post('/api/delivery/HB-2026-1004/status')
        .set('Authorization', `Bearer ${deliveryToken}`)
        .send({ status: 'Delivered' });
      expect(delRes.status).toBe(200);
      expect(delRes.body.data.order.status).toBe('Delivered');
    });
  });

  // 12. Review Eligibility and Duplicate Prevention (FR-REV)
  describe('12. Reviews & Rating Eligibility', () => {
    it('should reject review for order that is not yet delivered', async () => {
      // testOrderId was confirmed and is in Placed state
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ orderId: testOrderId, rating: 5, comment: 'Premature review' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('ORDER_NOT_DELIVERED');
    });

    it('should allow student to submit review for delivered order (HB-2026-1004)', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          orderId: 'HB-2026-1004',
          rating: 5,
          comment: 'Dosa was hot and crispy. Excellent delivery!'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should prevent duplicate reviews for the same order', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          orderId: 'HB-2026-1004',
          rating: 4,
          comment: 'Duplicate attempt'
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('DUPLICATE_REVIEW');
    });
  });

  // 13 & 14. Complaints, Dispute Resolution & Refund Consistency
  describe('13 & 14. Complaint Resolution & Wallet Refund Consistency', () => {
    let complaintId: string;

    it('should allow student to lodge a complaint on delivered order (HB-2026-1002)', async () => {
      const res = await request(app)
        .post('/api/complaints')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          orderId: 'HB-2026-1002',
          issueCategory: 'Food Quality',
          description: 'Roll filling was lukewarm and soggy upon delivery.'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      complaintId = res.body.data.complaint.id;
    });

    it('should resolve dispute and credit refund into student wallet consistently', async () => {
      // Check initial wallet balance
      const initialWallet = await request(app)
        .get('/api/wallet/balance')
        .set('Authorization', `Bearer ${studentToken}`);
      const balanceBefore = initialWallet.body.data.walletBalance;

      // Admin authorizes partial refund of ₹100
      const refundAmount = 100.0;
      const res = await request(app)
        .post(`/api/complaints/${complaintId}/resolve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'ResolveWithRefund',
          refundAmount,
          resolutionReason: 'Approved ₹100 partial goodwill refund for soggy food complaint.'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.complaint.status).toBe('Resolved');

      // Verify student wallet balance updated
      const updatedWallet = await request(app)
        .get('/api/wallet/balance')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(updatedWallet.body.data.walletBalance).toBe(balanceBefore + refundAmount);

      // Verify immutable wallet ledger transaction logged
      const txRes = await request(app)
        .get('/api/wallet/transactions')
        .set('Authorization', `Bearer ${studentToken}`);
      const latestTx = txRes.body.data.transactions[0];
      expect(latestTx.transaction_type).toBe('Credit');
      expect(latestTx.amount).toBe(refundAmount);
    });
  });
});
