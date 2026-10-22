"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.complaintRouter = void 0;
const express_1 = require("express");
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const paymentService_1 = require("../services/paymentService");
const notificationService_1 = require("../services/notificationService");
exports.complaintRouter = (0, express_1.Router)();
// 1. Submit a Complaint (Student Only)
exports.complaintRouter.post('/', auth_1.requireAuth, (0, auth_1.requireRole)('student'), (req, res, next) => {
    try {
        const { orderId, issueCategory, description } = req.body;
        const studentId = req.user.userId;
        if (!orderId || !issueCategory || !description) {
            res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'orderId, issueCategory, and description are required.' }
            });
            return;
        }
        const order = database_1.db.queryOne(`SELECT * FROM orders WHERE id = ?`, [orderId]);
        if (!order) {
            res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found.' } });
            return;
        }
        if (order.student_id !== studentId) {
            res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Unauthorized.' } });
            return;
        }
        if (order.status !== 'Delivered' && order.status !== 'Disputed') {
            res.status(400).json({
                success: false,
                error: { code: 'NOT_ELIGIBLE', message: 'Complaints can only be filed after an order is delivered.' }
            });
            return;
        }
        // 12-hour eligibility window check (BR-09, FR-CMP-01)
        const orderTime = new Date(order.updated_at || order.order_date).getTime();
        const now = Date.now();
        const hoursElapsed = (now - orderTime) / (1000 * 60 * 60);
        if (hoursElapsed > 12) {
            res.status(400).json({
                success: false,
                error: { code: 'WINDOW_EXPIRED', message: 'The 12-hour complaint window for this order has expired.' }
            });
            return;
        }
        const existing = database_1.db.queryOne(`SELECT * FROM complaints WHERE order_id = ?`, [orderId]);
        if (existing) {
            res.status(409).json({
                success: false,
                error: { code: 'DUPLICATE_COMPLAINT', message: 'A complaint has already been submitted for this order.' }
            });
            return;
        }
        const complaintId = `CMP_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        database_1.db.transaction(() => {
            database_1.db.execute(`INSERT INTO complaints (id, order_id, student_id, vendor_id, issue_category, description, status, refund_amount, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'Open', 0.0, CURRENT_TIMESTAMP)`, [complaintId, orderId, studentId, order.vendor_id, issueCategory, description.trim()]);
            // Flag order status as Disputed
            database_1.db.execute(`UPDATE orders SET status = 'Disputed', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [orderId]);
            // Notify Vendor and Admin
            const vendor = database_1.db.queryOne(`SELECT * FROM vendors WHERE id = ?`, [order.vendor_id]);
            if (vendor) {
                notificationService_1.NotificationService.createNotification(vendor.user_id, 'Customer Complaint Raised', `Order #${order.id} has a new complaint (${issueCategory}): "${description}". Please review.`, 'alert', `/vendor/complaints`);
            }
            const adminUsers = database_1.db.queryAll(`SELECT id FROM users WHERE role = 'admin'`);
            for (const adm of adminUsers) {
                notificationService_1.NotificationService.createNotification(adm.id, 'New Complaint Lodged', `Order #${order.id} under ${vendor?.business_name || 'Vendor'} has an open dispute.`, 'alert', `/admin/complaints`);
            }
        });
        const created = database_1.db.queryOne(`SELECT * FROM complaints WHERE id = ?`, [complaintId]);
        res.status(201).json({
            success: true,
            data: { complaint: created },
            message: 'Complaint submitted. The kitchen and hostel administration have been notified.'
        });
    }
    catch (err) {
        next(err);
    }
});
// 2. List Complaints (Role Filtered)
exports.complaintRouter.get('/', auth_1.requireAuth, (req, res, next) => {
    try {
        const userRole = req.user.role;
        const userId = req.user.userId;
        let sql = `
      SELECT c.*,
             u.name as student_name, u.email as student_email, u.mobile as student_mobile, u.hostel_block as student_block, u.room_number as student_room,
             v.business_name as vendor_name,
             o.total_amount as order_total, o.order_date
      FROM complaints c
      JOIN users u ON c.student_id = u.id
      JOIN vendors v ON c.vendor_id = v.id
      JOIN orders o ON c.order_id = o.id
      WHERE 1=1
    `;
        const params = [];
        if (userRole === 'student') {
            sql += ` AND c.student_id = ?`;
            params.push(userId);
        }
        else if (userRole === 'vendor') {
            const vendor = database_1.db.queryOne(`SELECT id FROM vendors WHERE user_id = ?`, [userId]);
            if (!vendor) {
                res.json({ success: true, data: { complaints: [] } });
                return;
            }
            sql += ` AND c.vendor_id = ?`;
            params.push(vendor.id);
        }
        sql += ` ORDER BY c.created_at DESC`;
        const complaints = database_1.db.queryAll(sql, params);
        res.json({ success: true, data: { complaints } });
    }
    catch (err) {
        next(err);
    }
});
// 3. Resolve Complaint (Admin or Vendor)
exports.complaintRouter.post('/:id/resolve', auth_1.requireAuth, (0, auth_1.requireRole)('admin', 'vendor'), (req, res, next) => {
    try {
        const { action, resolutionReason, refundAmount = 0 } = req.body;
        // action: 'ResolveWithRefund', 'ResolveWithoutRefund', 'Dismiss'
        if (!resolutionReason || resolutionReason.trim().length === 0) {
            res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'A mandatory resolution note / reason is required.' }
            });
            return;
        }
        const complaint = database_1.db.queryOne(`SELECT * FROM complaints WHERE id = ?`, [req.params.id]);
        if (!complaint) {
            res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Complaint not found.' } });
            return;
        }
        const order = database_1.db.queryOne(`SELECT * FROM orders WHERE id = ?`, [complaint.order_id]);
        if (!order) {
            res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Associated order not found.' } });
            return;
        }
        return database_1.db.transaction(() => {
            let finalStatus = 'Resolved';
            let approvedRefund = Number(refundAmount) || 0;
            if (action === 'Dismiss') {
                finalStatus = 'Dismissed';
                approvedRefund = 0;
            }
            else if (action === 'ResolveWithRefund') {
                finalStatus = 'Resolved';
                if (approvedRefund <= 0) {
                    approvedRefund = Number(order.total_amount); // default to full refund if not specified
                }
                approvedRefund = Math.min(approvedRefund, Number(order.total_amount));
                // Credit to student wallet
                paymentService_1.PaymentService.refundToWallet(complaint.student_id, complaint.order_id, approvedRefund, `Dispute Resolution: ${resolutionReason.trim()}`);
            }
            database_1.db.execute(`UPDATE complaints SET
           status = ?,
           refund_amount = ?,
           resolution_reason = ?,
           resolved_at = CURRENT_TIMESTAMP
         WHERE id = ?`, [finalStatus, approvedRefund, resolutionReason.trim(), req.params.id]);
            // Revert order status from Disputed to Delivered (closed)
            database_1.db.execute(`UPDATE orders SET status = 'Delivered', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [complaint.order_id]);
            notificationService_1.NotificationService.createNotification(complaint.student_id, `Complaint ${finalStatus}`, `Your complaint for Order #${complaint.order_id} has been ${finalStatus.toLowerCase()}. ${approvedRefund > 0 ? `₹${approvedRefund.toFixed(2)} credited to your wallet.` : ''} Note: ${resolutionReason}`, 'alert', `/orders/${complaint.order_id}`);
            const updated = database_1.db.queryOne(`SELECT * FROM complaints WHERE id = ?`, [req.params.id]);
            res.json({
                success: true,
                data: { complaint: updated },
                message: `Complaint marked as ${finalStatus}.`
            });
        });
    }
    catch (err) {
        next(err);
    }
});
