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

  return (
    <Link to={`/product/${product.id}`} className="group">
      <div className="bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
        <div className="bg-gray-100 flex items-center justify-center overflow-hidden w-full max-w-[829px] aspect-[1.08/1]">
          <div className="w-full h-full flex items-center justify-center p-6 bg-transparent">
            <img
              src={imageUrl}
              alt={product.name}
              className="max-h-full max-w-full object-contain object-center transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
        <p className="text-sm text-gray-500 mt-1">
          <span className="inline-flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {product.sellerName || product.storeName || product.shopName || product.seller || 'BillSnack Store'}
          </span>
        </p>
        <div className="flex items-center mt-1">
          <StarRating rating={product.rating} />
          <span className="text-sm text-gray-500 ml-2">{product.rating}/5</span>
        </div>
        <div className="flex items-baseline mt-2 space-x-2">
          <p className="text-xl font-bold text-black">Rp{formatPrice(product.price)}</p>
          {product.originalPrice && (
            <p className="text-lg text-gray-400 line-through">
              Rp{formatPrice(product.originalPrice)}
            </p>
          )}
          {product.originalPrice && (
            <p className="text-sm font-semibold text-red-500 bg-red-100 px-2 py-1 rounded-full">
              -
              {Math.round(
                ((product.originalPrice - product.price) /
                  product.originalPrice) *
                  100
              )}
              %
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
