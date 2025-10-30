import React, { useEffect, useState } from "react";
import { NavLink, Outlet, Link, Routes, Route, useNavigate } from "react-router-dom";
import AdminDashboardPage from "../../admin/AdminDashboardPage";
import AdminProductsPage from "../../admin/AdminProductsPage";
import AdminProductFormPage from "../../admin/AdminProductFormPage";
import AdminTransactionsPage from "../../admin/AdminTransactionsPage";

const DashboardIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
    <line x1="12" y1="22.08" x2="12" y2="12"></line>
  </svg>
);
const ProductIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <path d="M16 10a4 4 0 0 1-8 0"></path>
  </svg>
);

const TransactionIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
    <line x1="8" y1="21" x2="16" y2="21"></line>
    <line x1="12" y1="17" x2="12" y2="21"></line>
  </svg>
);

const AdminLayout = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if admin is logged in
    const adminAuth = localStorage.getItem("adminAuth");
    if (adminAuth) {
      try {
        const auth = JSON.parse(adminAuth);
        if (auth.isLoggedIn) {
          setIsAuthenticated(true);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error("Error parsing admin auth:", e);
      }
    }
    // Redirect to admin login if not authenticated
    setLoading(false);
    navigate("/perloginan");
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("adminAuth");
    navigate("/perloginan");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  const navLinkClasses = ({ isActive }) =>
    `flex items-center space-x-3 py-3 px-4 rounded-lg transition-colors ${
      isActive
        ? "bg-gray-700 text-white"
        : "text-gray-300 hover:bg-gray-700 hover:text-white"
    }`;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-gray-800 text-white p-4 flex flex-col">
        <h1 className="text-2xl font-bold mb-8">Admin Panel</h1>
        <nav className="grow">
          <ul>
            <li>
              <NavLink to="/admin" end className={navLinkClasses}>
                <DashboardIcon />
                <span>Dashboard</span>
              </NavLink>
            </li>
            <li className="mt-2">
              <NavLink to="/admin/products" className={navLinkClasses}>
                <ProductIcon />
                <span>Products</span>
              </NavLink>
            </li>
            <li className="mt-2">
              <NavLink to="/admin/transactions" className={navLinkClasses}>
                <TransactionIcon />
                <span>Transactions</span>
              </NavLink>
            </li>
          </ul>
        </nav>
        <button
          onClick={handleLogout}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
        >
          Logout
        </button>
      </aside>
      <main className="flex-1 p-8">
        <Routes>
          <Route index element={<AdminDashboardPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="products/new" element={<AdminProductFormPage />} />
          <Route path="products/edit/:id" element={<AdminProductFormPage />} />
          <Route path="transactions" element={<AdminTransactionsPage />} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminLayout;
