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
  const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:4000';
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
    <div className="bg-surface dark:bg-[rgb(var(--bg))]">
      <div className="px-8 sm:px-12 lg:px-16 py-12 max-w-7xl mx-auto">
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
            <div className="bg-surface-alt dark:bg-[rgb(var(--surface-alt))] rounded-lg shadow-sm overflow-hidden mb-4 flex items-center justify-center border border-base">
              <div className="w-full max-w-[829px] aspect-[1.08/1] bg-surface-alt dark:bg-[rgb(var(--surface))] flex items-center justify-center overflow-hidden">
                <div className="w-full h-full flex items-center justify-center p-8">
                  <img
                    src={selectedImage}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain object-center"
                  />
                </div>
              </div>
            </div>
            <div className="flex space-x-4">
              {product.images.map((img, index) => {
                const url = normalizeImg(img);
                return (
                  <div
                    key={index}
                    className={`w-24 aspect-3/2 rounded-md overflow-hidden cursor-pointer border-2 ${
                      selectedImage === url ? "border-[rgb(var(--accent))]" : "border-base"
                    } bg-surface-alt dark:bg-[rgb(var(--surface-alt))]`}
                    onClick={() => setSelectedImage(url)}
                  >
                    <div className="w-full h-full flex items-center justify-center">
                      <img
                        src={url}
                        alt={`${product.name} view ${index + 1}`}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Product Details */}
          <div className="bg-surface dark:bg-[rgb(var(--surface))] rounded-xl border border-base p-6 lg:p-8 shadow-sm">
            <h1 className="text-4xl font-bold">{product.name}</h1>
            <div className="flex items-center text-sm text-gray-600 dark:text-muted mt-3 mb-4">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="font-medium">Penjual:</span>
              <span className="ml-1">{shopName}</span>
            </div>
            <div className="flex items-center my-4">
              <StarRating rating={product.rating} />
              <span className="text-gray-500 dark:text-muted ml-2">
                {product.reviewCount} Ulasan
              </span>
            </div>
            <div className="flex items-baseline space-x-3 mb-6">
              <p className="text-3xl font-bold text-gray-900 dark:text-neutral-100">Rp{formatPrice(product.price)}</p>
              {product.originalPrice && (
                <p className="text-xl text-gray-400 dark:text-gray-500 line-through">Rp{formatPrice(product.originalPrice)}</p>
              )}
              {discountPct && (
                <span className="ml-1 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[rgba(var(--accent)/0.18)] text-[rgb(var(--accent-hover))] dark:bg-[rgba(var(--accent)/0.25)] dark:text-[rgb(var(--accent))]">-{discountPct}%</span>
              )}
            </div>

            <p className="text-gray-600 dark:text-muted mb-3">
              <span className="font-semibold">Ketersediaan Stok:</span> {product.stock} unit
            </p>
            <p className="text-gray-600 dark:text-muted mb-3">
              <span className="font-semibold">Kategori:</span> {product.category || 'Umum'}
            </p>
            <p className="text-gray-600 dark:text-muted mb-6">
              <span className="font-semibold">Deskripsi:</span> {product.description}
            </p>

            <hr className="my-8" />

            <div className="flex items-center space-x-4 mb-8">
              <div className="flex items-center border border-base rounded-full px-4 py-3 bg-surface-alt dark:bg-[rgb(var(--surface-alt))]">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="text-gray-500 text-xl font-bold w-6 h-6 flex items-center justify-center"
                >
                  -
                </button>
                <span className="w-8 text-center font-semibold text-lg">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="text-gray-500 text-xl font-bold w-6 h-6 flex items-center justify-center"
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
                className={`grow btn-primary py-4 px-8 rounded-full text-lg focus:outline-none transition duration-300 ${outOfStock ? "opacity-50 cursor-not-allowed" : ""}`}
                aria-label="Tambah ke Keranjang"
                style={outOfStock ? {} : { filter: btnHover ? 'brightness(1.07)' : 'brightness(1.0)' }}
              >
                {outOfStock ? "Stok Habis" : "Tambah ke Keranjang"}
              </button>
            </div>

            <button className="w-full border border-base text-gray-800 dark:text-neutral-200 font-semibold py-3 px-8 rounded-full text-lg hover:accent-bg hover:text-[rgb(var(--accent-fg))] transition duration-300">
              Wishlist ♡
            </button>
          </div>
          {/* Reviews Section */}
          <div className="mt-12 lg:col-span-2">
            <h2 className="text-2xl font-bold mb-4 dark:text-neutral-100">Ulasan ({reviews.length})</h2>
            {reviews.length === 0 ? (
              <p className="text-gray-500 dark:text-muted">Belum ada ulasan untuk produk ini.</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r.id || `${r.userId}-${r.created_at}` } className="p-4 border border-base rounded-md bg-surface-alt dark:bg-[rgb(var(--surface-alt))]">
                    <div className="flex items-center justify-between">
                      <strong>{r.user_name || r.userId || 'Pelanggan'}</strong>
                      <StarRating rating={r.rating} />
                    </div>
                    {r.comment && <p className="mt-2 text-gray-700 dark:text-neutral-300">{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* Review Form - only when allowed */}
            {canReview ? (
              <form onSubmit={handleSubmitReview} className="mt-6 space-y-3">
                <div>
                  <label className="block text-sm font-medium">Rating</label>
                  <select
                    value={newRating}
                    onChange={(e) => setNewRating(Number(e.target.value))}
                    className="mt-1 rounded-md border border-base bg-surface-alt dark:bg-[rgb(var(--surface-alt))] px-3 py-2"
                  >
                    {[5,4,3,2,1].map((v) => (
                      <option key={v} value={v}>{v} bintang</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Ulasan</label>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="mt-1 w-full rounded-md border border-base bg-surface-alt dark:bg-[rgb(var(--surface-alt))] px-3 py-2"
                    rows={4}
                    placeholder="Tulis pengalaman Anda menggunakan produk ini..."
                  />
                </div>
                <div>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="inline-flex items-center px-6 py-2 btn-primary rounded-md disabled:opacity-50"
                  >
                    {submittingReview ? 'Mengirim...' : 'Kirim Ulasan'}
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-sm text-gray-500 dark:text-muted mt-4">
                {user ? 'Anda belum dapat mengulas produk ini (mungkin belum membeli atau sudah mengulas).' : 'Silakan login setelah membeli untuk mengirim ulasan.'}
              </p>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
        <div className="bg-surface-alt dark:bg-[rgb(var(--surface-alt))] py-16 mt-12 rounded-xl border border-base">
          <div className="px-8 sm:px-12 lg:px-16">
            <h2 className="text-4xl font-bold text-center mb-10 dark:text-neutral-100">
              Anda Mungkin Juga Suka
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
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
