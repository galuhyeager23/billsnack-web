import React from "react";
import { Link } from "react-router-dom";

const SocialIcon = ({ children }) => (
  <a href="#" className="text-white hover:text-yellow-50 transition-colors">
    {children}
  </a>
);

const FacebookIcon = () => (
  <svg
    width="24"
    height="24"
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
    width="24"
    height="24"
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
    width="24"
    height="24"
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
    <footer className="relative bg-surface dark:bg-neutral-900 text-gray-700 dark:text-neutral-300 border-t border-base overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(circle_at_25%_30%,rgba(var(--accent)/0.18),transparent_65%),radial-gradient(circle_at_80%_70%,rgba(var(--accent)/0.12),transparent_70%)]"></div>
      <div className="px-6 sm:px-12 lg:px-16 py-12 max-w-6xl mx-auto relative">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg accent-bg flex items-center justify-center font-extrabold shadow-sm">B</div>
              <div>
                <h3 className="text-2xl font-bold tracking-wider text-gradient">Bilsnack.id</h3>
                <p className="text-sm text-muted max-w-xs">Camilan enak, layanan cepat. Ikuti kami untuk promo dan update produk baru setiap minggu.</p>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <a href="#" aria-label="Twitter" className="text-muted hover:text-[rgb(var(--accent))] transition-colors">
                <TwitterIcon />
              </a>
              <a href="#" aria-label="Facebook" className="text-muted hover:text-[rgb(var(--accent))] transition-colors">
                <FacebookIcon />
              </a>
              <a href="#" aria-label="Instagram" className="text-muted hover:text-[rgb(var(--accent))] transition-colors">
                <InstagramIcon />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-gray-800 dark:text-neutral-200">Bantuan</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="text-muted hover:accent-text transition-colors">Beranda</Link></li>
              <li><Link to="/shop" className="text-muted hover:accent-text transition-colors">Semua Produk</Link></li>
              <li><Link to="/profile" className="text-muted hover:accent-text transition-colors">Akun Saya</Link></li>
              <li><Link to="/contact" className="text-muted hover:accent-text transition-colors">Kontak</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-gray-800 dark:text-neutral-200">Perusahaan</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted hover:accent-text transition-colors">Tentang Kami</a></li>
              <li><a href="#" className="text-muted hover:accent-text transition-colors">Karir</a></li>
              <li><a href="#" className="text-muted hover:accent-text transition-colors">Syarat & Ketentuan</a></li>
              <li><a href="#" className="text-muted hover:accent-text transition-colors">Kebijakan Privasi</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-gray-800 dark:text-neutral-200">Newsletter</h4>
            <p className="text-sm text-muted mb-3">Daftar untuk dapatkan promo terbaru</p>
            <form className="flex gap-2">
              <input type="email" placeholder="Email Anda" aria-label="Email untuk newsletter" className="w-full rounded-md px-3 py-2 bg-surface-alt border border-base text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-300" />
              <button className="btn-primary px-4 py-2 rounded-md text-sm">Ikut</button>
            </form>

            <div className="mt-6">
              <h5 className="text-sm font-medium text-gray-800 dark:text-neutral-200 mb-2">Metode Pembayaran</h5>
              <div className="flex items-center gap-3">
                <div className="w-10 h-6 bg-surface-alt rounded-sm flex items-center justify-center text-muted text-xs border border-base">VISA</div>
                <div className="w-10 h-6 bg-surface-alt rounded-sm flex items-center justify-center text-muted text-xs border border-base">MC</div>
                <div className="w-10 h-6 bg-surface-alt rounded-sm flex items-center justify-center text-muted text-xs border border-base">PAY</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-base pt-6 flex flex-col md:flex-row items-center justify-between">
          <p className="text-sm text-muted">&copy; {new Date().getFullYear()} Bilsnack.id. Semua hak dilindungi.</p>
          <a href="#top" className="text-sm mt-3 md:mt-0 accent-text hover:underline">Kembali ke atas ↑</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
