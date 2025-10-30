// Fix: Populating ProductContext to manage and provide product data, as the file was empty.
import React, { createContext, useContext, useState } from "react";
import { PRODUCTS } from "../constants";

const ProductContext = createContext(undefined);

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState(PRODUCTS);

  const getProductById = (id) => products.find((p) => p.id === id);

  // Admin functions
  const addProduct = (productData) => {
    const newProduct = {
      id: Math.max(...products.map((p) => p.id), 0) + 1,
      ...productData,
    };
    setProducts((prev) => [...prev, newProduct]);
  };

  const updateProduct = (updatedProduct) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
  };

  const deleteProduct = (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        getProductById,
        addProduct,
        updateProduct,
        deleteProduct,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error("useProducts must be used within a ProductProvider");
  }
  return context;
};
