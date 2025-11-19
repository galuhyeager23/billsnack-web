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
  const initializedRef = React.useRef(false);

  // persist cart to localStorage whenever it changes, only when a user is logged in
  // Skip persisting until we've loaded the initial cart from storage to avoid overwriting it with an empty array.
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      if (!initializedRef.current) return;
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
        // If user just logged in, merge any existing in-memory guest cart with the persisted user cart.
        const raw = localStorage.getItem(key);
        const persisted = raw ? JSON.parse(raw) : [];
        setCartItems((currentGuestCart) => {
          // Merge by product id: sum quantities for duplicates, prefer persisted metadata when present
          const map = new Map();
          persisted.forEach((it) => map.set(String(it.id), { ...it }));
          (currentGuestCart || []).forEach((it) => {
            const k = String(it.id);
            if (map.has(k)) {
              map.get(k).quantity = (map.get(k).quantity || 0) + (it.quantity || 0);
            } else {
              map.set(k, { ...it });
            }
          });
          const merged = Array.from(map.values());
          try { localStorage.setItem(key, JSON.stringify(merged)); } catch (e) { /* ignore */ }
          return merged;
        });
        // mark initialized after loading/merging so the persist effect may run
        initializedRef.current = true;
      } else {
        // logged out or no user -> clear in-memory cart (returning to previous behavior)
        setCartItems([]);
        initializedRef.current = true;
      }
    } catch {
      // leave as-is on error
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
