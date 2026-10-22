import { db } from '../config/database';
import { Notification } from '../types';

export class NotificationService {
  public static createNotification(
    userId: string,
    title: string,
    message: string,
    type: 'info' | 'order' | 'payment' | 'delivery' | 'alert' = 'info',
    link?: string
  ): Notification {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const sql = `
      INSERT INTO notifications (id, user_id, title, message, type, is_read, link, created_at)
      VALUES (?, ?, ?, ?, ?, 0, ?, CURRENT_TIMESTAMP)
    `;
    db.execute(sql, [id, userId, title, message, type, link || null]);
    return {
      id,
      user_id: userId,
      title,
      message,
      type,
      is_read: 0,
      link: link || null,
      created_at: new Date().toISOString()
    };
  }

  public static getUserNotifications(userId: string): Notification[] {
    return db.queryAll<Notification>(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30`,
      [userId]
    );
  }

  public static markAsRead(notificationId: string, userId: string): boolean {
    const res = db.execute(
      `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
      [notificationId, userId]
    );
    return res.changes > 0;
  }

  public static markAllAsRead(userId: string): void {
    db.execute(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`, [userId]);
  }
}
