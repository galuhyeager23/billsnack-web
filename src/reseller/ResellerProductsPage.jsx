import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import formatPrice from "../utils/format";
import { useAuth } from "../contexts/AuthContext";

const ResellerProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [toggleStates, setToggleStates] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [statusCode, setStatusCode] = useState(null);
  const { token } = useAuth();
  const location = useLocation();

  // Toggle stock state locally and persist to backend
  const handleToggleStock = (product) => {
    const newStockStatus = !toggleStates[product.id];
    setToggleStates((prev) => ({ ...prev, [product.id]: newStockStatus }));
    (async () => {
      try {
        const res = await fetch(`/api/products/reseller/${product.id}`, {
          method: 'PUT',
          headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' },
          body: JSON.stringify({ in_stock: newStockStatus ? 1 : 0, stock: product.stock }),
        });
        if (!res.ok) throw new Error('Failed to update stock');
        setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, inStock: newStockStatus } : p)));
      } catch (err) {
        console.error('Failed to update stock', err);
        alert('Gagal memperbarui status stok');
        setToggleStates((prev) => ({ ...prev, [product.id]: !newStockStatus }));
      }
    })();
  };

  const handleDelete = (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan.')) return;
    (async () => {
      try {
        const res = await fetch(`/api/products/reseller/${id}`, {
          method: 'DELETE',
          headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' },
        });
        if (!res.ok) throw new Error('Failed to delete');
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } catch (err) {
        console.error('Delete failed', err);
        alert('Gagal menghapus produk.');
      }
    })();
  };

  // Fetch using relative endpoint first, then fallback to explicit backend origin
  useEffect(() => {
    let cancelled = false;
    const API_FALLBACK = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:4000';
    const endpoints = ['/api/products/reseller', `${API_FALLBACK.replace(/\/$/, '')}/api/products/reseller`];

    const doFetch = async () => {
      setLoading(true);
      setErrorMsg(null);
      setStatusCode(null);
      let lastErr = null;
      for (const ep of endpoints) {
        try {
          const res = await fetch(ep, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
          setStatusCode(res.status);
          if (res.status === 401 || res.status === 403) {
            const txt = await res.text().catch(() => '');
            setErrorMsg(`Autorisasi gagal (${res.status}). ${txt || ''}`.trim());
            setProducts([]);
            setToggleStates({});
            setLoading(false);
            return;
          }
          if (!res.ok) {
            lastErr = new Error(`HTTP ${res.status} from ${ep}`);
            continue;
          }
          const data = await res.json();
          if (cancelled) return;
          let list = data || [];
          const newProduct = location && location.state && location.state.newProduct;
          if (newProduct) {
            const exists = list.some(p => Number(p.id) === Number(newProduct.id));
            if (!exists) list = [newProduct, ...list];
          }
          setProducts(list);
          const map = (list || []).reduce((acc, product) => {
            acc[product.id] = product.inStock !== false;
            return acc;
          }, {});
          setToggleStates(map);
          setLoading(false);
          return;
        } catch (err) {
          console.warn('Fetch attempt failed for', ep, err);
          lastErr = err;
          continue;
        }
      }
      setErrorMsg(lastErr ? String(lastErr) : 'Gagal mengambil data');
      setProducts([]);
      setToggleStates({});
      setLoading(false);
    };

    doFetch();
    return () => { cancelled = true; };
  }, [token, location]);

  return (
    <div>
      <div className="flex justify-between items-center p-6 mb-6">
        <h1 className="text-3xl font-bold">Produk Saya</h1>
        <Link
          to="/reseller/products/new"
          className="bg-blue-500 text-white px-5 py-2 rounded-md font-semibold hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors"
        >
          Tambah Produk Baru
        </Link>
      </div>

      {loading && <div className="p-4 text-sm text-gray-600">Memuat produk...</div>}
      {errorMsg && (
        <div className="p-4 mb-4 bg-red-50 text-red-700 border border-red-100 rounded">{errorMsg} (status: {statusCode})</div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
        {products.length === 0 && !loading ? (
          <div className="p-12 text-center text-gray-500">Belum ada produk</div>
        ) : (
          <table className="w-full table-auto text-left">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="p-4 font-semibold">Gambar</th>
                <th className="p-4 font-semibold">Nama</th>
                <th className="p-4 font-semibold">Kategori</th>
                <th className="p-4 font-semibold">Harga</th>
                <th className="p-4 font-semibold">Stock</th>
                <th className="p-4 font-semibold">Approval</th>
                <th className="p-4 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    {(() => {
                      const img = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null;
                      const src = img ? (typeof img === 'string' ? img : (img.thumb || img.original || '')) : '';
                      return (
                        <img src={src} alt={product.name} className="w-16 h-16 object-cover rounded-md" />
                      );
                    })()}
                  </td>
                  <td className="p-4 font-medium">
                    {product.name}
                    <div className="text-sm text-gray-500">{product.sellerName || ''}</div>
                  </td>
                  <td className="p-4 text-gray-600">{product.category}</td>
                  <td className="p-4 font-medium">{formatPrice(product.price)}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-blue-600">{product.stock} unit</span>
                      <label className="inline-flex items-center">
                        <input type="checkbox" checked={!!toggleStates[product.id]} onChange={() => handleToggleStock(product)} />
                        <span className="ml-2 text-sm">Tersedia</span>
                      </label>
                    </div>
                  </td>
                  <td className="p-4">
                    {product.is_approved ? (
                      <span className="inline-block bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full">Disetujui</span>
                    ) : (
                      <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-full">Menunggu</span>
                    )}
                  </td>
                  <td className="p-4">
                    <Link to={`/reseller/products/edit/${product.id}`} className="text-blue-600 hover:underline mr-4">Edit</Link>
                    <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:underline">Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ResellerProductsPage;
