import { useEffect, useState, useCallback } from "react";
import { useAuth } from "./contexts/AuthContext";
import formatPrice from "./utils/format";

const formatDate = (d) => {
  try {
    return new Date(d).toLocaleString("id-ID");
  } catch {
    return d;
  }
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
            <div className="text-sm font-semibold">{h.status || "Update"}</div>
            <div className="text-xs text-gray-500">
              {h.location
                ? `${h.location} • ${formatDate(h.timestamp)}`
                : formatDate(h.timestamp)}
            </div>
            {h.note && (
              <div className="text-xs text-gray-700 mt-1">{h.note}</div>
            )}
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
      const res = await fetch(
        `/api/orders/my?page=${page}&pageSize=${pageSize}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to load orders");
      }
      const data = await res.json();
      setOrders(data.orders || []);
      setTotal(data.total || 0);
      // sync page/pageSize from server response if present
      if (data.page) setPage(Number(data.page));
      if (data.pageSize) setPageSize(Number(data.pageSize));
    } catch (e) {
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [token, page, pageSize]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  if (loading)
    return <div className="p-6 text-muted">Memuat riwayat pesanan...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!orders || orders.length === 0)
    return <div className="p-6 text-muted">Belum ada pesanan.</div>;

  return (
    <div className="bg-surface dark:bg-[rgb(var(--bg))] min-h-screen">
      <div className="px-8 sm:px-12 lg:px-16 py-12 max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center text-sm text-gray-500 dark:text-muted mb-8">
          <a href="/" className="hover:text-[rgb(var(--accent))]">
            Beranda
          </a>{" "}
          <svg
            className="w-4 h-4 mx-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="m9 18 6-6-6-6"
            />
          </svg>
          <span className="text-gray-700 dark:text-neutral-200 font-medium">
            Riwayat Pesanan
          </span>
        </nav>

        <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">
          Riwayat Pesanan
        </h1>

        <div className="flex justify-between items-center mb-8">
          <p className="text-gray-600 dark:text-muted">
            Lihat semua pesanan Anda di sini.
          </p>
          <button
            onClick={fetchOrders}
            className="btn-secondary px-4 py-2 rounded-full"
            aria-label="Segarkan riwayat pesanan"
          >
            Segarkan
          </button>
        </div>

        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border border-base rounded-lg p-4 bg-surface-alt shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs text-muted tracking-wide">
                    Order #{order.id}
                  </div>
                  <div className="text-lg font-medium">
                    {formatDate(order.created_at)}
                  </div>
                  <div className="text-sm text-muted">
                    Status:{" "}
                    <span className="font-medium accent-text">
                      {order.status}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted">Total</div>
                  <div className="text-xl font-semibold accent-text">
                    Rp {formatPrice(order.total)}
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <div className="text-sm font-medium mb-2 text-muted">Items</div>
                <div className="space-y-2">
                  {order.items.map((it) => (
                    <div
                      key={it.id}
                      className="flex items-center gap-3 border border-base p-2 rounded bg-surface"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{it.name}</div>
                        <div className="text-xs text-muted">
                          Qty: {it.quantity} — Rp {formatPrice(it.unit_price)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold accent-text">
                          Rp {formatPrice(it.total_price)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {order.metadata && order.metadata.tracking && (
                <div className="mt-3 text-sm text-muted">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div>
                        Tracking:{" "}
                        <span className="font-medium accent-text">
                          {order.metadata.tracking.provider || "—"}
                        </span>
                      </div>
                      <div>
                        No. Resi:{" "}
                        <span className="font-medium accent-text">
                          {order.metadata.tracking.tracking_number || "—"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <button
                        onClick={async () => {
                          // refresh tracking for this order
                          if (!token) return;
                          const id = order.id;
                          setRefreshingIds((s) => new Set([...s, id]));
                          try {
                            const res = await fetch(
                              `/api/orders/${id}/tracking/refresh`,
                              {
                                method: "POST",
                                headers: {
                                  Authorization: `Bearer ${token}`,
                                  "Content-Type": "application/json",
                                },
                              }
                            );
                            if (!res.ok) {
                              const err = await res.json().catch(() => ({}));
                              throw new Error(
                                err.error || "Gagal memperbarui tracking"
                              );
                            }
                            const data = await res.json();
                            // update order metadata locally
                            setOrders((prev) =>
                              (prev || []).map((o) =>
                                o.id === id
                                  ? {
                                      ...o,
                                      metadata: data.metadata || data.metadata,
                                    }
                                  : o
                              )
                            );
                          } catch (e) {
                            console.error("Refresh tracking error", e);
                            // non-fatal: show alert
                            alert(
                              (e && e.message) || "Gagal memperbarui tracking"
                            );
                          } finally {
                            setRefreshingIds((s) => {
                              const n = new Set(s);
                              n.delete(order.id);
                              return n;
                            });
                          }
                        }}
                        disabled={refreshingIds.has(order.id)}
                        className="text-sm btn-secondary px-3 py-1 rounded disabled:opacity-50"
                      >
                        {refreshingIds.has(order.id)
                          ? "Memperbarui..."
                          : "Perbarui Status"}
                      </button>
                    </div>
                  </div>
                  <TrackingTimeline history={order.metadata.tracking.history} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="mt-12 flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-muted">
            Menampilkan halaman {page} — total {total} pesanan
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label
                htmlFor="pageSize"
                className="text-sm text-gray-600 dark:text-muted"
              >
                Per halaman:
              </label>
              <select
                id="pageSize"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="border border-base bg-surface rounded px-3 py-2 text-sm focus:border-accent focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 btn-secondary rounded-full disabled:opacity-50"
                aria-label="Halaman sebelumnya"
              >
                Sebelumnya
              </button>
              <button
                disabled={page * pageSize >= total}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 btn-secondary rounded-full disabled:opacity-50"
                aria-label="Halaman berikutnya"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderHistoryPage;
