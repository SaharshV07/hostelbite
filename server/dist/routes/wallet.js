"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walletRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const paymentService_1 = require("../services/paymentService");
exports.walletRouter = (0, express_1.Router)();
// 1. Get Current Wallet Balance
exports.walletRouter.get('/balance', auth_1.requireAuth, (req, res, next) => {
    try {
        const balance = paymentService_1.PaymentService.getWalletBalance(req.user.userId);
        res.json({
            success: true,
            data: {
                walletBalance: balance,
                maxLimit: paymentService_1.PaymentService.MAX_WALLET_BALANCE
            }
        });
    }
    catch (err) {
        next(err);
    }
});
// 2. Get Wallet Transactions History
exports.walletRouter.get('/transactions', auth_1.requireAuth, (req, res, next) => {
    try {
        const transactions = paymentService_1.PaymentService.getWalletTransactions(req.user.userId);
        const balance = paymentService_1.PaymentService.getWalletBalance(req.user.userId);
        res.json({
            success: true,
            data: {
                transactions,
                currentBalance: balance
            }
        });
    }
    catch (err) {
        next(err);
    }
});
// 3. Top-Up Wallet (Simulated Payment)
exports.walletRouter.post('/topup', auth_1.requireAuth, (req, res, next) => {
    try {
        const { amount } = req.body;
        if (!amount || isNaN(Number(amount))) {
            res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Valid monetary amount is required.' }
            });
            return;
        }
        const topupAmount = Number(amount);
        const result = paymentService_1.PaymentService.topUpWallet(req.user.userId, topupAmount);
        if (!result.success) {
            res.status(400).json({
                success: false,
                error: { code: 'TOPUP_REJECTED', message: result.error }
            });
            return;
        }
        res.json({
            success: true,
            data: {
                newBalance: result.newBalance,
                transactionId: result.transactionId
            },
            message: `₹${topupAmount.toFixed(2)} added to your HostelBite wallet successfully!`
        });
    }
    catch (err) {
        next(err);
    }
});
