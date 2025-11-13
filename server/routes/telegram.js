/* eslint-env node */
const express = require('express');
const router = express.Router();
const TelegramCommandHandler = require('../services/telegramCommands');

let commandHandler;

/**
 * Initialize Telegram webhook
 * This should be called once when the server starts
 */
async function initTelegramWebhook(db) {
  commandHandler = new TelegramCommandHandler(db, null);
}

/**
 * POST /api/telegram/webhook
 * Handle incoming Telegram messages
 */
router.post('/webhook', async (req, res) => {
  try {
    const { message } = req.body;

    // Handle incoming message
    if (message && message.text) {
      const chatId = message.chat.id;
      if (commandHandler) {
        await commandHandler.handleMessage(message, chatId);
      }
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Telegram webhook error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/telegram/commands
 * Get list of available commands
 */
router.get('/commands', (req, res) => {
  const commands = [
    {
      command: '/start',
      description: 'Tampilkan menu awal dan daftar perintah',
    },
    {
      command: '/stock',
      description: 'Lihat semua produk dan status stock',
    },
    {
      command: '/harga [nama_barang]',
      description: 'Cek harga produk tertentu',
      example: '/harga Keripik Nanas',
    },
    {
      command: '/cek_barang [nama]',
      description: 'Lihat detail produk lengkap',
      example: '/cek_barang Kacang Goreng',
    },
    {
      command: '/stock_tersedia',
      description: 'Lihat semua produk yang tersedia',
    },
    {
      command: '/stock_habis',
      description: 'Lihat semua produk yang habis',
    },
    {
      command: '/bantuan',
      description: 'Tampilkan panduan penggunaan',
    },
  ];

  res.json({
    success: true,
    commands,
    note: 'Ketik nama barang langsung untuk mencarinya',
  });
});

/**
 * Export initialization function
 */
router.initTelegramWebhook = initTelegramWebhook;

module.exports = router;
