// Fix: Populating ShopPage with product grid and filtering, as the file was empty.
import React, { useState, useMemo } from "react";
import { useLocation, Link } from "react-router-dom";
import { useProducts } from "./contexts/ProductContext";
import ProductCard from "./components/ProductCard";
import SkeletonCard from "./components/SkeletonCard";

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

const ShopPage = () => {
  const { products, loading } = useProducts();
  const location = useLocation();
  const qs = new URLSearchParams(location.search);
  const category = qs.get('category') || '';
  const search = qs.get('search') || '';
  const [sort, setSort] = useState('');
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [selectedRating, setSelectedRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const categories = useMemo(() => {
    const set = new Set();
    products.forEach(p => { if (p.category) set.add(String(p.category)); });
    return Array.from(set).sort();
  }, [products]);

  const filtered = useMemo(() => {
    let base = category ? products.filter(p => String(p.category || '').toLowerCase() === String(category).toLowerCase()) : products;
    if (search) {
      base = base.filter(p => 
        String(p.name || '').toLowerCase().includes(search.toLowerCase()) ||
        String(p.category || '').toLowerCase().includes(search.toLowerCase()) ||
        String(p.brand || '').toLowerCase().includes(search.toLowerCase())
      );
    }
    // Price filter
    base = base.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
    // Rating filter
    if (selectedRating > 0) {
      base = base.filter(p => (p.rating || 0) >= selectedRating);
    }
    if (sort === 'price-asc') base = [...base].sort((a,b) => Number(a.price) - Number(b.price));
    if (sort === 'price-desc') base = [...base].sort((a,b) => Number(b.price) - Number(a.price));
    if (sort === 'rating-desc') base = [...base].sort((a,b) => Number(b.rating||0) - Number(a.rating||0));
    return base;
  }, [products, category, search, sort, priceRange, selectedRating]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center text-sm text-gray-500 dark:text-neutral-400 mb-6">
          <Link to="/" className="hover:text-amber-600 dark:hover:text-amber-400">
            Beranda
          </Link>{" "}
          <ChevronRightIcon />
          <span className="text-gray-700 dark:text-neutral-200 font-medium">Toko</span>
        </nav>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Koleksi Snack
          </h1>
          <p className="mt-3 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Jelajahi ribuan pilihan snack favorit dengan filter kategori dan urutkan sesuai kebutuhanmu.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className={`lg:w-64 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-gray-200 dark:border-neutral-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filter</h3>
              
              {/* Categories */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Kategori</h4>
                <div className="space-y-2">
                  <Link 
                    to="/shop" 
                    className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                      !category 
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    Semua Kategori
                  </Link>
                  {categories.map(cat => (
                    <Link 
                      key={cat} 
                      to={`/shop?category=${encodeURIComponent(cat)}`} 
                      className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                        category === cat 
                          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200' 
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700'
                      }`}
                    >
                      {cat}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Rentang Harga</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                    <span>Rp{priceRange[0].toLocaleString()}</span>
                    <span>Rp{priceRange[1].toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1000000"
                    step="10000"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className="w-full h-2 bg-gray-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Rating Filter */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Rating Minimal</h4>
                <div className="space-y-2">
                  {[0, 3, 4, 4.5].map(rating => (
                    <button
                      key={rating}
                      onClick={() => setSelectedRating(rating)}
                      className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedRating === rating 
                          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200' 
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700'
                      }`}
                    >
                      {rating === 0 ? 'Semua Rating' : `${rating}+ Bintang`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {(category || search || priceRange[1] < 1000000 || selectedRating > 0) && (
                <button
                  onClick={() => {
                    setPriceRange([0, 1000000]);
                    setSelectedRating(0);
                    window.location.href = '/shop';
                  }}
                  className="w-full bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-600 transition-colors"
                >
                  Hapus Filter
                </button>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden flex items-center gap-2 bg-white dark:bg-neutral-800 px-4 py-2 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filter
                </button>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {filtered.length} produk ditemukan
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <label htmlFor="sort" className="text-sm text-gray-600 dark:text-gray-300">Urutkan:</label>
                <select 
                  id="sort" 
                  value={sort} 
                  onChange={e=>setSort(e.target.value)} 
                  className="text-sm border border-gray-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Default</option>
                  <option value="price-asc">Harga Terendah</option>
                  <option value="price-desc">Harga Tertinggi</option>
                  <option value="rating-desc">Rating Tertinggi</option>
                </select>
              </div>
            </div>

            {/* Results Info */}
            {(category || search) && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                {category && (
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    Menampilkan produk untuk kategori <strong>{category}</strong>
                  </div>
                )}
                {search && (
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    Menampilkan produk yang cocok dengan <strong>"{search}"</strong>
                  </div>
                )}
                <Link 
                  to="/shop" 
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block"
                >
                  Hapus filter
                </Link>
              </div>
            )}

            {/* Products Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({length:12}).map((_,i)=>(<SkeletonCard key={i}/>))}
              </div>
            ) : filtered.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-5v2m0 0v2m0-2h2m-2 0h-2" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Tidak ada produk ditemukan</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Coba ubah filter atau kata kunci pencarian Anda.
                </p>
                <Link 
                  to="/shop" 
                  className="inline-flex items-center px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  Lihat Semua Produk
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopPage;
