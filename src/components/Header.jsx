import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import logo from "../assets/bilsnack.png";

// Komponen NavLink dengan animasi underline
const NavLink = ({ to, children }) => (
  <Link
    to={to}
    className="relative group text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-amber-600 dark:hover:text-amber-400 transition-colors py-2"
  >
    {children}
    <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-amber-500 transition-all duration-300 group-hover:w-full rounded-full"></span>
  </Link>
);

const SearchIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const UserAvatar = ({ name, src, size = 9 }) => {
  const initial = name ? name.trim().split(" ")[0][0].toUpperCase() : null;
  const sizeClass = size === 9 ? "w-9 h-9" : "w-10 h-10";
  return (
    <div
      className={`user-avatar-inner ${sizeClass} rounded-full overflow-hidden flex items-center justify-center font-bold border-2 border-gray-100 dark:border-neutral-700 bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-300 shadow-sm transition-transform`}
    >
      {src ? (
        <img
          src={src}
          alt={name || "User avatar"}
          className="w-full h-full object-cover"
        />
      ) : initial ? (
        <span className="text-sm">{initial}</span>
      ) : (
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
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      )}
    </div>
  );
};

const CartIcon = ({ filled = false }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`transition-colors duration-300 ${
      filled ? "text-amber-600 scale-110" : "text-gray-600 dark:text-gray-300"
    }`}
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
  const [theme, setTheme] = useState(() =>
    typeof window !== "undefined" &&
    document.documentElement.classList.contains("dark")
      ? "dark"
      : "light"
  );
  const location = useLocation();
  const navigate = useNavigate();
  const userMenuRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    navigate("/");
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  // Ripple effect removed for cleaner modern minimalist feel, but keeping structure if needed
  // Using pure CSS/Tailwind transitions instead for better performance

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

  const toggleTheme = () => {
    if (
      location.pathname.startsWith("/admin") ||
      location.pathname.startsWith("/reseller")
    )
      return;
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (next === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* ignore */
    }
  };

  const ThemeIcon = () =>
    theme === "dark" ? (
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
        className="text-amber-400"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    ) : (
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
        className="text-amber-500"
      >
        <circle cx="12" cy="12" r="4"></circle>
        <path d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.07 6.07-1.42-1.42M8.35 8.35 6.93 6.93m0 10.14 1.42-1.42m9.72-9.72-1.42 1.42" />
      </svg>
    );

  // Styling Classes
  const iconBtnClass =
    "p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-900";

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-neutral-800/50 shadow-sm transition-all duration-300">
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo Section */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="relative w-10 h-10 overflow-hidden rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                <img
                  src={logo}
                  alt="Bilsnack logo"
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <span className="text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent group-hover:from-amber-500 group-hover:to-amber-400 transition-all">
                Bilsnack
                <span className="text-gray-800 dark:text-gray-200">.id</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation & Search */}
          <div className="hidden md:flex flex-1 items-center justify-center lg:justify-between max-w-3xl px-8">
            <nav className="flex items-center space-x-8 mr-6">
              <NavLink to="/">Beranda</NavLink>
              <NavLink to="/shop">Semua Produk</NavLink>
            </nav>

            {/* Enhanced Search Bar */}
            <div
              className={`relative flex items-center transition-all duration-300 ease-out ${
                isSearchFocused
                  ? "flex-grow max-w-md ring-2 ring-amber-100 dark:ring-amber-900/30"
                  : "w-64"
              } bg-gray-100/50 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-700 rounded-full hover:border-amber-300 dark:hover:border-amber-700`}
            >
              <div className="pl-4 text-gray-400">
                <SearchIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Cari snack favorit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full bg-transparent border-none py-2.5 pl-3 pr-4 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:ring-0 focus:outline-none rounded-full"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1 sm:gap-3">
            {/* Theme Toggle */}
            {!location.pathname.startsWith("/admin") &&
              !location.pathname.startsWith("/reseller") && (
                <button
                  onClick={toggleTheme}
                  className={iconBtnClass}
                  aria-label="Toggle Theme"
                >
                  <ThemeIcon />
                </button>
              )}

            {/* Cart Button */}
            <Link
              to="/cart"
              className={`${iconBtnClass} relative mr-1`}
              aria-label="Keranjang"
            >
              <CartIcon filled={itemCount > 0} />
              {itemCount > 0 && (
                <span className="absolute top-0.5 right-0.5 h-5 w-5 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full shadow-sm ring-2 ring-white dark:ring-neutral-900 animate-in zoom-in duration-300">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Desktop Login/User Btn */}
            <div className="hidden md:flex items-center">
              {user ? (
                <div ref={userMenuRef} className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1 pl-2 pr-1 rounded-full border border-gray-200 dark:border-neutral-700 hover:shadow-md transition-all duration-200 bg-white dark:bg-neutral-800"
                  >
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 max-w-[80px] truncate hidden lg:block">
                      {user.name?.split(" ")[0]}
                    </span>
                    <UserAvatar name={user.name} src={user.profileImage} />
                  </button>

                  {/* Dropdown */}
                  <div
                    className={`absolute right-0 mt-3 w-60 origin-top-right bg-white dark:bg-neutral-800 rounded-2xl shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none divide-y divide-gray-100 dark:divide-neutral-700 transition-all duration-200 ${
                      isUserMenuOpen
                        ? "opacity-100 scale-100 visible"
                        : "opacity-0 scale-95 invisible"
                    }`}
                  >
                    <div className="px-5 py-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Halo,
                      </p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {user.name}
                      </p>
                    </div>
                    <div className="py-2">
                      <Link
                        to="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-5 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-amber-50 dark:hover:bg-neutral-700/50 hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
                      >
                        Profil Saya
                      </Link>
                      <Link
                        to="/orders"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-5 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-amber-50 dark:hover:bg-neutral-700/50 hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
                      >
                        Riwayat Pesanan
                      </Link>
                    </div>
                    <div className="py-2">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          handleLogout();
                        }}
                        className="w-full text-left px-5 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        Keluar
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="btn-primary py-2 px-6 rounded-full text-sm font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                >
                  Masuk
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
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
                {isMobileMenuOpen ? (
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                ) : (
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                )}
                {isMobileMenuOpen ? (
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                ) : (
                  <>
                    {" "}
                    <line x1="3" y1="6" x2="21" y2="6"></line>{" "}
                    <line x1="3" y1="18" x2="21" y2="18"></line>{" "}
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out bg-white dark:bg-neutral-900 border-t border-gray-100 dark:border-neutral-800 ${
          isMobileMenuOpen
            ? "max-h-screen opacity-100 shadow-xl"
            : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 pt-4 pb-6 space-y-4">
          {/* Mobile Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Cari produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && {
                  handleSearch,
                  setIsMobileMenuOpen: () => setIsMobileMenuOpen(false),
                }
              }
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-neutral-700 rounded-lg leading-5 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 sm:text-sm transition-shadow"
            />
          </div>

          <div className="space-y-1">
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-neutral-800"
            >
              Beranda
            </Link>
            <Link
              to="/shop"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-neutral-800"
            >
              Semua Produk
            </Link>
          </div>

          <div className="border-t border-gray-200 dark:border-neutral-800 pt-4">
            {user ? (
              <div className="flex items-center px-3">
                <div className="flex-shrink-0">
                  <UserAvatar
                    name={user.name}
                    src={user.profileImage}
                    size={10}
                  />
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium leading-none text-gray-800 dark:text-white">
                    {user.name}
                  </div>
                  <div className="text-sm font-medium leading-none text-gray-500 mt-1">
                    {user.email}
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-3">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full text-center btn-primary py-3 rounded-lg font-bold shadow-md"
                >
                  Masuk Sekarang
                </Link>
              </div>
            )}

            {user && (
              <div className="mt-3 px-2 space-y-1">
                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-neutral-800"
                >
                  Profil Saya
                </Link>
                <Link
                  to="/orders"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-neutral-800"
                >
                  Riwayat Pesanan
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Keluar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
