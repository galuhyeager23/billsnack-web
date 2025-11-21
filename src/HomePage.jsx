import React from "react";
import { Link } from "react-router-dom";
import ProductCard from "./components/ProductCard";
import { useProducts } from "./contexts/ProductContext";
import logo from "./assets/bilsnack.png";

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
      <section className="relative">
        {/* Subtle neutral gradient backdrop replacing bright amber */}
        <div className="absolute inset-0 bg-gradient-to-br from-[rgb(var(--surface-alt))] via-[rgb(var(--surface))] to-[rgb(var(--bg))] dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900" />
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_25%_30%,rgba(var(--accent)/0.18),transparent_65%),radial-gradient(circle_at_80%_70%,rgba(var(--accent)/0.12),transparent_70%)]" />
        <div className="relative px-6 sm:px-12 lg:px-16 py-20 lg:py-28 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-14 items-center">
          <div className="text-center md:text-left">
            <span className="inline-block mb-4 px-3 py-1 rounded-full accent-bg text-xs font-semibold tracking-wide shadow-sm">PROMO HARI INI</span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-gray-900 dark:text-white">
              Cemilan Enak, <span className="text-gradient">Mood Meningkat</span>.
            </h1>
            <p className="mt-5 text-gray-600 dark:text-gray-300 text-lg max-w-xl mx-auto md:mx-0">
              Temukan snack terbaik dari ratusan merek. Pengiriman cepat, harga bersahabat, dan selalu ada kejutan setiap minggu.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4 items-center md:items-start">
              <Link to="/shop" className="btn-primary w-full sm:w-auto justify-center">
                Belanja Sekarang
              </Link>
              <Link to="/register" className="btn-secondary w-full sm:w-auto justify-center">
                Daftar Gratis
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-6 max-w-md mx-auto md:mx-0">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">200+</p>
                <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">Merek</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">2,000+</p>
                <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">Produk</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">30,000+</p>
                <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">Pelanggan</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative w-80 h-80">
              <div className="absolute -inset-2 bg-[radial-gradient(circle_at_40%_35%,rgba(var(--accent)/0.25),transparent_70%)] rounded-3xl blur-xl" />
              <div className="relative w-full h-full bg-surface dark:bg-neutral-800 rounded-3xl shadow-lg flex items-center justify-center overflow-hidden border border-base">
                <img src={logo} alt="Billsnack" className="w-64 h-64 object-contain select-none" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Navigation */}
      <section className="bg-surface dark:bg-neutral-900 py-12">
        <div className="px-8 sm:px-12 lg:px-16">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">JELAJAHI KATEGORI</h2>
          <div className="flex justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 max-w-5xl">
              {/* All */}
              <Link
                to="/shop"
                className="group"
              >
                <div className="bg-surface-alt rounded-xl p-6 h-48 flex flex-col items-center justify-center hover:shadow-lg transition border border-base">
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
                <div className="bg-surface-alt rounded-xl p-6 h-48 flex flex-col items-center justify-center hover:shadow-lg transition border border-base">
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
                <div className="bg-surface-alt rounded-xl p-6 h-48 flex flex-col items-center justify-center hover:shadow-lg transition border border-base">
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
                <div className="bg-surface-alt rounded-xl p-6 h-48 flex flex-col items-center justify-center hover:shadow-lg transition border border-base">
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
                <div className="bg-surface-alt rounded-xl p-6 h-48 flex flex-col items-center justify-center hover:shadow-lg transition border border-base">
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
      <section className="bg-surface py-20">
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
              className="inline-flex items-center justify-center btn-primary rounded-full shadow-sm"
            >
              Lihat Semua
            </Link>
          </div>
        </div>
      </section>

      {/* Top Selling */}
      <section className="bg-surface py-20">
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
              className="inline-flex items-center justify-center btn-primary rounded-full shadow-sm"
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
