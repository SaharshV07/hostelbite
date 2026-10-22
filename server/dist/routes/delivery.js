"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deliveryRouter = void 0;
const express_1 = require("express");
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const orderService_1 = require("../services/orderService");
const notificationService_1 = require("../services/notificationService");
exports.deliveryRouter = (0, express_1.Router)();
// Max simultaneous active deliveries per agent (FR-DEL-08)
const MAX_ACTIVE_DELIVERIES = 2;
// 1. Available Orders Ready for Pickup / Claim
exports.deliveryRouter.get('/available', auth_1.requireAuth, (0, auth_1.requireRole)('delivery', 'admin'), (req, res, next) => {
    try {
        const orders = database_1.db.queryAll(`
      SELECT o.*,
             u.name as student_name, u.mobile as student_mobile, u.hostel_block as student_block, u.room_number as student_room,
             v.business_name as vendor_name, v.serviceable_blocks,
             (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o
      JOIN users u ON o.student_id = u.id
      JOIN vendors v ON o.vendor_id = v.id
      LEFT JOIN delivery_assignments da ON o.id = da.order_id
      WHERE o.status = 'Ready' AND da.id IS NULL
      ORDER BY o.order_date ASC
    `);
        res.json({ success: true, data: { orders } });
    }
    catch (err) {
        next(err);
    }
});
// 2. Deliveries Assigned to Current Agent
exports.deliveryRouter.get('/my-tasks', auth_1.requireAuth, (0, auth_1.requireRole)('delivery', 'admin'), (req, res, next) => {
    try {
        const agentId = req.user.userId;
        const { status } = req.query; // 'active' or 'completed'
        let sql = `
      SELECT o.*,
             u.name as student_name, u.mobile as student_mobile, u.hostel_block as student_block, u.room_number as student_room,
             v.business_name as vendor_name,
             da.id as assignment_id, da.status as assignment_status, da.assigned_at, da.delivered_at,
             (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o
      JOIN users u ON o.student_id = u.id
      JOIN vendors v ON o.vendor_id = v.id
      JOIN delivery_assignments da ON o.id = da.order_id
      WHERE da.agent_id = ?
    `;
        const params = [agentId];
        if (status === 'active') {
            sql += ` AND o.status IN ('Ready', 'Out for Delivery')`;
        }
        else if (status === 'completed') {
            sql += ` AND o.status = 'Delivered'`;
        }
        sql += ` ORDER BY da.assigned_at DESC`;
        const tasks = database_1.db.queryAll(sql, params);
        res.json({ success: true, data: { tasks } });
    }
    catch (err) {
        next(err);
    }
});
// 3. Claim / Accept Delivery Task
exports.deliveryRouter.post('/:orderId/claim', auth_1.requireAuth, (0, auth_1.requireRole)('delivery'), (req, res, next) => {
    try {
        const agentId = req.user.userId;
        const orderId = req.params.orderId;
        return database_1.db.transaction(() => {
            // Check active assignment limit
            const activeCount = database_1.db.queryOne(`
        SELECT COUNT(*) as count 
        FROM delivery_assignments da
        JOIN orders o ON da.order_id = o.id
        WHERE da.agent_id = ? AND o.status IN ('Ready', 'Out for Delivery')
      `, [agentId])?.count || 0;
            if (Number(activeCount) >= MAX_ACTIVE_DELIVERIES) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'LIMIT_EXCEEDED',
                        message: `You currently have ${activeCount} active deliveries in progress (maximum permitted is ${MAX_ACTIVE_DELIVERIES}). Please complete your current tasks before claiming another order.`
                    }
                });
                return;
            }
            const order = database_1.db.queryOne(`SELECT * FROM orders WHERE id = ?`, [orderId]);
            if (!order) {
                res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found.' } });
                return;
            }
            if (order.status !== 'Ready') {
                res.status(400).json({
                    success: false,
                    error: { code: 'ORDER_NOT_READY', message: `Order is currently in "${order.status}" status and cannot be claimed.` }
                });
                return;
            }
            const existingAssignment = database_1.db.queryOne(`SELECT * FROM delivery_assignments WHERE order_id = ?`, [orderId]);
            if (existingAssignment) {
                res.status(409).json({
                    success: false,
                    error: { code: 'ALREADY_CLAIMED', message: 'This order has already been claimed by another delivery courier.' }
                });
                return;
            }
            const assignmentId = `da_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            database_1.db.execute(`INSERT INTO delivery_assignments (id, order_id, agent_id, status, assigned_at)
         VALUES (?, ?, ?, 'assigned', CURRENT_TIMESTAMP)`, [assignmentId, orderId, agentId]);
            notificationService_1.NotificationService.createNotification(order.student_id, 'Delivery Courier Assigned', `A campus runner has been assigned to pick up Order #${order.id}.`, 'delivery', `/orders/${order.id}`);
            const updatedOrder = orderService_1.OrderService.getOrderDetails(orderId);
            res.json({
                success: true,
                data: { order: updatedOrder, assignmentId },
                message: 'Order claimed successfully! Head to vendor counter for pickup.'
            });
        });
    }
    catch (err) {
        next(err);
    }
});
// 4. Update Delivery Status (Out for Delivery -> Delivered)
exports.deliveryRouter.post('/:orderId/status', auth_1.requireAuth, (0, auth_1.requireRole)('delivery'), (req, res, next) => {
    try {
        const { status } = req.body;
        const orderId = req.params.orderId;
        const agentId = req.user.userId;
        if (!['Out for Delivery', 'Delivered'].includes(status)) {
            res.status(400).json({
                success: false,
                error: { code: 'INVALID_STATUS', message: 'Status must be "Out for Delivery" or "Delivered".' }
            });
            return;
        }
        const assignment = database_1.db.queryOne(`SELECT * FROM delivery_assignments WHERE order_id = ? AND agent_id = ?`, [orderId, agentId]);
        if (!assignment) {
            res.status(403).json({
                success: false,
                error: { code: 'FORBIDDEN', message: 'You are not the assigned delivery courier for this order.' }
            });
            return;
        }
        const updated = orderService_1.OrderService.updateOrderStatus(orderId, status, 'delivery', agentId);
        if (status === 'Out for Delivery') {
            database_1.db.execute(`UPDATE delivery_assignments SET status = 'picked_up' WHERE order_id = ?`, [orderId]);
        }
        else if (status === 'Delivered') {
            database_1.db.execute(`UPDATE delivery_assignments SET status = 'delivered', delivered_at = CURRENT_TIMESTAMP WHERE order_id = ?`, [orderId]);
        }
        res.json({
            success: true,
            data: { order: updated },
            message: `Order updated to "${status}".`
        });
    }
    catch (err) {
        res.status(400).json({
            success: false,
            error: { code: 'UPDATE_FAILED', message: err.message }
        });
    }
});
