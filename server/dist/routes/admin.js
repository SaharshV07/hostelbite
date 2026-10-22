"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
const express_1 = require("express");
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const notificationService_1 = require("../services/notificationService");
exports.adminRouter = (0, express_1.Router)();
// Apply Admin Role Check to all routes in this router
exports.adminRouter.use(auth_1.requireAuth, (0, auth_1.requireRole)('admin'));
// 1. List All Vendors with Full Administrative Data
exports.adminRouter.get('/vendors', (req, res, next) => {
    try {
        const { status } = req.query;
        let sql = `
      SELECT v.*, u.name as owner_name, u.email as owner_email, u.mobile as owner_mobile,
             (SELECT COUNT(*) FROM menu_items WHERE vendor_id = v.id) as item_count,
             (SELECT COUNT(*) FROM orders WHERE vendor_id = v.id) as total_orders
      FROM vendors v
      JOIN users u ON v.user_id = u.id
      WHERE 1=1
    `;
        const params = [];
        if (status) {
            sql += ` AND v.status = ?`;
            params.push(status);
        }
        sql += ` ORDER BY v.created_at DESC`;
        const vendors = database_1.db.queryAll(sql, params);
        res.json({ success: true, data: { vendors } });
    }
    catch (err) {
        next(err);
    }
});
// 2. Approve, Reject, or Suspend Vendor
exports.adminRouter.post('/vendors/:id/action', (req, res, next) => {
    try {
        const { action, comments } = req.body; // action: 'approve' | 'reject' | 'suspend' | 'activate'
        const vendorId = req.params.id;
        const vendor = database_1.db.queryOne(`SELECT * FROM vendors WHERE id = ?`, [vendorId]);
        if (!vendor) {
            res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Vendor not found.' } });
            return;
        }
        let targetStatus;
        let notifTitle;
        let notifMsg;
        if (action === 'approve') {
            targetStatus = 'approved';
            notifTitle = 'Vendor Application Approved!';
            notifMsg = `Congratulations! Your outlet "${vendor.business_name}" is approved and now active on HostelBite.`;
        }
        else if (action === 'reject') {
            targetStatus = 'rejected';
            notifTitle = 'Vendor Application Update';
            notifMsg = `Your vendor application was rejected. Comment: ${comments || 'Documents incomplete'}.`;
        }
        else if (action === 'suspend') {
            targetStatus = 'suspended';
            notifTitle = 'Vendor Account Suspended';
            notifMsg = `Your vendor listing has been temporarily suspended by the Chief Warden. Reason: ${comments || 'Administrative review'}.`;
        }
        else if (action === 'activate') {
            targetStatus = 'approved';
            notifTitle = 'Vendor Account Reactivated';
            notifMsg = `Your vendor listing has been reactivated. You can now accept orders.`;
        }
        else {
            res.status(400).json({ success: false, error: { code: 'INVALID_ACTION', message: 'Action must be approve, reject, suspend, or activate.' } });
            return;
        }
        database_1.db.execute(`UPDATE vendors SET status = ? WHERE id = ?`, [targetStatus, vendorId]);
        notificationService_1.NotificationService.createNotification(vendor.user_id, notifTitle, notifMsg, 'alert', `/vendor`);
        const updated = database_1.db.queryOne(`SELECT * FROM vendors WHERE id = ?`, [vendorId]);
        res.json({
            success: true,
            data: { vendor: updated },
            message: `Vendor status updated to "${targetStatus}".`
        });
    }
    catch (err) {
        next(err);
    }
});
// 3. User Directory (Students, Vendors, Delivery Agents, Admins)
exports.adminRouter.get('/users', (req, res, next) => {
    try {
        const { role, search } = req.query;
        let sql = `
      SELECT id, name, email, mobile, role, hostel_block, floor, room_number, wallet_balance, status, created_at
      FROM users
      WHERE 1=1
    `;
        const params = [];
        if (role) {
            sql += ` AND role = ?`;
            params.push(role);
        }
        if (search) {
            sql += ` AND (name LIKE ? OR email LIKE ? OR mobile LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        sql += ` ORDER BY created_at DESC`;
        const users = database_1.db.queryAll(sql, params);
        res.json({ success: true, data: { users } });
    }
    catch (err) {
        next(err);
    }
});
// 4. Update User Account Status (Active / Suspended)
exports.adminRouter.post('/users/:id/status', (req, res, next) => {
    try {
        const { status } = req.body;
        if (!['active', 'suspended'].includes(status)) {
            res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Status must be "active" or "suspended".' } });
            return;
        }
        const targetUser = database_1.db.queryOne(`SELECT * FROM users WHERE id = ?`, [req.params.id]);
        if (!targetUser) {
            res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found.' } });
            return;
        }
        if (targetUser.role === 'admin') {
            res.status(403).json({ success: false, error: { code: 'PROTECTED', message: 'Administrator accounts cannot be modified here.' } });
            return;
        }
        database_1.db.execute(`UPDATE users SET status = ? WHERE id = ?`, [status, req.params.id]);
        notificationService_1.NotificationService.createNotification(targetUser.id, `Account Status Updated`, `Your HostelBite account has been marked as "${status}".`, 'alert');
        res.json({ success: true, message: `User account set to "${status}".` });
    }
    catch (err) {
        next(err);
    }
});
// 5. System Order Audit
exports.adminRouter.get('/orders', (req, res, next) => {
    try {
        const { status, vendorId, limit = 100 } = req.query;
        let sql = `
      SELECT o.*, 
             u.name as student_name, u.email as student_email, u.hostel_block as student_block, u.room_number as student_room,
             v.business_name as vendor_name,
             p.payment_method, p.payment_status,
             da.agent_id as delivery_agent_id, du.name as delivery_agent_name
      FROM orders o
      JOIN users u ON o.student_id = u.id
      JOIN vendors v ON o.vendor_id = v.id
      LEFT JOIN payments p ON o.id = p.order_id
      LEFT JOIN delivery_assignments da ON o.id = da.order_id
      LEFT JOIN users du ON da.agent_id = du.id
      WHERE 1=1
    `;
        const params = [];
        if (status) {
            sql += ` AND o.status = ?`;
            params.push(status);
        }
        if (vendorId) {
            sql += ` AND o.vendor_id = ?`;
            params.push(vendorId);
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
