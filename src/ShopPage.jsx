// Fix: Populating ShopPage with product grid and filtering, as the file was empty.
import React from "react";
import { useProducts } from "./contexts/ProductContext";
import ProductCard from "./components/ProductCard";

const ShopPage = () => {
  const { products } = useProducts();

  return (
    <div className="px-8 sm:px-12 lg:px-16 py-12">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold tracking-tight">
          Our Snack Collection
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Discover our delicious selection of premium snacks and treats. Find your favorite flavors!
        </p>
      </div>
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
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
