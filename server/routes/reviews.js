/* eslint-env node */
const express = require('express');
const supabase = require('../supabase');
const auth = require('./auth');

const router = express.Router();
const verifyToken = auth && auth.verifyToken ? auth.verifyToken : (req, res, next) => next();

// Get reviews for a product
router.get('/product/:productId', async (req, res) => {
  const { productId } = req.params;
  try {
    const { data: rows, error } = await supabase
      .from('reviews')
      .select(`
        id,
        product_id,
        user_id,
        rating,
        comment,
        created_at,
        users (
          email,
          username,
          first_name,
          last_name
        )
      `)
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const out = (rows || []).map((r) => ({
      id: r.id,
      productId: r.product_id,
      userId: r.user_id,
      rating: Number(r.rating),
      comment: r.comment,
      createdAt: r.created_at,
      user_name: r.users ? 
        ((r.users.first_name || r.users.last_name) ? 
          `${r.users.first_name || ''} ${r.users.last_name || ''}`.trim() : 
          (r.users.username || r.users.email)) : 
        'Unknown'
    }));
    res.json(out);
  } catch (err) {
    console.error('Get reviews error', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Check if authenticated user can review a product (must have purchased)
router.get('/can-review', verifyToken, async (req, res) => {
  const productId = req.query.productId;
  const userId = req.user && req.user.id;
  const userEmail = req.user && req.user.email;
  if (!productId || !userId) return res.json({ canReview: false });
  
  try {
    // Get order items for this product, then filter by user in JavaScript
    const { data: rows, error } = await supabase
      .from('order_items')
      .select('id, orders!inner(user_id, email)')
      .eq('product_id', productId);

    if (error) throw error;
    
    // Filter orders that belong to current user
    const userOrders = (rows || []).filter(item => 
      item.orders && (item.orders.user_id === userId || item.orders.email === userEmail)
    );
    
    res.json({ canReview: userOrders.length > 0 });
  } catch (err) {
    console.error('can-review check error', err);
    res.status(500).json({ error: 'Failed to check purchase history' });
  }
});

// Post a review (authenticated, must have purchased)
router.post('/', verifyToken, async (req, res) => {
  const userId = req.user && req.user.id;
  const { productId, rating, comment } = req.body || {};
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!productId || typeof rating === 'undefined') return res.status(400).json({ error: 'Missing productId or rating' });

  try {
    // Verify purchase - get order items for this product, filter by user in JavaScript
    const userEmail = req.user && req.user.email;
    const { data: pRows, error: purchaseError } = await supabase
      .from('order_items')
      .select('id, orders!inner(user_id, email)')
      .eq('product_id', productId);

    if (purchaseError) throw purchaseError;
    
    // Filter orders that belong to current user
    const userOrders = (pRows || []).filter(item => 
      item.orders && (item.orders.user_id === userId || item.orders.email === userEmail)
    );
    
    if (userOrders.length === 0) {
      return res.status(403).json({ error: 'User has not purchased this product' });
    }

    // Insert review
    const { data: reviewData, error: insertError } = await supabase
      .from('reviews')
      .insert({
        product_id: productId,
        user_id: userId,
        rating: rating,
        comment: comment || null
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Recompute aggregate rating and count
    const { data: allReviews, error: aggError } = await supabase
      .from('reviews')
      .select('rating')
      .eq('product_id', productId);

    if (aggError) throw aggError;

    const cnt = allReviews ? allReviews.length : 0;
    const avg = cnt > 0 ? (allReviews.reduce((sum, r) => sum + Number(r.rating), 0) / cnt).toFixed(2) : 0;

    const { error: updateError } = await supabase
      .from('products')
      .update({ rating: Number(avg), review_count: cnt })
      .eq('id', productId);

    if (updateError) throw updateError;

    res.status(201).json({ ok: true, reviewId: reviewData.id, rating: Number(avg), reviewCount: cnt });
  } catch (err) {
    console.error('Post review error', err);
    res.status(500).json({ error: 'Failed to post review' });
  }
});

module.exports = router;
