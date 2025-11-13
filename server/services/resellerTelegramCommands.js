/* eslint-env node */

class ResellerTelegramCommandHandler {
  constructor(db, telegramService) {
    this.db = db;
    this.telegramService = telegramService;
  }

  /**
   * Get reseller user_id from telegram chat_id
   * @param {number} chatId - Telegram chat ID
   * @returns {Promise<number|null>} - User ID or null if not found
   */
  async getResellerIdFromChatId(chatId) {
    try {
      const [rows] = await this.db.query(
        'SELECT user_id FROM telegram_users WHERE chat_id = ? AND bot_type = "reseller"',
        [chatId]
      );
      return rows.length > 0 ? rows[0].user_id : null;
    } catch (err) {
      console.error('Error getting reseller ID:', err);
      return null;
    }
  }

  /**
   * Check if user is registered reseller
   * @param {number} userId - User ID
   * @returns {Promise<boolean>}
   */
  async isRegisteredReseller(userId) {
    try {
      const [rows] = await this.db.query(
        'SELECT id FROM users WHERE id = ? AND role = "reseller"',
        [userId]
      );
      return rows.length > 0;
    } catch (err) {
      console.error('Error checking reseller status:', err);
      return false;
    }
  }

  /**
   * Handle incoming Telegram message for Reseller
   * @param {Object} message - Telegram message object
   * @param {number} chatId - Chat ID to respond to
   * @returns {Promise<void>}
   */
  async handleMessage(message, chatId) {
    const text = message.text || '';
    const command = text.split(' ')[0].toLowerCase();
    const args = text.split(' ').slice(1).join(' ');

    try {
      switch (command) {
        case '/start':
          await this.handleStart(chatId);
          break;
        case '/produk_saya':
          await this.handleMyProducts(chatId, args);
          break;
        case '/stok':
          await this.handleMyStock(chatId);
          break;
        case '/penjualan':
          await this.handleSalesInfo(chatId);
          break;
        case '/pesanan':
          await this.handleOrders(chatId);
          break;
        case '/bantuan':
        case '/help':
          await this.handleHelp(chatId);
          break;
        default:
          // If not a command, try to search for product
          if (text.length > 0 && !text.startsWith('/')) {
            await this.handleProductSearch(chatId, text);
          }
          break;
      }
    } catch (err) {
      console.error('Error handling Reseller Telegram command:', err);
      await this.sendMessage(chatId, '❌ Terjadi kesalahan saat memproses perintah Anda. Silakan coba lagi.');
    }
  }

