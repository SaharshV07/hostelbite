import { Router, Response } from 'express';
import { db } from '../config/database';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { Vendor, User, Order } from '../types';
import { NotificationService } from '../services/notificationService';

export const adminRouter = Router();

// Apply Admin Role Check to all routes in this router
adminRouter.use(requireAuth, requireRole('admin'));

// 1. List All Vendors with Full Administrative Data
adminRouter.get('/vendors', (req, res, next) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT v.*, u.name as owner_name, u.email as owner_email, u.mobile as owner_mobile,
             (SELECT COUNT(*) FROM menu_items WHERE vendor_id = v.id) as item_count,
             (SELECT COUNT(*) FROM orders WHERE vendor_id = v.id) as total_orders
      FROM vendors v
      JOIN users u ON v.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      sql += ` AND v.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY v.created_at DESC`;
    const vendors = db.queryAll<any>(sql, params);
    res.json({ success: true, data: { vendors } });
  } catch (err) {
    next(err);
  }
});

// 2. Approve, Reject, or Suspend Vendor
adminRouter.post('/vendors/:id/action', (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { action, comments } = req.body; // action: 'approve' | 'reject' | 'suspend' | 'activate'
    const vendorId = req.params.id;

    const vendor = db.queryOne<Vendor>(`SELECT * FROM vendors WHERE id = ?`, [vendorId]);
    if (!vendor) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Vendor not found.' } });
      return;
    }

    let targetStatus: string;
    let notifTitle: string;
    let notifMsg: string;

    if (action === 'approve') {
      targetStatus = 'approved';
      notifTitle = 'Vendor Application Approved!';
      notifMsg = `Congratulations! Your outlet "${vendor.business_name}" is approved and now active on HostelBite.`;
    } else if (action === 'reject') {
      targetStatus = 'rejected';
      notifTitle = 'Vendor Application Update';
      notifMsg = `Your vendor application was rejected. Comment: ${comments || 'Documents incomplete'}.`;
    } else if (action === 'suspend') {
      targetStatus = 'suspended';
      notifTitle = 'Vendor Account Suspended';
      notifMsg = `Your vendor listing has been temporarily suspended by the Chief Warden. Reason: ${comments || 'Administrative review'}.`;
    } else if (action === 'activate') {
      targetStatus = 'approved';
      notifTitle = 'Vendor Account Reactivated';
      notifMsg = `Your vendor listing has been reactivated. You can now accept orders.`;
    } else {
      res.status(400).json({ success: false, error: { code: 'INVALID_ACTION', message: 'Action must be approve, reject, suspend, or activate.' } });
      return;
    }

    db.execute(`UPDATE vendors SET status = ? WHERE id = ?`, [targetStatus, vendorId]);

    NotificationService.createNotification(
      vendor.user_id,
      notifTitle,
      notifMsg,
      'alert',
      `/vendor`
    );

    const updated = db.queryOne<Vendor>(`SELECT * FROM vendors WHERE id = ?`, [vendorId])!;
    res.json({
      success: true,
      data: { vendor: updated },
      message: `Vendor status updated to "${targetStatus}".`
    });
  } catch (err) {
    next(err);
  }
});

// 3. User Directory (Students, Vendors, Delivery Agents, Admins)
adminRouter.get('/users', (req, res, next) => {
  try {
    const { role, search } = req.query;
    let sql = `
      SELECT id, name, email, mobile, role, hostel_block, floor, room_number, wallet_balance, status, created_at
      FROM users
      WHERE 1=1
    `;
    const params: any[] = [];

    if (role) {
      sql += ` AND role = ?`;
      params.push(role);
    }

    if (search) {
      sql += ` AND (name LIKE ? OR email LIKE ? OR mobile LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY created_at DESC`;
    const users = db.queryAll<User>(sql, params);
    res.json({ success: true, data: { users } });
  } catch (err) {
    next(err);
  }
});

// 4. Update User Account Status (Active / Suspended)
adminRouter.post('/users/:id/status', (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended'].includes(status)) {
      res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Status must be "active" or "suspended".' } });
      return;
    }

    const targetUser = db.queryOne<User>(`SELECT * FROM users WHERE id = ?`, [req.params.id]);
    if (!targetUser) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found.' } });
      return;
    }

    if (targetUser.role === 'admin') {
      res.status(403).json({ success: false, error: { code: 'PROTECTED', message: 'Administrator accounts cannot be modified here.' } });
      return;
    }

    db.execute(`UPDATE users SET status = ? WHERE id = ?`, [status, req.params.id]);

    NotificationService.createNotification(
      targetUser.id,
      `Account Status Updated`,
      `Your HostelBite account has been marked as "${status}".`,
      'alert'
    );

    res.json({ success: true, message: `User account set to "${status}".` });
  } catch (err) {
    next(err);
  }
});

// 5. System Order Audit
adminRouter.get('/orders', (req, res, next) => {
  try {
    const { status, vendorId, limit = 100 } = req.query;
    let sql = `
      SELECT o.*, 
             u.name as student_name, u.email as student_email, u.hostel_block as student_block, u.room_number as student_room,
             v.business_name as vendor_name,
             p.payment_method, p.payment_status,
             da.agent_id as delivery_agent_id, du.name as delivery_agent_name
      FROM orders o
      JOIN users u ON o.student_id = u.id
      JOIN vendors v ON o.vendor_id = v.id
      LEFT JOIN payments p ON o.id = p.order_id
      LEFT JOIN delivery_assignments da ON o.id = da.order_id
      LEFT JOIN users du ON da.agent_id = du.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      sql += ` AND o.status = ?`;
      params.push(status);
    }

    if (vendorId) {
      sql += ` AND o.vendor_id = ?`;
      params.push(vendorId);
    }

    sql += ` ORDER BY o.order_date DESC LIMIT ?`;
    params.push(Number(limit));

    const orders = db.queryAll<any>(sql, params);
    res.json({ success: true, data: { orders } });
  } catch (err) {
    next(err);
  }
});
