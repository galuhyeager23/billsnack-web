/* eslint-env node */
const express = require('express');
const supabase = require('../supabase');
const router = express.Router();
const { sanitizeImages, sanitizeColors, sanitizeInStock } = require('../utils/validate');
const auth = require('./auth');

const verifyToken = auth && auth.verifyToken ? auth.verifyToken : (req, res, next) => next();

function requireAdmin(req, res, next) {
  const user = req.user || {};
  if (user.role && user.role === 'admin') return next();
  return res.status(403).json({ error: 'Admin privileges required' });
}

function requireReseller(req, res, next) {
  const user = req.user || {};
  if (user.role && user.role === 'reseller') return next();
  return res.status(403).json({ error: 'Reseller privileges required' });
}

// Get all products (public - only approved reseller products)
router.get('/', async (req, res) => {
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
      .or('reseller_id.is.null,is_approved.eq.true')
      .order('id', { ascending: false });

    if (error) throw error;

    const parsed = (rows || []).map((r) => {
      const images = sanitizeImages(r.images) || [];
      const colors = sanitizeColors(r.colors) || [];
      const rp = r.users?.reseller_profiles;
      let storeNameRaw = null;
      if (Array.isArray(rp)) storeNameRaw = rp[0]?.store_name;
      else if (rp && typeof rp === 'object') storeNameRaw = rp.store_name;
      const storeName = storeNameRaw && typeof storeNameRaw === 'string' ? storeNameRaw.trim() : null;
      const sellerName = r.reseller_id ? (storeName || 'Toko Reseller') : 'BillSnack Store';
      return {
        id: r.id,
        name: r.name,
        description: r.description,
        price: Number(r.price),
        stock: r.stock,
        category: r.category,
        images,
        originalPrice: r.original_price !== null ? Number(r.original_price) : undefined,
        rating: r.rating !== null ? Number(r.rating) : 0,
        reviewCount: r.review_count || 0,
        is_approved: r.is_approved === true || r.is_approved === 1,
        colors,
        sellerName,
        resellerId: r.reseller_id,
        createdAt: r.created_at,
      };
    });
    res.json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get top-selling products
router.get('/top-selling', async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 10));
    
    // Get all order items with product info (only approved products)
    const { data: orderItems, error } = await supabase
      .from('order_items')
      .select(`
        product_id, 
        quantity, 
        products!inner(
          *,
          users:reseller_id (
            first_name,
            last_name,
            email,
            reseller_profiles (store_name)
          )
        )
      `);

    if (error) throw error;

    // Aggregate by product and filter approved products
    const productMap = {};
    (orderItems || []).forEach(item => {
      const product = item.products;
      const pid = item.product_id;
      
      // Only include approved reseller products or admin products (null reseller_id)
      if (product && (product.reseller_id === null || product.is_approved === true)) {
        if (!productMap[pid]) {
          productMap[pid] = {
            ...product,
            sold_qty: 0
          };
        }
        productMap[pid].sold_qty += item.quantity || 0;
      }
    });

    const sorted = Object.values(productMap)
      .sort((a, b) => b.sold_qty - a.sold_qty)
      .slice(0, limit);

    const parsed = sorted.map((r) => {
      const images = sanitizeImages(r.images) || [];
      const colors = sanitizeColors(r.colors) || [];
      const rp = r.users?.reseller_profiles;
      let storeNameRaw = null;
      if (Array.isArray(rp)) storeNameRaw = rp[0]?.store_name;
      else if (rp && typeof rp === 'object') storeNameRaw = rp.store_name;
      const storeName = storeNameRaw && typeof storeNameRaw === 'string' ? storeNameRaw.trim() : null;
      const sellerName = r.reseller_id ? (storeName || 'Toko Reseller') : 'BillSnack Store';
      return {
        id: r.id,
        name: r.name,
        description: r.description,
        price: Number(r.price),
        stock: r.stock,
        category: r.category,
        images,
        originalPrice: r.original_price !== null ? Number(r.original_price) : undefined,
        rating: r.rating !== null ? Number(r.rating) : 0,
        reviewCount: r.review_count || 0,
        colors,
        sellerName,
        createdAt: r.created_at,
        soldQty: Number(r.sold_qty || 0),
      };
    });
    res.json(parsed);
  } catch (err) {
    console.error('Failed to fetch top-selling products', err);
    res.status(500).json({ error: 'Failed to fetch top-selling products' });
  }
});

