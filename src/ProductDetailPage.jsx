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

  const shopName = product && (product.storeName || product.shopName || product.sellerName || product.seller || product.vendor || product.resellerName || (product.reseller && product.reseller.name)) || 'Bilsnack Store';

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

  return (
    <div className="bg-white">
      <div className="px-8 sm:px-12 lg:px-16 py-12">
        <nav className="flex items-center text-sm text-gray-500 mb-8">
          <Link to="/" className="hover:text-gray-700">
            Beranda
          </Link>{" "}
          <ChevronRightIcon />
          <Link to="/shop" className="hover:text-gray-700">
            Toko
          </Link>{" "}
          <ChevronRightIcon />
          <span className="text-gray-700 font-medium">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div>
            <div className="bg-gray-100 rounded-lg shadow-sm overflow-hidden mb-4 flex items-center justify-center">
              <div className="w-full max-w-[829px] aspect-[1.08/1] bg-gray-100 flex items-center justify-center overflow-hidden">
                <div className="w-full h-full flex items-center justify-center p-8 bg-transparent">
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
                      selectedImage === url ? "border-black" : "border-gray-200"
                    }`}
                    onClick={() => setSelectedImage(url)}
                  >
                    <div className="w-full h-full flex items-center justify-center bg-white">
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
          <div className="bg-white">
            <h1 className="text-4xl font-bold">{product.name}</h1>
            <p className="text-sm text-gray-600 mt-2">Penjual: {shopName}</p>
            <div className="flex items-center my-4">
              <StarRating rating={product.rating} />
              <span className="text-gray-500 ml-2">
                {product.reviewCount} Ulasan
              </span>
            </div>
            <div className="flex items-baseline space-x-2 mb-6">
              <p className="text-3xl font-bold text-black">Rp{formatPrice(product.price)}</p>
              {product.originalPrice && (
                <p className="text-2xl text-gray-400 line-through">Rp{formatPrice(product.originalPrice)}</p>
              )}
            </div>

            <p className="text-gray-600 mb-6">
              <span className="font-semibold">Ketersediaan Stok:</span> {product.stock} unit
            </p>

            <p className="text-gray-600 mb-6">
              <span className="font-semibold">Deskripsi:</span> {product.description}
            </p>

            <hr className="my-8" />

            <div className="flex items-center space-x-4 mb-8">
              <div className="flex items-center border rounded-full px-4 py-3">
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
                className={`grow text-white font-semibold py-4 px-8 rounded-full text-lg focus:outline-none transition duration-300 ${outOfStock ? "bg-gray-400 cursor-not-allowed" : ""}`}
                aria-label="Tambah ke Keranjang"
                style={!outOfStock ? { backgroundColor: btnHover ? '#E65A00' : '#FF6B00' } : {}}
              >
                {outOfStock ? "Stok Habis" : "Tambah ke Keranjang"}
              </button>
            </div>

            <button className="w-full border border-black text-black font-semibold py-3 px-8 rounded-full text-lg hover:bg-black hover:text-white transition duration-300">
              Wishlist ♡
            </button>
          </div>
          {/* Reviews Section */}
          <div className="mt-12 lg:col-span-2">
            <h2 className="text-2xl font-bold mb-4">Ulasan ({reviews.length})</h2>
            {reviews.length === 0 ? (
              <p className="text-gray-500">Belum ada ulasan untuk produk ini.</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r.id || `${r.userId}-${r.created_at}` } className="p-4 border rounded-md">
                    <div className="flex items-center justify-between">
                      <strong>{r.user_name || r.userId || 'Pelanggan'}</strong>
                      <StarRating rating={r.rating} />
                    </div>
                    {r.comment && <p className="mt-2 text-gray-700">{r.comment}</p>}
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
                    className="mt-1 rounded-md border px-3 py-2"
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
                    className="mt-1 w-full rounded-md border px-3 py-2"
                    rows={4}
                    placeholder="Tulis pengalaman Anda menggunakan produk ini..."
                  />
                </div>
                <div>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="inline-flex items-center px-6 py-2 bg-orange-600 text-white rounded-md disabled:opacity-50"
                  >
                    {submittingReview ? 'Mengirim...' : 'Kirim Ulasan'}
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-sm text-gray-500 mt-4">
                {user ? 'Anda belum dapat mengulas produk ini (mungkin belum membeli atau sudah mengulas).' : 'Silakan login setelah membeli untuk mengirim ulasan.'}
              </p>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
        <div className="bg-gray-50 py-16">
          <div className="px-8 sm:px-12 lg:px-16">
            <h2 className="text-4xl font-bold text-center mb-10">
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
