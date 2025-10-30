// Fix: Populating App to set up the main application structure, as the file was empty. This also fixes the module error in index.
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { ProductProvider } from "./contexts/ProductContext";

import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./HomePage";
import ShopPage from "./ShopPage";
import ProductDetailPage from "./ProductDetailPage";
import CartPage from "./CartPage";
import CheckoutPage from "./CheckoutPage";
import OrderConfirmationPage from "./OrderConfirmationPage";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import ProfilePage from "./ProfilePage";

// Admin components
import AdminLayout from "./components/admin/AdminLayout";
import AdminLoginPage from "./admin/AdminLoginPage";
import AdminDashboardPage from "./admin/AdminDashboardPage";
import AdminProductsPage from "./admin/AdminProductsPage";
import AdminProductFormPage from "./admin/AdminProductFormPage";
import AdminTransactionsPage from "./admin/AdminTransactionsPage";

const App = () => {
  return (
    <AuthProvider>
      <ProductProvider>
        <CartProvider>
          <Router>
            <Routes>
              {/* Admin Routes - tanpa Header dan Footer */}
              <Route path="/perloginan" element={<AdminLoginPage />} />
              <Route path="/admin/*" element={<AdminLayout />} />

              {/* Public Routes - dengan Header dan Footer */}
              <Route
                path="*"
                element={
                  <div className="flex flex-col min-h-screen">
                    <Header />
                    <main className="flex-grow">
                      <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/shop" element={<ShopPage />} />
                        <Route path="/product/:id" element={<ProductDetailPage />} />
                        <Route path="/cart" element={<CartPage />} />
                        <Route path="/checkout" element={<CheckoutPage />} />
                        <Route
                          path="/order-confirmation"
                          element={<OrderConfirmationPage />}
                        />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                      </Routes>
                    </main>
                    <Footer />
                  </div>
                }
              />
            </Routes>
          </Router>
        </CartProvider>
      </ProductProvider>
    </AuthProvider>
  );
};

export default App;
