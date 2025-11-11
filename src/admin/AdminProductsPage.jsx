import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useProducts } from "../contexts/ProductContext";
import formatPrice from "../utils/format";

const AdminProductsPage = () => {
  const { products, deleteProduct, updateProduct } = useProducts();
  const [toggleStates, setToggleStates] = useState({});

  // keep toggleStates in sync when products change
  React.useEffect(() => {
    const map = products.reduce((acc, product) => {
      acc[product.id] = product.inStock !== false;
      return acc;
    }, {});
    setToggleStates(map);
  }, [products]);

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
      <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
        <table className="w-full text-left table-auto">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-4 font-semibold">Gambar</th>
              <th className="p-4 font-semibold">Nama</th>
              <th className="p-4 font-semibold">Kategori</th>
              <th className="p-4 font-semibold">Harga</th>
              <th className="p-4 font-semibold">Status Stok</th>
              <th className="p-4 font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {products.length > 0 ? (
              products.map((product) => (
                <tr key={product.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    {(() => {
                      // product.images may be an array of strings or objects { original, thumb }
                      const img = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null;
                      const src = img
                        ? (typeof img === 'string' ? img : (img.thumb || img.original || ''))
                        : '';
                      return (
                        <img
                          src={src}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-md"
                        />
                      );
                    })()}
                  </td>
                  <td className="p-4 font-medium">{product.name}</td>
                  <td className="p-4 text-gray-600">{product.category}</td>
                  <td className="p-4 font-medium">
                    Rp {formatPrice(product.price)}
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
                      className="text-red-600 hover:underline font-semibold"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center p-8 text-gray-500">
                  Tidak ada produk ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminProductsPage;
