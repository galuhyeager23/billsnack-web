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
    const supabase = req.app.locals.supabase;

    // Check if user is reseller
    if (!user || user.role !== 'reseller') {
      return res.status(403).json({ error: 'Only resellers can register with Telegram bot' });
    }

    const { chatId, firstName, lastName, username } = req.body;

    if (!chatId) {
      return res.status(400).json({ error: 'chatId is required' });
    }

    // Check if chat ID already registered
    const { data: existing, error: existingError } = await supabase
      .from('telegram_users')
      .select('id')
      .eq('chat_id', chatId)
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      throw existingError;
    }

    if (existing) {
      // Update existing registration
      const { error: updateError } = await supabase
        .from('telegram_users')
        .update({
          user_id: user.id,
          username,
          first_name: firstName,
          last_name: lastName,
          verified_at: new Date().toISOString(),
        })
        .eq('chat_id', chatId);

      if (updateError) throw updateError;
    } else {
      // Create new registration
      const { error: insertError } = await supabase
        .from('telegram_users')
        .insert({
          chat_id: chatId,
          user_id: user.id,
          bot_type: 'reseller',
          username,
          first_name: firstName,
          last_name: lastName,
          verified_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;
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
    const supabase = req.app.locals.supabase;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: rows, error } = await supabase
      .from('telegram_users')
      .select('chat_id, bot_type, verified_at')
      .eq('user_id', user.id)
      .eq('bot_type', 'reseller')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    const isRegistered = !!rows;
    res.json({
      isRegistered,
      chatId: isRegistered ? rows.chat_id : null,
      verifiedAt: isRegistered ? rows.verified_at : null,
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
    const supabase = req.app.locals.supabase;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { error } = await supabase
      .from('telegram_users')
      .delete()
      .eq('user_id', user.id)
      .eq('bot_type', 'reseller');

    if (error) throw error;

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
