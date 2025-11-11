import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useProducts } from "../contexts/ProductContext";
import formatPrice from "../utils/format";

const AdminProductFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getProductById, addProduct, updateProduct, uploadImages } = useProducts();
  const isEditing = Boolean(id);

  const [product, setProduct] = useState({
    name: "",
    category: "",
    price: "",
    images: [],
    description: "",
  });

  // allow admin to paste or type image URLs (one per line or comma separated)
  const [imagesText, setImagesText] = useState("");

  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedMeta, setUploadedMeta] = useState([]);
  const [uploadMessage, setUploadMessage] = useState('');

  const normalizeImg = (img) => (typeof img === 'string' ? img : (img && (img.thumb || img.original)) || '');

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files || files.length === 0) return;

    // set local previews immediately
    const urls = files.map((file) => URL.createObjectURL(file));
    setImagePreviewUrls(urls);
    setSelectedImages(files);

    // require admin token to upload
    const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (!adminToken) {
      setUploadMessage('Anda perlu login sebagai admin untuk mengunggah gambar.');
      return;
    }

    // upload immediately so admin can see uploaded thumbs/urls before saving
    try {
      setUploading(true);
      setUploadMessage('Mengunggah gambar...');
      const uploaded = await uploadImages(files);
      if (uploaded && uploaded.length > 0) {
        setUploadedMeta(uploaded);
        // normalize and show uploaded thumbs (prefer thumb)
        const norm = uploaded.map((i) => (typeof i === 'string' ? i : (i.thumb || i.original || ''))).filter(Boolean);
        setImagePreviewUrls(norm);
        setUploadMessage(`Terunggah ${uploaded.length} gambar`);
      } else {
        setUploadMessage('Unggah selesai, namun tidak ada file yang dikembalikan dari server.');
      }
    } catch (err) {
      console.error('Upload error (client)', err);
      setUploadMessage('Gagal mengunggah gambar. Periksa ukuran file (max 5MB) dan coba lagi.');
      setUploadedMeta([]);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newUrls = imagePreviewUrls.filter((_, i) => i !== index);
    const newMeta = uploadedMeta.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    setImagePreviewUrls(newUrls);
    setUploadedMeta(newMeta);
  };

  useEffect(() => {
    if (isEditing && id) {
      const existingProduct = getProductById(Number(id));
      if (existingProduct) {
        setProduct(existingProduct);
        // existingProduct.images may be an array of strings or objects { original, thumb }
        const previews = Array.isArray(existingProduct.images)
          ? existingProduct.images.map((i) => normalizeImg(i)).filter(Boolean)
          : [];
        setImagePreviewUrls(previews);
      }
    }
  }, [id, isEditing, getProductById]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // preserve spaces and multi-word values; keep raw input for all fields
    setProduct({
      ...product,
      [name]: value,
    });
  };

  const parseCurrencyToNumber = (val) => {
    if (val === null || typeof val === 'undefined') return null;
    const raw = String(val).replace(/[^0-9\-,.]/g, '').trim();
    let num = Number(raw.replace(/\./g, '').replace(/,/g, '.'));
    if (Number.isNaN(num)) {
      num = Number(String(val).replace(/[^0-9]/g, '')) || 0;
    }
    return num;
  };

  const handlePriceChange = (e) => {
    const raw = e.target.value || '';
    const num = parseCurrencyToNumber(raw);
    // store numeric value (or empty string) so later we can coerce when saving
    setProduct(prev => ({ ...prev, price: (raw === '' ? '' : num) }));
  };

  

  const handleImagesTextChange = (e) => {
    setImagesText(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Simple validation: require name, category, and a valid numeric price
    const priceValid = product.price !== '' && product.price !== null && !Number.isNaN(Number(product.price));
    if (!product.name || !product.category || !priceValid) {
      alert("Harap isi semua kolom yang diperlukan.");
      return;
    }

  // Upload selected images (if any) then create/update via ProductContext
  let finalImages = product.images || [];
    try {
      if (uploadedMeta && uploadedMeta.length > 0) {
        // prefer already-uploaded meta (uploaded on select)
        finalImages = uploadedMeta;
      } else if (selectedImages.length > 0) {
        // upload via ProductContext.uploadImages (returns array of { original, thumb })
        let uploaded;
        try {
          uploaded = await uploadImages(selectedImages);
        } catch (upErr) {
          console.error('Image upload failed', upErr);
          alert('Gagal mengunggah gambar. Silakan coba lagi.');
          return;
        }
        console.debug('Uploaded images response:', uploaded);
        if (uploaded && uploaded.length > 0) {
          finalImages = uploaded; // store objects so frontend can use thumb/original
          setUploadedMeta(uploaded);
        }
      } else if (imagesText && imagesText.trim().length > 0) {
        // parse typed image URLs
        const parts = imagesText.split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
        finalImages = parts.map((url) => ({ original: url, thumb: url }));
      }
  const productToSave = { ...product, images: finalImages };
      console.debug('Product to save:', productToSave);
      if (isEditing) {
        await updateProduct(productToSave);
      } else {
        await addProduct(productToSave);
      }
      navigate('/admin/products');
    } catch (err) {
      console.error('Failed to save product', err);
      alert('Gagal menyimpan produk. Periksa konsol untuk detail.');
    }
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
            <div>
              <label className="block text-sm font-medium text-gray-700">Nama Produk</label>
              <textarea
                name="name"
                value={product.name}
                onChange={handleChange}
                required
                rows={2}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
                placeholder="Masukkan nama produk (boleh mengandung spasi dan multiple kata)"
              />
            </div>
            {/* Category select: limit to snack-relevant categories to avoid free-text issues */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Kategori</label>
              <select
                name="category"
                value={product.category}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
              >
                <option value="">Pilih kategori...</option>
                <option value="All">All</option>
                <option value="Chips & Crisps">Chips & Crisps</option>
                <option value="Candies & Sweets">Candies & Sweets</option>
                <option value="Cookies">Cookies</option>
                <option value="Nuts & Dried Fruits">Nuts & Dried Fruits</option>
              </select>
            </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Harga</label>
            <input
              type="text"
              name="price"
              value={product.price === '' || product.price === null ? '' : formatPrice(product.price)}
              onChange={handlePriceChange}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
              placeholder="Masukkan harga produk (contoh: 12000 atau 12.000)"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Masukkan nominal tanpa simbol. Tampilan akan diformat ke Rupiah.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Stok</label>
            <textarea
              name="stock"
              value={product.stock || ''}
              onChange={handleChange}
              rows={1}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
              placeholder="Masukkan stok"
            />
          </div>

          {/* Rating and review count are managed from customer checkout events and not editable here */}
          
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
            disabled={!localStorage.getItem('adminToken')}
          />
          {uploading && <p className="text-sm text-gray-500 mt-2">{uploadMessage || 'Mengunggah...'}</p>}
          {!uploading && uploadMessage && <p className="text-sm text-gray-500 mt-2">{uploadMessage}</p>}
          <p className="text-sm text-gray-500 mt-2">Atau ketik/paste URL gambar (satu per baris atau pisah koma):</p>
          <textarea
            value={imagesText}
            onChange={handleImagesTextChange}
            placeholder="https://.../img1.jpg\nhttps://.../img2.jpg"
            className="mt-2 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black text-sm"
            rows={3}
          />
          {imagePreviewUrls.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              {imagePreviewUrls.map((url, index) => (
                <div key={index} className="relative">
                  <div className="w-full aspect-[1.08/1] bg-gray-100 rounded-lg border overflow-hidden flex items-center justify-center">
                    <div className="w-full h-full flex items-center justify-center p-4">
                      <img
                        src={url}
                        alt={`Pratinjau ${index + 1}`}
                        className="max-h-full max-w-full object-contain object-center"
                      />
                    </div>
                  </div>
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
            className="bg-amber-500 text-white px-6 py-3 rounded-md font-semibold hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-300 transition-colors"
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
