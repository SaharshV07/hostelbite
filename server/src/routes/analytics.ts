import { Router, Response } from 'express';
import { db } from '../config/database';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { Vendor } from '../types';

export const analyticsRouter = Router();

// 1. Platform-wide Administrative Analytics (Admin Only)
analyticsRouter.get('/overview', requireAuth, requireRole('admin'), (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const totalOrders = db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM orders WHERE status != 'Payment Pending'`
    )?.count || 0;

    const totalRevenue = db.queryOne<{ revenue: number }>(
      `SELECT SUM(total_amount) as revenue FROM orders WHERE status IN ('Delivered', 'Ready', 'Out for Delivery', 'Accepted', 'Preparing')`
    )?.revenue || 0;

    const activeVendors = db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM vendors WHERE status = 'approved' AND accepting_orders = 1`
    )?.count || 0;

    const openComplaints = db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM complaints WHERE status IN ('Open', 'Escalated')`
    )?.count || 0;

    const statusCounts = db.queryAll<{ status: string; count: number }>(
      `SELECT status, COUNT(*) as count FROM orders WHERE status != 'Payment Pending' GROUP BY status`
    );

    const blockDistribution = db.queryAll<{ block: string; count: number }>(
      `SELECT COALESCE(u.hostel_block, 'Other') as block, COUNT(*) as count 
       FROM orders o 
       JOIN users u ON o.student_id = u.id 
       WHERE o.status != 'Payment Pending'
       GROUP BY block`
    );

    // Mess Wastage Indicator (FR-RPT-02):
    // Total subscribed hostel students vs today's meal pre-orders
    const totalStudents = db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM users WHERE role = 'student'`
    )?.count || 0;

    const messOrdersToday = db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM orders o
       JOIN vendors v ON o.vendor_id = v.id
       WHERE v.is_mess = 1 AND o.status != 'Payment Pending'`
    )?.count || 0;

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
  } catch (err) {
    next(err);
  }
});

// 2. Vendor Specific Analytics (Vendor Only)
analyticsRouter.get('/vendor', requireAuth, requireRole('vendor'), (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const vendor = db.queryOne<Vendor>(`SELECT * FROM vendors WHERE user_id = ?`, [req.user!.userId]);
    if (!vendor) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Vendor not found.' } });
      return;
    }

    const totalOrders = db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM orders WHERE vendor_id = ? AND status != 'Payment Pending'`,
      [vendor.id]
    )?.count || 0;

    const totalRevenue = db.queryOne<{ revenue: number }>(
      `SELECT SUM(subtotal) as revenue FROM orders WHERE vendor_id = ? AND status IN ('Delivered', 'Ready', 'Out for Delivery', 'Accepted', 'Preparing')`,
      [vendor.id]
    )?.revenue || 0;

    const topItems = db.queryAll<{ item_name: string; total_quantity: number; revenue: number }>(
      `SELECT oi.item_name, SUM(oi.quantity) as total_quantity, SUM(oi.subtotal) as revenue
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE o.vendor_id = ? AND o.status != 'Payment Pending'
       GROUP BY oi.item_name
       ORDER BY total_quantity DESC
       LIMIT 5`,
      [vendor.id]
    );

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
  } catch (err) {
    next(err);
  }
});
