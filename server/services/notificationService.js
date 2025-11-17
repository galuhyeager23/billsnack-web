/* eslint-env node */

class NotificationService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Create notification for order purchase
   * @param {number} orderId - Order ID
   * @param {Array} orderItems - Order items with products
   * @returns {Promise<void>}
   */
  async notifyOrderPurchase(orderId, orderItems) {
    try {
      // Get order details
      const [orders] = await this.db.query(
        'SELECT id, user_id, total_price, created_at FROM orders WHERE id = ?',
        [orderId]
      );

      if (orders.length === 0) {
        console.warn(`Order ${orderId} not found`);
        return;
      }

  const order = orders[0];
  // buyerUserId not used currently
  const _buyerUserId = order.user_id;

      // For each product in order, notify the reseller
      if (orderItems && orderItems.length > 0) {
        for (const item of orderItems) {
          // Get product details
          const [products] = await this.db.query(
            'SELECT id, name, price, reseller_id FROM products WHERE id = ?',
            [item.product_id]
          );

          if (products.length > 0) {
            const product = products[0];
            const resellerId = product.reseller_id;

            // Notify reseller if product has reseller_id (not admin products)
            if (resellerId) {
              await this.createNotification(
                resellerId,
                'order_purchase',
                `📦 Produk ${product.name} dibeli!`,
                `Pesanan baru! ${item.quantity} x ${product.name} (Rp${Number(product.price).toLocaleString('id-ID')})`,
                orderId,
                product.id
              );
            }
          }
        }
      }

      // Also notify admin about all orders
      await this.createNotification(
        null, // null = admin (we'll query admin users)
        'order_purchase',
        '📦 Pesanan baru diterima!',
        `Order #${orderId} - Total: Rp${Number(order.total_price).toLocaleString('id-ID')} - ${orderItems.length} item`,
        orderId,
        null,
        'admin'
      );

      console.log(`Notifications created for order ${orderId}`);
    } catch (err) {
      console.error('Error creating purchase notification:', err);
    }
  }

  /**
   * Create a notification record
   * @param {number|null} userId - User ID to notify (null for admin)
   * @param {string} type - Notification type
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {number} orderId - Related order ID
   * @param {number} productId - Related product ID
   * @param {string} recipientType - 'reseller', 'admin', or null
   * @returns {Promise<void>}
   */
  async createNotification(userId, type, title, message, orderId, productId, recipientType = 'reseller') {
    try {
      if (recipientType === 'admin') {
        // Create notification for all admin users
        const [admins] = await this.db.query(
          'SELECT id FROM users WHERE role = "admin"'
        );

        for (const admin of admins) {
          await this.db.query(
            'INSERT INTO notifications (user_id, type, title, message, order_id, product_id) VALUES (?, ?, ?, ?, ?, ?)',
            [admin.id, type, title, message, orderId, productId]
          );
        }
      } else if (userId) {
        // Create notification for specific user
        await this.db.query(
          'INSERT INTO notifications (user_id, type, title, message, order_id, product_id) VALUES (?, ?, ?, ?, ?, ?)',
          [userId, type, title, message, orderId, productId]
        );
      }
    } catch (err) {
      console.error('Error creating notification:', err);
    }
  }

  /**
   * Get unread notifications for a user
   * @param {number} userId - User ID
   * @param {number} limit - Limit results
   * @returns {Promise<Array>} - Notifications
   */
  async getUnreadNotifications(userId, limit = 10) {
    try {
      const [rows] = await this.db.query(
        'SELECT * FROM notifications WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC LIMIT ?',
        [userId, limit]
      );
      return rows || [];
    } catch (err) {
      console.error('Error getting unread notifications:', err);
      return [];
    }
  }

  /**
   * Get all notifications for a user (paginated)
   * @param {number} userId - User ID
   * @param {number} offset - Offset
   * @param {number} limit - Limit
   * @returns {Promise<{notifications: Array, total: number}>}
   */
  async getNotifications(userId, offset = 0, limit = 20) {
    try {
      const [notifications] = await this.db.query(
        'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [userId, limit, offset]
      );

      const [countResult] = await this.db.query(
        'SELECT COUNT(*) as total FROM notifications WHERE user_id = ?',
        [userId]
      );

      return {
        notifications: notifications || [],
        total: countResult[0]?.total || 0,
      };
    } catch (err) {
      console.error('Error getting notifications:', err);
      return { notifications: [], total: 0 };
    }
  }

  /**
   * Mark notification as read
   * @param {number} notificationId - Notification ID
   * @returns {Promise<void>}
   */
  async markAsRead(notificationId) {
    try {
      await this.db.query(
        'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id = ?',
        [notificationId]
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }

  /**
   * Mark all notifications as read for user
   * @param {number} userId - User ID
   * @returns {Promise<void>}
   */
  async markAllAsRead(userId) {
    try {
      await this.db.query(
        'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE user_id = ? AND is_read = 0',
        [userId]
      );
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }

  /**
   * Count unread notifications
   * @param {number} userId - User ID
   * @returns {Promise<number>}
   */
  async countUnread(userId) {
    try {
      const [result] = await this.db.query(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
        [userId]
      );
      return result[0]?.count || 0;
    } catch (err) {
      console.error('Error counting unread notifications:', err);
      return 0;
    }
  }

  /**
   * Delete old notifications (cleanup)
   * @param {number} daysOld - Delete notifications older than this many days
   * @returns {Promise<void>}
   */
  async deleteOldNotifications(daysOld = 30) {
    try {
      const result = await this.db.query(
        'DELETE FROM notifications WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
        [daysOld]
      );
      console.log(`Deleted ${result[0]?.affectedRows || 0} old notifications`);
    } catch (err) {
      console.error('Error deleting old notifications:', err);
    }
  }

  /**
   * Send notification to Telegram (for reseller bot)
   * @param {number} userId - User ID
   * @param {string} message - Message to send
   * @returns {Promise<boolean>}
   */
  async sendTelegramNotification(userId, message) {
    try {
      // Get chat_id from telegram_users table
      const [telegramUsers] = await this.db.query(
        'SELECT chat_id FROM telegram_users WHERE user_id = ? AND bot_type = "reseller" LIMIT 1',
        [userId]
      );

      if (telegramUsers.length === 0) {
        console.warn(`No Telegram chat found for user ${userId}`);
        return false;
      }

      const chatId = telegramUsers[0].chat_id;
      const botToken = process.env.TELEGRAM_RESELLER_BOT_TOKEN;

      if (!botToken) {
        console.warn('TELEGRAM_RESELLER_BOT_TOKEN not set');
        return false;
      }

      const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      });

      return response.ok;
    } catch (err) {
      console.error('Error sending Telegram notification:', err);
      return false;
    }
  }
}

module.exports = NotificationService;
