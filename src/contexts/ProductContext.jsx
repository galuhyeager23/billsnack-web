/* eslint-disable react-refresh/only-export-components */
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
  }, []);

  const getProductById = (id) => products.find((p) => Number(p.id) === Number(id));

  // Admin functions that call the API and update local state
  const addProduct = async (productData) => {
    try {
      // if admin token exists, use admin endpoint with Authorization
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const url = adminToken ? `${API_BASE}/api/admin/products` : `${API_BASE}/api/products`;
      const headers = { 'Content-Type': 'application/json' };
      if (adminToken) headers.Authorization = `Bearer ${adminToken}`;
      const res = await fetch(url, {
        method: 'POST',
        headers,
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
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const url = adminToken ? `${API_BASE}/api/admin/products/${updatedProduct.id}` : `${API_BASE}/api/products/${updatedProduct.id}`;
      const headers = { 'Content-Type': 'application/json' };
      if (adminToken) headers.Authorization = `Bearer ${adminToken}`;
      const res = await fetch(url, {
        method: 'PUT',
        headers,
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
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const url = adminToken ? `${API_BASE}/api/admin/products/${id}` : `${API_BASE}/api/products/${id}`;
      const headers = {};
      if (adminToken) headers.Authorization = `Bearer ${adminToken}`;
      const res = await fetch(url, { method: 'DELETE', headers });
      if (!res.ok) throw new Error('Failed to delete product');
      setProducts((prev) => prev.filter((p) => Number(p.id) !== Number(id)));
      return true;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const uploadImages = async (files) => {
    if (!files || files.length === 0) return [];
    const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    const fd = new FormData();
    for (const f of files) fd.append('files', f);
    const headers = {};
    if (adminToken) headers.Authorization = `Bearer ${adminToken}`;
    const res = await fetch(`${API_BASE}/api/uploads`, { method: 'POST', body: fd, headers });
    if (!res.ok) throw new Error('Image upload failed');
    const data = await res.json();
    // prefer structured meta if provided (files_meta contains { original, thumb })
    if (data.files_meta && Array.isArray(data.files_meta)) return data.files_meta;
    // otherwise return array of objects for consistency
    if (data.files && Array.isArray(data.files)) return data.files.map((u) => ({ original: u, thumb: null }));
    return [];
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
        uploadImages,
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
