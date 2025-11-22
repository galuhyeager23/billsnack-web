import React from "react";
import { Link } from "react-router-dom";

const SocialIcon = ({ children, href, label }) => (
  <a
    href={href || "#"}
    aria-label={label}
    className="group relative w-10 h-10 bg-gradient-to-br from-surface-alt to-surface dark:from-neutral-800 dark:to-neutral-700 rounded-full flex items-center justify-center text-muted hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-[rgb(var(--accent))/0.3] border border-base hover:border-[rgb(var(--accent))]"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-[rgb(var(--accent))] to-[rgb(var(--accent-hover))] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    <div className="relative z-10">
      {children}
    </div>
  </a>
);

const FacebookIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);

const TwitterIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
  </svg>
);

const InstagramIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const Footer = () => {
  return (
    <footer className="relative bg-gradient-to-br from-surface via-surface-alt to-bg dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 text-gray-700 dark:text-neutral-300 border-t border-base overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(var(--accent)/0.15),transparent_50%),radial-gradient(circle_at_80%_20%,rgba(var(--accent)/0.1),transparent_50%),radial-gradient(circle_at_40%_80%,rgba(var(--accent)/0.08),transparent_50%)] animate-pulse"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-transparent via-transparent to-[rgba(var(--accent)/0.05)]"></div>
      </div>

      <div className="px-6 sm:px-12 lg:px-16 py-16 max-w-7xl mx-auto relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Section */}
          <div className="col-span-1 lg:col-span-1">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[rgb(var(--accent))] to-[rgb(var(--accent-hover))] flex items-center justify-center font-extrabold text-white shadow-lg transform hover:scale-110 transition-transform duration-300">
                  B
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-neutral-900 animate-pulse"></div>
              </div>
              <div>
                <h3 className="text-3xl font-bold tracking-wider bg-gradient-to-r from-gray-900 via-[rgb(var(--accent))] to-gray-900 dark:from-white dark:via-[rgb(var(--accent))] dark:to-white bg-clip-text text-transparent">
                  Bilsnack.id
                </h3>
                <p className="text-sm text-muted max-w-xs leading-relaxed mt-1">
                  Camilan enak, layanan cepat. Ikuti kami untuk promo dan update produk baru setiap minggu.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <SocialIcon href="#" label="Twitter">
                <TwitterIcon />
              </SocialIcon>
              <SocialIcon href="#" label="Facebook">
                <FacebookIcon />
              </SocialIcon>
              <SocialIcon href="#" label="Instagram">
                <InstagramIcon />
              </SocialIcon>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-6">
            <h4 className="font-bold text-lg text-gray-900 dark:text-white relative">
              Bantuan
              <div className="absolute -bottom-2 left-0 w-8 h-0.5 bg-gradient-to-r from-[rgb(var(--accent))] to-transparent"></div>
            </h4>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="group flex items-center text-muted hover:text-[rgb(var(--accent))] transition-all duration-300 hover:translate-x-1">
                  <span className="w-1.5 h-1.5 bg-[rgb(var(--accent))] rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Beranda
                </Link>
              </li>
              <li>
                <Link to="/shop" className="group flex items-center text-muted hover:text-[rgb(var(--accent))] transition-all duration-300 hover:translate-x-1">
                  <span className="w-1.5 h-1.5 bg-[rgb(var(--accent))] rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Semua Produk
                </Link>
              </li>
              <li>
                <Link to="/profile" className="group flex items-center text-muted hover:text-[rgb(var(--accent))] transition-all duration-300 hover:translate-x-1">
                  <span className="w-1.5 h-1.5 bg-[rgb(var(--accent))] rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Akun Saya
                </Link>
              </li>
              <li>
                <Link to="/contact" className="group flex items-center text-muted hover:text-[rgb(var(--accent))] transition-all duration-300 hover:translate-x-1">
                  <span className="w-1.5 h-1.5 bg-[rgb(var(--accent))] rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Kontak
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="space-y-6">
            <h4 className="font-bold text-lg text-gray-900 dark:text-white relative">
              Perusahaan
              <div className="absolute -bottom-2 left-0 w-8 h-0.5 bg-gradient-to-r from-[rgb(var(--accent))] to-transparent"></div>
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="group flex items-center text-muted hover:text-[rgb(var(--accent))] transition-all duration-300 hover:translate-x-1">
                  <span className="w-1.5 h-1.5 bg-[rgb(var(--accent))] rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Tentang Kami
                </a>
              </li>
              <li>
                <a href="#" className="group flex items-center text-muted hover:text-[rgb(var(--accent))] transition-all duration-300 hover:translate-x-1">
                  <span className="w-1.5 h-1.5 bg-[rgb(var(--accent))] rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Karir
                </a>
              </li>
              <li>
                <a href="#" className="group flex items-center text-muted hover:text-[rgb(var(--accent))] transition-all duration-300 hover:translate-x-1">
                  <span className="w-1.5 h-1.5 bg-[rgb(var(--accent))] rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Syarat & Ketentuan
                </a>
              </li>
              <li>
                <a href="#" className="group flex items-center text-muted hover:text-[rgb(var(--accent))] transition-all duration-300 hover:translate-x-1">
                  <span className="w-1.5 h-1.5 bg-[rgb(var(--accent))] rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Kebijakan Privasi
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter & Payment */}
          <div className="space-y-6">
            <div>
              <h4 className="font-bold text-lg text-gray-900 dark:text-white relative mb-4">
                Newsletter
                <div className="absolute -bottom-2 left-0 w-8 h-0.5 bg-gradient-to-r from-[rgb(var(--accent))] to-transparent"></div>
              </h4>
              <p className="text-sm text-muted mb-4 leading-relaxed">Daftar untuk dapatkan promo terbaru dan update eksklusif</p>
              <form className="space-y-3">
                <div className="relative">
                  <input
                    type="email"
                    placeholder="Email Anda"
                    aria-label="Email untuk newsletter"
                    className="w-full rounded-lg px-4 py-3 bg-white dark:bg-neutral-800 border border-base text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] focus:border-transparent transition-all duration-300 hover:shadow-md"
                  />
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[rgb(var(--accent))/0.05] to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
                <button className="w-full btn-primary px-6 py-3 rounded-lg text-sm font-semibold hover:scale-105 hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
                  <span className="relative z-10">Ikuti Newsletter</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[rgb(var(--accent-hover))] to-[rgb(var(--accent))] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </form>
            </div>

            <div>
              <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Metode Pembayaran</h5>
              <div className="flex items-center gap-3">
                <div className="group relative w-12 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-md flex items-center justify-center text-white text-xs font-bold border border-blue-500 hover:scale-110 transition-all duration-300 shadow-md">
                  <span>VISA</span>
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-md"></div>
                </div>
                <div className="group relative w-12 h-8 bg-gradient-to-br from-red-600 to-red-700 rounded-md flex items-center justify-center text-white text-xs font-bold border border-red-500 hover:scale-110 transition-all duration-300 shadow-md">
                  <span>MC</span>
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-md"></div>
                </div>
                <div className="group relative w-12 h-8 bg-gradient-to-br from-green-600 to-green-700 rounded-md flex items-center justify-center text-white text-xs font-bold border border-green-500 hover:scale-110 transition-all duration-300 shadow-md">
                  <span>PAY</span>
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-md"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-16 border-t border-base pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted">
                &copy; {new Date().getFullYear()} Bilsnack.id. Semua hak dilindungi.
              </p>
              <div className="hidden md:flex items-center gap-2 text-xs text-muted">
                <span>Made with</span>
                <span className="text-red-500 animate-pulse">♥</span>
                <span>for snack lovers</span>
              </div>
            </div>
            <a
              href="#top"
              className="group flex items-center gap-2 text-sm accent-text hover:text-[rgb(var(--accent-hover))] transition-all duration-300 hover:scale-105"
            >
              <span>Kembali ke atas</span>
              <svg
                className="w-4 h-4 transform group-hover:-translate-y-1 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
