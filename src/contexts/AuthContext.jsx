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

  const register = async ({ email, password, firstName, lastName, username, phone, gender, profileImage, profileImageUrl }) => {
    const body = { email, password, firstName, lastName };
    if (username) body.username = username;
    if (phone) body.phone = phone;
    if (gender) body.gender = gender;
    if (profileImage) body.profileImage = profileImage;
    if (profileImageUrl) body.profileImageUrl = profileImageUrl;

    let res;
    try {
      res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (networkErr) {
      console.error('Network error when calling register:', networkErr);
      throw new Error('Network error: could not reach backend. Pastikan server backend berjalan.');
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Registration failed');
    }
    const data = await res.json();
    setToken(data.token);
    const userObj = data.user || {};
    if (userObj.firstName || userObj.lastName) userObj.name = `${userObj.firstName || ''} ${userObj.lastName || ''}`.trim();
    setUser(userObj);
    return data;
  };

  const login = async ({ email, password }) => {
    let res;
    try {
      res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
    } catch (networkErr) {
      console.error('Network error when calling login:', networkErr);
      throw new Error('Network error: could not reach backend. Pastikan server backend berjalan.');
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Login failed');
    }
    const data = await res.json();
    setToken(data.token);
    const userObj = data.user || {};
    if (userObj.firstName || userObj.lastName) userObj.name = `${userObj.firstName || ''} ${userObj.lastName || ''}`.trim();
    setUser(userObj);
    return data;
  };

  const logout = () => {
    // Clear storage immediately so other tabs/components see logged-out state
    try {
      localStorage.removeItem('billsnack_user');
      localStorage.removeItem('billsnack_token');
    } catch {
      // ignore
    }
    setUser(null);
    setToken(null);
  };

  const updateProfile = (userData) => {
    // If we have a token, persist the profile to the backend
    if (token) {
      (async () => {
        try {
          const res = await fetch(`${API_BASE}/api/auth/profile`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(userData),
          });
          if (res.ok) {
            const data = await res.json();
            const updated = data.user;
            // derive display name
            if (updated.firstName || updated.lastName) {
              updated.name = `${updated.firstName || ''} ${updated.lastName || ''}`.trim();
            }
            setUser(updated);
          } else {
            const err = await res.json().catch(() => ({}));
            console.error('Failed to update profile on server', err);
            // fallback: update locally
            setUser(prev => {
              if (!prev) return null;
              const updatedLocal = { ...prev, ...userData };
              if (userData.firstName || userData.lastName) {
                updatedLocal.name = `${updatedLocal.firstName || ''} ${updatedLocal.lastName || ''}`.trim();
              }
              return updatedLocal;
            });
          }
        } catch (e) {
          console.error('Profile update error', e);
          setUser(prev => {
            if (!prev) return null;
            const updatedLocal = { ...prev, ...userData };
            if (userData.firstName || userData.lastName) {
              updatedLocal.name = `${updatedLocal.firstName || ''} ${updatedLocal.lastName || ''}`.trim();
            }
            return updatedLocal;
          });
        }
      })();
    } else {
      setUser(prevUser => {
        if (!prevUser) return null;
        const updatedUser = { ...prevUser, ...userData };
        if (userData.firstName || userData.lastName) {
          updatedUser.name = `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim();
        }
        return updatedUser;
      });
    }
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
