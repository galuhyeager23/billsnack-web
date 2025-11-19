import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useProducts } from "../contexts/ProductContext";
import formatPrice from "../utils/format";
import { useAuth } from "../contexts/AuthContext";

const AdminProductsPage = () => {
  const { deleteProduct, updateProduct } = useProducts();
  const [toggleStates, setToggleStates] = useState({});
  const [allProducts, setAllProducts] = useState([]);
  const { token } = useAuth();
  const [resellers, setResellers] = useState([]);
  const [selectedReseller, setSelectedReseller] = useState('all');
  const [sellerSort, setSellerSort] = useState('none'); // 'none' | 'asc' | 'desc'
  const [loading, setLoading] = useState(true);

  // Fetch admin products from /api/admin/products endpoint
  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/products', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error(`Failed to fetch admin products: ${res.status}`);
        const data = await res.json();
        // Normalize data
        const normalized = Array.isArray(data)
          ? data.map((p) => ({
              ...p,
              stock: typeof p.stock === 'number' ? p.stock : (p.quantity || 0),
              inStock: typeof p.inStock !== 'undefined'
                ? p.inStock
                : (typeof p.in_stock !== 'undefined' ? Boolean(p.in_stock) : ( (typeof p.stock === 'number') ? p.stock > 0 : true )),
            }))
          : data;
        setAllProducts(normalized);
        
        const map = normalized.reduce((acc, product) => {
          acc[product.id] = product.inStock !== false;
          return acc;
        }, {});
        setToggleStates(map);
      } catch (e) {
        console.error('Failed to fetch admin products', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  // Combine admin products with reseller products
  React.useEffect(() => {
    const map = allProducts.reduce((acc, product) => {
      acc[product.id] = product.inStock !== false;
      return acc;
    }, {});
    setToggleStates(map);
  }, [allProducts]);

  // fetch resellers for filter dropdown
  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/resellers', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) return;
        const data = await res.json();
        setResellers(data || []);
      } catch (e) {
        console.error('Failed to fetch resellers for filter', e);
      }
    })();
  }, [token]);

  const handleDelete = (id) => {
    if (
      window.confirm(
        "Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan."
      )
    ) {
      deleteProduct(id);
    }
  };

  const handleToggleStock = (product) => {
    const newStockStatus = !toggleStates[product.id];
    setToggleStates((prev) => ({
      ...prev,
      [product.id]: newStockStatus,
    }));
    updateProduct({
      ...product,
      inStock: newStockStatus,
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Kelola Produk</h1>
        <Link
          to="/admin/products/new"
          className="bg-amber-500 text-white px-5 py-2 rounded-md font-semibold hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-300 transition-colors"
        >
          Tambah Produk Baru
        </Link>
      </div>
      
      {loading ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-500">Memuat produk...</p>
        </div>
      ) : (
      <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
        <table className="w-full text-left table-auto">
          <thead>
            <tr>
              <th colSpan={9} className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium">Filter Penjual:</label>
                    <select value={selectedReseller} onChange={(e) => setSelectedReseller(e.target.value)} className="border rounded px-3 py-1">
                      <option value="all">Semua</option>
                      {resellers.map(r => (
                        <option key={r.id} value={r.id}>{r.store_name || `${r.first_name || ''} ${r.last_name || ''}`.trim() || r.email}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium">Urutkan Penjual:</label>
                    <button onClick={() => setSellerSort(s => s === 'asc' ? 'desc' : 'asc')} className="px-3 py-1 bg-gray-100 rounded">
                      {sellerSort === 'asc' ? 'A → Z' : sellerSort === 'desc' ? 'Z → A' : 'Tidak'}
                    </button>
                  </div>
                </div>
              </th>
            </tr>
            <tr className="border-b bg-gray-50">
              <th className="p-4 font-semibold">Gambar</th>
              <th className="p-4 font-semibold">Nama</th>
              <th className="p-4 font-semibold">Kategori</th>
              <th className="p-4 font-semibold">Harga</th>
              <th className="p-4 font-semibold">Stock</th>
              <th className="p-4 font-semibold">Penjual</th>
              <th className="p-4 font-semibold">Approval</th>
              <th className="p-4 font-semibold">Status Stok</th>
              <th className="p-4 font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              // apply reseller filter and optional sort
              let displayed = allProducts.slice();
              if (selectedReseller !== 'all') {
                displayed = displayed.filter(p => String(p.resellerId) === String(selectedReseller));
              }
              if (sellerSort === 'asc') {
                displayed.sort((a,b) => (a.sellerName || '').localeCompare(b.sellerName || ''));
              } else if (sellerSort === 'desc') {
                displayed.sort((a,b) => (b.sellerName || '').localeCompare(a.sellerName || ''));
              }
              return displayed.length > 0 ? (
                displayed.map((product) => (
                <tr key={product.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    {(() => {
                      // product.images may be an array of strings or objects { original, thumb }
                      const img = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null;
                      const src = img
                        ? (typeof img === 'string' ? img : (img.thumb || img.original || ''))
                        : '';
                      return src ? (
                        <img
                          src={src}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-md"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex';
                          }}
                        />
                      ) : null;
                    })()}
                    {(() => {
                      const img = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null;
                      const src = img
                        ? (typeof img === 'string' ? img : (img.thumb || img.original || ''))
                        : '';
                      return !src ? (
                        <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center text-xs text-gray-500">
                          No image
                        </div>
                      ) : null;
                    })()}
                  </td>
                  <td className="p-4 font-medium">{product.name}</td>
                  <td className="p-4 text-gray-600">{product.category}</td>
                  <td className="p-4 font-medium">
                    Rp {formatPrice(product.price)}
                  </td>
                  <td className="p-4">
                    <span className="text-lg font-bold text-blue-600">{product.stock} unit</span>
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      {product.resellerId ? (
                        <Link to={`/admin/resellers/edit/${product.resellerId}`} className="font-medium text-blue-700 hover:underline">
                          {product.sellerName || product.reseller || "Reseller"}
                        </Link>
                      ) : (
                        <p className="font-medium text-gray-900">{product.sellerName || product.reseller || "Admin"}</p>
                      )}
                      <p className="text-gray-500">{product.resellerEmail || product.resellerEmail || "admin@billsnack.id"}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    {product.resellerId ? (
                      product.is_approved ? (
                        <span className="inline-block bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-semibold">Disetujui</span>
                      ) : (
                        <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-full font-semibold">Menunggu</span>
                      )
                    ) : (
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-semibold">Admin</span>
                    )}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleStock(product)}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                        toggleStates[product.id]
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          toggleStates[product.id]
                            ? "translate-x-7"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                    <span className="ml-2 text-sm font-medium">
                      {toggleStates[product.id] ? "In Stock" : "Out of Stock"}
                    </span>
                  </td>
                  <td className="p-4">
                    <Link
                      to={`/admin/products/edit/${product.id}`}
                      className="text-blue-600 hover:underline mr-4 font-semibold"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:underline mr-4 font-semibold"
                    >
                      Hapus
                    </button>
                    {/* Approve / Unapprove for reseller products */}
                    {product.resellerId && (
                      <button
                        onClick={async () => {
                          try {
                            const newVal = !product.is_approved;
                            const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
                            if (!adminToken) {
                              alert('Anda perlu login sebagai admin terlebih dahulu.');
                              return;
                            }
                            console.log('Approving product', product.id, 'newVal=', newVal);
                            // Call admin approve endpoint directly
                            const res = await fetch(`/api/admin/products/${product.id}/approve`, {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${adminToken}`
                              },
                              body: JSON.stringify({ is_approved: newVal })
                            });
                            if (!res.ok) {
                              const err = await res.json();
                              throw new Error(err.error || 'Failed to approve');
                            }
                            // Update local state
                            const updated = { ...product, is_approved: newVal };
                            setAllProducts(prev => prev.map(p => p.id === product.id ? updated : p));
                            alert(newVal ? 'Produk disetujui!' : 'Persetujuan produk dibatalkan!');
                          } catch (err) {
                            console.error('Approve toggle failed', err);
                            alert(`Gagal mengubah status persetujuan: ${err.message}`);
                          }
                        }}
                        className={`inline-flex items-center px-3 py-1 rounded-md font-semibold ${product.is_approved ? 'bg-gray-200 text-gray-800' : 'bg-green-600 text-white'}`}
                      >
                        {product.is_approved ? 'Batalkan Persetujuan' : 'Setujui'}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="text-center p-8 text-gray-500">
                  Tidak ada produk ditemukan.
                </td>
              </tr>
            );
          })()}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
};

export default AdminProductsPage;
