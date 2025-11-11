/*
  tracking_poller.js
  - Simple polling script that queries orders with tracking metadata and calls the trackingService
  - Intended to be run manually or via cron. It will update orders.metadata with new history when available.

  Usage (dev):
    node ./server/scripts/tracking_poller.js
*/
const pool = require('../db');
const { fetchCarrierStatus } = require('../services/trackingService');

async function run() {
  const conn = await pool.getConnection();
  try {
    // find orders that have tracking metadata
    const [rows] = await conn.execute("SELECT id, metadata FROM orders WHERE metadata IS NOT NULL AND metadata LIKE '%tracking%'");
    if (!rows || rows.length === 0) {
      console.log('No tracked orders found');
      return;
    }

    for (const r of rows) {
      let meta = null;
      try { meta = typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata; } catch { continue; }
      if (!meta || !meta.tracking || !meta.tracking.tracking_number) continue;
      const provider = meta.tracking.provider || null;
      const trackingNumber = meta.tracking.tracking_number;
      console.log('Polling', r.id, provider, trackingNumber);
      try {
        const status = await fetchCarrierStatus({ provider, trackingNumber });
        if (!status) continue;
        // naive merge: replace meta.tracking with fetched status
        meta.tracking = status;
        await conn.execute('UPDATE orders SET metadata = ? WHERE id = ?', [JSON.stringify(meta), r.id]);
        console.log('Updated order', r.id);
      } catch (e) {
        console.error('Failed to fetch/update for', r.id, e && e.message ? e.message : e);
      }
    }
  } finally {
    conn.release();
  }
}

if (require.main === module) {
  run().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
}
