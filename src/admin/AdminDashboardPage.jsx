import React, { useEffect, useState } from "react";
import { useProducts } from "../contexts/ProductContext";
import { useAuth } from "../contexts/AuthContext";
import formatPrice from "../utils/format";

const AdminDashboardPage = () => {
  const { products } = useProducts();
  const { user } = useAuth();

  // derive a friendly display name for the admin and avatar
  const { displayName, displayAvatar, displayInitials } = (() => {
    let name = null;
    let avatar = null;
    // prefer in-memory user from context
    if (user) {
      if (user.name) name = user.name;
      const fn = user.firstName || user.first_name || '';
      const ln = user.lastName || user.last_name || '';
      const combined = `${fn} ${ln}`.trim();
      if (!name && combined) name = combined;
      if (!name && user.email) name = String(user.email).split('@')[0];
      if (user.profileImage) avatar = user.profileImage;
      if (!avatar && user.profileImageUrl) avatar = user.profileImageUrl;
    }

    // fallback to persisted user in localStorage (if any)
    if ((!name || !avatar) && typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('billsnack_user');
        if (raw) {
          const lu = JSON.parse(raw);
          if (lu) {
            if (!name && lu.name) name = lu.name;
            const fn = lu.firstName || lu.first_name || '';
            const ln = lu.lastName || lu.last_name || '';
            const combined = `${fn} ${ln}`.trim();
            if (!name && combined) name = combined;
            if (!name && lu.email) name = String(lu.email).split('@')[0];
            if (!avatar && (lu.profileImage || lu.profile_image || lu.profileImageUrl || lu.profile_image_url)) {
              avatar = lu.profileImage || lu.profile_image || lu.profileImageUrl || lu.profile_image_url;
            }
          }
        }
      } catch {
        // ignore
      }
    }

    // initials fallback
    let initials = null;
    if (name) {
      const parts = name.split(/\s+/).filter(Boolean);
      initials = parts.length === 0 ? null : ((parts[0][0] || '') + (parts[1] ? (parts[1][0] || '') : '')).toUpperCase();
    }

    return { displayName: name, displayAvatar: avatar, displayInitials: initials };
  })();

  // Live transactions fetched from server (show a short recent list)
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [txError, setTxError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    const token = adminToken || null;

    const fetchTx = async () => {
      setLoadingTx(true);
      setTxError(null);
      try {
        const res = await fetch('/api/admin/transactions', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error('Gagal mengambil transaksi');
        const data = await res.json();
        const rows = Array.isArray(data.rows) ? data.rows : [];
        if (!mounted) return;
        const normalized = rows.map(r => ({
          id: r.id || r.transaction_id || r.txn_id || null,
          orderId: r.order_number || r.order_id || r.orderId || null,
          customer: r.name || (r.first_name ? `${r.first_name} ${r.last_name || ''}`.trim() : (r.email || r.order_email || r.user_email || '')),
          amount: Number(r.amount ?? r.total ?? r.order_total ?? 0),
          paymentMethod: r.payment_method || r.paymentMethod || null,
          status: r.status || r.state || null,
          date: r.created_at || r.date || null,
        }));
        setTransactions(normalized.slice(0, 5));
      } catch (e) {
        if (!mounted) return;
        setTxError(e.message || 'Error');
      } finally {
        if (mounted) setLoadingTx(false);
      }
    };
    fetchTx();
    return () => { mounted = false; };
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "Selesai":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      case "Menunggu":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "Gagal":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-surface-alt text-muted";
    }
  };

  return (
    <div className="pb-4">
      <h1 className="text-3xl font-bold mb-2 text-gradient">Dashboard</h1>
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-full bg-surface-alt border border-base flex items-center justify-center text-lg font-semibold text-muted overflow-hidden">
          {displayAvatar ? (
            // allow inlined base64 images or remote urls
            <img src={displayAvatar} alt={`${displayName || 'Admin'} avatar`} className="w-full h-full object-cover" />
          ) : (
            <span className="select-none accent-text">{displayInitials || 'A'}</span>
          )}
        </div>
        <div>
          <p className="text-lg text-muted">
            Selamat datang kembali, <span className="font-medium accent-text">{displayName || 'Admin'}</span>!
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="rounded-lg p-6 shadow-md bg-surface-alt border border-base">
          <h2 className="text-xl font-semibold text-muted">Total Produk</h2>
          <p className="text-5xl font-bold mt-2 accent-text">{products.length}</p>
        </div>
        <div className="rounded-lg p-6 shadow-md bg-surface-alt border border-base">
          <h2 className="text-xl font-semibold text-muted">Total Kategori</h2>
          <p className="text-5xl font-bold mt-2 accent-text">{new Set(products.map((p) => p.category)).size}</p>
        </div>
        <div className="rounded-lg p-6 shadow-md bg-surface-alt border border-base">
          <h2 className="text-xl font-semibold text-muted">Total Transaksi</h2>
          <p className="text-5xl font-bold mt-2 accent-text">{transactions.length}</p>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4 accent-text">Transaksi Terbaru</h2>
        {loadingTx && <div className="text-sm text-muted mb-2">Memuat transaksi terbaru...</div>}
        {txError && <div className="text-sm text-red-600 mb-2">Error: {txError}</div>}
        <div className="rounded-lg shadow-md overflow-hidden bg-surface-alt border border-base">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-alt/60">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    ID Transaksi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    ID Pesanan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Pelanggan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Jumlah
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Metode Pembayaran
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Tanggal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-surface-alt/70">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {transaction.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                      {transaction.orderId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {transaction.customer}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm accent-text font-semibold">
                      Rp{formatPrice(transaction.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                      {transaction.paymentMethod}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                      {transaction.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
