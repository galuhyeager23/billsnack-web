import React, { useEffect, useState } from "react";
import { NavLink, Outlet, Link, Routes, Route, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import ResellerDashboardPage from "../../reseller/ResellerDashboardPage";
import ResellerProductsPage from "../../reseller/ResellerProductsPage";
import ResellerProductFormPage from "../../reseller/ResellerProductFormPage";

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

const MenuIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);

const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const ResellerLayout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resellerEmail, setResellerEmail] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Use AuthContext user to determine authentication and role
    if (user && user.role === 'reseller') {
      setIsAuthenticated(true);
      setResellerEmail(user.email || '');
      setLoading(false);
      return;
    }
    // Not authenticated as reseller -> redirect
    setLoading(false);
    navigate("/reseller/login");
  }, [navigate, user]);

  // Force light mode for reseller area
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  const handleLogout = () => {
    // Use AuthContext logout to clear token and user
    try {
      logout();
    } catch (e) {
      console.error('Logout error', e);
    }
    navigate("/reseller/login");
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
      {/* Top Header Bar - Always visible */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-gray-800 border-b border-gray-700 z-50 flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white hover:bg-gray-700 p-2 rounded-lg transition-colors"
          >
            {sidebarOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
          <h1 className="text-xl font-bold text-white">Reseller Panel</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-300 truncate">
            {resellerEmail}
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Overlay for Mobile - Hide on Desktop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden mt-16"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Collapsible on ALL screen sizes */}
      <aside
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed lg:fixed left-0 top-16 z-40 w-64 h-screen-minus-16 bg-gray-800 text-white p-4 flex flex-col transition-transform duration-300 ease-in-out overflow-y-auto`}
        style={{ height: "calc(100vh - 4rem)" }}
      >
        {/* Sidebar Header - Removed to avoid duplication with top header */}
        <div className="mb-8">
          <p className="text-sm text-gray-400">Menu Navigation</p>
        </div>
        <nav className="grow">
          <ul>
            <li>
              <NavLink
                to="/reseller"
                end
                className={navLinkClasses}
                onClick={() => setSidebarOpen(false)}
              >
                <DashboardIcon />
                <span>Dashboard</span>
              </NavLink>
            </li>
            <li className="mt-2">
              <NavLink
                to="/reseller/products"
                className={navLinkClasses}
                onClick={() => setSidebarOpen(false)}
              >
                <ProductIcon />
                <span>Produk Saya</span>
              </NavLink>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 p-4 lg:p-8 transition-all duration-300 mt-16 ${
        sidebarOpen ? "ml-64" : "ml-0"
      }`}>
        <Routes>
          <Route index element={<ResellerDashboardPage />} />
          <Route path="products" element={<ResellerProductsPage />} />
          <Route path="products/new" element={<ResellerProductFormPage />} />
          <Route path="products/edit/:id" element={<ResellerProductFormPage />} />
        </Routes>
      </main>
    </div>
  );
};

export default ResellerLayout;
