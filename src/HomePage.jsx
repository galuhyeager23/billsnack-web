import React from "react";
import { Link } from "react-router-dom";
import ProductCard from "./components/ProductCard";
import { useProducts } from "./contexts/ProductContext";

const HomePage = () => {
  const { products } = useProducts();
  const newArrivals = products.slice(0, 4);
  const topSelling = products
    .slice(4, 8)
    .sort((a, b) => b.reviewCount - a.reviewCount);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-white">
        <div className="px-8 sm:px-12 lg:px-16 py-20 lg:py-32 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 text-center md:text-left">
            <h1 className="text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              TEMUKAN SNACK <br /> YANG COCOK <br /> DENGAN SELERA ANDA
            </h1>
            <div className="mt-8 flex justify-center md:justify-start space-x-8">
              <div>
                <p className="text-3xl font-bold">200+</p>
                <p className="text-gray-600 text-sm">Merek</p>
              </div>
              <div>
                <p className="text-3xl font-bold">2,000+</p>
                <p className="text-gray-600 text-sm">Produk</p>
              </div>
              <div>
                <p className="text-3xl font-bold">30,000+</p>
                <p className="text-gray-600 text-sm">Pelanggan</p>
              </div>
            </div>
            <Link
              to="/shop"
              className="mt-10 inline-block bg-black text-white font-semibold py-4 px-10 rounded-full text-lg hover:bg-gray-800 transition duration-300"
            >
              Belanja Sekarang
            </Link>
          </div>
          <div className="md:w-1/2 mt-12 md:mt-0 flex justify-center">
            {/* Placeholder for hero image */}
            <div className="w-96 h-96 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
              <img
                src="https://via.placeholder.com/400x400?text=Hero+Image"
                alt="Hero"
                className="w-full h-full object-cover"
              />
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
                to="/shop"
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
                to="/shop"
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
                to="/shop"
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
                to="/shop"
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
              className="border border-black text-black font-semibold py-3 px-8 rounded-full text-lg hover:bg-black hover:text-white transition duration-300"
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
              className="border border-black text-black font-semibold py-3 px-8 rounded-full text-lg hover:bg-black hover:text-white transition duration-300"
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
