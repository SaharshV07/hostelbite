"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsRouter = void 0;
const express_1 = require("express");
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
exports.analyticsRouter = (0, express_1.Router)();
// 1. Platform-wide Administrative Analytics (Admin Only)
exports.analyticsRouter.get('/overview', auth_1.requireAuth, (0, auth_1.requireRole)('admin'), (req, res, next) => {
    try {
        const totalOrders = database_1.db.queryOne(`SELECT COUNT(*) as count FROM orders WHERE status != 'Payment Pending'`)?.count || 0;
        const totalRevenue = database_1.db.queryOne(`SELECT SUM(total_amount) as revenue FROM orders WHERE status IN ('Delivered', 'Ready', 'Out for Delivery', 'Accepted', 'Preparing')`)?.revenue || 0;
        const activeVendors = database_1.db.queryOne(`SELECT COUNT(*) as count FROM vendors WHERE status = 'approved' AND accepting_orders = 1`)?.count || 0;
        const openComplaints = database_1.db.queryOne(`SELECT COUNT(*) as count FROM complaints WHERE status IN ('Open', 'Escalated')`)?.count || 0;
        const statusCounts = database_1.db.queryAll(`SELECT status, COUNT(*) as count FROM orders WHERE status != 'Payment Pending' GROUP BY status`);
        const blockDistribution = database_1.db.queryAll(`SELECT COALESCE(u.hostel_block, 'Other') as block, COUNT(*) as count 
       FROM orders o 
       JOIN users u ON o.student_id = u.id 
       WHERE o.status != 'Payment Pending'
       GROUP BY block`);
        // Mess Wastage Indicator (FR-RPT-02):
        // Total subscribed hostel students vs today's meal pre-orders
        const totalStudents = database_1.db.queryOne(`SELECT COUNT(*) as count FROM users WHERE role = 'student'`)?.count || 0;
        const messOrdersToday = database_1.db.queryOne(`SELECT COUNT(*) as count FROM orders o
       JOIN vendors v ON o.vendor_id = v.id
       WHERE v.is_mess = 1 AND o.status != 'Payment Pending'`)?.count || 0;
        const estimatedWastagePercentage = totalStudents > 0
            ? Math.max(5, Math.min(35, Math.round(((totalStudents - messOrdersToday) / totalStudents) * 25)))
            : 12;
        res.json({
            success: true,
            data: {
                totalOrders: Number(totalOrders),
                totalRevenue: Number(Number(totalRevenue).toFixed(2)),
                activeVendors: Number(activeVendors),
                openComplaints: Number(openComplaints),
                statusCounts,
                blockDistribution,
                messWastage: {
                    totalRegisteredStudents: Number(totalStudents),
                    messOrdersCount: Number(messOrdersToday),
                    estimatedWastageRisk: `${estimatedWastagePercentage}%`,
                    statusNote: estimatedWastagePercentage > 20 ? 'High Surplus Risk' : 'Optimal Consumption'
                }
            }
        });
    }
    catch (err) {
        next(err);
    }
});
// 2. Vendor Specific Analytics (Vendor Only)
exports.analyticsRouter.get('/vendor', auth_1.requireAuth, (0, auth_1.requireRole)('vendor'), (req, res, next) => {
    try {
        const vendor = database_1.db.queryOne(`SELECT * FROM vendors WHERE user_id = ?`, [req.user.userId]);
        if (!vendor) {
            res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Vendor not found.' } });
            return;
        }
        const totalOrders = database_1.db.queryOne(`SELECT COUNT(*) as count FROM orders WHERE vendor_id = ? AND status != 'Payment Pending'`, [vendor.id])?.count || 0;
        const totalRevenue = database_1.db.queryOne(`SELECT SUM(subtotal) as revenue FROM orders WHERE vendor_id = ? AND status IN ('Delivered', 'Ready', 'Out for Delivery', 'Accepted', 'Preparing')`, [vendor.id])?.revenue || 0;
        const topItems = database_1.db.queryAll(`SELECT oi.item_name, SUM(oi.quantity) as total_quantity, SUM(oi.subtotal) as revenue
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE o.vendor_id = ? AND o.status != 'Payment Pending'
       GROUP BY oi.item_name
       ORDER BY total_quantity DESC
       LIMIT 5`, [vendor.id]);
        res.json({
            success: true,
            data: {
                vendorName: vendor.business_name,
                rating: vendor.rating,
                totalReviews: vendor.total_reviews,
                totalOrders: Number(totalOrders),
                totalRevenue: Number(Number(totalRevenue).toFixed(2)),
                topItems
            }
        });
    }
    catch (err) {
        next(err);
    }
});
