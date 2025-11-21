/* eslint-env node */
const express = require('express');
const supabase = require('../supabase');
const auth = require('./auth');

const router = express.Router();
const verifyToken = auth && auth.verifyToken ? auth.verifyToken : (req, res, next) => next();

function requireReseller(req, res, next) {
  const u = req.user || {};
  if (u.role && u.role === 'reseller') return next();
  return res.status(403).json({ error: 'Reseller privileges required' });
}

// List resellers (non-sensitive fields). Optional ?excludeSelf=1 to hide current user
router.get('/', verifyToken, async (req, res) => {
  const excludeSelf = req.query.excludeSelf === '1';
  const userId = req.user && req.user.id;
  
  try {
    let query = supabase
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        username,
        reseller_profiles (
          store_name,
          phone
        )
      `)
      .eq('role', 'reseller');

    if (excludeSelf && userId) {
      query = query.neq('id', userId);
    }

    const { data: rows, error } = await query;
    if (error) throw error;

    const out = (rows || []).map(r => ({
      id: r.id,
      email: r.email,
      first_name: r.first_name,
      last_name: r.last_name,
      username: r.username,
      store_name: r.reseller_profiles?.[0]?.store_name || null,
      phone: r.reseller_profiles?.[0]?.phone || null
    }));

    res.json(out);
  } catch (err) {
    console.error('Failed to fetch resellers', err);
    res.status(500).json({ error: 'Failed to fetch resellers' });
  }
});

// Return the list of connected reseller IDs for the authenticated user
router.get('/connections', verifyToken, requireReseller, async (req, res) => {
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const { data: rows, error } = await supabase
      .from('reseller_connections')
      .select('user_a, user_b, status')
      .or(`user_a.eq.${userId},user_b.eq.${userId}`);

    if (error) throw error;

    // Map to set of peer ids
    const peers = new Set();
    (rows || []).forEach(r => {
      if (r.user_a === userId) peers.add(r.user_b);
      if (r.user_b === userId) peers.add(r.user_a);
    });
    
    res.json({ connections: Array.from(peers) });
  } catch (err) {
    console.error('Failed to fetch connections', err);
    res.status(500).json({ error: 'Failed to fetch connections' });
  }
});

// Toggle connection: create symmetric rows when connecting, remove both when disconnecting
router.post('/:id/connect', verifyToken, requireReseller, async (req, res) => {
  const targetId = Number(req.params.id);
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!targetId || userId === targetId) return res.status(400).json({ error: 'Invalid target' });
  
  try {
    // Check existing connection
    const { data: existing, error: fetchError } = await supabase
      .from('reseller_connections')
      .select('id')
      .or(`and(user_a.eq.${userId},user_b.eq.${targetId}),and(user_a.eq.${targetId},user_b.eq.${userId})`)
      .limit(1);

    if (fetchError) throw fetchError;

    if (existing && existing.length > 0) {
      // Disconnect: remove both directional rows
      const { error: deleteError } = await supabase
        .from('reseller_connections')
        .delete()
        .or(`and(user_a.eq.${userId},user_b.eq.${targetId}),and(user_a.eq.${targetId},user_b.eq.${userId})`);

      if (deleteError) throw deleteError;
      return res.json({ ok: true, connected: false });
    }

    // Create symmetric rows
    const { error: insert1Error } = await supabase
      .from('reseller_connections')
      .insert({ user_a: userId, user_b: targetId, status: 'connected' });

    const { error: insert2Error } = await supabase
      .from('reseller_connections')
      .insert({ user_a: targetId, user_b: userId, status: 'connected' });

    // Ignore duplicate errors
    if (insert1Error && !insert1Error.message.includes('duplicate')) throw insert1Error;
    if (insert2Error && !insert2Error.message.includes('duplicate')) throw insert2Error;

    return res.json({ ok: true, connected: true });
  } catch (err) {
    console.error('Failed to toggle connection', err);
    res.status(500).json({ error: 'Failed to toggle connection' });
  }
});

// Get reseller statistics (products sold and total earnings)
router.get('/stats', verifyToken, requireReseller, async (req, res) => {
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    // Calculate total products sold and earnings from order_items
    // Consider revenue for completed or in-transit orders.
    // Valid statuses per schema: 'Menunggu', 'Selesai', 'Gagal', 'Dikirim', 'Dalam Pengiriman'
    const revenueStatuses = ['Selesai', 'Dikirim', 'Dalam Pengiriman'];
    const { data: orderStats, error } = await supabase
      .from('order_items')
      .select(`
        quantity,
        total_price,
        products!inner(reseller_id),
        orders!inner(status)
      `)
      .eq('products.reseller_id', userId)
      .in('orders.status', revenueStatuses);

    if (error) throw error;

    const totalSold = (orderStats || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalEarnings = (orderStats || []).reduce((sum, item) => sum + parseFloat(item.total_price || 0), 0);

    const stats = {
      totalSold: totalSold || 0,
      totalEarnings: parseFloat(totalEarnings || 0)
    };

    res.json(stats);
  } catch (err) {
    console.error('Failed to fetch reseller stats', err);
    res.status(500).json({ error: 'Failed to fetch reseller stats' });
  }
});

// Get list of sold products with details
router.get('/sold-products', verifyToken, requireReseller, async (req, res) => {
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const revenueStatuses = ['Selesai', 'Dikirim', 'Dalam Pengiriman'];
    const { data: orderItems, error } = await supabase
      .from('order_items')
      .select(`
        quantity,
        total_price,
        order_id,
        products!inner(id, name, price, reseller_id),
        orders!inner(status)
      `)
      .eq('products.reseller_id', userId)
      .in('orders.status', revenueStatuses);

    if (error) throw error;

    // Group by product
    const productMap = {};
    (orderItems || []).forEach(item => {
      const productId = item.products.id;
      if (!productMap[productId]) {
        productMap[productId] = {
          id: productId,
          name: item.products.name,
          price: parseFloat(item.products.price || 0),
          totalQuantitySold: 0,
          totalRevenue: 0,
          orderCount: new Set()
        };
      }
      productMap[productId].totalQuantitySold += item.quantity || 0;
      productMap[productId].totalRevenue += parseFloat(item.total_price || 0);
      productMap[productId].orderCount.add(item.order_id);
    });

    const formatted = Object.values(productMap).map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      totalQuantitySold: item.totalQuantitySold,
      totalRevenue: item.totalRevenue,
      orderCount: item.orderCount.size
    }));

    formatted.sort((a, b) => b.totalQuantitySold - a.totalQuantitySold);

    res.json(formatted);
  } catch (err) {
    console.error('Failed to fetch sold products', err);
    res.status(500).json({ error: 'Failed to fetch sold products' });
  }
});

module.exports = router;
