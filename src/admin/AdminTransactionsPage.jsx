import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import formatPrice from "../utils/format";

const AdminTransactionsPage = () => {
  const { token: userToken } = useAuth();
  // Admin UI may store a separate admin token after admin login flow
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  // prefer adminToken for admin API calls, but fall back to normal user token
  const token = adminToken || userToken;
  const [transactions, setTransactions] = useState([]);
  const [sourceTable, setSourceTable] = useState(null);
  const [rawResponse, setRawResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingProvider, setTrackingProvider] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingHistoryText, setTrackingHistoryText] = useState("");

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/admin/transactions', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
          // try to surface JSON error body, or fallback to status text
          let msg = res.statusText || 'Failed to load transactions';
          try { const err = await res.json(); if (err && err.error) msg = err.error; } catch { /* ignore */ }
          throw new Error(msg);
        }

        // Defensive: ensure the response is JSON. Some dev setups accidentally
        // return index.html (text/html) which causes "Unexpected token '<'".
        const ctype = (res.headers.get('content-type') || '').toLowerCase();
        if (!ctype.includes('application/json')) {
          const text = await res.text();
          // show a short snippet to help debugging
          const snippet = text && text.length > 500 ? text.slice(0, 500) + '... (truncated)' : text;
          throw new Error('Expected JSON response from /api/admin/transactions — received: ' + (ctype || 'unknown') + '\n' + snippet);
        }

        const data = await res.json();
        // admin route returns { table, rows }
        if (data && Array.isArray(data.rows)) {
          setTransactions(data.rows);
          setSourceTable(data.table || null);
          setRawResponse(data);
        } else {
          setTransactions([]);
          setSourceTable(data && data.table ? data.table : null);
          setRawResponse(data || null);
        }
      } catch (err) {
        setError(err.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [token]);
  

  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState("All");

  const getStatusColor = (status) => {
    switch (status) {
      case "Selesai":
        return "text-green-600 bg-green-100";
      case "Menunggu":
        return "text-yellow-600 bg-yellow-100";
      case "Gagal":
        return "text-red-600 bg-red-100";
      case "Dikirim":
        return "text-blue-600 bg-blue-100";
      case "Dalam Pengiriman":
        return "text-orange-600 bg-orange-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const statusMatch = filterStatus === "All" || String(transaction.status) === filterStatus;
    const paymentMatch = filterPaymentMethod === "All" || String(transaction.paymentMethod) === filterPaymentMethod;
    return statusMatch && paymentMatch;
  });

  const totalAmount = filteredTransactions.reduce((sum, transaction) => sum + (Number(transaction.amount) || Number(transaction.total) || 0), 0);

  const openTrackingModal = (order) => {
    setSelectedOrder(order);
    // prefill if metadata present
    try {
      const meta = order.metadata && typeof order.metadata === 'string' ? JSON.parse(order.metadata) : order.metadata;
      if (meta && meta.tracking) {
        setTrackingProvider(meta.tracking.provider || '');
        setTrackingNumber(meta.tracking.tracking_number || '');
        setTrackingHistoryText((meta.tracking.history && JSON.stringify(meta.tracking.history, null, 2)) || '');
      } else {
        setTrackingProvider(''); setTrackingNumber(''); setTrackingHistoryText('');
      }
    } catch {
      setTrackingProvider(''); setTrackingNumber(''); setTrackingHistoryText('');
    }
    setShowModal(true);
  };

  const submitTracking = async () => {
    if (!selectedOrder) return;
    let history = null;
    try {
      history = trackingHistoryText ? JSON.parse(trackingHistoryText) : null;
    } catch {
      alert('History harus berupa JSON yang valid (array objek)');
      return;
    }
    try {
      const res = await fetch(`/api/orders/${selectedOrder.id}/tracking`, {
        method: 'PUT',
        headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: `Bearer ${token}` } : {}),
        body: JSON.stringify({ provider: trackingProvider, tracking_number: trackingNumber, history }),
      });
      if (!res.ok) throw new Error('Gagal menyimpan tracking');
      await res.json();
      alert('Tracking tersimpan');
      setShowModal(false);
      // refresh list
      window.location.reload();
    } catch (e) {
      alert((e && e.message) || 'Error');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Transaksi</h1>
      <p className="text-lg text-gray-600 mb-8">Kelola dan pantau semua transaksi pembayaran</p>
      {loading && <div className="p-4">Memuat...</div>}
      {error && <div className="p-4 text-red-600">Error: {error}</div>}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Total Transaksi</h3>
          <p className="text-3xl font-bold mt-2 text-blue-600">{transactions.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Selesai</h3>
          <p className="text-3xl font-bold mt-2 text-green-600">
            {transactions.filter(t => t.status === "Selesai").length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Menunggu</h3>
          <p className="text-3xl font-bold mt-2 text-yellow-600">
            {transactions.filter(t => t.status === "Menunggu").length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Dikirim</h3>
          <p className="text-3xl font-bold mt-2 text-blue-600">
            {transactions.filter(t => t.status === "Dikirim").length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Dalam Pengiriman</h3>
          <p className="text-3xl font-bold mt-2 text-orange-600">
            {transactions.filter(t => t.status === "Dalam Pengiriman").length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Total Pendapatan</h3>
          <p className="text-3xl font-bold mt-2 text-purple-600">
            Rp{formatPrice(transactions.filter(t => t.status === "Selesai" || t.status === "Dikirim").reduce((sum, t) => sum + (Number(t.amount) || 0), 0))}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        {sourceTable && (
          <div className="text-sm text-gray-600 mb-2">Sumber data: <strong>{sourceTable}</strong> — {transactions.length} baris</div>
        )}
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">Semua Status</option>
              <option value="Selesai">Selesai</option>
              <option value="Menunggu">Menunggu</option>
              <option value="Gagal">Gagal</option>
              <option value="Dikirim">Dikirim</option>
              <option value="Dalam Pengiriman">Dalam Pengiriman</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Metode Pembayaran</label>
            <select
              value={filterPaymentMethod}
              onChange={(e) => setFilterPaymentMethod(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">Semua Metode</option>
              <option value="QRIS">QRIS</option>
              <option value="Transfer Bank">Transfer Bank</option>
              <option value="COD">COD</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {!sourceTable && rawResponse && (
          <div className="p-4 bg-yellow-50 text-sm text-gray-700">Peringatan: server mengembalikan data kosong. Response: <pre className="whitespace-pre-wrap text-xs mt-2">{JSON.stringify(rawResponse, null, 2)}</pre></div>
        )}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Daftar Transaksi ({filteredTransactions.length} transaksi)
          </h2>
            <p className="text-sm text-gray-600 mt-1">
            Total Jumlah: Rp {formatPrice(totalAmount)}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID Transaksi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID Pesanan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pelanggan
                </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Peran Pengguna
                  </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jumlah
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Metode Pembayaran
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <tr key={(transaction.id || transaction.order_id || transaction.orderId)} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {transaction.id || transaction.order_id || ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.order_id || transaction.orderId || ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.email || transaction.customer || transaction.name || transaction.order_email || transaction.user_email || ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.user_role || transaction.role || transaction.user_status || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Rp {formatPrice(transaction.amount || transaction.total || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.payment_method || transaction.paymentMethod || ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {/* Allow admin to change status when an order_id is available */}
                    {(() => {
                      const curStatus = transaction.status || transaction.state || '';
                      const orderId = transaction.order_id || transaction.orderId || null;
                      const transRowId = transaction.id || null;
                      const statuses = ["Selesai", "Menunggu", "Gagal", "Dikirim", "Dalam Pengiriman"];
                      const handleChangeStatus = async (e) => {
                        const newStatus = e.target.value;
                        // Determine whether to update orders table (when orderId available)
                        // or transactions table (fallback when only transaction row exists).
                        if (!orderId && !transRowId) {
                          alert('Order ID / Transaction ID tidak tersedia untuk transaksi ini. Status tidak dapat diubah.');
                          return;
                        }
                        try {
                          if (orderId) {
                            const res = await fetch(`/api/orders/${orderId}/status`, {
                              method: 'PUT',
                              headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: `Bearer ${token}` } : {}),
                              body: JSON.stringify({ status: newStatus }),
                            });
                            if (!res.ok) {
                              const err = await res.json().catch(() => ({}));
                              throw new Error(err.error || 'Gagal memperbarui status order');
                            }
                            await res.json();
                          } else {
                            // update transactions table via admin route
                            const res = await fetch(`/api/admin/transactions/${transRowId}/status`, {
                              method: 'PUT',
                              headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: `Bearer ${token}` } : {}),
                              body: JSON.stringify({ status: newStatus }),
                            });
                            if (!res.ok) {
                              const err = await res.json().catch(() => ({}));
                              throw new Error(err.error || 'Gagal memperbarui status transaksi');
                            }
                            await res.json();
                          }

                          // update local state by matching on whichever key exists
                          const keyVal = transRowId || orderId;
                          setTransactions(prev => (prev || []).map(t => {
                            const tKey = t.id || t.order_id || t.orderId || null;
                            if (tKey === keyVal) return { ...t, status: newStatus };
                            return t;
                          }));
                        } catch (err) {
                          console.error('Update status failed', err);
                          alert((err && err.message) || 'Gagal memperbarui status');
                        }
                      };

                      return (
                        <select value={curStatus} onChange={handleChangeStatus} className={`px-2 py-1 text-xs rounded ${getStatusColor(curStatus)}`}>
                          <option value="">-</option>
                          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.created_at || transaction.date || ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button className="text-blue-600 hover:text-blue-900 mr-2" onClick={() => openTrackingModal(transaction)}>
                      Set Tracking
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredTransactions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Tidak ada transaksi yang ditemukan sesuai filter yang dipilih.
          </div>
        )}
      </div>

      {/* Tracking modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-2">Set Tracking untuk Order #{selectedOrder.id || selectedOrder.order_id}</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-600">Provider</label>
                <input value={trackingProvider} onChange={e => setTrackingProvider(e.target.value)} className="border px-2 py-1 w-full" />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Nomor Resi</label>
                <input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} className="border px-2 py-1 w-full" />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">History (JSON array)</label>
              <textarea rows={6} value={trackingHistoryText} onChange={e => setTrackingHistoryText(e.target.value)} className="border w-full p-2 font-mono text-sm" />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-3 py-1 border rounded">Batal</button>
              <button onClick={submitTracking} className="px-3 py-1 bg-green-600 text-white rounded">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTransactionsPage;