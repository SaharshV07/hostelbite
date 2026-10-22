import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { NotificationService } from '../services/notificationService';

export const notificationRouter = Router();

// 1. Get Current User's Notifications
notificationRouter.get('/', requireAuth, (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const notifications = NotificationService.getUserNotifications(req.user!.userId);
    const unreadCount = notifications.filter(n => !n.is_read).length;

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount
      }
    });
  } catch (err) {
    next(err);
  }
});

// 2. Mark Single Notification as Read
notificationRouter.put('/:id/read', requireAuth, (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const success = NotificationService.markAsRead(req.params.id, req.user!.userId);
    res.json({ success });
  } catch (err) {
    next(err);
  }
});

// 3. Mark All Notifications as Read
notificationRouter.put('/read-all', requireAuth, (req: AuthenticatedRequest, res: Response, next) => {
  try {
    NotificationService.markAllAsRead(req.user!.userId);
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    next(err);
  }
});
