import React from "react";
import { Link } from "react-router-dom";
import StarRating from "./StarRating";
import { formatPrice } from "../utils/format";

const ProductCard = ({ product }) => {
  // product.images can be array of strings or array of objects { original, thumb }
  const firstImage = (product.images && product.images.length > 0) ? product.images[0] : null;
  const imageUrl = firstImage
    ? (typeof firstImage === 'string' ? firstImage : (firstImage.thumb || firstImage.original))
    : '/images/placeholder.png';

  const discountPct = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : null;

  return (
    <Link to={`/product/${product.id}`} className="group block">
      <div className="relative card overflow-hidden aspect-[1/1.15] flex items-center justify-center dark:bg-[rgb(var(--surface-alt))]">
        {discountPct && (
          <span className="absolute top-3 left-3 badge bg-red-500/90 text-white shadow-md">-{discountPct}%</span>
        )}
        <div className="absolute inset-0 bg-[linear-gradient(150deg,rgba(var(--accent)/0.12)_0%,transparent_55%)] opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-contain p-6 transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="mt-4 space-y-1">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-neutral-200 group-hover:accent-text transition-colors">{product.name}</h3>
        <p className="text-xs text-gray-500 dark:text-muted flex items-center">
          <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          {product.sellerName || product.storeName || product.shopName || product.seller || 'BillSnack Store'}
        </p>
        <div className="flex items-center">
          <StarRating rating={product.rating} />
          <span className="text-xs text-gray-500 dark:text-muted ml-2">{product.rating}/5</span>
        </div>
        <div className="flex items-baseline mt-1 space-x-2">
          <p className="text-base font-bold text-gray-900 dark:text-neutral-100">Rp{formatPrice(product.price)}</p>
          {product.originalPrice && (
            <p className="text-sm text-gray-400 line-through">Rp{formatPrice(product.originalPrice)}</p>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
