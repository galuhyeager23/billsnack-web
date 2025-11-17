import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ResellerProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [toggleStates, setToggleStates] = useState({});
  const { token } = useAuth();

  useEffect(() => {
    // fetch reseller's products from API
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products/reseller', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = await res.json();
        setProducts(data || []);
        const map = (data || []).reduce((acc, product) => {
          acc[product.id] = product.inStock !== false;
          return acc;
        }, {});
        setToggleStates(map);
      } catch (err) {
        console.error('Error fetching reseller products:', err);
      }
    };
    fetchProducts();
  }, [token]);

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

  const handleToggleStock = (product) => {
    const newStockStatus = !toggleStates[product.id];
    setToggleStates((prev) => ({ ...prev, [product.id]: newStockStatus }));
    // Update backend
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
        // revert toggle
        setToggleStates((prev) => ({ ...prev, [product.id]: !newStockStatus }));
      }
    })();
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(price);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Produk Saya</h1>
        <Link
          to="/reseller/products/new"
          className="bg-blue-500 text-white px-5 py-2 rounded-md font-semibold hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors"
        >
          Tambah Produk Baru
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-gray-600 text-lg">Belum ada produk</p>
          <p className="text-gray-500 text-sm mt-2">Mulai dengan menambahkan produk pertama Anda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="flex items-center p-6">
                {/* Product Image */}
                <div className="w-32 h-32 bg-gray-200 rounded-lg mr-6 flex items-center justify-center">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>

                {/* Product Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">Kategori: {product.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">{formatPrice(product.price)}</p>
                      <p className="text-sm text-gray-500 mt-1">Terjual: {product.sales}</p>
                    </div>
                  </div>

                  {/* Stock Status */}
                  <div className="flex items-center gap-6 mb-4">
                    {/* Stock Quantity */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600">Stock:</span>
                      <span className="text-lg font-bold text-blue-600">{product.stock} unit</span>
                    </div>

                    {/* Stock Status Toggle */}
                    <div className="flex items-center gap-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={toggleStates[product.id]}
                          onChange={() => handleToggleStock(product)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {toggleStates[product.id] ? "Tersedia" : "Habis"}
                        </span>
                      </label>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      toggleStates[product.id]
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {toggleStates[product.id] ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Link
                      to={`/reseller/products/edit/${product.id}`}
                      className="inline-flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-md font-semibold transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="inline-flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-md font-semibold transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResellerProductsPage;
