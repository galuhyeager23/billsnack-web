/* eslint-env node */
const express = require('express');
const router = express.Router();
const ResellerTelegramCommandHandler = require('../services/resellerTelegramCommands');

let resellerCommandHandler;

/**
 * Initialize Reseller Telegram webhook
 * This should be called once when the server starts
 */
async function initResellerTelegramWebhook(db) {
  resellerCommandHandler = new ResellerTelegramCommandHandler(db, null);
}

/**
 * POST /api/telegram/reseller/webhook
 * Handle incoming Telegram messages for Reseller Bot
 */
router.post('/reseller/webhook', async (req, res) => {
  try {
    const { message } = req.body;

    // Handle incoming message
    if (message && message.text) {
      const chatId = message.chat.id;
      if (resellerCommandHandler) {
        await resellerCommandHandler.handleMessage(message, chatId);
      }
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Reseller Telegram webhook error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/telegram/reseller/commands
 * Get list of available commands for Reseller
 */
router.get('/reseller/commands', (req, res) => {
  const commands = [
    {
      command: '/start',
      description: 'Tampilkan menu awal dan daftar perintah',
    },
    {
      command: '/produk_saya',
      description: 'Lihat semua produk yang Anda jual',
    },
    {
      command: '/stok',
      description: 'Lihat status stock produk Anda',
    },
    {
      command: '/penjualan',
      description: 'Lihat info penjualan & earning Anda',
    },
    {
      command: '/pesanan',
      description: 'Lihat pesanan terbaru Anda',
    },
    {
      command: '/bantuan',
      description: 'Tampilkan panduan penggunaan',
    },
  ];

  res.json({
    success: true,
    commands,
    note: 'Bot ini khusus untuk reseller. Ketik nama produk untuk mencarinya.',
  });
});

/**
 * Export initialization function
 */
router.initResellerTelegramWebhook = initResellerTelegramWebhook;

module.exports = router;
