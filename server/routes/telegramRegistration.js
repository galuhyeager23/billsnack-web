/* eslint-env node */
/**
 * Telegram Registration API
 * Allows resellers to link their Telegram account to their Bilsnack account
 */

const express = require('express');
const router = express.Router();
const auth = require('./auth');
const verifyToken = auth && auth.verifyToken ? auth.verifyToken : (req, res, next) => next();

/**
 * POST /api/telegram/register-reseller
 * Link Telegram chat ID to reseller account
 * Requires: JWT token + reseller role
 */
router.post('/register-reseller', verifyToken, async (req, res) => {
  try {
    const user = req.user;
    const db = req.app.locals.db;

    // Check if user is reseller
    if (!user || user.role !== 'reseller') {
      return res.status(403).json({ error: 'Only resellers can register with Telegram bot' });
    }

    const { chatId, firstName, lastName, username } = req.body;

    if (!chatId) {
      return res.status(400).json({ error: 'chatId is required' });
    }

    // Check if chat ID already registered
    const [existing] = await db.query(
      'SELECT id FROM telegram_users WHERE chat_id = ?',
      [chatId]
    );

    if (existing.length > 0) {
      // Update existing registration
      await db.query(
        'UPDATE telegram_users SET user_id = ?, username = ?, first_name = ?, last_name = ?, verified_at = NOW() WHERE chat_id = ?',
        [user.id, username, firstName, lastName, chatId]
      );
    } else {
      // Create new registration
      await db.query(
        'INSERT INTO telegram_users (chat_id, user_id, bot_type, username, first_name, last_name, verified_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [chatId, user.id, 'reseller', username, firstName, lastName]
      );
    }

    res.json({
      success: true,
      message: 'Telegram bot terdaftar berhasil! Kirim /start di bot untuk memulai.',
      chatId,
    });
  } catch (err) {
    console.error('Error registering Telegram account:', err);
    res.status(500).json({ error: 'Failed to register Telegram account' });
  }
});

/**
 * GET /api/telegram/reseller-status
 * Check if reseller is registered with Telegram
 * Requires: JWT token
 */
router.get('/reseller-status', verifyToken, async (req, res) => {
  try {
    const user = req.user;
    const db = req.app.locals.db;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [rows] = await db.query(
      'SELECT chat_id, bot_type, verified_at FROM telegram_users WHERE user_id = ? AND bot_type = "reseller"',
      [user.id]
    );

    const isRegistered = rows.length > 0;
    res.json({
      isRegistered,
      chatId: isRegistered ? rows[0].chat_id : null,
      verifiedAt: isRegistered ? rows[0].verified_at : null,
    });
  } catch (err) {
    console.error('Error checking Telegram status:', err);
    res.status(500).json({ error: 'Failed to check Telegram status' });
  }
});

/**
 * DELETE /api/telegram/unregister-reseller
 * Unlink Telegram account from reseller
 * Requires: JWT token
 */
router.delete('/unregister-reseller', verifyToken, async (req, res) => {
  try {
    const user = req.user;
    const db = req.app.locals.db;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await db.query(
      'DELETE FROM telegram_users WHERE user_id = ? AND bot_type = "reseller"',
      [user.id]
    );

    res.json({
      success: true,
      message: 'Akun Telegram berhasil dilepas dari profil Anda',
    });
  } catch (err) {
    console.error('Error unregistering Telegram account:', err);
    res.status(500).json({ error: 'Failed to unregister Telegram account' });
  }
});

module.exports = router;
