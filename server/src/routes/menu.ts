import { Router, Response } from 'express';
import { db } from '../config/database';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { MenuItem, Vendor } from '../types';

export const menuRouter = Router();

// 1. Browse Menu Items with Filters & Search
menuRouter.get('/', (req, res, next) => {
  try {
    const { vendorId, dietaryTag, category, search, minPrice, maxPrice, availability } = req.query;

    let sql = `
      SELECT m.*, v.business_name as vendor_name, v.accepting_orders as vendor_accepting, v.is_mess
      FROM menu_items m
      JOIN vendors v ON m.vendor_id = v.id
      WHERE v.status = 'approved'
    `;
    const params: any[] = [];

    if (vendorId) {
      sql += ` AND m.vendor_id = ?`;
      params.push(vendorId);
    }

    if (dietaryTag) {
      sql += ` AND m.dietary_tag = ?`;
      params.push(dietaryTag);
    }

    if (category) {
      sql += ` AND m.category = ?`;
      params.push(category);
    }

    if (availability !== undefined) {
      sql += ` AND m.availability = ?`;
      params.push(availability === '1' || availability === 'true' ? 1 : 0);
    }

    if (minPrice) {
      sql += ` AND m.price >= ?`;
      params.push(Number(minPrice));
    }

    if (maxPrice) {
      sql += ` AND m.price <= ?`;
      params.push(Number(maxPrice));
    }

    if (search) {
      sql += ` AND (m.name LIKE ? OR m.description LIKE ? OR v.business_name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY m.is_popular DESC, m.name ASC`;

    const items = db.queryAll<MenuItem>(sql, params);
    res.json({ success: true, data: { items } });
  } catch (err) {
    next(err);
  }
});

// 2. Get Single Menu Item
menuRouter.get('/:id', (req, res, next) => {
  try {
    const item = db.queryOne<MenuItem>(
      `SELECT m.*, v.business_name as vendor_name 
       FROM menu_items m 
       JOIN vendors v ON m.vendor_id = v.id 
       WHERE m.id = ?`,
      [req.params.id]
    );

    if (!item) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Menu item not found.' }
      });
      return;
    }

    res.json({ success: true, data: { item } });
  } catch (err) {
    next(err);
  }
});

// Helper: check vendor ownership
function getVendorForUser(userId: string): Vendor | undefined {
  return db.queryOne<Vendor>(`SELECT * FROM vendors WHERE user_id = ?`, [userId]);
}

// 3. Create Menu Item (Vendor Only)
menuRouter.post('/', requireAuth, requireRole('vendor'), (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const vendor = getVendorForUser(req.user!.userId);
    if (!vendor) {
      res.status(403).json({
        success: false,
        error: { code: 'NO_VENDOR_PROFILE', message: 'User does not manage an active vendor outlet.' }
      });
      return;
    }

    const { name, description, price, dietaryTag, category, photo } = req.body;
    if (!name || price === undefined || !dietaryTag) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Name, price, and dietary tag (Veg, Non-Veg, Vegan, Jain) are required.' }
      });
      return;
    }

    const itemId = `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    db.execute(
      `INSERT INTO menu_items (
        id, vendor_id, name, description, price, dietary_tag, availability, category, is_new, is_popular, photo
      ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, 1, 0, ?)`,
      [
        itemId,
        vendor.id,
        name.trim(),
        description || null,
        Number(price),
        dietaryTag,
        category || 'Main Course',
        photo || null
      ]
    );

    const created = db.queryOne<MenuItem>(`SELECT * FROM menu_items WHERE id = ?`, [itemId])!;
    res.status(201).json({
      success: true,
      data: { item: created },
      message: 'Menu item created successfully.'
    });
  } catch (err) {
    next(err);
  }
});

// 4. Update Menu Item (Vendor Only)
menuRouter.put('/:id', requireAuth, requireRole('vendor'), (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const vendor = getVendorForUser(req.user!.userId);
    if (!vendor) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'No authorized vendor profile found.' }
      });
      return;
    }

    const existing = db.queryOne<MenuItem>(`SELECT * FROM menu_items WHERE id = ?`, [req.params.id]);
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Menu item not found.' }
      });
      return;
    }

    if (existing.vendor_id !== vendor.id) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You can only update menu items for your own outlet.' }
      });
      return;
    }

    const { name, description, price, dietaryTag, category, availability, photo } = req.body;

    db.execute(
      `UPDATE menu_items SET
         name = COALESCE(?, name),
         description = COALESCE(?, description),
         price = COALESCE(?, price),
         dietary_tag = COALESCE(?, dietary_tag),
         category = COALESCE(?, category),
         availability = COALESCE(?, availability),
         photo = COALESCE(?, photo)
       WHERE id = ?`,
      [
        name ? name.trim() : null,
        description !== undefined ? description : null,
        price !== undefined ? Number(price) : null,
        dietaryTag || null,
        category || null,
        availability !== undefined ? (availability ? 1 : 0) : null,
        photo !== undefined ? photo : null,
        req.params.id
      ]
    );

    const updated = db.queryOne<MenuItem>(`SELECT * FROM menu_items WHERE id = ?`, [req.params.id])!;
    res.json({
      success: true,
      data: { item: updated },
      message: 'Menu item updated.'
    });
  } catch (err) {
    next(err);
  }
});

// 5. Toggle Item Availability (Quick Switch for Kitchen)
menuRouter.put('/:id/availability', requireAuth, requireRole('vendor'), (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const vendor = getVendorForUser(req.user!.userId);
    if (!vendor) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Vendor access required.' } });
      return;
    }

    const existing = db.queryOne<MenuItem>(`SELECT * FROM menu_items WHERE id = ?`, [req.params.id]);
    if (!existing || existing.vendor_id !== vendor.id) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Item not found in your outlet.' } });
      return;
    }

    const { availability } = req.body;
    const newVal = availability ? 1 : 0;
    db.execute(`UPDATE menu_items SET availability = ? WHERE id = ?`, [newVal, req.params.id]);

    res.json({
      success: true,
      data: { id: req.params.id, availability: newVal },
      message: `Item marked ${newVal ? 'in stock' : 'out of stock'}.`
    });
  } catch (err) {
    next(err);
  }
});

// 6. Delete Menu Item (Vendor Only)
menuRouter.delete('/:id', requireAuth, requireRole('vendor'), (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const vendor = getVendorForUser(req.user!.userId);
    if (!vendor) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Vendor access required.' } });
      return;
    }

    const existing = db.queryOne<MenuItem>(`SELECT * FROM menu_items WHERE id = ?`, [req.params.id]);
    if (!existing || existing.vendor_id !== vendor.id) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Item not found in your outlet.' } });
      return;
    }

    db.execute(`DELETE FROM menu_items WHERE id = ?`, [req.params.id]);
    res.json({ success: true, message: 'Menu item deleted successfully.' });
  } catch (err) {
    next(err);
  }
});
