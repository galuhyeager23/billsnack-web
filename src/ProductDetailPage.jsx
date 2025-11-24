import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useProducts } from "./contexts/ProductContext";
import { useCart } from "./contexts/CartContext";
import { useAuth } from "./contexts/AuthContext";
import StarRating from "./components/StarRating";
import { formatPrice } from "./utils/format";
import ProductCard from "./components/ProductCard";

const ChevronRightIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const ProductDetailPage = () => {
  const { id } = useParams();
  const { getProductById, products } = useProducts();
  const { addToCart } = useCart();
  const { user, token } = useAuth();

  const product = getProductById(Number(id));

  const shopName = product && (product.sellerName || product.storeName || product.shopName || product.seller || 'BillSnack Store');

  // selectedImage will store a URL string (normalize objects -> url)
  const normalizeImg = (img) => (typeof img === 'string' ? img : (img && (img.thumb || img.original)) || '');
  const [selectedImage, setSelectedImage] = useState(product ? normalizeImg(product.images[0]) : "");
  const [quantity, setQuantity] = useState(1);
  const [btnHover, setBtnHover] = useState(false);
  const [outOfStock, setOutOfStock] = useState(false);
  const [activeTab, setActiveTab] = useState('description');

  useEffect(() => {
    if (product) {
      setSelectedImage(normalizeImg(product.images[0]));
      setQuantity(1);
      setOutOfStock(!product.inStock || product.stock === 0);
      window.scrollTo(0, 0);
    }
  }, [product]);


  const handleAddToCart = () => {
    if (quantity > product.stock) {
      alert(`Maaf, stok hanya tersedia ${product.stock} unit. Tidak bisa menambahkan lebih dari itu.`);
      return;
    }
    addToCart(product, quantity);
    alert(`${quantity} x ${product.name} ditambahkan ke keranjang!`);
  };

  // relatedProducts computed below after we ensure product exists
  const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : 'http://localhost:4000');
  const [reviews, setReviews] = useState([]);
  const [canReview, setCanReview] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    // fetch reviews and can-review status; guard when product is not set yet
    if (!product) return;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/reviews/product/${product.id}`);
        if (res.ok) {
          const data = await res.json();
          setReviews(data);
        }
      } catch (e) {
        console.error('Failed to fetch reviews', e);
      }
    })();

    // check if user can review (if logged in)
    if (user && token) {
      (async () => {
        try {
          const res = await fetch(`${API_BASE}/api/reviews/can-review?productId=${product.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const d = await res.json();
            setCanReview(!!d.canReview);
          }
        } catch (e) {
          console.error('can-review check failed', e);
        }
      })();
    } else {
      setCanReview(false);
    }
  }, [product, user, token, API_BASE]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user || !token) {
      alert('Silakan login terlebih dahulu untuk mengirim ulasan.');
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await fetch(`${API_BASE}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: product.id, rating: Number(newRating), comment: newComment }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Gagal mengirim ulasan');
      }
      const data = await res.json();
      // refetch reviews
      const revRes = await fetch(`${API_BASE}/api/reviews/product/${product.id}`);
      if (revRes.ok) setReviews(await revRes.json());
      // update local product rating (best-effort)
      if (data && typeof data.rating !== 'undefined') {
        product.rating = data.rating;
        product.reviewCount = data.reviewCount;
      }
      setNewComment('');
      setNewRating(5);
      setCanReview(false);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Gagal mengirim ulasan');
    } finally {
      setSubmittingReview(false);
    }
  };

  

  if (!product) {
    return <div className="text-center py-20">Produk tidak ditemukan</div>;
  }

  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const discountPct = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : null;

  return (
    <div className="bg-surface dark:bg-[rgb(var(--bg))] relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div className="absolute top-20 left-10 w-32 h-32 bg-yellow-400 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-yellow-400 rounded-full blur-2xl"></div>
        <div className="absolute bottom-40 left-1/3 w-20 h-20 bg-yellow-400 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-16 h-16 bg-yellow-400 rounded-full blur-lg"></div>
      </div>

      <div className="px-8 sm:px-12 lg:px-16 py-12 max-w-7xl mx-auto relative">
        <nav className="flex items-center text-sm text-gray-500 dark:text-muted mb-8">
          <Link to="/" className="hover:accent-text">
            Beranda
          </Link>{" "}
          <ChevronRightIcon />
          <Link to="/shop" className="hover:accent-text">
            Toko
          </Link>{" "}
          <ChevronRightIcon />
          <span className="text-gray-700 dark:text-neutral-200 font-medium">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div>
            <div className="bg-surface-alt dark:bg-[rgb(var(--surface-alt))] rounded-xl shadow-lg overflow-hidden mb-4 flex items-center justify-center border border-base hover:shadow-xl transition-shadow duration-300">
              <div className="w-full max-w-[829px] aspect-[1.08/1] bg-surface-alt dark:bg-[rgb(var(--surface))] flex items-center justify-center overflow-hidden">
                <div className="w-full h-full flex items-center justify-center p-8">
                  <img
                    src={selectedImage}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain object-center transition-transform duration-500 hover:scale-105"
                  />
                </div>
              </div>
            </div>
            
            {/* Trust Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 px-3 py-1 rounded-full text-xs font-medium border border-yellow-200 dark:border-yellow-800">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Gratis Ongkir
              </div>
              <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 px-3 py-1 rounded-full text-xs font-medium border border-yellow-200 dark:border-yellow-800">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Garansi Uang Kembali
              </div>
              <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 px-3 py-1 rounded-full text-xs font-medium border border-yellow-200 dark:border-yellow-800">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Produk Asli
              </div>
            </div>
            
            <div className="flex space-x-4 overflow-x-auto pb-2">
              {product.images.map((img, index) => {
                const url = normalizeImg(img);
                return (
                  <div
                    key={index}
                    className={`w-24 aspect-3/2 rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-300 hover:shadow-md flex-shrink-0 ${
                      selectedImage === url ? "border-[rgb(var(--accent))] shadow-lg scale-105" : "border-base hover:border-gray-300"
                    } bg-surface-alt dark:bg-[rgb(var(--surface-alt))]`}
                    onClick={() => setSelectedImage(url)}
                  >
                    <div className="w-full h-full flex items-center justify-center">
                      <img
                        src={url}
                        alt={`${product.name} view ${index + 1}`}
                        className="max-h-full max-w-full object-contain transition-transform duration-300 hover:scale-110"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Product Details */}
          <div className="bg-gradient-to-br from-surface via-surface-alt to-surface dark:from-[rgb(var(--surface))] dark:via-[rgb(var(--surface-alt))] dark:to-[rgb(var(--surface))] rounded-xl border border-base p-6 lg:p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-neutral-100 mb-2">{product.name}</h1>
            
            {/* Social Proof */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center text-sm text-gray-600 dark:text-muted">
                <StarRating rating={product.rating} />
                <span className="ml-2 font-medium">{product.rating}/5</span>
                <span className="ml-1">({product.reviewCount} ulasan)</span>
              </div>
              <div className="text-sm text-gray-500 dark:text-neutral-400">
                • {product.soldCount || Math.floor(Math.random() * 100) + 50} terjual
              </div>
            </div>
            
            <div className="flex items-center text-sm text-gray-600 dark:text-muted mt-3 mb-4">
              <svg className="w-5 h-5 mr-2 text-[rgb(var(--accent))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              <span className="font-medium">Penjual:</span>
              <span className="ml-1 text-[rgb(var(--accent))] font-semibold">{shopName}</span>
            </div>
            
            <div className="flex items-baseline space-x-3 mb-6">
              <p className="text-3xl font-bold text-gray-900 dark:text-neutral-100">Rp{formatPrice(product.price)}</p>
              {product.originalPrice && (
                <p className="text-xl line-through">Rp{formatPrice(product.originalPrice)}</p>
              )}
              {discountPct && (
                <span className="ml-1 inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-md animate-pulse">-{discountPct}%</span>
              )}
            </div>

            <div className="bg-yellow-50/50 dark:bg-yellow-900/10 rounded-lg p-4 mb-6 border border-yellow-200 dark:border-yellow-800">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-300 mb-1">
                    <span className="font-semibold text-yellow-600 dark:text-yellow-400">Ketersediaan Stok:</span>
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">{product.stock} unit</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-300 mb-1">
                    <span className="font-semibold text-yellow-600 dark:text-yellow-400">Kategori:</span>
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">{product.category || 'Umum'}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-300 mb-1">
                    <span className="font-semibold text-yellow-600 dark:text-yellow-400">Berat:</span>
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">{product.weight || '500g'}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-300 mb-1">
                    <span className="font-semibold text-yellow-600 dark:text-yellow-400">Kondisi:</span>
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">Baru</p>
                </div>
              </div>
            </div>

            <hr className="my-8 border-base" />

            <div className="flex items-center space-x-4 mb-8">
              <div className="flex items-center border border-yellow-200 dark:border-yellow-800 rounded-full px-4 py-3 bg-yellow-50/50 dark:bg-yellow-900/10 shadow-sm">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="text-yellow-600 dark:text-yellow-400 text-xl font-bold w-6 h-6 flex items-center justify-center hover:text-yellow-700 dark:hover:text-yellow-300 transition-colors"
                >
                  -
                </button>
                <span className="w-8 text-center font-semibold text-lg text-gray-900 dark:text-white">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="text-yellow-600 dark:text-yellow-400 text-xl font-bold w-6 h-6 flex items-center justify-center hover:text-yellow-700 dark:hover:text-yellow-300 transition-colors"
                  disabled={quantity >= product.stock}
                >
                  +
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                onMouseEnter={() => setBtnHover(true)}
                onMouseLeave={() => setBtnHover(false)}
                disabled={outOfStock}
                className={`grow bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white py-4 px-8 rounded-full text-lg font-semibold focus:outline-none transition-all duration-300 transform hover:scale-105 hover:shadow-lg shadow-md ${outOfStock ? "opacity-50 cursor-not-allowed bg-gray-400" : ""}`}
                aria-label="Tambah ke Keranjang"
              >
                {outOfStock ? "Stok Habis" : "Tambah ke Keranjang"}
              </button>
            </div>

            <button className="w-full border-2 border-yellow-400 text-yellow-600 dark:text-yellow-400 font-semibold py-3 px-8 rounded-full text-lg hover:bg-yellow-400 hover:text-white transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
              Tambah ke Wishlist ♡
            </button>
          </div>
          {/* Reviews Section */}
          <div className="mt-12 lg:col-span-2">
            <div className="border-b border-base pb-4">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('description')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-300 ${
                    activeTab === 'description'
                      ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded-t-md'
                      : 'border-transparent text-gray-500 hover:text-yellow-600 dark:hover:text-yellow-400 hover:border-yellow-300'
                  }`}
                >
                  Deskripsi
                </button>
                <button
                  onClick={() => setActiveTab('specifications')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-300 ${
                    activeTab === 'specifications'
                      ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded-t-md'
                      : 'border-transparent text-gray-500 hover:text-yellow-600 dark:hover:text-yellow-400 hover:border-yellow-300'
                  }`}
                >
                  Spesifikasi
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-300 ${
                    activeTab === 'reviews'
                      ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded-t-md'
                      : 'border-transparent text-gray-500 hover:text-yellow-600 dark:hover:text-yellow-400 hover:border-yellow-300'
                  }`}
                >
                  Ulasan ({reviews.length})
                </button>
              </nav>
            </div>
            <div className="mt-6">
              {activeTab === 'description' && (
                <div className="prose prose-gray dark:prose-invert max-w-none bg-surface-alt dark:bg-[rgb(var(--surface-alt))] p-6 rounded-lg border border-base shadow-sm">
                  <p className="text-gray-600 dark:text-muted leading-relaxed">{product.description}</p>
                </div>
              )}
              {activeTab === 'specifications' && (
                <div className="bg-surface-alt dark:bg-[rgb(var(--surface-alt))] p-6 rounded-lg border border-base shadow-sm">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Spesifikasi Produk</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-200 dark:border-neutral-600">
                        <span className="text-gray-600 dark:text-muted">Nama Produk</span>
                        <span className="font-medium text-gray-900 dark:text-white">{product.name}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200 dark:border-neutral-600">
                        <span className="text-gray-600 dark:text-muted">Kategori</span>
                        <span className="font-medium text-gray-900 dark:text-white">{product.category || 'Umum'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200 dark:border-neutral-600">
                        <span className="text-gray-600 dark:text-muted">Berat</span>
                        <span className="font-medium text-gray-900 dark:text-white">{product.weight || '500g'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200 dark:border-neutral-600">
                        <span className="text-gray-600 dark:text-muted">Stok</span>
                        <span className="font-medium text-gray-900 dark:text-white">{product.stock} unit</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-200 dark:border-neutral-600">
                        <span className="text-gray-600 dark:text-muted">Kondisi</span>
                        <span className="font-medium text-green-600 dark:text-green-400">Baru</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200 dark:border-neutral-600">
                        <span className="text-gray-600 dark:text-muted">Pengiriman</span>
                        <span className="font-medium text-gray-900 dark:text-white">Gratis Ongkir</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200 dark:border-neutral-600">
                        <span className="text-gray-600 dark:text-muted">Garansi</span>
                        <span className="font-medium text-gray-900 dark:text-white">7 hari</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200 dark:border-neutral-600">
                        <span className="text-gray-600 dark:text-muted">Penjual</span>
                        <span className="font-medium text-[rgb(var(--accent))]">{shopName}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'reviews' && (
                <>
                  {reviews.length === 0 ? (
                    <div className="text-center py-12 bg-surface-alt dark:bg-[rgb(var(--surface-alt))] rounded-lg border border-base">
                      <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p className="text-gray-500 dark:text-muted text-lg">Belum ada ulasan untuk produk ini.</p>
                      <p className="text-sm text-gray-400 mt-2">Jadilah yang pertama memberikan ulasan!</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {reviews.map((r) => (
                        <div key={r.id || `${r.userId}-${r.created_at}` } className="p-6 border border-base rounded-xl bg-gradient-to-r from-surface-alt to-surface dark:from-[rgb(var(--surface-alt))] dark:to-[rgb(var(--surface))] shadow-md hover:shadow-lg transition-shadow duration-300">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-[rgb(var(--accent))] to-[rgb(var(--accent-hover))] rounded-full flex items-center justify-center text-white font-bold">
                                {(r.user_name || r.userId || 'P').charAt(0).toUpperCase()}
                              </div>
                              <strong className="text-gray-900 dark:text-neutral-100">{r.user_name || r.userId || 'Pelanggan'}</strong>
                            </div>
                            <StarRating rating={r.rating} />
                          </div>
                          {r.comment && <p className="mt-2 text-gray-700 dark:text-neutral-300 leading-relaxed">{r.comment}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Review Form - only when allowed */}
                  {canReview ? (
                    <form onSubmit={handleSubmitReview} className="mt-8 space-y-4 bg-gradient-to-r from-surface-alt to-surface dark:from-[rgb(var(--surface-alt))] dark:to-[rgb(var(--surface))] p-6 rounded-xl border border-base shadow-md">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 mb-4">Tulis Ulasan Anda</h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">Rating</label>
                        <select
                          value={newRating}
                          onChange={(e) => setNewRating(Number(e.target.value))}
                          className="mt-1 rounded-lg border border-base bg-white dark:bg-[rgb(var(--surface))] px-4 py-2 focus:ring-2 focus:ring-[rgb(var(--accent))] focus:border-transparent transition-all duration-300"
                        >
                          {[5,4,3,2,1].map((v) => (
                            <option key={v} value={v}>{v} bintang</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">Ulasan</label>
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-base bg-white dark:bg-[rgb(var(--surface))] px-4 py-2 focus:ring-2 focus:ring-[rgb(var(--accent))] focus:border-transparent transition-all duration-300"
                          rows={4}
                          placeholder="Tulis pengalaman Anda menggunakan produk ini..."
                        />
                      </div>
                      <div>
                        <button
                          type="submit"
                          disabled={submittingReview}
                          className="inline-flex items-center px-6 py-3 btn-primary rounded-lg font-semibold disabled:opacity-50 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                        >
                          {submittingReview ? 'Mengirim...' : 'Kirim Ulasan'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="text-center py-8 bg-surface-alt dark:bg-[rgb(var(--surface-alt))] rounded-lg border border-base mt-6">
                      <p className="text-sm text-gray-500 dark:text-muted">
                        {user ? 'Anda belum dapat mengulas produk ini (mungkin belum membeli atau sudah mengulas).' : 'Silakan login setelah membeli untuk mengirim ulasan.'}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
        <div className="bg-gradient-to-br from-surface-alt via-surface to-surface-alt dark:from-[rgb(var(--surface-alt))] dark:via-[rgb(var(--surface))] dark:to-[rgb(var(--surface-alt))] py-16 mt-12 rounded-xl border border-base shadow-lg">
          <div className="px-8 sm:px-12 lg:px-16">
            <h2 className="text-4xl font-bold text-center mb-10 dark:text-neutral-100 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-neutral-100 dark:to-neutral-300 bg-clip-text text-transparent">
              Anda Mungkin Juga Suka
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts.map((p, index) => (
                <div key={p.id} className="transform transition-all duration-300 hover:scale-105 hover:shadow-xl" style={{ animationDelay: `${index * 100}ms` }}>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
