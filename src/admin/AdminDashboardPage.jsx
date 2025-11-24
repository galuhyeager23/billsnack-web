import React, { useEffect, useState } from "react";
import { useProducts } from "../contexts/ProductContext";
// import { useAuth } from "../contexts/AuthContext";
import formatPrice from "../utils/format";

const AdminDashboardPage = () => {
  const { products } = useProducts();
  // Jangan gunakan user dari AuthContext, hanya ambil data admin dari localStorage

  // derive a friendly display name for the admin and avatar
  const { displayName, displayAvatar, displayInitials } = (() => {
    let name = null;
    let avatar = null;
    // Hanya ambil dari localStorage adminUser
    if (typeof window !== 'undefined') {
      try {
        const adminRaw = localStorage.getItem('adminUser');
        if (adminRaw) {
          const au = JSON.parse(adminRaw);
          if (au) {
            if (au.name) name = au.name;
            const fn = au.firstName || au.first_name || '';
            const ln = au.lastName || au.last_name || '';
            const combined = `${fn} ${ln}`.trim();
            if (!name && combined) name = combined;
            if (!name && au.email) name = String(au.email).split('@')[0];
            if (au.profileImage || au.profile_image || au.profileImageUrl || au.profile_image_url) {
              avatar = au.profileImage || au.profile_image || au.profileImageUrl || au.profile_image_url;
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
      <h1 className="text-3xl font-bold mb-2 text-black">Dashboard</h1>
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
        <div className="glass rounded-2xl p-6 shadow-xl bg-white/80 backdrop-blur-sm border border-white/20 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <h2 className="text-xl font-semibold text-gray-800">Total Produk</h2>
          <p className="text-5xl font-bold mt-2 text-blue-600">{products.length}</p>
        </div>
        <div className="glass rounded-2xl p-6 shadow-xl bg-white/80 backdrop-blur-sm border border-white/20 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <h2 className="text-xl font-semibold text-gray-800">Total Kategori</h2>
          <p className="text-5xl font-bold mt-2 text-green-600">{new Set(products.map((p) => p.category)).size}</p>
        </div>
        <div className="glass rounded-2xl p-6 shadow-xl bg-white/80 backdrop-blur-sm border border-white/20 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          <h2 className="text-xl font-semibold text-gray-800">Total Transaksi</h2>
          <p className="text-5xl font-bold mt-2 text-purple-600">{transactions.length}</p>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4 accent-text">Transaksi Terbaru</h2>
        {loadingTx && <div className="text-sm text-muted mb-2">Memuat transaksi terbaru...</div>}
        {txError && <div className="text-sm text-red-600 mb-2">Error: {txError}</div>}
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          <table className="w-full text-left table-auto">
            <thead>
              <tr className="bg-yellow-500 text-white">
                <th className="p-4 font-semibold text-white">ID Transaksi</th>
                <th className="p-4 font-semibold text-white">ID Pesanan</th>
                <th className="p-4 font-semibold text-white">Pelanggan</th>
                <th className="p-4 font-semibold text-white">Jumlah</th>
                <th className="p-4 font-semibold text-white">Metode Pembayaran</th>
                <th className="p-4 font-semibold text-white">Status</th>
                <th className="p-4 font-semibold text-white">Tanggal</th>
              </tr>
            </thead>
            <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">{transaction.id}</td>
                    <td className="p-4">{transaction.orderId}</td>
                    <td className="p-4">{transaction.customer}</td>
                    <td className="p-4">
                      <span className="font-semibold text-yellow-600">Rp{formatPrice(transaction.amount)}</span>
                    </td>
                    <td className="p-4">{transaction.paymentMethod}</td>
                    <td className="p-4">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="p-4">{transaction.date}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
