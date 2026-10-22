"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRouter = void 0;
const express_1 = require("express");
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const paymentService_1 = require("../services/paymentService");
const orderService_1 = require("../services/orderService");
exports.paymentRouter = (0, express_1.Router)();
// 1. Process Simulated Gateway Payment (UPI / Card / Net Banking)
exports.paymentRouter.post('/process', auth_1.requireAuth, (req, res, next) => {
    try {
        const { orderId, paymentMethod = 'UPI', simulateSuccess = true } = req.body;
        if (!orderId) {
            res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'orderId is required.' }
            });
            return;
        }
        const order = database_1.db.queryOne(`SELECT * FROM orders WHERE id = ?`, [orderId]);
        if (!order) {
            res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Order not found.' }
            });
            return;
        }
        if (order.student_id !== req.user.userId && req.user.role !== 'admin') {
            res.status(403).json({
                success: false,
                error: { code: 'FORBIDDEN', message: 'Unauthorized to pay for this order.' }
            });
            return;
        }
        if (order.status !== 'Payment Pending') {
            res.status(400).json({
                success: false,
                error: { code: 'INVALID_ORDER_STATE', message: `Order is already in "${order.status}" status.` }
            });
            return;
        }
        const paymentResult = paymentService_1.PaymentService.processSimulatedGatewayPayment(order.id, Number(order.total_amount), paymentMethod, Boolean(simulateSuccess));
        if (!paymentResult.success) {
            res.status(402).json({
                success: false,
                error: {
                    code: 'PAYMENT_FAILED',
                    message: paymentResult.error || 'Simulated payment transaction was declined. Order remains unconfirmed.'
                }
            });
            return;
        }
        // Payment succeeded -> Confirm order and notify kitchen
        const confirmedOrder = orderService_1.OrderService.confirmPaidOrder(order.id);
        res.json({
            success: true,
            data: {
                order: confirmedOrder,
                paymentId: paymentResult.paymentId,
                transactionId: paymentResult.transactionId,
                status: 'Success'
            },
            message: 'Payment verified and order confirmed! Sent to kitchen.'
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            error: { code: 'PAYMENT_PROCESSING_ERROR', message: err.message }
        });
    }
});
// 2. Process Order Payment with Prepaid Wallet
exports.paymentRouter.post('/wallet', auth_1.requireAuth, (req, res, next) => {
    try {
        const { orderId } = req.body;
        if (!orderId) {
            res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'orderId is required.' }
            });
            return;
        }
        const order = database_1.db.queryOne(`SELECT * FROM orders WHERE id = ?`, [orderId]);
        if (!order) {
            res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Order not found.' }
            });
            return;
        }
        if (order.student_id !== req.user.userId) {
            res.status(403).json({
                success: false,
                error: { code: 'FORBIDDEN', message: 'Unauthorized.' }
            });
            return;
        }
        if (order.status !== 'Payment Pending') {
            res.status(400).json({
                success: false,
                error: { code: 'INVALID_ORDER_STATE', message: `Order is already in "${order.status}" status.` }
            });
            return;
        }
        const walletResult = paymentService_1.PaymentService.processWalletPayment(req.user.userId, order.id, Number(order.total_amount));
        if (!walletResult.success) {
            res.status(400).json({
                success: false,
                error: { code: 'INSUFFICIENT_FUNDS', message: walletResult.error }
            });
            return;
        }
        const confirmedOrder = orderService_1.OrderService.confirmPaidOrder(order.id);
        const newBalance = paymentService_1.PaymentService.getWalletBalance(req.user.userId);
        res.json({
            success: true,
            data: {
                order: confirmedOrder,
                paymentId: walletResult.paymentId,
                walletBalance: newBalance,
                status: 'Success'
            },
            message: 'Payment deducted from wallet and order confirmed! Sent to kitchen.'
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            error: { code: 'WALLET_PAYMENT_ERROR', message: err.message }
        });
    }
});
// 3. Get Payment Details for an Order
exports.paymentRouter.get('/:orderId', auth_1.requireAuth, (req, res, next) => {
    try {
        const payment = database_1.db.queryOne(`SELECT * FROM payments WHERE order_id = ?`, [req.params.orderId]);
        if (!payment) {
            res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'No payment record found for this order.' }
            });
            return;
        }
        res.json({ success: true, data: { payment } });
    }
    catch (err) {
        next(err);
    }
});
