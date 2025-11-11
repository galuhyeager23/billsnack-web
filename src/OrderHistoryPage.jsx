import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from './contexts/AuthContext';
import formatPrice from './utils/format';

const formatDate = (d) => {
  try { return new Date(d).toLocaleString('id-ID'); } catch { return d; }
};

const TrackingTimeline = ({ history = [] }) => {
  if (!Array.isArray(history) || history.length === 0) return null;
  return (
    <div className="mt-3">
      <div className="text-sm font-medium mb-2">Perjalanan Paket</div>
      <ol className="border-l border-gray-200 ml-3">
        {history.map((h, idx) => (
          <li key={idx} className="mb-4 ml-6">
            <span className="absolute -left-3 mt-1 w-3 h-3 rounded-full bg-yellow-500"></span>
            <div className="text-sm font-semibold">{h.status || 'Update'}</div>
            <div className="text-xs text-gray-500">{h.location ? `${h.location} • ${formatDate(h.timestamp)}` : formatDate(h.timestamp)}</div>
            {h.note && <div className="text-xs text-gray-700 mt-1">{h.note}</div>}
          </li>
        ))}
      </ol>
    </div>
  );
};

const OrderHistoryPage = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [refreshingIds, setRefreshingIds] = useState(new Set());

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
        const res = await fetch(`/api/orders/my?page=${page}&pageSize=${pageSize}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to load orders');
      }
      const data = await res.json();
  setOrders(data.orders || []);
  setTotal(data.total || 0);
  // sync page/pageSize from server response if present
  if (data.page) setPage(Number(data.page));
  if (data.pageSize) setPageSize(Number(data.pageSize));
    } catch (e) {
      setError(e.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [token, page, pageSize]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  if (loading) return <div className="p-6">Memuat riwayat pesanan...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!orders || orders.length === 0) return <div className="p-6">Belum ada pesanan.</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Riwayat Pesanan</h2>
        <div>
          <button
            onClick={fetchOrders}
            className="text-sm bg-white border rounded px-3 py-1 hover:bg-gray-50"
            aria-label="Segarkan riwayat"
          >Segarkan</button>
        </div>
      </div>

      <div className="space-y-4">
        {orders.map(order => (
          <div key={order.id} className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm text-gray-500">Order #{order.id}</div>
                <div className="text-lg font-medium">{formatDate(order.created_at)}</div>
                <div className="text-sm text-gray-600">Status: {order.status}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Total</div>
                <div className="text-xl font-semibold">Rp {formatPrice(order.total)}</div>
              </div>
            </div>

            <div className="mt-3">
              <div className="text-sm font-medium mb-2">Items</div>
              <div className="space-y-2">
                {order.items.map(it => (
                  <div key={it.id} className="flex items-center gap-3 border p-2 rounded">
                    <div className="flex-1">
                      <div className="font-medium">{it.name}</div>
                      <div className="text-sm text-gray-500">Qty: {it.quantity} — Rp {formatPrice(it.unit_price)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">Rp {formatPrice(it.total_price)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {order.metadata && order.metadata.tracking && (
              <div className="mt-3 text-sm text-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div>Tracking: <span className="font-medium">{order.metadata.tracking.provider || '—'}</span></div>
                    <div>No. Resi: <span className="font-medium">{order.metadata.tracking.tracking_number || '—'}</span></div>
                  </div>
                  <div>
                    <button
                      onClick={async () => {
                        // refresh tracking for this order
                        if (!token) return;
                        const id = order.id;
                        setRefreshingIds(s => new Set([...s, id]));
                        try {
                          const res = await fetch(`/api/orders/${id}/tracking/refresh`, {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                          });
                          if (!res.ok) {
                            const err = await res.json().catch(() => ({}));
                            throw new Error(err.error || 'Gagal memperbarui tracking');
                          }
                          const data = await res.json();
                          // update order metadata locally
                          setOrders(prev => (prev || []).map(o => o.id === id ? { ...o, metadata: data.metadata || data.metadata } : o));
                        } catch (e) {
                          console.error('Refresh tracking error', e);
                          // non-fatal: show alert
                          alert((e && e.message) || 'Gagal memperbarui tracking');
                        } finally {
                          setRefreshingIds(s => {
                            const n = new Set(s);
                            n.delete(order.id);
                            return n;
                          });
                        }
                      }}
                      disabled={refreshingIds.has(order.id)}
                      className="text-sm px-3 py-1 border rounded disabled:opacity-50 bg-white hover:bg-gray-50"
                    >
                      {refreshingIds.has(order.id) ? 'Memperbarui...' : 'Perbarui Status'}
                    </button>
                  </div>
                </div>
                <TrackingTimeline history={order.metadata.tracking.history} />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-gray-600">Menampilkan halaman {page} — total {total} pesanan</div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Per halaman:</label>
          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="border rounded px-2 py-1 text-sm">
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
          <button disabled={page * pageSize >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  );
};

export default OrderHistoryPage;
