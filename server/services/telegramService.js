/* eslint-env node */
const fetch = require('node-fetch');

class TelegramService {
  constructor(botToken, adminChatId) {
    this.botToken = botToken;
    this.adminChatId = adminChatId;
    this.apiUrl = `https://api.telegram.org/bot${botToken}`;
  }

  /**
   * Send a message to the admin Telegram chat
   * @param {string} message - The message to send
   * @returns {Promise<Object>} - Response from Telegram API
   */
  async sendMessage(message) {
    if (!this.botToken || !this.adminChatId) {
      console.warn('Telegram service not configured. Skipping message send.');
      return null;
    }

    try {
      const response = await fetch(`${this.apiUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.adminChatId,
          text: message,
          parse_mode: 'HTML',
        }),
      });

      const result = await response.json();
      if (!result.ok) {
        console.error('Telegram API error:', result.description);
        return null;
      }
      return result;
    } catch (err) {
      console.error('Failed to send Telegram message:', err);
      return null;
    }
  }

  /**
   * Notify admin of a new order
   * @param {Object} order - Order object with customer and items info
   * @returns {Promise<Object>} - Response from Telegram API
   */
  async notifyNewOrder(order) {
    const {
      id,
      order_number,
      email,
      name,
      phone,
      address,
      city,
      province,
      total,
      items = [],
    } = order;

    // Format items list
    const itemsList = items
      .map((item) => `• <b>${item.name}</b> x${item.quantity} = Rp${item.total_price.toLocaleString('id-ID')}`)
      .join('\n');

    const message = `
<b>🛒 Order Baru Masuk!</b>

<b>Order ID:</b> ${id}
<b>Order Number:</b> <code>${order_number}</code>

<b>👤 Customer Info:</b>
• <b>Nama:</b> ${name || 'N/A'}
• <b>Email:</b> ${email || 'N/A'}
• <b>Phone:</b> ${phone || 'N/A'}

<b>📍 Alamat:</b>
${address || 'N/A'}, ${city || 'N/A'}, ${province || 'N/A'}

<b>📦 Items:</b>
${itemsList}

<b>💰 Total:</b> Rp${Number(total).toLocaleString('id-ID')}

<i>Check dashboard untuk detail lengkap</i>
`;

    return this.sendMessage(message);
  }

  /**
   * Notify admin of order status update
   * @param {Object} order - Order object
   * @param {string} status - New status (pending, processing, shipped, delivered, cancelled)
   * @returns {Promise<Object>} - Response from Telegram API
   */
  async notifyOrderStatusUpdate(order, status) {
    const statusEmoji = {
      pending: '⏳',
      processing: '🔄',
      shipped: '📦',
      delivered: '✅',
      cancelled: '❌',
    };

    const emoji = statusEmoji[status] || '📌';

    const message = `
${emoji} <b>Order Status Update</b>

<b>Order Number:</b> <code>${order.order_number}</code>
<b>Status:</b> <b>${status.toUpperCase()}</b>
<b>Customer:</b> ${order.name}
<b>Total:</b> Rp${Number(order.total).toLocaleString('id-ID')}
`;

    return this.sendMessage(message);
  }
}

module.exports = TelegramService;
