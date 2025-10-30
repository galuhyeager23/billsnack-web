import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";

const SearchIcon = () => (
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
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const UserIcon = () => (
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
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const CartIconComponent = () => (
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
    <circle cx="9" cy="21" r="1"></circle>
    <circle cx="20" cy="21" r="1"></circle>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
  </svg>
);

const Header = () => {
  const { itemCount } = useCart();
  const { user, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    navigate("/");
  };

  return (
    <header className="bg-white sticky top-0 z-50">
      <div className="bg-black text-white text-center text-sm py-2 px-4 relative">
        Daftar dan dapatkan diskon 20% untuk pesanan snack pertama Anda!{" "}
        <Link to="/register" className="underline font-semibold">
          Daftar Sekarang
        </Link>
        <button className="absolute right-4 top-1/2 -translate-y-1/2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
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
        </button>
      </div>
      <div className="px-8 sm:px-12 lg:px-16">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl font-bold tracking-wider">
              Billsnack.id
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                to="/"
                className="text-gray-600 hover:text-black font-medium transition-colors"
              >
                Beranda
              </Link>
              <Link
                to="/shop"
                className="text-gray-600 hover:text-black font-medium transition-colors"
              >
                Semua Produk
              </Link>
            </nav>
            <div className="hidden md:flex items-center bg-gray-100 rounded-full px-4 py-2 w-64">
              <SearchIcon />
              <input
                type="text"
                placeholder="Cari produk..."
                className="bg-transparent ml-2 w-full focus:outline-none"
              />
            </div>
            <div className="flex items-center space-x-4 relative">
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden text-gray-600 hover:text-black"
              >
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
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>
              {user ? (
                <div onMouseLeave={() => setIsUserMenuOpen(false)}>
                  <button
                    onMouseEnter={() => setIsUserMenuOpen(true)}
                    className="text-gray-600 hover:text-black"
                  >
                    <UserIcon />
                  </button>
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20">
                      <div className="px-4 py-2 text-sm text-gray-700">
                        Masuk sebagai
                        <br />
                        <span className="font-medium">{user.name}</span>
                      </div>
                      <div className="border-t border-gray-100"></div>
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Profil Saya
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Keluar
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="text-gray-600 hover:text-black">
                  <UserIcon />
                </Link>
              )}
              <Link
                to="/cart"
                className="text-gray-600 hover:text-black relative"
              >
                <CartIconComponent />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-8 sm:px-12 lg:px-16 py-4 space-y-4">
            <Link
              to="/"
              className="block text-gray-600 hover:text-black font-medium transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Beranda
            </Link>
            <Link
              to="/shop"
              className="block text-gray-600 hover:text-black font-medium transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Semua Produk
            </Link>
            <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
              <SearchIcon />
              <input
                type="text"
                placeholder="Cari produk..."
                className="bg-transparent ml-2 w-full focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
