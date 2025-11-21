// Fix: Populating ShopPage with product grid and filtering, as the file was empty.
import React, { useState, useMemo } from "react";
import { useLocation, Link } from "react-router-dom";
import { useProducts } from "./contexts/ProductContext";
import ProductCard from "./components/ProductCard";
import SkeletonCard from "./components/SkeletonCard";

const ShopPage = () => {
  const { products, loading } = useProducts();
  const location = useLocation();
  const qs = new URLSearchParams(location.search);
  const category = qs.get('category') || '';
  const [sort, setSort] = useState('');

  const categories = useMemo(() => {
    const set = new Set();
    products.forEach(p => { if (p.category) set.add(String(p.category)); });
    return Array.from(set).sort();
  }, [products]);

  const filtered = useMemo(() => {
    let base = category ? products.filter(p => String(p.category || '').toLowerCase() === String(category).toLowerCase()) : products;
    if (sort === 'price-asc') base = [...base].sort((a,b) => Number(a.price) - Number(b.price));
    if (sort === 'price-desc') base = [...base].sort((a,b) => Number(b.price) - Number(a.price));
    if (sort === 'rating-desc') base = [...base].sort((a,b) => Number(b.rating||0) - Number(a.rating||0));
    return base;
  }, [products, category, sort]);

  return (
    <div className="px-8 sm:px-12 lg:px-16 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">Koleksi Snack</h1>
        <p className="mt-3 text-muted max-w-2xl mx-auto">Jelajahi ribuan pilihan snack favorit dengan filter kategori dan urutkan sesuai kebutuhanmu.</p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex flex-wrap gap-2">
          <Link to="/shop" className={`px-3 py-1 rounded-full text-sm border border-base transition ${!category ? 'accent-bg' : 'bg-surface-alt text-muted hover:accent-text'}`}>Semua</Link>
          {categories.map(cat => (
            <Link key={cat} to={`/shop?category=${encodeURIComponent(cat)}`} className={`px-3 py-1 rounded-full text-sm border border-base transition ${category === cat ? 'accent-bg' : 'bg-surface-alt text-muted hover:accent-text'}`}>{cat}</Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-sm text-muted">Urutkan:</label>
          <select id="sort" value={sort} onChange={e=>setSort(e.target.value)} className="text-sm border border-base rounded-md px-3 py-2 bg-surface focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400">
            <option value="">Default</option>
            <option value="price-asc">Harga Termurah</option>
            <option value="price-desc">Harga Tertinggi</option>
            <option value="rating-desc">Rating Tertinggi</option>
          </select>
        </div>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
          {Array.from({length:8}).map((_,i)=>(<SkeletonCard key={i}/>))}
        </div>
      ) : filtered.length > 0 ? (
        <>
          <div className="mb-6 flex items-center justify-between">
            <div>
              {category ? (
                <h2 className="text-2xl font-semibold">Kategori: {category}</h2>
              ) : (
                <h2 className="text-2xl font-semibold">Semua Produk</h2>
              )}
              {category && (
                <div className="text-sm text-gray-500">Menampilkan produk untuk kategori <strong>{category}</strong></div>
              )}
            </div>
            {category && (
              <div>
                <Link to="/shop" className="text-sm text-blue-600 hover:underline">Bersihkan filter</Link>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-20">
          <h2 className="text-2xl font-semibold">No products found</h2>
          <p className="text-gray-500 mt-2">
            Products will be available soon.
          </p>
        </div>
      )}
    </div>
  );
};

export default ShopPage;
