"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewRouter = void 0;
const express_1 = require("express");
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const notificationService_1 = require("../services/notificationService");
exports.reviewRouter = (0, express_1.Router)();
// Helper to recalculate vendor average rating
function updateVendorRating(vendorId) {
    const stats = database_1.db.queryOne(`SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE vendor_id = ?`, [vendorId]);
    const avgRating = stats?.avg_rating ? Number(Number(stats.avg_rating).toFixed(1)) : 4.5;
    const count = stats?.count ? Number(stats.count) : 0;
    database_1.db.execute(`UPDATE vendors SET rating = ?, total_reviews = ? WHERE id = ?`, [avgRating, count, vendorId]);
}
// 1. Submit Review for Delivered Order
exports.reviewRouter.post('/', auth_1.requireAuth, (0, auth_1.requireRole)('student'), (req, res, next) => {
    try {
        const { orderId, rating, comment } = req.body;
        const studentId = req.user.userId;
        if (!orderId || !rating) {
            res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'orderId and rating (1-5) are required.' }
            });
            return;
        }
        const numRating = Number(rating);
        if (numRating < 1 || numRating > 5 || !Number.isInteger(numRating)) {
            res.status(400).json({
                success: false,
                error: { code: 'INVALID_RATING', message: 'Rating must be an integer between 1 and 5.' }
            });
            return;
        }
        const order = database_1.db.queryOne(`SELECT * FROM orders WHERE id = ?`, [orderId]);
        if (!order) {
            res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found.' } });
            return;
        }
        if (order.student_id !== studentId) {
            res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Unauthorized to rate this order.' } });
            return;
        }
        if (order.status !== 'Delivered') {
            res.status(400).json({
                success: false,
                error: { code: 'ORDER_NOT_DELIVERED', message: 'You can only rate an order after it has been delivered.' }
            });
            return;
        }
        const existingReview = database_1.db.queryOne(`SELECT * FROM reviews WHERE order_id = ?`, [orderId]);
        if (existingReview) {
            res.status(409).json({
                success: false,
                error: { code: 'DUPLICATE_REVIEW', message: 'You have already submitted a review for this order (1 review per order rule).' }
            });
            return;
        }
        const reviewId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        database_1.db.execute(`INSERT INTO reviews (id, order_id, student_id, vendor_id, rating, comment, created_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`, [reviewId, orderId, studentId, order.vendor_id, numRating, comment ? comment.trim() : null]);
        updateVendorRating(order.vendor_id);
        // Notify vendor
        const vendor = database_1.db.queryOne(`SELECT * FROM vendors WHERE id = ?`, [order.vendor_id]);
        if (vendor) {
            notificationService_1.NotificationService.createNotification(vendor.user_id, 'New Customer Review Received', `A student left a ${numRating}-star rating for Order #${order.id}. Check your review feedback!`, 'info', `/vendor/reviews`);
        }
        const created = database_1.db.queryOne(`SELECT * FROM reviews WHERE id = ?`, [reviewId]);
        res.status(201).json({
            success: true,
            data: { review: created },
            message: 'Thank you for your rating!'
        });
    }
    catch (err) {
        next(err);
    }
});
// 2. Get Reviews for a Vendor
exports.reviewRouter.get('/vendor/:vendorId', (req, res, next) => {
    try {
        const reviews = database_1.db.queryAll(`
      SELECT r.*, u.name as student_name
      FROM reviews r
      JOIN users u ON r.student_id = u.id
      WHERE r.vendor_id = ?
      ORDER BY r.created_at DESC
    `, [req.params.vendorId]);
        res.json({ success: true, data: { reviews } });
    }
    catch (err) {
        next(err);
    }
});
// 3. Vendor Response to Review
exports.reviewRouter.post('/:id/respond', auth_1.requireAuth, (0, auth_1.requireRole)('vendor'), (req, res, next) => {
    try {
        const { response } = req.body;
        if (!response || response.trim().length === 0) {
            res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Response text cannot be empty.' }
            });
            return;
        }
        const review = database_1.db.queryOne(`SELECT * FROM reviews WHERE id = ?`, [req.params.id]);
        if (!review) {
            res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Review not found.' } });
            return;
        }
        const vendor = database_1.db.queryOne(`SELECT * FROM vendors WHERE user_id = ?`, [req.user.userId]);
        if (!vendor || review.vendor_id !== vendor.id) {
            res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You can only respond to reviews of your own outlet.' } });
            return;
        }
        database_1.db.execute(`UPDATE reviews SET vendor_response = ?, response_at = CURRENT_TIMESTAMP WHERE id = ?`, [response.trim(), req.params.id]);
        notificationService_1.NotificationService.createNotification(review.student_id, 'Vendor Responded to Your Review', `${vendor.business_name} responded to your review for Order #${review.order_id}.`, 'info', `/orders/${review.order_id}`);
        const updated = database_1.db.queryOne(`SELECT * FROM reviews WHERE id = ?`, [req.params.id]);
        res.json({ success: true, data: { review: updated }, message: 'Response posted successfully.' });
    }
    catch (err) {
        next(err);
    }
});
// 4. Admin Moderate/Delete Review
exports.reviewRouter.delete('/:id', auth_1.requireAuth, (0, auth_1.requireRole)('admin'), (req, res, next) => {
    try {
        const review = database_1.db.queryOne(`SELECT * FROM reviews WHERE id = ?`, [req.params.id]);
        if (!review) {
            res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Review not found.' } });
            return;
        }
        database_1.db.execute(`DELETE FROM reviews WHERE id = ?`, [req.params.id]);
        updateVendorRating(review.vendor_id);
        res.json({ success: true, message: 'Review moderated and removed by Administrator.' });
    }
    catch (err) {
        next(err);
    }
});
