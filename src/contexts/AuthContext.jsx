/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext(undefined);

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:4000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('billsnack_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('billsnack_token'));

  useEffect(() => {
    if (token) {
      localStorage.setItem('billsnack_token', token);
    } else {
      localStorage.removeItem('billsnack_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('billsnack_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('billsnack_user');
    }
  }, [user]);

  const register = async ({ email, password, firstName, lastName }) => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, firstName, lastName }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Registration failed');
    }
    const data = await res.json();
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const login = async ({ email, password }) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Login failed');
    }
    const data = await res.json();
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  const updateProfile = (userData) => {
    setUser(prevUser => {
      if (!prevUser) return null;
      const updatedUser = { ...prevUser, ...userData };
      if (userData.firstName || userData.lastName) {
        updatedUser.name = `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim();
      }
      return updatedUser;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, register, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
