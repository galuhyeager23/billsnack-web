import React from "react";
import { Link } from "react-router-dom";
import StarRating from "./StarRating";

const ProductCard = ({ product }) => {
  return (
    <Link to={`/product/${product.id}`} className="group">
      <div className="bg-gray-100 rounded-lg overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="mt-4">
        <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
        <div className="flex items-center mt-1">
          <StarRating rating={product.rating} />
          <span className="text-sm text-gray-500 ml-2">{product.rating}/5</span>
        </div>
        <div className="flex items-baseline mt-2 space-x-2">
          <p className="text-xl font-bold text-black">Rp{product.price}</p>
          {product.originalPrice && (
            <p className="text-lg text-gray-400 line-through">
              Rp{product.originalPrice}
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
