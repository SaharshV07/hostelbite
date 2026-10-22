import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { PaymentService } from '../services/paymentService';

export const walletRouter = Router();

// 1. Get Current Wallet Balance
walletRouter.get('/balance', requireAuth, (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const balance = PaymentService.getWalletBalance(req.user!.userId);
    res.json({
      success: true,
      data: {
        walletBalance: balance,
        maxLimit: PaymentService.MAX_WALLET_BALANCE
      }
    });
  } catch (err) {
    next(err);
  }
});

// 2. Get Wallet Transactions History
walletRouter.get('/transactions', requireAuth, (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const transactions = PaymentService.getWalletTransactions(req.user!.userId);
    const balance = PaymentService.getWalletBalance(req.user!.userId);

    res.json({
      success: true,
      data: {
        transactions,
        currentBalance: balance
      }
    });
  } catch (err) {
    next(err);
  }
});

// 3. Top-Up Wallet (Simulated Payment)
walletRouter.post('/topup', requireAuth, (req: AuthenticatedRequest, res: Response, next) => {
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
    const result = PaymentService.topUpWallet(req.user!.userId, topupAmount);

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
  } catch (err) {
    next(err);
  }
});
