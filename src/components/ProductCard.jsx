import React from "react";
import { Link } from "react-router-dom";
import StarRating from "./StarRating";
import { formatPrice } from "../utils/format";

const ProductCard = ({ product }) => {
  // product.images can be array of strings or array of objects { original, thumb }
  const firstImage = (product.images && product.images.length > 0) ? product.images[0] : null;
  const imageUrl = firstImage
    ? (typeof firstImage === 'string' ? firstImage : (firstImage.thumb || firstImage.original))
    : null;

  const discountPct = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : null;

  return (
    <Link to={`/product/${product.id}`} className="group block" aria-label={`Lihat detail produk ${product.name}`}> 
      <div className="relative overflow-hidden aspect-[1/1.15] flex items-center justify-center bg-gradient-to-br from-surface-alt via-surface to-bg dark:from-neutral-800 dark:via-neutral-900 dark:to-neutral-800 rounded-2xl border border-base shadow-lg hover:shadow-2xl transition-all duration-300">
        {discountPct && (
          <span className="absolute top-3 left-3 badge bg-gradient-to-r from-red-500 via-orange-400 to-yellow-300 text-white shadow-lg rounded-full px-3 py-1 text-xs font-bold animate-bounce">-{discountPct}%</span>
        )}
        <div className="absolute inset-0 bg-[linear-gradient(150deg,rgba(var(--accent)/0.10)_0%,transparent_55%)] opacity-0 group-hover:opacity-100 transition-opacity"></div>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-contain p-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-1 drop-shadow-xl"
            loading="lazy"
            onError={e => { e.target.style.display = 'none'; if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No image</div>
        )}
      </div>
      <div className="mt-4 space-y-1 px-2 pb-2">
        <h3 className="text-base font-bold text-gray-800 dark:text-neutral-200 group-hover:text-accent transition-colors line-clamp-2">{product.name}</h3>
        <p className="text-xs text-gray-500 dark:text-muted flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          {product.sellerName || product.storeName || product.shopName || product.seller || 'BillSnack Store'}
        </p>
        <div className="flex items-center">
          <StarRating rating={product.rating} />
          <span className="text-xs text-gray-500 dark:text-muted ml-2">{product.rating}/5</span>
        </div>
        <div className="flex items-baseline mt-1 space-x-2">
          <p className="text-lg font-extrabold text-gray-900 dark:text-neutral-100">Rp{formatPrice(product.price)}</p>
          {product.originalPrice && (
            <p className="text-sm text-gray-400 line-through">Rp{formatPrice(product.originalPrice)}</p>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
