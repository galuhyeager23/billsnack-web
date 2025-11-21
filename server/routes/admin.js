/* eslint-env node */
const express = require('express');
const supabase = require('../supabase');
const auth = require('./auth');
const bcrypt = require('bcrypt');

const router = express.Router();

const verifyToken = auth && auth.verifyToken ? auth.verifyToken : (req, res, next) => next();

function requireAdmin(req, res, next) {
  const user = req.user || {};
  if (user.role && user.role === 'admin') return next();
  return res.status(403).json({ error: 'Admin privileges required' });
}

// Products (admin CRUD) - show ALL products including unapproved reseller products
router.get('/products', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from('products')
      .select(`
        *,
        users:reseller_id (
          first_name,
          last_name,
          email,
          reseller_profiles (store_name)
        )
      `)
      .order('id', { ascending: false });

    if (error) throw error;

    const { sanitizeImages, sanitizeColors } = require('../utils/validate');
    const normalized = (rows || []).map((r) => {
      const images = sanitizeImages(r.images) || [];
      const colors = sanitizeColors(r.colors) || [];
      let storeNameRaw = null;
      const rp = r.users?.reseller_profiles;
      if (Array.isArray(rp)) storeNameRaw = rp[0]?.store_name; else if (rp && typeof rp === 'object') storeNameRaw = rp.store_name;
      const storeName = storeNameRaw && typeof storeNameRaw === 'string' ? storeNameRaw.trim() : null;
      const sellerName = r.reseller_id ? (storeName || 'Toko Reseller') : 'BillSnack Store';
      return {
        id: r.id,
        name: r.name,
        description: r.description,
        price: Number(r.price),
        stock: r.stock,
        category: r.category,
        images: images && images.length > 0 ? images : [],
        originalPrice: r.original_price !== null ? Number(r.original_price) : undefined,
        rating: r.rating !== null ? Number(r.rating) : 0,
        reviewCount: r.review_count || 0,
        is_approved: !!r.is_approved,
        colors,
        sellerName,
        resellerId: r.reseller_id,
        resellerEmail: r.users?.email,
        createdAt: r.created_at,
      };
    });
    res.json(normalized);
  } catch (err) {
    console.error('Admin get products error', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Approve/reject reseller product
router.put('/products/:id/approve', verifyToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { is_approved, isApproved } = req.body;
  const approved = typeof is_approved !== 'undefined' ? is_approved : (typeof isApproved !== 'undefined' ? isApproved : true);
  
  try {
    const { error: updateError } = await supabase
      .from('products')
      .update({ is_approved: !!approved })
      .eq('id', id);

    if (updateError) throw updateError;

    const { data: r, error: fetchError } = await supabase
      .from('products')
      .select('is_approved')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    res.json({ ok: true, is_approved: !!r.is_approved });
  } catch (err) {
    console.error('Admin approve product error', err);
    res.status(500).json({ error: 'Failed to approve product' });
  }
});

// Users: list users
router.get('/users', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        username,
        phone,
        gender,
        role,
        created_at,
        reseller_profiles (
          store_name
        )
      `)
      .order('id', { ascending: false });

    if (error) throw error;
    // Collect reseller ids
    const resellerIds = (rows || [])
      .filter(u => u.role === 'reseller')
      .map(u => u.id);

    let productCountsByReseller = {};
    let salesCountsByReseller = {};

    if (resellerIds.length > 0) {
      try {
        // Fetch products for these resellers
        const { data: productRows, error: productsErr } = await supabase
          .from('products')
          .select('id,reseller_id')
          .in('reseller_id', resellerIds);
        if (!productsErr && Array.isArray(productRows)) {
          productRows.forEach(p => {
            if (p.reseller_id) {
              productCountsByReseller[p.reseller_id] = (productCountsByReseller[p.reseller_id] || 0) + 1;
            }
          });
        }

        // Fetch order items joined to products to compute sold quantities per reseller
        const { data: salesRows, error: salesErr } = await supabase
          .from('order_items')
          .select('quantity, products:product_id(reseller_id)')
          .in('products.reseller_id', resellerIds);
        if (!salesErr && Array.isArray(salesRows)) {
          salesRows.forEach(r => {
            const rid = r.products && r.products.reseller_id;
            if (rid) {
              salesCountsByReseller[rid] = (salesCountsByReseller[rid] || 0) + (r.quantity || 0);
            }
          });
        }
      } catch (aggErr) {
        console.error('Aggregation error for reseller product/sales counts', aggErr);
      }
    }

    // Flatten reseller_profiles and append counts
    const formatted = (rows || []).map(user => {
      const rp = user.reseller_profiles;
      let storeNameRaw = null;
      if (Array.isArray(rp)) storeNameRaw = rp[0]?.store_name;
      else if (rp && typeof rp === 'object') storeNameRaw = rp.store_name;
      const store_name = storeNameRaw && typeof storeNameRaw === 'string' ? storeNameRaw.trim() : null;
      const totalProducts = productCountsByReseller[user.id] || 0;
      const totalSales = salesCountsByReseller[user.id] || 0;
      return {
        ...user,
        store_name,
        totalProducts,
        totalSales
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error('Admin get users error', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get a single user with optional reseller profile
router.get('/users/:id', verifyToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const { data: rows, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        username,
        phone,
        address,
        role,
        is_active,
        reseller_profiles (
          store_name,
          phone
        )
      `)
      .eq('id', id)
      .single();

    if (error || !rows) return res.status(404).json({ error: 'User not found' });
    
    const user = {
      ...rows,
      rp_phone: rows.reseller_profiles?.[0]?.phone,
      store_name: rows.reseller_profiles?.[0]?.store_name
    };
    delete user.reseller_profiles;
    
    res.json(user);
  } catch (err) {
    console.error('Admin get user error', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Admin: create a user (returns store_name if present)
router.post('/users', verifyToken, requireAdmin, async (req, res) => {
  const { email, password, first_name, last_name, phone, address, role, store_name } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    let hash = null;
    if (password) {
      hash = await bcrypt.hash(password, process.env.SALT_ROUNDS ? Number(process.env.SALT_ROUNDS) : 10);
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: hash,
        first_name: first_name || null,
        last_name: last_name || null,
        phone: phone || null,
        address: address || null,
        role: role || 'reseller',
        is_active: true
      })
      .select()
      .single();

    if (userError) throw userError;
    const userId = userData.id;

    if (typeof store_name !== 'undefined') {
      // Use upsert to avoid separate existence check (handles missing id column scenario)
      await supabase
        .from('reseller_profiles')
        .upsert({
          user_id: userId,
          store_name: store_name || null,
          phone: phone || null,
          address: address || null
        }, { onConflict: 'user_id' });
    }

    const { data: userWithProfile } = await supabase
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        username,
        phone,
        address,
        role,
        created_at,
        reseller_profiles ( store_name )
      `)
      .eq('id', userId)
      .single();

    const responseUser = {
      ...userWithProfile,
      store_name: userWithProfile.reseller_profiles?.[0]?.store_name || null
    };
    delete responseUser.reseller_profiles;

    res.status(201).json({ ok: true, user: responseUser });
  } catch (err) {
    console.error('Admin create user error', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Admin: update user fields and reseller profile (returns store_name)
router.put('/users/:id', verifyToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { email, first_name, last_name, phone, address, role, is_active, store_name } = req.body || {};

  console.log(`\n=== UPDATE USER ${id} ===`);
  console.log('Request body:', req.body);
  console.log('Store name:', store_name);

  try {
    const updates = {};
    if (typeof email !== 'undefined') updates.email = email;
    if (typeof first_name !== 'undefined') updates.first_name = first_name || null;
    if (typeof last_name !== 'undefined') updates.last_name = last_name || null;
    if (typeof phone !== 'undefined') updates.phone = phone || null;
    if (typeof address !== 'undefined') updates.address = address || null;
    if (typeof role !== 'undefined') updates.role = role;
    if (typeof is_active !== 'undefined') updates.is_active = !!is_active;

    console.log('User table updates:', updates);

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id);
      if (updateError) throw updateError;
      console.log('✓ Users table updated');
    }

    // Upsert reseller profile if store_name provided (even if empty string)
    if (typeof store_name !== 'undefined') {
      console.log('Upserting reseller_profiles with store_name (no id assumption):', store_name);
      const profileData = { user_id: id, store_name: store_name || null, phone: phone || null, address: address || null };
      const { error: upsertError } = await supabase
        .from('reseller_profiles')
        .upsert(profileData, { onConflict: 'user_id' });
      if (upsertError) throw upsertError;
      console.log('✓ Reseller profile upserted');
    } else {
      console.log('store_name not provided; skipping profile upsert');
    }

    // Fetch user with profile to include store_name in response
    const { data: userWithProfile, error: fetchUserError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        username,
        phone,
        address,
        role,
        created_at,
        reseller_profiles ( store_name )
      `)
      .eq('id', id)
      .single();
    if (fetchUserError) throw fetchUserError;

    const responseUser = {
      ...userWithProfile,
      store_name: userWithProfile.reseller_profiles?.[0]?.store_name || null
    };
    delete responseUser.reseller_profiles;

    console.log('✓ Update complete\n');
    res.json({ ok: true, user: responseUser });
  } catch (err) {
    console.error('Admin update user error', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Admin: set or update a user's role
router.put('/users/:id/role', verifyToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body || {};
  if (!role) return res.status(400).json({ error: 'Missing role in body' });
  
  const allowed = ['user', 'reseller', 'admin'];
  if (!allowed.includes(role)) return res.status(400).json({ error: 'Invalid role' });
  
  try {
    const { error: updateError } = await supabase
      .from('users')
      .update({ role })
      .eq('id', id);

    if (updateError) throw updateError;

    const { data: user } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, username, phone, gender, role, created_at')
      .eq('id', id)
      .single();

    return res.json({ ok: true, user });
  } catch (err) {
    console.error('Admin update user role error', err);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Admin: delete a user
router.delete('/users/:id', verifyToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    console.error('Failed to delete user', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Transactions: return orders as transactions
router.get('/transactions', verifyToken, requireAdmin, async (req, res) => {
  try {
    // Fetch orders with user info and aggregated order items
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        users:user_id (email, role, first_name, last_name)
      `)
      .order('id', { ascending: false })
      .limit(500);

    if (ordersError) throw ordersError;

    if (!orders || orders.length === 0) {
      return res.json({ table: 'orders', rows: [] });
    }

    const orderIds = orders.map(o => o.id);

    // Fetch all order items for these orders
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('order_id, total_price')
      .in('order_id', orderIds);

    if (itemsError) throw itemsError;

    // Sum total_price per order
    const itemSumsByOrder = (items || []).reduce((acc, it) => {
      acc[it.order_id] = (acc[it.order_id] || 0) + parseFloat(it.total_price || 0);
      return acc;
    }, {});

    const rows = orders.map(o => {
      const itemsTotal = itemSumsByOrder[o.id] || 0;
      return {
        ...o,
        order_id: o.id,
        order_number: o.order_number,
        payment_method: o.payment_method || (o.metadata?.payment),
        user_email: o.users?.email,
        user_role: o.users?.role,
        first_name: o.users?.first_name,
        last_name: o.users?.last_name,
        amount: o.total || itemsTotal
      };
    });

    return res.json({ table: 'orders', rows });
  } catch (err) {
    console.error('Admin get transactions error', err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Admin: update transaction/order status
router.put('/transactions/:id/status', verifyToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};
  const allowed = ['Selesai', 'Menunggu', 'Gagal', 'Dikirim', 'Dalam Pengiriman'];
  if (!status || !allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  
  try {
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id);

    if (updateError) throw updateError;

    const { data: order } = await supabase
      .from('orders')
      .select('id, status')
      .eq('id', id)
      .single();

    return res.json({ ok: true, transaction: order });
  } catch (err) {
    console.error('Failed to update transaction status', err);
    return res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;
