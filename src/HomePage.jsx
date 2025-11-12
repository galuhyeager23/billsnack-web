import React from "react";
import { Link } from "react-router-dom";
import ProductCard from "./components/ProductCard";
import { useProducts } from "./contexts/ProductContext";
import logo from "./assets/bilsnack.jpg";

const HomePage = () => {
  const { products, topSelling: ctxTopSelling } = useProducts();
  const newArrivals = (products || []).slice(0, 4);
  // Prefer server-provided topSelling list when available, otherwise fall back to local calculation
  const topSelling = (Array.isArray(ctxTopSelling) && ctxTopSelling.length > 0)
    ? ctxTopSelling.slice(0, 4)
    : (products || []).slice().sort((a, b) => (Number(b.reviewCount || 0) - Number(a.reviewCount || 0))).slice(0, 4);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-yellow-50 via-white to-yellow-50">
        <div className="px-6 sm:px-12 lg:px-16 py-20 lg:py-32 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="text-center md:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-gray-900">
              Temukan cemilan favoritmu.
            </h1>
            <p className="mt-4 text-gray-600 text-lg max-w-xl mx-auto md:mx-0">
              Jutaan pilihan snack dari berbagai merek. Cepat, mudah, dan selalu ada promo menarik setiap hari.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4 items-center md:items-start">
              <div className="w-full sm:w-auto flex-1">
                <div className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm border border-gray-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input className="ml-3 w-full bg-transparent focus:outline-none" placeholder="Cari snack, merk, atau kategori..." />
                </div>
              </div>

              <Link to="/shop" className="inline-flex items-center justify-center bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-6 rounded-full shadow">
                Belanja Sekarang
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-6 justify-center md:justify-start">
              <div className="text-center">
                <p className="text-2xl font-bold">200+</p>
                <p className="text-gray-600 text-sm">Merek</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">2,000+</p>
                <p className="text-gray-600 text-sm">Produk</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">30,000+</p>
                <p className="text-gray-600 text-sm">Pelanggan</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="w-80 h-80 bg-white rounded-2xl shadow-xl flex items-center justify-center overflow-hidden">
              <img src={logo} alt="Billsnack" className="w-64 h-64 object-contain" />
            </div>
          </div>
        </div>
      </section>

      {/* Category Navigation */}
      <section className="bg-white py-12">
        <div className="px-8 sm:px-12 lg:px-16">
          <h2 className="text-3xl font-bold text-center mb-8">JELAJAHI KATEGORI</h2>
          <div className="flex justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 max-w-5xl">
              {/* All */}
              <Link
                to="/shop"
                className="group"
              >
                <div className="bg-yellow-100 rounded-xl p-6 h-48 flex flex-col items-center justify-center hover:shadow-lg transition-shadow duration-300">
                  <div className="w-20 h-20 mb-3 flex items-center justify-center">
                    <span className="text-4xl">🛍️</span>
                  </div>
                  <h3 className="text-lg font-bold text-center text-gray-800 group-hover:text-black transition-colors">All</h3>
                </div>
              </Link>

              {/* Chips & Crisps */}
              <Link
                to={`/shop?category=${encodeURIComponent('Chips & Crisps')}`}
                className="group"
              >
                <div className="bg-blue-100 rounded-xl p-6 h-48 flex flex-col items-center justify-center hover:shadow-lg transition-shadow duration-300">
                  <div className="w-20 h-20 mb-3 flex items-center justify-center">
                    <span className="text-4xl">🥨</span>
                  </div>
                  <h3 className="text-lg font-bold text-center text-gray-800 group-hover:text-black transition-colors">Chips & Crisps</h3>
                </div>
              </Link>

              {/* Candies & Sweets */}
              <Link
                to={`/shop?category=${encodeURIComponent('Candies & Sweets')}`}
                className="group"
              >
                <div className="bg-pink-100 rounded-xl p-6 h-48 flex flex-col items-center justify-center hover:shadow-lg transition-shadow duration-300">
                  <div className="w-20 h-20 mb-3 flex items-center justify-center">
                    <span className="text-4xl">🍬</span>
                  </div>
                  <h3 className="text-lg font-bold text-center text-gray-800 group-hover:text-black transition-colors">Candies & Sweets</h3>
                </div>
              </Link>

              {/* Cookies */}
              <Link
                to={`/shop?category=${encodeURIComponent('Cookies')}`}
                className="group"
              >
                <div className="bg-orange-100 rounded-xl p-6 h-48 flex flex-col items-center justify-center hover:shadow-lg transition-shadow duration-300">
                  <div className="w-20 h-20 mb-3 flex items-center justify-center">
                    <span className="text-4xl">🍪</span>
                  </div>
                  <h3 className="text-lg font-bold text-center text-gray-800 group-hover:text-black transition-colors">Cookies</h3>
                </div>
              </Link>

              {/* Nuts & Dried Fruits */}
              <Link
                to={`/shop?category=${encodeURIComponent('Nuts & Dried Fruits')}`}
                className="group"
              >
                <div className="bg-purple-100 rounded-xl p-6 h-48 flex flex-col items-center justify-center hover:shadow-lg transition-shadow duration-300">
                  <div className="w-20 h-20 mb-3 flex items-center justify-center">
                    <span className="text-4xl">🥜</span>
                  </div>
                  <h3 className="text-lg font-bold text-center text-gray-800 group-hover:text-black transition-colors">Nuts & Dried Fruits</h3>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="bg-white py-20">
        <div className="px-8 sm:px-12 lg:px-16">
          <h2 className="text-4xl font-bold text-center mb-12">PRODUK TERBARU</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              to="/shop"
              className="inline-flex items-center justify-center bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold py-3 px-8 rounded-full shadow transition transform hover:-translate-y-0.5 active:scale-95"
            >
              Lihat Semua
            </Link>
          </div>
        </div>
      </section>

      {/* Top Selling */}
      <section className="bg-white py-20">
        <div className="px-8 sm:px-12 lg:px-16">
          <h2 className="text-4xl font-bold text-center mb-12">TERLARIS</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {topSelling.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              to="/shop"
              className="inline-flex items-center justify-center bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold py-3 px-8 rounded-full shadow transition transform hover:-translate-y-0.5 active:scale-95"
            >
              Lihat Semua
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