  /**
   * Send message to Telegram chat
   * @param {number} chatId - Chat ID
   * @param {string} message - Message to send
   */
  async sendMessage(chatId, message) {
    try {
      const apiUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_RESELLER_BOT_TOKEN}`;
      const response = await fetch(`${apiUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      });
      return await response.json();
    } catch (err) {
      console.error('Error sending Reseller Telegram message:', err);
    }
  }

  /**
   * Handle /start command for Reseller
   */
  async handleStart(chatId) {
    const resellerId = await this.getResellerIdFromChatId(chatId);
    
    if (!resellerId) {
      const message = `
❌ <b>Bot Reseller Belum Terdaftar</b>

Anda belum terdaftar sebagai reseller di Bilsnack.

<b>Langkah-langkah:</b>
1. Daftar sebagai reseller di dashboard Bilsnack
2. Hubungi admin untuk link akun Telegram Anda
3. Verifikasi di bot ini

📞 Hubungi admin: @billsnack_admin
`;
      await this.sendMessage(chatId, message);
      return;
    }

    const message = `
<b>🎯 Selamat datang di Bilsnack Reseller Bot!</b>

Saya adalah bot untuk mengelola produk dan penjualan Anda di Bilsnack.

<b>Perintah yang tersedia:</b>
/produk_saya - Lihat daftar produk Anda
/stok - Lihat status stock produk Anda
/penjualan - Lihat info penjualan & earning Anda
/pesanan - Lihat pesanan terbaru
/bantuan - Tampilkan bantuan

<i>Atau ketik nama produk untuk mencarinya</i>
`;
    await this.sendMessage(chatId, message);
  }

  /**
   * Handle /produk_saya command - Show reseller's products ONLY
   */
  async handleMyProducts(chatId, args) {
    const resellerId = await this.getResellerIdFromChatId(chatId);
    
    if (!resellerId) {
      await this.sendMessage(chatId, '❌ Anda tidak terdaftar. Gunakan /start untuk info lebih lanjut.');
      return;
    }

    try {
      const [rows] = await this.db.query(
        'SELECT id, name, price, stock, category, in_stock FROM products WHERE reseller_id = ? ORDER BY created_at DESC LIMIT 20',
        [resellerId]
      );

      if (rows.length === 0) {
        await this.sendMessage(chatId, '❌ Anda belum memiliki produk. Upload produk di dashboard terlebih dahulu.');
        return;
      }

      let message = '<b>📦 Produk Anda</b>\n\n';
      rows.forEach((product, index) => {
        const statusEmoji = product.in_stock ? '✅' : '⚠️';
        message += `${index + 1}. <b>${product.name}</b>\n`;
        message += `   Harga: Rp${Number(product.price).toLocaleString('id-ID')}\n`;
        message += `   Stock: ${product.stock} ${statusEmoji}\n`;
        message += `   Kategori: ${product.category || 'N/A'}\n\n`;
      });

      message += `<i>Total produk: ${rows.length}</i>`;
      await this.sendMessage(chatId, message);
    } catch (err) {
      console.error('Error in handleMyProducts:', err);
      await this.sendMessage(chatId, '❌ Error saat mengambil data produk Anda.');
    }
  }

  /**
   * Handle /stok command - Show reseller's stock status ONLY
   */
  async handleMyStock(chatId) {
    const resellerId = await this.getResellerIdFromChatId(chatId);
    
    if (!resellerId) {
      await this.sendMessage(chatId, '❌ Anda tidak terdaftar. Gunakan /start untuk info lebih lanjut.');
      return;
    }

    try {
      const [rows] = await this.db.query(
        'SELECT name, stock, in_stock FROM products WHERE reseller_id = ? AND (stock > 0 OR in_stock = 1)',
        [resellerId]
      );

      if (rows.length === 0) {
        await this.sendMessage(chatId, '⚠️ Semua produk Anda habis atau tidak aktif.');
        return;
      }

      let message = '<b>📊 Status Stock Produk Anda</b>\n\n';
      let totalStock = 0;
      let lowStockCount = 0;
      
      rows.forEach((product) => {
        totalStock += product.stock;
        if (product.stock > 0 && product.stock <= 5) {
          lowStockCount++;
          message += `⚠️ <b>${product.name}</b>: ${product.stock} unit (terbatas!)\n`;
        } else if (product.stock > 5) {
          message += `✅ <b>${product.name}</b>: ${product.stock} unit\n`;
        }
      });

      message += `\n<b>Ringkasan:</b>\n`;
      message += `📦 Total Stock: ${totalStock} unit\n`;
      message += `⚠️ Produk Terbatas: ${lowStockCount} item`;

      await this.sendMessage(chatId, message);
    } catch (err) {
      console.error('Error in handleMyStock:', err);
      await this.sendMessage(chatId, '❌ Error saat mengambil status stock.');
    }
  }

  /**
   * Handle /penjualan command - Show sales information for reseller ONLY
   */
  async handleSalesInfo(chatId) {
    const resellerId = await this.getResellerIdFromChatId(chatId);
    
    if (!resellerId) {
      await this.sendMessage(chatId, '❌ Anda tidak terdaftar. Gunakan /start untuk info lebih lanjut.');
      return;
    }

    try {
      // Query orders containing reseller's products
      const [orders] = await this.db.query(`
        SELECT COUNT(DISTINCT o.id) as total_orders, SUM(o.total_price) as total_revenue
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        JOIN products p ON p.id = oi.product_id
        WHERE p.reseller_id = ? AND o.status = "completed"
      `, [resellerId]);

      const totalOrders = orders[0]?.total_orders || 0;
      const totalRevenue = orders[0]?.total_revenue || 0;

      const message = `
<b>💰 Informasi Penjualan Anda</b>

📊 <b>Total Penjualan:</b> ${totalOrders} order
💵 <b>Total Revenue:</b> Rp${Number(totalRevenue).toLocaleString('id-ID')}
📈 <b>Rating Toko:</b> ⭐ 4.5 (Sedang dikembangkan)
👥 <b>Total Pembeli:</b> Data sedang dikumpulkan

💡 <i>Detail lebih lengkap tersedia di dashboard</i>
`;
      await this.sendMessage(chatId, message);
    } catch (err) {
      console.error('Error in handleSalesInfo:', err);
      await this.sendMessage(chatId, '❌ Error saat mengambil info penjualan.');
    }
  }

  /**
   * Handle /pesanan command - Show reseller's recent orders ONLY
   */
  async handleOrders(chatId) {
    const resellerId = await this.getResellerIdFromChatId(chatId);
    
    if (!resellerId) {
      await this.sendMessage(chatId, '❌ Anda tidak terdaftar. Gunakan /start untuk info lebih lanjut.');
      return;
    }

    try {
      // Query orders containing this reseller's products
      const [rows] = await this.db.query(`
        SELECT DISTINCT o.id, o.total_price, o.status, o.created_at
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        JOIN products p ON p.id = oi.product_id
        WHERE p.reseller_id = ?
        ORDER BY o.created_at DESC
        LIMIT 5
      `, [resellerId]);

      if (rows.length === 0) {
        await this.sendMessage(chatId, '📭 Belum ada pesanan masuk untuk produk Anda.');
        return;
      }

      let message = '<b>📋 Pesanan Terbaru untuk Produk Anda</b>\n\n';
      rows.forEach((order, index) => {
        const date = new Date(order.created_at).toLocaleDateString('id-ID');
        const statusEmoji = order.status === 'completed' ? '✅' : order.status === 'pending' ? '⏳' : '❌';
        message += `${index + 1}. Order #${order.id}\n`;
        message += `   Total: Rp${Number(order.total_price).toLocaleString('id-ID')}\n`;
        message += `   Status: ${statusEmoji} ${order.status}\n`;
        message += `   Tanggal: ${date}\n\n`;
      });

      await this.sendMessage(chatId, message);
    } catch (err) {
      console.error('Error in handleOrders:', err);
      await this.sendMessage(chatId, '❌ Error saat mengambil data pesanan.');
    }
  }

  /**
   * Handle /bantuan command - Show help
   */
  async handleHelp(chatId) {
    const message = `
<b>📖 Panduan Bilsnack Reseller Bot</b>

<b>Perintah Utama:</b>

📦 <b>/produk_saya</b>
   Lihat daftar semua produk yang Anda jual

📊 <b>/stok</b>
   Lihat status stock produk Anda
   ⚠️ Alerting untuk produk dengan stock terbatas

💰 <b>/penjualan</b>
   Lihat ringkasan penjualan & earning Anda
   
📋 <b>/pesanan</b>
   Lihat 5 pesanan terbaru Anda

🔍 <b>Pencarian Produk</b>
   Ketik nama produk untuk mencari detailnya
   Contoh: "Keripik Nanas"

<b>💡 Tips:</b>
• Gunakan /stok secara berkala untuk memantau stock
• Aktifkan notifikasi untuk mendapat alert pesanan baru
• Buka dashboard untuk informasi lebih lengkap

<i>Butuh bantuan? Hubungi admin di @billsnack_admin</i>
`;
    await this.sendMessage(chatId, message);
  }

  /**
   * Handle product search - Only show reseller's own products
   */
  async handleProductSearch(chatId, productName) {
    const resellerId = await this.getResellerIdFromChatId(chatId);
    
    if (!resellerId) {
      await this.sendMessage(chatId, '❌ Anda tidak terdaftar. Gunakan /start untuk info lebih lanjut.');
      return;
    }

    try {
      const [rows] = await this.db.query(
        'SELECT id, name, price, stock, category, in_stock FROM products WHERE reseller_id = ? AND name LIKE ? LIMIT 1',
        [resellerId, `%${productName}%`]
      );

      if (rows.length === 0) {
        await this.sendMessage(chatId, `❌ Produk "${productName}" tidak ditemukan di katalog Anda.`);
        return;
      }

      const product = rows[0];
      const statusEmoji = product.in_stock ? '✅' : '❌';
      const message = `
<b>🔍 Hasil Pencarian</b>

<b>Nama:</b> ${product.name}
<b>Harga:</b> Rp${Number(product.price).toLocaleString('id-ID')}
<b>Kategori:</b> ${product.category || 'N/A'}
<b>Stock:</b> ${product.stock} unit
<b>Status:</b> ${statusEmoji} ${product.in_stock ? 'Aktif' : 'Tidak Aktif'}
`;
      await this.sendMessage(chatId, message);
    } catch (err) {
      console.error('Error in handleProductSearch:', err);
      await this.sendMessage(chatId, '❌ Error saat mencari produk.');
    }
  }
}

module.exports = ResellerTelegramCommandHandler;
