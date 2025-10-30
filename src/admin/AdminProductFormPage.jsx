import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useProducts } from "../contexts/ProductContext";

const AdminProductFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getProductById, addProduct, updateProduct } = useProducts();
  const isEditing = Boolean(id);

  const [product, setProduct] = useState({
    name: "",
    category: "",
    price: 0,
    originalPrice: undefined,
    rating: 0,
    reviewCount: 0,
    images: [""],
    description: "",
    colors: [{ name: "", hex: "" }],
  });

  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    setSelectedImages(files);
    
    // Create preview URLs
    const urls = files.map((file) => URL.createObjectURL(file));
    setImagePreviewUrls(urls);
  };

  const handleRemoveImage = (index) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newUrls = imagePreviewUrls.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    setImagePreviewUrls(newUrls);
  };

  useEffect(() => {
    if (isEditing && id) {
      const existingProduct = getProductById(Number(id));
      if (existingProduct) {
        setProduct(existingProduct);
        setImagePreviewUrls(existingProduct.images || []);
      }
    }
  }, [id, isEditing, getProductById]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct({
      ...product,
      [name]:
        name === "price" || name === "originalPrice" ? Number(value) : value,
    });
  };

  const handleArrayChange = (e, field) => {
    const values = e.target.value.split(",").map((item) => item.trim());
    setProduct({ ...product, [field]: values });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Simple validation
    if (!product.name || !product.category || product.price <= 0) {
      alert("Harap isi semua kolom yang diperlukan.");
      return;
    }

    // Handle image upload (simulated)
    let finalImages = product.images;
    if (selectedImages.length > 0) {
      // In a real app, you would upload files to a server and get URLs back
      // For demo purposes, we'll create placeholder URLs
      finalImages = selectedImages.map((_, index) => `/images/uploaded-${Date.now()}-${index}.jpg`);
    }

    const productToSave = {
      ...product,
      images: finalImages,
    };

    if (isEditing) {
      updateProduct(productToSave);
    } else {
      addProduct(productToSave);
    }
    navigate("/admin/products");
  };

  const FormInput = ({ label, name, value, onChange, type = "text", required = false }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
      />
    </div>
  );

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        {isEditing ? "Edit Produk" : "Tambah Produk Baru"}
      </h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormInput
            label="Nama Produk"
            name="name"
            value={product.name}
            onChange={handleChange}
            required
          />
          <FormInput
            label="Kategori"
            name="category"
            value={product.category}
            onChange={handleChange}
            required
          />
          <FormInput
            label="Harga"
            name="price"
            type="number"
            value={product.price}
            onChange={handleChange}
            required
          />
          <FormInput
            label="Harga Asli (Opsional)"
            name="originalPrice"
            type="number"
            value={product.originalPrice || ""}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Deskripsi
          </label>
          <textarea
            name="description"
            value={product.description}
            onChange={handleChange}
            rows={4}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gambar Produk
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {imagePreviewUrls.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              {imagePreviewUrls.map((url, index) => (
                <div key={index} className="relative">
                  <img
                    src={url}
                    alt={`Pratinjau ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Note: Color editing is simplified. A more complex UI would be needed for a real app. */}
        <div className="flex items-center space-x-4">
          <button
            type="submit"
            className="bg-black text-white px-6 py-3 rounded-md font-semibold hover:bg-gray-800 transition-colors"
          >
            {isEditing ? "Perbarui Produk" : "Simpan Produk"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className="bg-gray-200 text-gray-800 px-6 py-3 rounded-md font-semibold hover:bg-gray-300 transition-colors"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminProductFormPage;
