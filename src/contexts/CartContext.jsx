/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useEffect } from "react";
import { useAuth } from "./AuthContext";

const CartContext = createContext(undefined);

export const CartProvider = ({ children }) => {
  // cart is stored per authenticated user only. If not logged in, cart is kept in memory and not persisted.
  const { user } = useAuth();

  // Build a cart key from available stable user identifiers. Prefer numeric id when present.
  const getCartKey = (u) => {
    if (!u) return null;
    if (u.id) return `billsnack_cart_user_${u.id}`;
    if (u.user_id) return `billsnack_cart_user_${u.user_id}`;
    if (u.email) return `billsnack_cart_user_${u.email}`;
    if (u.username) return `billsnack_cart_user_${u.username}`;
    return null;
  };

  // Start with an empty cart and load the user's cart from storage once Auth is available.
  const [cartItems, setCartItems] = useState([]);

  // persist cart to localStorage whenever it changes, only when a user is logged in
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const key = getCartKey(user);
      if (key) {
        localStorage.setItem(key, JSON.stringify(cartItems));
      }
    } catch {
      // ignore storage errors
    }
  }, [cartItems, user]);

  // When the authenticated user changes (login/logout), load or clear cart accordingly
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const key = getCartKey(user);
      if (key) {
        const raw = localStorage.getItem(key);
        setCartItems(raw ? JSON.parse(raw) : []);
      } else {
        // logged out or no user -> clear in-memory cart (do not remove persisted per-user keys)
        setCartItems([]);
      }
    } catch {
      setCartItems([]);
    }
  }, [user]);

  const addToCart = (product, quantity) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      // normalize image (product.images may contain strings or objects { original, thumb })
      const firstImg = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null;
      const imageUrl = firstImg
        ? (typeof firstImg === 'string' ? firstImg : (firstImg.thumb || firstImg.original || ''))
        : '';
      return [
        ...prevItems,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          image: imageUrl,
          quantity,
        },
      ];
    });
  };

  const removeFromCart = (cartItemId) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.id !== Number(cartItemId))
    );
  };

  const updateQuantity = (cartItemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(cartItemId);
    } else {
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.id === Number(cartItemId)
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    }
  };

  const clearCart = () => {
    setCartItems([]);
    try {
      const key = getCartKey(user);
      if (key) localStorage.removeItem(key);
    } catch { /* ignore */ }
  };

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
