// Fix: Populating ProductContext to manage and provide product data, as the file was empty.
import React, { createContext, useContext, useState, useEffect } from "react";
import { PRODUCTS } from "../constants";

const ProductContext = createContext(undefined);

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:4000';

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState(PRODUCTS || []);
  const [loading, setLoading] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/products`);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error('Failed to fetch products from API, falling back to local constants', err);
      // keep existing PRODUCTS as fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getProductById = (id) => products.find((p) => Number(p.id) === Number(id));

  // Admin functions that call the API and update local state
  const addProduct = async (productData) => {
    try {
      const res = await fetch(`${API_BASE}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
      if (!res.ok) throw new Error('Failed to create product');
      const created = await res.json();
      setProducts((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const updateProduct = async (updatedProduct) => {
    try {
      const res = await fetch(`${API_BASE}/api/products/${updatedProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduct),
      });
      if (!res.ok) throw new Error('Failed to update product');
      const data = await res.json();
      setProducts((prev) => prev.map((p) => (Number(p.id) === Number(data.id) ? data : p)));
      return data;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const deleteProduct = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete product');
      setProducts((prev) => prev.filter((p) => Number(p.id) !== Number(id)));
      return true;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        loading,
        getProductById,
        addProduct,
        updateProduct,
        deleteProduct,
        refresh: fetchProducts,
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
