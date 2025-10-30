import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useProducts } from "./contexts/ProductContext";
import { useCart } from "./contexts/CartContext";
import StarRating from "./components/StarRating";
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

  const product = getProductById(Number(id));

  const [selectedImage, setSelectedImage] = useState(product?.images[0] || "");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (product) {
      setSelectedImage(product.images[0]);
      setQuantity(1);
      window.scrollTo(0, 0);
    }
  }, [product]);

  if (!product) {
    return <div className="text-center py-20">Produk tidak ditemukan</div>;
  }

  const handleAddToCart = () => {
    addToCart(product, quantity);
    alert(`${quantity} x ${product.name} ditambahkan ke keranjang!`);
  };

  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const reviews = [
    { rating: 5, name: "Alex K.", text: "Produk ini luar biasa! Sangat direkomendasikan." },
    { rating: 5, name: "Sarah M.", text: "Kualitasnya sangat baik dan pengirimannya cepat." },
    { rating: 4, name: "John D.", text: "Produk bagus, sesuai dengan deskripsi." },
    { rating: 5, name: "Emma L.", text: "Pembelian terbaik yang pernah saya lakukan. Worth setiap rupiah!" },
    { rating: 5, name: "Mike T.", text: "Luar biasa! Akan beli lagi." },
    { rating: 4, name: "Lisa R.", text: "Kualitas bagus dan pengiriman cepat." },
  ];

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
            <div className="bg-gray-100 rounded-lg shadow-sm overflow-hidden mb-4">
              <img
                src={selectedImage}
                alt={product.name}
                className="w-full h-[500px] object-cover"
              />
            </div>
            <div className="flex space-x-4">
              {product.images.map((img, index) => (
                <div
                  key={index}
                  className={`w-24 h-24 rounded-md overflow-hidden cursor-pointer border-2 ${
                    selectedImage === img
                      ? "border-black"
                      : "border-gray-200"
                  }`}
                  onClick={() => setSelectedImage(img)}
                >
                  <img
                    src={img}
                    alt={`${product.name} view ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Product Details */}
          <div className="bg-white">
            <h1 className="text-4xl font-bold">{product.name}</h1>
            <div className="flex items-center my-4">
              <StarRating rating={product.rating} />
              <span className="text-gray-500 ml-2">
                {product.reviewCount} Ulasan
              </span>
            </div>
            <div className="flex items-baseline space-x-2 mb-6">
              <p className="text-3xl font-bold text-black">
                Rp{product.price.toFixed(2)}
              </p>
              {product.originalPrice && (
                <p className="text-2xl text-gray-400 line-through">
                  Rp{product.originalPrice.toFixed(2)}
                </p>
              )}
            </div>
            <p className="text-gray-600">{product.description}</p>

            <hr className="my-8" />

            <div className="space-y-4 mb-6">
              <p className="text-sm text-gray-600"><strong>Warna:</strong> Merah, Biru, Hitam, Putih</p>
            </div>

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
                  onClick={() => setQuantity((q) => q + 1)}
                  className="text-gray-500 text-xl font-bold w-6 h-6 flex items-center justify-center"
                >
                  +
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                className="flex-grow bg-black text-white font-semibold py-4 px-8 rounded-full text-lg hover:bg-gray-800 transition duration-300"
              >
                Tambah ke Keranjang
              </button>
            </div>

            <button className="w-full border border-black text-black font-semibold py-3 px-8 rounded-full text-lg hover:bg-black hover:text-white transition duration-300">
              Wishlist ♡
            </button>
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
