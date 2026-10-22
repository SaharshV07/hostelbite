"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const database_1 = require("../config/database");
const notificationService_1 = require("./notificationService");
class PaymentService {
    static MAX_WALLET_BALANCE = 5000.0;
    static getWalletBalance(userId) {
        const user = database_1.db.queryOne(`SELECT wallet_balance FROM users WHERE id = ?`, [userId]);
        return user ? Number(user.wallet_balance) : 0;
    }
    static getWalletTransactions(userId) {
        return database_1.db.queryAll(`SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY transaction_date DESC LIMIT 50`, [userId]);
    }
    static topUpWallet(userId, amount) {
        if (amount <= 0 || amount % 50 !== 0) {
            return { success: false, newBalance: 0, error: 'Top-up amount must be a positive multiple of ₹50.' };
        }
        return database_1.db.transaction(() => {
            const user = database_1.db.queryOne(`SELECT * FROM users WHERE id = ?`, [userId]);
            if (!user) {
                return { success: false, newBalance: 0, error: 'User not found.' };
            }
            const currentBalance = Number(user.wallet_balance);
            const newBalance = currentBalance + amount;
            if (newBalance > this.MAX_WALLET_BALANCE) {
                return {
                    success: false,
                    newBalance: currentBalance,
                    error: `Top-up exceeds regulatory maximum wallet balance limit of ₹${this.MAX_WALLET_BALANCE.toFixed(2)}.`
                };
            }
            database_1.db.execute(`UPDATE users SET wallet_balance = ? WHERE id = ?`, [newBalance, userId]);
            const txId = `WTX_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
            database_1.db.execute(`INSERT INTO wallet_transactions (id, user_id, order_id, amount, transaction_type, balance_after, description, transaction_date)
         VALUES (?, ?, NULL, ?, 'Credit', ?, ?, CURRENT_TIMESTAMP)`, [txId, userId, amount, newBalance, `Wallet Top-Up via Simulated Gateway (+₹${amount.toFixed(2)})`]);
            notificationService_1.NotificationService.createNotification(userId, 'Wallet Top-Up Successful', `₹${amount.toFixed(2)} has been credited to your HostelBite wallet. New balance: ₹${newBalance.toFixed(2)}.`, 'payment');
            return { success: true, newBalance, transactionId: txId };
        });
    }
    static processWalletPayment(userId, orderId, amount) {
        return database_1.db.transaction(() => {
            const user = database_1.db.queryOne(`SELECT * FROM users WHERE id = ?`, [userId]);
            if (!user) {
                return { success: false, error: 'User not found.' };
            }
            const currentBalance = Number(user.wallet_balance);
            if (currentBalance < amount) {
                return {
                    success: false,
                    error: `Insufficient wallet balance. Available: ₹${currentBalance.toFixed(2)}, Required: ₹${amount.toFixed(2)}. Please top up your wallet or choose another payment method.`
                };
            }
            const newBalance = currentBalance - amount;
            database_1.db.execute(`UPDATE users SET wallet_balance = ? WHERE id = ?`, [newBalance, userId]);
            const wtxId = `WTX_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
            database_1.db.execute(`INSERT INTO wallet_transactions (id, user_id, order_id, amount, transaction_type, balance_after, description, transaction_date)
         VALUES (?, ?, ?, ?, 'Debit', ?, ?, CURRENT_TIMESTAMP)`, [wtxId, userId, orderId, amount, newBalance, `Payment for Order #${orderId} (-₹${amount.toFixed(2)})`]);
            const paymentId = `PAY_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
            const txnRef = `HB_TXN_${Date.now()}`;
            database_1.db.execute(`INSERT INTO payments (id, order_id, amount, payment_method, transaction_id, payment_status, payment_date)
         VALUES (?, ?, ?, 'Wallet', ?, 'Success', CURRENT_TIMESTAMP)`, [paymentId, orderId, amount, txnRef]);
            return { success: true, paymentId };
        });
    }
    static processSimulatedGatewayPayment(orderId, amount, method, simulateSuccess = true) {
        const existingPayment = database_1.db.queryOne(`SELECT * FROM payments WHERE order_id = ?`, [orderId]);
        if (existingPayment && existingPayment.payment_status === 'Success') {
            return {
                success: true,
                paymentId: existingPayment.id,
                transactionId: existingPayment.transaction_id
            };
        }
        const paymentId = existingPayment ? existingPayment.id : `PAY_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        const txnRef = `HB_SIM_${method}_${Date.now()}_${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
        if (!simulateSuccess) {
            if (existingPayment) {
                database_1.db.execute(`UPDATE payments SET payment_status = 'Failed', payment_date = CURRENT_TIMESTAMP WHERE id = ?`, [paymentId]);
            }
            else {
                database_1.db.execute(`INSERT INTO payments (id, order_id, amount, payment_method, transaction_id, payment_status, payment_date)
           VALUES (?, ?, ?, ?, ?, 'Failed', CURRENT_TIMESTAMP)`, [paymentId, orderId, amount, method, txnRef]);
            }
            return {
                success: false,
                error: 'Simulated payment was marked as Failed by user/gateway test trigger. Order remains unconfirmed.'
            };
        }
        // Success path
        if (existingPayment) {
            database_1.db.execute(`UPDATE payments SET payment_status = 'Success', payment_method = ?, transaction_id = ?, payment_date = CURRENT_TIMESTAMP WHERE id = ?`, [method, txnRef, paymentId]);
        }
        else {
            database_1.db.execute(`INSERT INTO payments (id, order_id, amount, payment_method, transaction_id, payment_status, payment_date)
         VALUES (?, ?, ?, ?, ?, 'Success', CURRENT_TIMESTAMP)`, [paymentId, orderId, amount, method, txnRef]);
        }
        return {
            success: true,
            paymentId,
            transactionId: txnRef
        };
    }
    static refundToWallet(userId, orderId, refundAmount, reason) {
        if (refundAmount <= 0) {
            return { success: false, newBalance: 0, error: 'Refund amount must be greater than zero.' };
        }
        return database_1.db.transaction(() => {
            const user = database_1.db.queryOne(`SELECT * FROM users WHERE id = ?`, [userId]);
            if (!user) {
                return { success: false, newBalance: 0, error: 'User not found.' };
            }
            const currentBalance = Number(user.wallet_balance);
            const newBalance = Math.min(this.MAX_WALLET_BALANCE, currentBalance + refundAmount);
            database_1.db.execute(`UPDATE users SET wallet_balance = ? WHERE id = ?`, [newBalance, userId]);
            const txId = `WTX_REF_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
            database_1.db.execute(`INSERT INTO wallet_transactions (id, user_id, order_id, amount, transaction_type, balance_after, description, transaction_date)
         VALUES (?, ?, ?, ?, 'Credit', ?, ?, CURRENT_TIMESTAMP)`, [txId, userId, orderId, refundAmount, newBalance, `Refund for Order #${orderId} (+₹${refundAmount.toFixed(2)}): ${reason}`]);
            database_1.db.execute(`UPDATE payments SET payment_status = 'Refunded' WHERE order_id = ?`, [orderId]);
            notificationService_1.NotificationService.createNotification(userId, 'Refund Credited to Wallet', `A refund of ₹${refundAmount.toFixed(2)} for Order #${orderId} has been credited to your wallet. Reason: ${reason}.`, 'payment', `/orders/${orderId}`);
            return { success: true, newBalance };
        });
    }
}
exports.PaymentService = PaymentService;
