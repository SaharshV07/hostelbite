"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const notificationService_1 = require("../services/notificationService");
exports.notificationRouter = (0, express_1.Router)();
// 1. Get Current User's Notifications
exports.notificationRouter.get('/', auth_1.requireAuth, (req, res, next) => {
    try {
        const notifications = notificationService_1.NotificationService.getUserNotifications(req.user.userId);
        const unreadCount = notifications.filter(n => !n.is_read).length;
        res.json({
            success: true,
            data: {
                notifications,
                unreadCount
            }
        });
    }
    catch (err) {
        next(err);
    }
});
// 2. Mark Single Notification as Read
exports.notificationRouter.put('/:id/read', auth_1.requireAuth, (req, res, next) => {
    try {
        const success = notificationService_1.NotificationService.markAsRead(req.params.id, req.user.userId);
        res.json({ success });
    }
    catch (err) {
        next(err);
    }
});
// 3. Mark All Notifications as Read
exports.notificationRouter.put('/read-all', auth_1.requireAuth, (req, res, next) => {
    try {
        notificationService_1.NotificationService.markAllAsRead(req.user.userId);
        res.json({ success: true, message: 'All notifications marked as read.' });
    }
    catch (err) {
        next(err);
    }
});
