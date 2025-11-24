import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useProducts } from "../contexts/ProductContext";
import formatPrice from "../utils/format";

const AdminProductsPage = () => {
  const { deleteProduct, updateProduct } = useProducts();
  const [toggleStates, setToggleStates] = useState({});
  const [allProducts, setAllProducts] = useState([]);
  const [resellers, setResellers] = useState([]);
  const [selectedReseller, setSelectedReseller] = useState("all");
  const [sellerSort, setSellerSort] = useState("none"); // 'none' | 'asc' | 'desc'
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch admin products from /api/admin/products endpoint
  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const adminToken =
          typeof window !== "undefined"
            ? localStorage.getItem("adminToken")
            : null;
        console.log(
          "Fetching admin products with token:",
          adminToken ? "Present" : "Missing"
        );

        const res = await fetch("/api/admin/products", {
          headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
        });

        console.log("Admin products response status:", res.status);

        if (!res.ok) {
          const errorText = await res.text();
          console.error(
            "Failed to fetch admin products:",
            res.status,
            errorText
          );
          throw new Error(`Failed to fetch admin products: ${res.status}`);
        }

        const data = await res.json();
        console.log("Admin products data:", data);

        // Normalize data
        const normalized = Array.isArray(data)
          ? data.map((p) => ({
              ...p,
              stock: typeof p.stock === "number" ? p.stock : p.quantity || 0,
              inStock:
                typeof p.inStock !== "undefined"
                  ? p.inStock
                  : typeof p.in_stock !== "undefined"
                  ? Boolean(p.in_stock)
                  : typeof p.stock === "number"
                  ? p.stock > 0
                  : true,
            }))
          : data;

        console.log("Normalized products:", normalized.length, "items");
        setAllProducts(normalized);

        const map = normalized.reduce((acc, product) => {
          acc[product.id] = product.inStock !== false;
          return acc;
        }, {});
        setToggleStates(map);
      } catch (e) {
        console.error("Failed to fetch admin products", e);
        alert("Gagal memuat produk. Periksa console untuk detail error.");
      } finally {
        setLoading(false);
      }
    })();
  }, []); // Remove token dependency

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
        const adminToken =
          typeof window !== "undefined"
            ? localStorage.getItem("adminToken")
            : null;
        const res = await fetch("/api/resellers", {
          headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
        });
        if (!res.ok) return;
        const data = await res.json();
        setResellers(data || []);
      } catch (e) {
        console.error("Failed to fetch resellers for filter", e);
      }
    })();
  }, []);

  const handleDelete = async (id) => {
    if (
      window.confirm(
        "Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan."
      )
    ) {
      try {
        await deleteProduct(id);
        // Refresh the product list after successful deletion
        const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
        const res = await fetch('/api/admin/products', {
          headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
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
        }
      } catch (err) {
        console.error('Failed to delete product:', err);
        // Error already shown by deleteProduct
      }
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
        <h1 className="text-3xl font-bold text-gray-800">Kelola Produk</h1>
        <Link
          to="/admin/products/new"
          className="bg-green-500 text-white px-5 py-2 rounded-md font-semibold hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Produk Baru
        </Link>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Cari produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">
              Filter Penjual:
            </label>
            <select
              value={selectedReseller}
              onChange={(e) => setSelectedReseller(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="all">Semua</option>
              {resellers.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.store_name ||
                    `${r.first_name || ""} ${r.last_name || ""}`.trim() ||
                    r.email}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">
              Urutkan Penjual:
            </label>
            <button
              onClick={() =>
                setSellerSort((s) =>
                  s === "asc" ? "desc" : s === "desc" ? "none" : "asc"
                )
              }
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              {sellerSort === "asc"
                ? "A → Z"
                : sellerSort === "desc"
                ? "Z → A"
                : "Tidak"}
            </button>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full text-left table-auto">
          <thead>
            <tr className="bg-yellow-500 text-white">
              <th className="p-4 font-semibold text-white">Gambar</th>
              <th className="p-4 font-semibold text-white">Nama</th>
              <th className="p-4 font-semibold text-white">Harga</th>
              <th className="p-4 font-semibold text-white">Stock</th>
              <th className="p-4 font-semibold text-white">Penjual</th>
              <th className="p-4 font-semibold text-white">Approval</th>
              <th className="p-4 font-semibold text-white">Status Stok</th>
              <th className="p-4 font-semibold text-white">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              // apply reseller filter, search, and optional sort
              let displayed = allProducts.slice();
              if (selectedReseller !== "all") {
                displayed = displayed.filter(
                  (p) => String(p.resellerId) === String(selectedReseller)
                );
              }
              if (searchTerm) {
                displayed = displayed.filter(
                  (p) =>
                    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.category
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase()) ||
                    (p.sellerName || "")
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase())
                );
              }
              if (sellerSort === "asc") {
                displayed.sort((a, b) =>
                  (a.sellerName || "").localeCompare(b.sellerName || "")
                );
              } else if (sellerSort === "desc") {
                displayed.sort((a, b) =>
                  (b.sellerName || "").localeCompare(a.sellerName || "")
                );
              }
              return displayed.length > 0 ? (
                displayed.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      {(() => {
                        // product.images may be an array of strings or objects { original, thumb }
                        const img =
                          Array.isArray(product.images) &&
                          product.images.length > 0
                            ? product.images[0]
                            : null;
                        const src = img
                          ? typeof img === "string"
                            ? img
                            : img.thumb || img.original || ""
                          : "";
                        return src ? (
                          <img
                            src={src}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded-md"
                            onError={(e) => {
                              e.target.style.display = "none";
                              if (e.target.nextElementSibling)
                                e.target.nextElementSibling.style.display =
                                  "flex";
                            }}
                          />
                        ) : null;
                      })()}
                      {(() => {
                        const img =
                          Array.isArray(product.images) &&
                          product.images.length > 0
                            ? product.images[0]
                            : null;
                        const src = img
                          ? typeof img === "string"
                            ? img
                            : img.thumb || img.original || ""
                          : "";
                        return !src ? (
                          <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center text-xs text-gray-500">
                            No image
                          </div>
                        ) : null;
                      })()}
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {product.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {product.category}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-yellow-600">
                        Rp {formatPrice(product.price)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                        {product.stock} unit
                      </span>
                    </td>
                    <td className="p-4">
                      {product.resellerId ? (
                        <Link
                          to={`/admin/resellers/edit/${product.resellerId}`}
                          className="font-medium text-blue-700 hover:underline"
                        >
                          {product.sellerName || product.reseller || "Reseller"}
                        </Link>
                      ) : (
                        <p className="font-medium text-gray-900">
                          {product.sellerName || product.reseller || "Admin"}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        {product.resellerEmail || "admin@billsnack.id"}
                      </p>
                    </td>
                    <td className="p-4">
                      {product.resellerId ? (
                        product.is_approved ? (
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                            Disetujui
                          </span>
                        ) : (
                          <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                            Menunggu
                          </span>
                        )
                      ) : (
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                          Admin
                        </span>
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
                      <div className="flex gap-2">
                        <Link
                          to={`/admin/products/edit/${product.id}`}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-md text-sm font-semibold transition-colors flex items-center gap-1"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-md text-sm font-semibold transition-colors flex items-center gap-1"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          Hapus
                        </button>
                        {/* Approve / Unapprove for reseller products */}
                        {product.resellerId && (
                          <button
                            onClick={async () => {
                              try {
                                const newVal = !product.is_approved;
                                const adminToken =
                                  typeof window !== "undefined"
                                    ? localStorage.getItem("adminToken")
                                    : null;
                                if (!adminToken) {
                                  alert(
                                    "Anda perlu login sebagai admin terlebih dahulu."
                                  );
                                  return;
                                }
                                console.log(
                                  "Approving product",
                                  product.id,
                                  "newVal=",
                                  newVal
                                );
                                // Call admin approve endpoint directly
                                const res = await fetch(
                                  `/api/admin/products/${product.id}/approve`,
                                  {
                                    method: "PUT",
                                    headers: {
                                      "Content-Type": "application/json",
                                      Authorization: `Bearer ${adminToken}`,
                                    },
                                    body: JSON.stringify({
                                      is_approved: newVal,
                                    }),
                                  }
                                );
                                if (!res.ok) {
                                  const err = await res.json();
                                  throw new Error(
                                    err.error || "Failed to approve"
                                  );
                                }
                                // Update local state
                                const updated = {
                                  ...product,
                                  is_approved: newVal,
                                };
                                setAllProducts((prev) =>
                                  prev.map((p) =>
                                    p.id === product.id ? updated : p
                                  )
                                );
                                alert(
                                  newVal
                                    ? "Produk disetujui!"
                                    : "Persetujuan produk dibatalkan!"
                                );
                              } catch (err) {
                                console.error("Approve toggle failed", err);
                                alert(
                                  `Gagal mengubah status persetujuan: ${err.message}`
                                );
                              }
                            }}
                            className={`inline-flex items-center px-3 py-1 rounded-md font-semibold ${
                              product.is_approved
                                ? "bg-gray-200 text-gray-800"
                                : "bg-green-600 text-white"
                            }`}
                          >
                            {product.is_approved
                              ? "Batalkan Persetujuan"
                              : "Setujui"}
                          </button>
                        )}
                      </div>
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
    </div>
  );
};

export default AdminProductsPage;
