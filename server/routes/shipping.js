/* eslint-env node */
const express = require('express');
const { computeShippingFee } = require('../services/shippingService');

const router = express.Router();

// POST /api/shipping/quote
// Body: { city, postalCode, shippingMethod, sellersCount }
router.post('/quote', (req, res) => {
  try {
    const { city, postalCode, shippingMethod, sellersCount } = req.body || {};
    if (!city || !shippingMethod) {
      return res.status(400).json({ error: 'city and shippingMethod required' });
    }

    const result = computeShippingFee({ city, postalCode, method: shippingMethod });
    if (!result.available) {
      return res.status(400).json({ error: 'Metode pengiriman tidak tersedia untuk lokasi ini' });
    }

    const count = Math.max(1, Number(sellersCount) || 1);
    const totalFee = result.fee * count; // fee per seller/store

    return res.json({
      ok: true,
      method: result.method,
      distanceKm: result.distanceKm,
      feePerStore: result.fee,
      stores: count,
      totalFee,
      currency: 'IDR'
    });
  } catch (err) {
    console.error('Shipping quote error', err);
    return res.status(500).json({ error: 'Failed to compute shipping quote' });
  }
});

module.exports = router;