// ===== RESELLER ROUTES =====

// List reseller products
router.get('/reseller', verifyToken, requireReseller, async (req, res) => {
  try {
    const userId = req.user && req.user.id;
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
      .eq('reseller_id', userId)
      .order('id', { ascending: false });

    if (error) throw error;

    const parsed = (rows || []).map((r) => {
      const images = sanitizeImages(r.images) || [];
      const colors = sanitizeColors(r.colors) || [];
      const rp = r.users?.reseller_profiles;
      let storeNameRaw = null;
      if (Array.isArray(rp)) storeNameRaw = rp[0]?.store_name;
      else if (rp && typeof rp === 'object') storeNameRaw = rp.store_name;
      const storeName = storeNameRaw && typeof storeNameRaw === 'string' ? storeNameRaw.trim() : null;
      const sellerName = storeName || 'Toko Reseller';
      return {
        id: r.id,
        name: r.name,
        description: r.description,
        price: Number(r.price),
        stock: r.stock,
        inStock: !!r.in_stock,
        category: r.category,
        images,
        originalPrice: r.original_price !== null ? Number(r.original_price) : undefined,
        rating: r.rating !== null ? Number(r.rating) : 0,
        reviewCount: r.review_count || 0,
        colors,
        is_approved: r.is_approved === true || r.is_approved === 1,
        sellerName,
        resellerId: r.reseller_id,
        createdAt: r.created_at,
      };
    });
    res.json(parsed);
  } catch (err) {
    console.error('Failed to fetch reseller products', err);
    res.status(500).json({ error: 'Failed to fetch reseller products' });
  }
});

