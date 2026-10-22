import { db } from '../config/database';
import { Payment, PaymentMethod, PaymentStatus, WalletTransaction, User } from '../types';
import { NotificationService } from './notificationService';

export class PaymentService {
  public static readonly MAX_WALLET_BALANCE = 5000.0;

  public static getWalletBalance(userId: string): number {
    const user = db.queryOne<{ wallet_balance: number }>(
      `SELECT wallet_balance FROM users WHERE id = ?`,
      [userId]
    );
    return user ? Number(user.wallet_balance) : 0;
  }

  public static getWalletTransactions(userId: string): WalletTransaction[] {
    return db.queryAll<WalletTransaction>(
      `SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY transaction_date DESC LIMIT 50`,
      [userId]
    );
  }

  public static topUpWallet(userId: string, amount: number): { success: boolean; newBalance: number; transactionId?: string; error?: string } {
    if (amount <= 0 || amount % 50 !== 0) {
      return { success: false, newBalance: 0, error: 'Top-up amount must be a positive multiple of ₹50.' };
    }

    return db.transaction(() => {
      const user = db.queryOne<User>(`SELECT * FROM users WHERE id = ?`, [userId]);
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

      db.execute(`UPDATE users SET wallet_balance = ? WHERE id = ?`, [newBalance, userId]);

      const txId = `WTX_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      db.execute(
        `INSERT INTO wallet_transactions (id, user_id, order_id, amount, transaction_type, balance_after, description, transaction_date)
         VALUES (?, ?, NULL, ?, 'Credit', ?, ?, CURRENT_TIMESTAMP)`,
        [txId, userId, amount, newBalance, `Wallet Top-Up via Simulated Gateway (+₹${amount.toFixed(2)})`]
      );

      NotificationService.createNotification(
        userId,
        'Wallet Top-Up Successful',
        `₹${amount.toFixed(2)} has been credited to your HostelBite wallet. New balance: ₹${newBalance.toFixed(2)}.`,
        'payment'
      );

      return { success: true, newBalance, transactionId: txId };
    });
  }

  public static processWalletPayment(userId: string, orderId: string, amount: number): { success: boolean; error?: string; paymentId?: string } {
    return db.transaction(() => {
      const user = db.queryOne<User>(`SELECT * FROM users WHERE id = ?`, [userId]);
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
      db.execute(`UPDATE users SET wallet_balance = ? WHERE id = ?`, [newBalance, userId]);

      const wtxId = `WTX_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      db.execute(
        `INSERT INTO wallet_transactions (id, user_id, order_id, amount, transaction_type, balance_after, description, transaction_date)
         VALUES (?, ?, ?, ?, 'Debit', ?, ?, CURRENT_TIMESTAMP)`,
        [wtxId, userId, orderId, amount, newBalance, `Payment for Order #${orderId} (-₹${amount.toFixed(2)})`]
      );

      const paymentId = `PAY_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const txnRef = `HB_TXN_${Date.now()}`;
      db.execute(
        `INSERT INTO payments (id, order_id, amount, payment_method, transaction_id, payment_status, payment_date)
         VALUES (?, ?, ?, 'Wallet', ?, 'Success', CURRENT_TIMESTAMP)`,
        [paymentId, orderId, amount, txnRef]
      );

      return { success: true, paymentId };
    });
  }

  public static processSimulatedGatewayPayment(
    orderId: string,
    amount: number,
    method: PaymentMethod,
    simulateSuccess: boolean = true
  ): { success: boolean; paymentId?: string; transactionId?: string; error?: string } {
    const existingPayment = db.queryOne<Payment>(`SELECT * FROM payments WHERE order_id = ?`, [orderId]);
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
        db.execute(`UPDATE payments SET payment_status = 'Failed', payment_date = CURRENT_TIMESTAMP WHERE id = ?`, [paymentId]);
      } else {
        db.execute(
          `INSERT INTO payments (id, order_id, amount, payment_method, transaction_id, payment_status, payment_date)
           VALUES (?, ?, ?, ?, ?, 'Failed', CURRENT_TIMESTAMP)`,
          [paymentId, orderId, amount, method, txnRef]
        );
      }
      return {
        success: false,
        error: 'Simulated payment was marked as Failed by user/gateway test trigger. Order remains unconfirmed.'
      };
    }

    // Success path
    if (existingPayment) {
      db.execute(
        `UPDATE payments SET payment_status = 'Success', payment_method = ?, transaction_id = ?, payment_date = CURRENT_TIMESTAMP WHERE id = ?`,
        [method, txnRef, paymentId]
      );
    } else {
      db.execute(
        `INSERT INTO payments (id, order_id, amount, payment_method, transaction_id, payment_status, payment_date)
         VALUES (?, ?, ?, ?, ?, 'Success', CURRENT_TIMESTAMP)`,
        [paymentId, orderId, amount, method, txnRef]
      );
    }

    return {
      success: true,
      paymentId,
      transactionId: txnRef
    };
  }

  public static refundToWallet(
    userId: string,
    orderId: string,
    refundAmount: number,
    reason: string
  ): { success: boolean; newBalance: number; error?: string } {
    if (refundAmount <= 0) {
      return { success: false, newBalance: 0, error: 'Refund amount must be greater than zero.' };
    }

    return db.transaction(() => {
      const user = db.queryOne<User>(`SELECT * FROM users WHERE id = ?`, [userId]);
      if (!user) {
        return { success: false, newBalance: 0, error: 'User not found.' };
      }

      const currentBalance = Number(user.wallet_balance);
      const newBalance = Math.min(this.MAX_WALLET_BALANCE, currentBalance + refundAmount);

      db.execute(`UPDATE users SET wallet_balance = ? WHERE id = ?`, [newBalance, userId]);

      const txId = `WTX_REF_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      db.execute(
        `INSERT INTO wallet_transactions (id, user_id, order_id, amount, transaction_type, balance_after, description, transaction_date)
         VALUES (?, ?, ?, ?, 'Credit', ?, ?, CURRENT_TIMESTAMP)`,
        [txId, userId, orderId, refundAmount, newBalance, `Refund for Order #${orderId} (+₹${refundAmount.toFixed(2)}): ${reason}`]
      );

      db.execute(
        `UPDATE payments SET payment_status = 'Refunded' WHERE order_id = ?`,
        [orderId]
      );

      NotificationService.createNotification(
        userId,
        'Refund Credited to Wallet',
        `A refund of ₹${refundAmount.toFixed(2)} for Order #${orderId} has been credited to your wallet. Reason: ${reason}.`,
        'payment',
        `/orders/${orderId}`
      );

      return { success: true, newBalance };
    });
  }
}
