import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ResellerDashboardPage = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalEarnings: 0,
    totalSold: 0,
  });
  const [soldProducts, setSoldProducts] = useState([]);

  useEffect(() => {
    // Dummy data untuk tampilan
    setStats({
      totalProducts: 0,
      activeProducts: 0,
      totalEarnings: 0,
      totalSold: 0,
    });
  }, []);

  const { token, user } = useAuth();
  const [resellers, setResellers] = useState([]);
  const [connections, setConnections] = useState(new Set());
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // fetch other resellers and existing connections (only for reseller role)
    const fetchResellers = async () => {
      try {
        const base = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : 'http://localhost:4000');
        const r1 = await fetch(`${base}/api/resellers?excludeSelf=1`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (r1.ok) {
          const data = await r1.json();
          setResellers(data || []);
        }
        const r2 = await fetch(`${base}/api/resellers/connections`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (r2.ok) {
          const d2 = await r2.json();
          setConnections(new Set(d2.connections || []));
        }
      } catch (e) {
        console.error('Failed to fetch resellers or connections', e);
      }
    };
    if (token && user && user.role === 'reseller') fetchResellers();
  }, [token, user]);

  // fetch reseller metrics (counts) to populate dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const base = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : 'http://localhost:4000');
        const res = await fetch(`${base}/api/products/reseller`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!res.ok) return;
        const data = await res.json();
        const totalProducts = data.length;
        const activeProducts = data.filter(p => p.is_approved === 1 || p.is_approved === true).length;
        const pending = data.filter(p => !p.is_approved || p.is_approved === 0).length;
        
        // Fetch sales statistics from the new endpoint
        const statsRes = await fetch(`${base}/api/resellers/stats`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        let totalSold = 0;
        let totalEarnings = 0;
        
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          totalSold = statsData.totalSold || 0;
          totalEarnings = statsData.totalEarnings || 0;
        }
        
        // Fetch sold products details
        const soldRes = await fetch(`${base}/api/resellers/sold-products`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (soldRes.ok) {
          const soldData = await soldRes.json();
          setSoldProducts(soldData || []);
        }
        
        setStats({ totalProducts, activeProducts, totalSold, totalEarnings });
        setPendingCount(pending);
      } catch (e) {
        console.error('Failed to fetch reseller stats', e);
      }
    };
    if (token && user && user.role === 'reseller') fetchStats();
  }, [token, user]);

  const toggleConnect = async (targetId) => {
    try {
      const base = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : 'http://localhost:4000');
      const res = await fetch(`${base}/api/resellers/${targetId}/connect`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Request failed');
      const j = await res.json();
      setConnections(prev => {
        const next = new Set(prev);
        if (j.connected) next.add(Number(targetId)); else next.delete(Number(targetId));
        return next;
      });
    } catch (e) {
      console.error('Toggle connect failed', e);
      alert('Gagal menghubungkan reseller. Coba lagi.');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Reseller</h1>
        <p className="text-gray-600 mt-2">Selamat datang di panel reseller Bilsnack</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Products */}
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Produk</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalProducts}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m0 0L4 7m16 0v10l-8 4m0 0l-8-4m0 0V7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Active Products */}
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Produk Aktif</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.activeProducts}</p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Sold */}
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Terjual</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{stats.totalSold}</p>
            </div>
            <div className="bg-orange-100 rounded-full p-3">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Earnings */}
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Penghasilan</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">{formatPrice(stats.totalEarnings)}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/reseller/products/new"
            className="flex items-center justify-between bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-lg p-4 transition-colors"
          >
            <div>
              <p className="font-semibold text-blue-900">Tambah Produk Baru</p>
              <p className="text-sm text-blue-700">Upload produk untuk dijual</p>
            </div>
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </Link>

          <Link
            to="/reseller/products"
            className="flex items-center justify-between bg-green-50 hover:bg-green-100 border-2 border-green-200 rounded-lg p-4 transition-colors"
          >
            <div>
              <p className="font-semibold text-green-900">Kelola Produk</p>
              <p className="text-sm text-green-700">Edit atau hapus produk Anda</p>
            </div>
            <div className="flex items-center gap-3">
              {pendingCount > 0 && (
                <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-semibold">{pendingCount} Menunggu</span>
              )}
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            </div>
          </Link>
        </div>
      </div>

      {/* Information Box */}
      <div className="bg-blue-50 border-l-4 border-blue-600 rounded-lg p-6 mb-8">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-1a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Catatan:</strong> Panel ini adalah tampilan untuk resseler. Anda dapat menambah dan mengelola produk yang ingin Anda jual melalui platform Bilsnack.
            </p>
          </div>
        </div>
      </div>

      {/* Sold Products Table */}
      {soldProducts.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Produk Terjual</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama Produk
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Harga Satuan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jumlah Terjual
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Pesanan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Pendapatan
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {soldProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatPrice(product.price)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.totalQuantitySold}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.orderCount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-green-600">{formatPrice(product.totalRevenue)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Connect with other resellers (only visible to reseller role) */}
      {user && user.role === 'reseller' ? (
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Terhubung dengan Reseller Lain</h2>
        <p className="text-sm text-gray-600 mb-4">Temukan reseller lain dan bangun jaringan. Klik "Hubungkan" untuk saling terhubung.</p>
        {resellers.length === 0 ? (
          <p className="text-gray-500">Tidak ada reseller lain ditemukan.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resellers.map(r => (
              <div key={r.id} className="border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{r.store_name || `${r.first_name || ''} ${r.last_name || ''}`.trim() || r.username || r.email}</p>
                  <p className="text-sm text-gray-500">{r.email}</p>
                </div>
                <div>
                  <button
                    onClick={() => toggleConnect(r.id)}
                    className={`py-2 px-4 rounded-lg font-semibold ${connections.has(r.id) ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>
                    {connections.has(r.id) ? 'Terhubung' : 'Hubungkan'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Koneksi Reseller</h2>
          <p className="text-sm text-gray-600">Fitur koneksi hanya tersedia untuk akun dengan peran <strong>reseller</strong>. Jika Anda ingin menjadi reseller, minta admin untuk menandai akun Anda sebagai reseller.</p>
        </div>
      )}
    </div>
  );
};

export default ResellerDashboardPage;
