import { Router, Response } from 'express';
import { db } from '../config/database';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { PaymentService } from '../services/paymentService';
import { OrderService } from '../services/orderService';
import { Order, Payment } from '../types';

export const paymentRouter = Router();

// 1. Process Simulated Gateway Payment (UPI / Card / Net Banking)
paymentRouter.post('/process', requireAuth, (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { orderId, paymentMethod = 'UPI', simulateSuccess = true } = req.body;

    if (!orderId) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'orderId is required.' }
      });
      return;
    }

    const order = db.queryOne<Order>(`SELECT * FROM orders WHERE id = ?`, [orderId]);
    if (!order) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Order not found.' }
      });
      return;
    }

    if (order.student_id !== req.user!.userId && req.user!.role !== 'admin') {
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

    const paymentResult = PaymentService.processSimulatedGatewayPayment(
      order.id,
      Number(order.total_amount),
      paymentMethod,
      Boolean(simulateSuccess)
    );

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
    const confirmedOrder = OrderService.confirmPaidOrder(order.id);

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
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'PAYMENT_PROCESSING_ERROR', message: err.message }
    });
  }
});

// 2. Process Order Payment with Prepaid Wallet
paymentRouter.post('/wallet', requireAuth, (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'orderId is required.' }
      });
      return;
    }

    const order = db.queryOne<Order>(`SELECT * FROM orders WHERE id = ?`, [orderId]);
    if (!order) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Order not found.' }
      });
      return;
    }

    if (order.student_id !== req.user!.userId) {
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

    const walletResult = PaymentService.processWalletPayment(
      req.user!.userId,
      order.id,
      Number(order.total_amount)
    );

    if (!walletResult.success) {
      res.status(400).json({
        success: false,
        error: { code: 'INSUFFICIENT_FUNDS', message: walletResult.error }
      });
      return;
    }

    const confirmedOrder = OrderService.confirmPaidOrder(order.id);
    const newBalance = PaymentService.getWalletBalance(req.user!.userId);

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
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'WALLET_PAYMENT_ERROR', message: err.message }
    });
  }
});

// 3. Get Payment Details for an Order
paymentRouter.get('/:orderId', requireAuth, (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const payment = db.queryOne<Payment>(`SELECT * FROM payments WHERE order_id = ?`, [req.params.orderId]);
    if (!payment) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'No payment record found for this order.' }
      });
      return;
    }

    res.json({ success: true, data: { payment } });
  } catch (err) {
    next(err);
  }
});