// Create product as reseller
router.post('/reseller', verifyToken, requireReseller, async (req, res) => {
  const userId = req.user && req.user.id;
  const { name, description, price, stock, category, images: imagesInput, originalPrice, rating, reviewCount, colors: colorsInput } = req.body;
  if (!name || typeof price === 'undefined') return res.status(400).json({ error: 'Missing required fields: name, price' });
  
  try {
    const in_stock = Number(stock) > 0;
    // Precompute seller_name for persistence
    const { data: rpProfile } = await supabase.from('reseller_profiles').select('store_name').eq('user_id', userId);
    let storeNamePersist = null;
    if (Array.isArray(rpProfile) && rpProfile.length > 0) storeNamePersist = rpProfile[0]?.store_name;
    else if (rpProfile && typeof rpProfile === 'object') storeNamePersist = rpProfile.store_name;
    storeNamePersist = (storeNamePersist && typeof storeNamePersist === 'string') ? storeNamePersist.trim() : null;
    const sellerNamePersist = storeNamePersist || 'Toko Reseller';
    const { data, error } = await supabase
      .from('products')
      .insert({
        name,
        description: description || null,
        price,
        stock: stock || 0,
        category: category || null,
        images: imagesInput || [],
        original_price: originalPrice !== undefined ? originalPrice : null,
        rating: rating !== undefined ? rating : 0,
        review_count: reviewCount !== undefined ? reviewCount : 0,
        colors: colorsInput || [],
        in_stock,
        reseller_id: userId,
        is_approved: false,
        seller_name: sellerNamePersist
      })
      .select(`
        *,
        users:reseller_id (
          first_name,
          last_name,
          email,
          reseller_profiles (store_name)
        )
      `)
      .single();

    if (error) throw error;

    const r = data;
    const rp = r.users?.reseller_profiles;
    let storeNameRaw = null;
    if (Array.isArray(rp)) storeNameRaw = rp[0]?.store_name;
    else if (rp && typeof rp === 'object') storeNameRaw = rp.store_name;
    const storeName = storeNameRaw && typeof storeNameRaw === 'string' ? storeNameRaw.trim() : null;
    const sellerName = storeName || 'Toko Reseller';

    const parsed = {
      id: r.id,
      name: r.name,
      description: r.description,
      price: Number(r.price),
      stock: r.stock,
      inStock: !!r.in_stock,
      category: r.category,
      images: r.images || [],
      originalPrice: r.original_price !== null ? Number(r.original_price) : undefined,
      rating: r.rating !== null ? Number(r.rating) : 0,
      reviewCount: r.review_count || 0,
      colors: r.colors || [],
      is_approved: r.is_approved === true,
      resellerId: r.reseller_id,
      sellerName,
      createdAt: r.created_at,
    };
    res.status(201).json(parsed);
  } catch (err) {
    console.error('Failed to create reseller product', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product as reseller
router.put('/reseller/:id', verifyToken, requireReseller, async (req, res) => {
  const userId = req.user && req.user.id;
  const { id } = req.params;
  const { name, description, price, stock, category, images: imagesInput, originalPrice, rating, reviewCount, colors: colorsInput, in_stock } = req.body;
  
  try {
    // Verify ownership
    const { data: existing, error: fetchError } = await supabase
      .from('products')
      .select('reseller_id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) return res.status(404).json({ error: 'Product not found' });
    if (existing.reseller_id !== userId) return res.status(403).json({ error: 'Not authorized to update this product' });

    const inStockVal = typeof in_stock !== 'undefined' ? in_stock : (Number(stock) > 0);
    // Recompute seller_name for persistence (profile may have changed)
    const { data: rpProfile } = await supabase.from('reseller_profiles').select('store_name').eq('user_id', userId);
    let storeNamePersist = null;
    if (Array.isArray(rpProfile) && rpProfile.length > 0) storeNamePersist = rpProfile[0]?.store_name;
    else if (rpProfile && typeof rpProfile === 'object') storeNamePersist = rpProfile.store_name;
    storeNamePersist = (storeNamePersist && typeof storeNamePersist === 'string') ? storeNamePersist.trim() : null;
    const sellerNamePersist = storeNamePersist || 'Toko Reseller';
    
    const { error: updateError } = await supabase
      .from('products')
      .update({
        name,
        description: description || null,
        price,
        stock: stock || 0,
        category: category || null,
        images: imagesInput || [],
        original_price: originalPrice !== undefined ? originalPrice : null,
        rating: rating !== undefined ? rating : 0,
        review_count: reviewCount !== undefined ? reviewCount : 0,
        colors: colorsInput || [],
        in_stock: inStockVal,
        seller_name: sellerNamePersist
      })
      .eq('id', id);

    if (updateError) throw updateError;
    res.json({ ok: true });
  } catch (err) {
    console.error('Failed to update reseller product', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product as reseller
router.delete('/reseller/:id', verifyToken, requireReseller, async (req, res) => {
  const userId = req.user && req.user.id;
  const { id } = req.params;
  
  try {
    const { data: existing, error: fetchError } = await supabase
      .from('products')
      .select('reseller_id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) return res.status(404).json({ error: 'Product not found' });
    if (existing.reseller_id !== userId) return res.status(403).json({ error: 'Not authorized to delete this product' });

    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;
    res.json({ ok: true });
  } catch (err) {
    console.error('Failed to delete reseller product', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Get single product (public)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { data: r, error } = await supabase
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
      .eq('id', id)
      .single();

    if (error || !r) return res.status(404).json({ error: 'Product not found' });

    // Hide unapproved reseller products from public
    if (r.reseller_id && !r.is_approved) return res.status(404).json({ error: 'Product not found' });

    const images = sanitizeImages(r.images) || [];
    const colors = sanitizeColors(r.colors) || [];
    const rp = r.users?.reseller_profiles;
    let storeNameRaw = null;
    if (Array.isArray(rp)) storeNameRaw = rp[0]?.store_name;
    else if (rp && typeof rp === 'object') storeNameRaw = rp.store_name;
    const storeName = storeNameRaw && typeof storeNameRaw === 'string' ? storeNameRaw.trim() : null;
    const sellerName = r.reseller_id ? (storeName || 'Toko Reseller') : 'BillSnack Store';
    
    const out = {
      id: r.id,
      name: r.name,
      description: r.description,
      price: Number(r.price),
      stock: r.stock,
      category: r.category,
      images,
      originalPrice: r.original_price !== null ? Number(r.original_price) : undefined,
      rating: r.rating !== null ? Number(r.rating) : 0,
      reviewCount: r.review_count || 0,
      colors,
      is_approved: r.is_approved === true,
      sellerName,
      resellerId: r.reseller_id,
      createdAt: r.created_at,
    };
    res.json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create product (admin)
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  const { name, description, price, stock, category, images: imagesInput, originalPrice, rating, reviewCount, colors: colorsInput, resellerId, reseller_id } = req.body;
  const inStockInput = typeof req.body.inStock !== 'undefined' ? req.body.inStock : req.body.in_stock;
  let in_stock = sanitizeInStock(inStockInput);
  if (in_stock === null) in_stock = Number(stock) > 0;

  if (!name || typeof price === 'undefined') {
    return res.status(400).json({ error: 'Missing required fields: name, price' });
  }
  
  try {
    const sanitizedImages = sanitizeImages(imagesInput);
    const sanitizedColors = sanitizeColors(colorsInput);
    const resellerIdToUse = typeof resellerId !== 'undefined' ? resellerId : reseller_id || null;

    // Precompute seller_name for persistence (if reseller assigned)
    let sellerNamePersist = 'BillSnack Store';
    if (resellerIdToUse) {
      const { data: rp } = await supabase.from('reseller_profiles').select('store_name').eq('user_id', resellerIdToUse);
      let storeNamePersist = null;
      if (Array.isArray(rp) && rp.length > 0) storeNamePersist = rp[0]?.store_name;
      else if (rp && typeof rp === 'object') storeNamePersist = rp.store_name;
      storeNamePersist = (storeNamePersist && typeof storeNamePersist === 'string') ? storeNamePersist.trim() : null;
      sellerNamePersist = storeNamePersist || 'Toko Reseller';
    }
    const { data, error } = await supabase
      .from('products')
      .insert({
        name,
        description: description || null,
        price,
        stock: stock || 0,
        category: category || null,
        images: sanitizedImages || [],
        original_price: originalPrice !== undefined ? originalPrice : null,
        rating: rating !== undefined ? rating : 0,
        review_count: reviewCount !== undefined ? reviewCount : 0,
        colors: sanitizedColors || [],
        in_stock,
        reseller_id: resellerIdToUse,
        is_approved: true,
        seller_name: sellerNamePersist
      })
      .select(`
        *,
        users:reseller_id (
          first_name,
          last_name,
          email,
          reseller_profiles (store_name)
        )
      `)
      .single();

    if (error) throw error;

    const r = data;
    const images = sanitizeImages(r.images) || [];
    const colors = sanitizeColors(r.colors) || [];
    const rp = r.users?.reseller_profiles;
    let storeNameRaw = null;
    if (Array.isArray(rp)) storeNameRaw = rp[0]?.store_name; else if (rp && typeof rp === 'object') storeNameRaw = rp.store_name;
    const storeName = storeNameRaw && typeof storeNameRaw === 'string' ? storeNameRaw.trim() : null;
    const sellerName = r.reseller_id ? (storeName || 'Toko Reseller') : 'BillSnack Store';
    const out = {
      id: r.id,
      name: r.name,
      description: r.description,
      price: Number(r.price),
      stock: r.stock,
      inStock: !!r.in_stock,
      category: r.category,
      images,
      originalPrice: r.original_price !== null ? Number(r.original_price) : undefined,
      rating: r.rating !== null ? Number(r.rating) : 0,
      reviewCount: r.review_count || 0,
      colors,
      sellerName,
      resellerId: r.reseller_id,
      createdAt: r.created_at,
    };
    res.status(201).json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product (admin)
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock, category, images: imagesInput, originalPrice, rating, reviewCount, colors: colorsInput, resellerId, reseller_id } = req.body;
  const inStockInput = typeof req.body.inStock !== 'undefined' ? req.body.inStock : req.body.in_stock;
  const in_stock = typeof inStockInput !== 'undefined' ? !!inStockInput : (Number(stock) > 0);
  const is_approved_input = typeof req.body.is_approved !== 'undefined' ? req.body.is_approved : (typeof req.body.isApproved !== 'undefined' ? req.body.isApproved : undefined);

  try {
    const sanitizedImages = sanitizeImages(imagesInput);
    const sanitizedColors = sanitizeColors(colorsInput);
    const resellerIdToUse = typeof resellerId !== 'undefined' ? resellerId : reseller_id;

    const updates = {
      name,
      description: description || null,
      price,
      stock,
      category: category || null,
      images: sanitizedImages || [],
      original_price: originalPrice !== undefined ? originalPrice : null,
      rating: rating !== undefined ? rating : 0,
      review_count: reviewCount !== undefined ? reviewCount : 0,
      colors: sanitizedColors || [],
      in_stock
    };

    if (typeof resellerIdToUse !== 'undefined') {
      updates.reseller_id = resellerIdToUse;
    }
    if (typeof is_approved_input !== 'undefined') {
      updates.is_approved = !!is_approved_input;
    }

    // Recompute seller_name if reseller_id is (re)assigned
    if (updates.reseller_id) {
      const resellerIdForPersist = updates.reseller_id;
      const { data: rp } = await supabase.from('reseller_profiles').select('store_name').eq('user_id', resellerIdForPersist);
      let storeNamePersist = null;
      if (Array.isArray(rp) && rp.length > 0) storeNamePersist = rp[0]?.store_name;
      else if (rp && typeof rp === 'object') storeNamePersist = rp.store_name;
      storeNamePersist = (storeNamePersist && typeof storeNamePersist === 'string') ? storeNamePersist.trim() : null;
      updates.seller_name = storeNamePersist || 'Toko Reseller';
    }

    const { error: updateError } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id);

    if (updateError) throw updateError;

    const { data: r, error: fetchError } = await supabase
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
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const images = sanitizeImages(r.images) || [];
    const colors = sanitizeColors(r.colors) || [];
    const rp = r.users?.reseller_profiles;
    let storeNameRaw = null;
    if (Array.isArray(rp)) storeNameRaw = rp[0]?.store_name; else if (rp && typeof rp === 'object') storeNameRaw = rp.store_name;
    const storeName = storeNameRaw && typeof storeNameRaw === 'string' ? storeNameRaw.trim() : null;
    const sellerName = r.reseller_id ? (storeName || 'Toko Reseller') : 'BillSnack Store';
    const out = {
      id: r.id,
      name: r.name,
      description: r.description,
      price: Number(r.price),
      stock: r.stock,
      inStock: !!r.in_stock,
      category: r.category,
      images,
      originalPrice: r.original_price !== null ? Number(r.original_price) : undefined,
      rating: r.rating !== null ? Number(r.rating) : 0,
      reviewCount: r.review_count || 0,
      colors,
      sellerName,
      resellerId: r.reseller_id,
      createdAt: r.created_at,
    };
    res.json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product (admin)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
