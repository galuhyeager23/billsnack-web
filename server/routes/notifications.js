/* eslint-env node */
const express = require('express');
const router = express.Router();
const NotificationService = require('../services/notificationService');
const auth = require('./auth');

const verifyToken = auth && auth.verifyToken ? auth.verifyToken : (req, res, next) => next();

let notificationService;

/**
 * Initialize notification service
 */
function initNotificationService(db) {
  notificationService = new NotificationService(db);
}

/**
 * GET /api/notifications
 * Get notifications for logged-in user
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const offset = Math.max(0, Number(req.query.offset) || 0);
    const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 20));

    const result = await notificationService.getNotifications(user.id, offset, limit);

    res.json({
      success: true,
      notifications: result.notifications,
      total: result.total,
      offset,
      limit,
    });
  } catch (err) {
    console.error('Error getting notifications:', err);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

/**
 * GET /api/notifications/unread
 * Get unread notifications count
 */
router.get('/unread/count', verifyToken, async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const count = await notificationService.countUnread(user.id);

    res.json({
      success: true,
      unreadCount: count,
    });
  } catch (err) {
    console.error('Error counting unread:', err);
    res.status(500).json({ error: 'Failed to count unread notifications' });
  }
});

/**
 * GET /api/notifications/unread
 * Get unread notifications (limited list)
 */
router.get('/unread', verifyToken, async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const limit = Math.max(1, Math.min(20, Number(req.query.limit) || 10));
    const notifications = await notificationService.getUnreadNotifications(user.id, limit);

    res.json({
      success: true,
      notifications,
      count: notifications.length,
    });
  } catch (err) {
    console.error('Error getting unread notifications:', err);
    res.status(500).json({ error: 'Failed to get unread notifications' });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark notification as read
 */
router.patch('/:id/read', verifyToken, async (req, res) => {
  try {
    const user = req.user;
    const notificationId = Number(req.params.id);

    if (!user || !notificationId) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    // Verify notification belongs to user
    const db = req.app.locals.db;
    const [notifications] = await db.query(
      'SELECT id FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, user.id]
    );

    if (notifications.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await notificationService.markAsRead(notificationId);

    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

/**
 * POST /api/notifications/read-all
 * Mark all notifications as read for user
 */
router.post('/read-all', verifyToken, async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await notificationService.markAllAsRead(user.id);

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (err) {
    console.error('Error marking all as read:', err);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete notification
 */
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const user = req.user;
    const notificationId = Number(req.params.id);

    if (!user || !notificationId) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    // Verify notification belongs to user
    const db = req.app.locals.db;
    const [notifications] = await db.query(
      'SELECT id FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, user.id]
    );

    if (notifications.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Delete notification
    await db.query('DELETE FROM notifications WHERE id = ?', [notificationId]);

    res.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (err) {
    console.error('Error deleting notification:', err);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Export service initializer
router.initNotificationService = initNotificationService;

module.exports = router;
