import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth';
import { vendorRouter } from './routes/vendors';
import { menuRouter } from './routes/menu';
import { orderRouter } from './routes/orders';
import { paymentRouter } from './routes/payments';
import { walletRouter } from './routes/wallet';
import { deliveryRouter } from './routes/delivery';
import { complaintRouter } from './routes/complaints';
import { reviewRouter } from './routes/reviews';
import { adminRouter } from './routes/admin';
import { analyticsRouter } from './routes/analytics';
import { notificationRouter } from './routes/notifications';
import fs from 'node:fs';
import path from 'node:path';
import { errorHandler } from './middleware/errorHandler';

export const app = express();

app.use(cors({
  origin: true, // Allow frontend dev server
  credentials: true
}));

app.use(express.json());

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'HostelBite Backend API',
    institution: 'Manipal University Jaipur - Department of IT',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/vendors', vendorRouter);
app.use('/api/menu', menuRouter);
app.use('/api/orders', orderRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/delivery', deliveryRouter);
app.use('/api/complaints', complaintRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/admin', adminRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/notifications', notificationRouter);

// Serve Frontend SPA in Production / Unified Mode
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Centralized Error Handling
app.use(errorHandler);
