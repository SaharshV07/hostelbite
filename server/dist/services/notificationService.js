"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const database_1 = require("../config/database");
class NotificationService {
    static createNotification(userId, title, message, type = 'info', link) {
        const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const sql = `
      INSERT INTO notifications (id, user_id, title, message, type, is_read, link, created_at)
      VALUES (?, ?, ?, ?, ?, 0, ?, CURRENT_TIMESTAMP)
    `;
        database_1.db.execute(sql, [id, userId, title, message, type, link || null]);
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
    static getUserNotifications(userId) {
        return database_1.db.queryAll(`SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30`, [userId]);
    }
    static markAsRead(notificationId, userId) {
        const res = database_1.db.execute(`UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`, [notificationId, userId]);
        return res.changes > 0;
    }
    static markAllAsRead(userId) {
        database_1.db.execute(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`, [userId]);
    }
}
exports.NotificationService = NotificationService;
