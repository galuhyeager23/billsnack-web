import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";

const SearchIcon = () => (
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
    className="text-gray-400"
  >
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const UserAvatar = ({ name, src, size = 9 }) => {
  const initial = name ? name.trim().split(" ")[0][0].toUpperCase() : null;
  const sizeClass = size === 9 ? "w-9 h-9" : "w-10 h-10";
  return (
    <div className={`${sizeClass} rounded-full overflow-hidden bg-gray-100 flex items-center justify-center text-gray-700 font-semibold`}>
      {src ? (
        <img src={src} alt={name || "User avatar"} className="w-full h-full object-cover" />
      ) : initial ? (
        <span className="text-sm">{initial}</span>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      )}
    </div>
  );
};

const CartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700">
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
  const userMenuRef = useRef(null);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    navigate("/");
  };

  // create a small ripple/shadow effect at the click position inside the clicked element
  // createRipple accepts optional color (e.g. red for Keluar) and duration (ms)
  const createRipple = (e, color = 'rgba(0,0,0,0.08)', duration = 700) => {
    const target = e.currentTarget;
    if (!target) return;
    // ensure container positioning
    target.style.position = target.style.position || 'relative';
    target.style.overflow = 'hidden';
    const rect = target.getBoundingClientRect();
    const circle = document.createElement('span');
    const size = Math.max(rect.width, rect.height) * 1.2;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    circle.style.position = 'absolute';
    circle.style.left = `${x}px`;
    circle.style.top = `${y}px`;
    circle.style.width = `${size}px`;
    circle.style.height = `${size}px`;
    circle.style.borderRadius = '50%';
  circle.style.background = color;
    circle.style.pointerEvents = 'none';
    circle.style.transform = 'scale(0)';
    circle.style.transition = 'transform 350ms ease-out, opacity 600ms ease-out';
    target.appendChild(circle);
    // trigger animation
    requestAnimationFrame(() => {
      circle.style.transform = 'scale(1)';
      circle.style.opacity = '0';
    });
    // remove after animation
    setTimeout(() => {
      if (circle && circle.parentElement === target) target.removeChild(circle);
    }, duration);
  };

  // Close user menu when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    }

    function handleEsc(e) {
      if (e.key === "Escape") setIsUserMenuOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  return (
    <header className="bg-white sticky top-0 z-50">
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-400 text-white text-center text-sm py-2 px-4 relative">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-4">
          <span className="font-medium">Diskon 20% untuk pesanan snack pertama Anda!</span>
          <Link
            to="/register"
            className="underline font-semibold text-white focus:outline-none focus:ring-2 focus:ring-yellow-300 rounded-sm px-1 py-0.5"
          >
            Daftar Sekarang
          </Link>
        </div>
      </div>
      <div className="px-8 sm:px-12 lg:px-16">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0 flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-400 flex items-center justify-center text-white font-extrabold">B</div>
              <span className="text-2xl font-bold tracking-wider">Billsnack.id</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                to="/"
                className="text-gray-700 hover:text-yellow-600 focus:text-yellow-700 font-medium transition-colors px-2 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-300 hover:underline hover:scale-105 cursor-pointer"
              >
                Beranda
              </Link>
              <Link
                to="/shop"
                className="text-gray-700 hover:text-yellow-600 focus:text-yellow-700 font-medium transition-colors px-2 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-300 hover:underline hover:scale-105 cursor-pointer"
              >
                Semua Produk
              </Link>
            </nav>
            <div className="hidden md:flex items-center bg-white rounded-full px-4 py-2 w-96 shadow-sm border border-gray-100">
              <SearchIcon />
              <input
                type="text"
                placeholder="Cari snack, merk, atau kategori..."
                className="bg-transparent ml-3 w-full focus:outline-none focus:ring-2 focus:ring-yellow-300 text-sm"
              />
            </div>
            <Link
              to="/shop"
              className="hidden md:inline-block bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 active:from-yellow-700 active:to-yellow-800 text-white font-semibold py-2 px-5 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-300 shadow-md transition transform hover:-translate-y-0.5 active:scale-95 hover:shadow-lg cursor-pointer"
            >
              Belanja
            </Link>
            <div className="flex items-center space-x-4 relative">
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden text-gray-600 hover:text-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-300 rounded"
                aria-label="Toggle menu"
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
                  <div ref={userMenuRef} className="relative">
                    <button
                      onClick={() => setIsUserMenuOpen((s) => !s)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setIsUserMenuOpen((s) => !s);
                        }
                      }}
                      className="flex items-center gap-2 text-gray-700 hover:text-black cursor-pointer focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded-full p-1 transition-transform active:scale-95"
                      aria-haspopup="true"
                      aria-expanded={isUserMenuOpen}
                      aria-pressed={isUserMenuOpen}
                      aria-label="Akun saya"
                      type="button"
                    >
                      <div className="w-9 h-9">
                        <UserAvatar name={user.name} src={user.profileImage} />
                      </div>
                    </button>
                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-2 z-20">
                        <div className="px-4 py-3 flex items-center gap-3">
                          <div className="w-12 h-12">
                            <UserAvatar name={user.name} src={user.profileImage} size={10} />
                          </div>
                          <div className="text-sm text-gray-700">
                            <div className="text-xs text-gray-500">Masuk sebagai</div>
                            <div className="font-medium truncate" style={{ maxWidth: 160 }}>{user.name}</div>
                          </div>
                        </div>
                        <div className="border-t border-gray-100 my-1"></div>
                        {(() => {
                          const itemClass = 'relative overflow-hidden block w-full text-left px-4 py-2 text-sm text-gray-700 hover:text-blue-600 focus:text-blue-600 hover:bg-transparent focus:bg-transparent active:bg-transparent focus:outline-none shadow-none hover:shadow-none bg-transparent appearance-none border-none';
                          return (
                            <Link
                              to="/profile"
                              className={itemClass}
                              onClick={(e) => {
                                createRipple(e);
                                setIsUserMenuOpen(false);
                              }}
                            >
                              Profil Saya
                            </Link>
                          );
                        })()}
                        {(() => {
                          const itemClass = 'relative overflow-hidden block w-full text-left px-4 py-2 text-sm text-gray-700 hover:text-blue-600 focus:text-blue-600 hover:bg-transparent focus:bg-transparent active:bg-transparent focus:outline-none shadow-none hover:shadow-none bg-transparent appearance-none border-none';
                          return (
                            <button
                              type="button"
                              onClick={(e) => {
                                // red ripple for destructive action, delay logout so ripple is visible
                                createRipple(e, 'rgba(220,38,38,0.12)', 500);
                                setTimeout(() => {
                                  setIsUserMenuOpen(false);
                                  handleLogout();
                                }, 160);
                              }}
                              className={itemClass}
                              style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                              aria-label="Keluar"
                            >
                              Keluar
                            </button>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link to="/login" className="text-gray-700 hover:text-yellow-600" aria-label="Masuk">
                    <div className="w-9 h-9">
                      <UserAvatar />
                    </div>
                  </Link>
                )}
              <Link to="/cart" className="relative" aria-label={`Keranjang, ${itemCount} item`}>
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:shadow-sm hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-yellow-300">
                  <CartIcon />
                </div>
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow-md">
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
