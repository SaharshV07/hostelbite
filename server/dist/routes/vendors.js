"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vendorRouter = void 0;
const express_1 = require("express");
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
exports.vendorRouter = (0, express_1.Router)();
// 1. List Approved Vendors (for Students & General Browsing)
exports.vendorRouter.get('/', (req, res, next) => {
    try {
        const { cuisine, search, isMess } = req.query;
        let sql = `
      SELECT v.*, u.name as owner_name, u.email as owner_email,
             (SELECT COUNT(*) FROM menu_items WHERE vendor_id = v.id AND availability = 1) as active_item_count
      FROM vendors v
      JOIN users u ON v.user_id = u.id
      WHERE v.status = 'approved'
    `;
        const params = [];
        if (cuisine) {
            sql += ` AND v.cuisine_category LIKE ?`;
            params.push(`%${cuisine}%`);
        }
        if (isMess !== undefined) {
            sql += ` AND v.is_mess = ?`;
            params.push(isMess === '1' || isMess === 'true' ? 1 : 0);
        }
        if (search) {
            sql += ` AND (v.business_name LIKE ? OR v.cuisine_category LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }
        sql += ` ORDER BY v.is_mess DESC, v.rating DESC`;
        const vendors = database_1.db.queryAll(sql, params);
        res.json({ success: true, data: { vendors } });
    }
    catch (err) {
        next(err);
    }
});
// 2. Get Vendor Profile for logged in Vendor
exports.vendorRouter.get('/my/profile', auth_1.requireAuth, (0, auth_1.requireRole)('vendor'), (req, res, next) => {
    try {
        const vendor = database_1.db.queryOne(`SELECT v.*, u.name as owner_name, u.email as owner_email 
       FROM vendors v 
       JOIN users u ON v.user_id = u.id 
       WHERE v.user_id = ?`, [req.user.userId]);
        if (!vendor) {
            res.status(404).json({
                success: false,
                error: { code: 'VENDOR_NOT_FOUND', message: 'No vendor profile associated with this account.' }
            });
            return;
        }
        res.json({ success: true, data: { vendor } });
    }
    catch (err) {
        next(err);
    }
});
// 3. Get Single Vendor by ID
exports.vendorRouter.get('/:id', (req, res, next) => {
    try {
        const vendor = database_1.db.queryOne(`SELECT v.*, u.name as owner_name, u.email as owner_email,
              (SELECT COUNT(*) FROM menu_items WHERE vendor_id = v.id) as total_item_count
       FROM vendors v
       JOIN users u ON v.user_id = u.id
       WHERE v.id = ?`, [req.params.id]);
        if (!vendor) {
            res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Vendor not found.' }
            });
            return;
        }
        res.json({ success: true, data: { vendor } });
    }
    catch (err) {
        next(err);
    }
});
// 4. Toggle Vendor Accepting Orders Switch
exports.vendorRouter.put('/:id/accepting-orders', auth_1.requireAuth, (0, auth_1.requireRole)('vendor', 'admin'), (req, res, next) => {
    try {
        const { acceptingOrders } = req.body;
        const vendorId = req.params.id;
        const vendor = database_1.db.queryOne(`SELECT * FROM vendors WHERE id = ?`, [vendorId]);
        if (!vendor) {
            res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Vendor not found.' }
            });
            return;
        }
        // Role check: vendor can only modify their own outlet
        if (req.user.role === 'vendor' && vendor.user_id !== req.user.userId) {
            res.status(403).json({
                success: false,
                error: { code: 'FORBIDDEN', message: 'You can only update your own outlet status.' }
            });
            return;
        }
        const newVal = acceptingOrders ? 1 : 0;
        database_1.db.execute(`UPDATE vendors SET accepting_orders = ? WHERE id = ?`, [newVal, vendorId]);
        const updated = database_1.db.queryOne(`SELECT * FROM vendors WHERE id = ?`, [vendorId]);
        res.json({
            success: true,
            data: { vendor: updated },
            message: `Kitchen ordering ${newVal ? 'resumed' : 'paused'}.`
        });
    }
    catch (err) {
        next(err);
    }
});
// 5. Submit Vendor Onboarding Application
exports.vendorRouter.post('/onboard', auth_1.requireAuth, (req, res, next) => {
    try {
        const { businessName, cuisineCategory, fssaiLicense, serviceableBlocks, deliveryTimeWindow, minimumOrderValue } = req.body;
        if (!businessName || !cuisineCategory || !fssaiLicense) {
            res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Business name, cuisine category, and FSSAI license are required.' }
            });
            return;
        }
        const vendorId = `ven_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        database_1.db.execute(`INSERT INTO vendors (
        id, user_id, business_name, cuisine_category, fssai_license,
        serviceable_blocks, delivery_time_window, minimum_order_value, accepting_orders, is_mess, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 'pending')`, [
            vendorId,
            req.user.userId,
            businessName.trim(),
            cuisineCategory.trim(),
            fssaiLicense.trim(),
            serviceableBlocks || 'All Blocks (B1-B5, G1-G3)',
            deliveryTimeWindow || '25-35 mins',
            Number(minimumOrderValue) || 50.0
        ]);
        const created = database_1.db.queryOne(`SELECT * FROM vendors WHERE id = ?`, [vendorId]);
        res.status(201).json({
            success: true,
            data: { vendor: created },
            message: 'Vendor application submitted. Awaiting Administrator approval.'
        });
    }
    catch (err) {
        next(err);
    }
});
