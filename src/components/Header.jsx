import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import logo from "../assets/bilsnack.png";

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
    className="text-muted"
  >
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const UserAvatar = ({ name, src, size = 9 }) => {
  const initial = name ? name.trim().split(" ")[0][0].toUpperCase() : null;
  const sizeClass = size === 9 ? "w-9 h-9" : "w-10 h-10";
  return (
    <div className={`user-avatar-inner ${sizeClass} rounded-full overflow-hidden flex items-center justify-center font-semibold border border-base bg-surface-alt text-muted transition-colors`}>      
      {src ? (
        <img src={src} alt={name || "User avatar"} className="w-full h-full object-cover avatar-img" />
      ) : initial ? (
        <span className="text-sm">{initial}</span>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-colors">
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
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`transition-colors ${filled ? 'text-red-600' : 'text-muted'} group-hover:text-[rgb(var(--accent))]`}
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
  const [theme, setTheme] = useState(() => (typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light'));
  const location = useLocation();
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

  // Theme toggle handler
  const toggleTheme = () => {
    // Prevent toggling theme while in admin or reseller sections
    if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/reseller')) {
      return; // ignore toggle
    }
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (next === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    try { localStorage.setItem('theme', next); } catch { /* ignore */ }
  };

  const ThemeIcon = () => theme === 'dark' ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.07 6.07-1.42-1.42M8.35 8.35 6.93 6.93m0 10.14 1.42-1.42m9.72-9.72-1.42 1.42"/></svg>
  );

  return (
    <header className="backdrop-blur-sm bg-surface/80 dark:bg-neutral-900/80 border-b border-base sticky top-0 z-50 transition-colors">
      <div className="bg-[linear-gradient(90deg,rgba(var(--accent)/0.9)_0%,rgba(var(--accent)/0.75)_50%,rgba(var(--accent)/0.9)_100%)] text-white text-center text-sm py-2 px-4 relative">
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
        <div className="flex items-center justify-between h-20 max-w-7xl mx-auto">
          <div className="flex-shrink-0 flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="Bilsnack logo" className="w-10 h-10 rounded-lg object-cover" />
              <span className="text-2xl font-bold tracking-wider bg-[linear-gradient(90deg,rgba(var(--accent))_0%,rgba(var(--accent))_100%)] bg-clip-text text-transparent">Bilsnack.id</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                to="/"
                className="text-gray-700 dark:text-neutral-200 hover:text-[rgb(var(--accent))] focus:text-[rgb(var(--accent))] font-medium transition-colors px-2 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300 hover:underline hover:scale-105 cursor-pointer"
              >
                Beranda
              </Link>
              <Link
                to="/shop"
                className="text-gray-700 dark:text-neutral-200 hover:text-[rgb(var(--accent))] focus:text-[rgb(var(--accent))] font-medium transition-colors px-2 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300 hover:underline hover:scale-105 cursor-pointer"
              >
                Semua Produk
              </Link>
            </nav>
              <div className="hidden md:flex items-center bg-surface-alt rounded-full px-4 py-2 w-96 shadow-sm border border-base">
              <SearchIcon />
              <input
                type="text"
                placeholder="Cari snack, merk, atau kategori..."
                  className="bg-transparent ml-3 w-full focus:outline-none focus:ring-2 focus:ring-amber-300 text-sm placeholder:text-muted"
              />
            </div>
            <Link
              to="/shop"
              className="hidden md:inline-block btn-primary font-semibold py-2 px-5 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-md transition transform hover:-translate-y-0.5 active:scale-95 hover:shadow-lg cursor-pointer"
            >
              Belanja
            </Link>
            <div className="flex items-center space-x-4 relative">
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden text-gray-600 dark:text-neutral-200 hover:text-[rgb(var(--accent))] focus:outline-none focus:ring-2 focus:ring-amber-300 rounded"
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
                      className="icon-btn active:scale-95"
                      aria-haspopup="true"
                      aria-expanded={isUserMenuOpen}
                      aria-pressed={isUserMenuOpen}
                      aria-label="Akun saya"
                      type="button"
                    >
                      <UserAvatar name={user.name} src={user.profileImage} />
                    </button>
                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-surface rounded-md shadow-lg py-2 z-20 border border-base">
                        <div className="px-4 py-3 flex items-center gap-3">
                          <div className="w-12 h-12">
                            <UserAvatar name={user.name} src={user.profileImage} size={10} />
                          </div>
                          <div className="text-sm text-gray-700">
                            <div className="text-xs text-gray-500">Masuk sebagai</div>
                            <div className="font-medium truncate" style={{ maxWidth: 160 }}>{user.name}</div>
                          </div>
                        </div>
                        <div className="border-t border-base my-1"></div>
                        {(() => {
                          const itemClass = 'relative overflow-hidden block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-neutral-200 hover:text-[rgb(var(--accent))] focus:text-[rgb(var(--accent))] hover:bg-transparent focus:bg-transparent active:bg-transparent focus:outline-none shadow-none hover:shadow-none bg-transparent appearance-none border-none';
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
                          const itemClass = 'relative overflow-hidden block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-neutral-200 hover:text-[rgb(var(--accent))] focus:text-[rgb(var(--accent))] hover:bg-transparent focus:bg-transparent active:bg-transparent focus:outline-none shadow-none hover:shadow-none bg-transparent appearance-none border-none';
                          return (
                            <Link
                              to="/orders"
                              className={itemClass}
                              onClick={(e) => {
                                createRipple(e);
                                setIsUserMenuOpen(false);
                              }}
                            >
                              Riwayat Pesanan
                            </Link>
                          );
                        })()}
                        {(() => {
                          const itemClass = 'relative overflow-hidden block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-neutral-200 hover:text-[rgb(var(--accent))] focus:text-[rgb(var(--accent))] hover:bg-transparent focus:bg-transparent active:bg-transparent focus:outline-none shadow-none hover:shadow-none bg-transparent appearance-none border-none';
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
                  <Link to="/login" aria-label="Masuk" className="icon-btn">
                    <UserAvatar />
                  </Link>
                )}
              {!location.pathname.startsWith('/admin') && !location.pathname.startsWith('/reseller') && (
                <button
                  type="button"
                  onClick={toggleTheme}
                  aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                  className="icon-btn"
                >
                  <ThemeIcon />
                </button>
              )}
              <Link to="/cart" className="relative" aria-label={`Keranjang, ${itemCount} item`}>
                <div className={`icon-btn ${itemCount > 0 ? 'ring-2 ring-red-300/50 bg-red-50 dark:bg-red-900/20' : ''}`}>
                  <CartIcon filled={itemCount > 0} />
                </div>
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 rounded-full h-5 w-5 flex items-center justify-center text-[10px] font-semibold bg-red-600 text-white shadow-md ring-2 ring-red-300 dark:ring-red-400">
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
        <div className="md:hidden bg-surface border-t border-base">
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
            <div className="flex items-center bg-surface-alt rounded-full px-4 py-2 border border-base">
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
