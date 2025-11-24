import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ResellerProductFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "",
    description: "",
    image: null,
    imageUrl: null,
    quantity: "",
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    "All",
    "Chips & Crisps",
    "Candies & Sweets",
    "Cookies",
    "Nuts & Dried Fruits",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        image: file,
      }));
    }
  };

  const { token } = useAuth();

  useEffect(() => {
    if (!isEditing) return;
    // fetch product data to populate form
    (async () => {
      try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) throw new Error("Failed to fetch product");
        const data = await res.json();
        setFormData({
          name: data.name || "",
          price: data.price || "",
          category: data.category || "",
          description: data.description || "",
          image: null,
          imageUrl:
            data.images && data.images.length > 0 ? data.images[0] : null,
          quantity: data.stock || "",
        });
      } catch (err) {
        console.error("Failed to load product", err);
      }
    })();
  }, [isEditing, id]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nama produk harus diisi";
    }
    if (!formData.price) {
      newErrors.price = "Harga harus diisi";
    }
    if (!formData.category) {
      newErrors.category = "Kategori harus dipilih";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Deskripsi harus diisi";
    }
    if (!isEditing && !formData.image) {
      newErrors.image = "Gambar produk harus diupload";
    }
    if (!formData.quantity) {
      newErrors.quantity = "Jumlah stok harus diisi";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      // If there is an image file selected, upload it first
      let images = [];
      if (formData.image) {
        const fd = new FormData();
        fd.append("files", formData.image);
        const upRes = await fetch("/api/uploads", {
          method: "POST",
          body: fd,
        });
        if (!upRes.ok) throw new Error("Upload failed");
        const upData = await upRes.json();
        images = upData.files || [];
      } else if (formData.imageUrl) {
        images = [formData.imageUrl];
      }

      const payload = {
        name: formData.name,
        price: Number(formData.price),
        stock: Number(formData.quantity),
        category: formData.category,
        description: formData.description,
        images: images,
      };

      if (isEditing) {
        const res = await fetch(`/api/products/reseller/${id}`, {
          method: "PUT",
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              }
            : { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to update product");
        alert("Produk berhasil diupdate!");
      } else {
        const res = await fetch("/api/products/reseller", {
          method: "POST",
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              }
            : { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to create product");
        const newProd = await res.json();
        alert("Produk berhasil ditambahkan!");
        // navigate back to reseller products and pass new product in state for immediate display
        navigate("/reseller/products", { state: { newProduct: newProd } });
        return;
      }
      navigate("/reseller/products");
    } catch (error) {
      console.error("Error:", error);
      alert("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? "Edit Produk" : "Tambah Produk Baru"}
        </h1>
        <p className="text-gray-600 mt-2">
          {isEditing
            ? "Perbarui informasi produk Anda"
            : "Isi formulir di bawah untuk menambahkan produk baru"}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md space-y-6"
      >
        {/* Product Name */}
        <div className="mb-6">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Nama Produk <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Contoh: Keripik Nanas Lezat"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-transparent ${
              errors.name ? "border-red-500" : "border-gray-200"
            }`}
          />
          {errors.name && (
            <p className="text-red-600 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        {/* Price */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label
              htmlFor="price"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Harga (Rp) <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="Contoh: 50000"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-transparent ${
                errors.price ? "border-red-500" : "border-gray-200"
              }`}
            />
            {errors.price && (
              <p className="text-red-600 text-sm mt-1">{errors.price}</p>
            )}
          </div>

          {/* Quantity */}
          <div>
            <label
              htmlFor="quantity"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Jumlah Stok <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              placeholder="Contoh: 100"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-transparent ${
                errors.quantity ? "border-red-500" : "border-gray-200"
              }`}
            />
            {errors.quantity && (
              <p className="text-red-600 text-sm mt-1">{errors.quantity}</p>
            )}
          </div>
        </div>

        {/* Category */}
        <div className="mb-6">
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Kategori <span className="text-red-600">*</span>
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-transparent ${
              errors.category ? "border-red-500" : "border-gray-200"
            }`}
          >
            <option value="">-- Pilih Kategori --</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="text-red-600 text-sm mt-1">{errors.category}</p>
          )}
        </div>

        {/* Description */}
        <div className="mb-6">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Deskripsi <span className="text-red-600">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Jelaskan detail produk Anda..."
            rows={5}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-transparent resize-vertical ${
              errors.description ? "border-red-500" : "border-gray-200"
            }`}
          />
          {errors.description && (
            <p className="text-red-600 text-sm mt-1">{errors.description}</p>
          )}
        </div>

        {/* Image Upload */}
        <div className="mb-6">
          <label
            htmlFor="image"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Gambar Produk{" "}
            {!isEditing && <span className="text-red-600">*</span>}
          </label>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors ${
              errors.image ? "border-red-500" : "border-gray-300"
            }`}
          >
            <input
              type="file"
              id="image"
              name="image"
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
            <label htmlFor="image" className="cursor-pointer">
              {formData.image ? (
                <div>
                  <p className="text-green-600 font-semibold">
                    ✓ Gambar terpilih: {formData.image.name}
                  </p>
                </div>
              ) : (
                <div>
                  <svg
                    className="w-12 h-12 mx-auto text-gray-400 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-gray-600">
                    Klik untuk memilih gambar atau drag and drop
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    Ukuran maksimal: 5MB (JPG, PNG)
                  </p>
                </div>
              )}
            </label>
          </div>
          {errors.image && (
            <p className="text-red-600 text-sm mt-1">{errors.image}</p>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting
              ? isEditing
                ? "Memperbarui..."
                : "Menambahkan..."
              : isEditing
              ? "Update Produk"
              : "Tambah Produk"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/reseller/products")}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResellerProductFormPage;
