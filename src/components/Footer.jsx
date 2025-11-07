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
  <footer className="bg-gradient-to-r from-yellow-700 to-yellow-600 text-white">
      <div className="px-6 sm:px-12 lg:px-16 py-12 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-yellow-400 flex items-center justify-center text-white font-extrabold">B</div>
              <div>
                <h3 className="text-2xl font-bold tracking-wider text-white">Bilsnack.id</h3>
                <p className="text-white text-sm">Camilan enak, layanan cepat. Ikuti kami untuk promo dan update produk baru setiap minggu.</p>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <a href="#" aria-label="Twitter" className="text-white hover:text-yellow-50 transition-colors">
                <TwitterIcon />
              </a>
              <a href="#" aria-label="Facebook" className="text-white hover:text-yellow-50 transition-colors">
                <FacebookIcon />
              </a>
              <a href="#" aria-label="Instagram" className="text-white hover:text-yellow-50 transition-colors">
                <InstagramIcon />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-white">Bantuan</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-white/90 hover:text-white transition-colors">Beranda</Link></li>
              <li><Link to="/shop" className="text-white/90 hover:text-white transition-colors">Semua Produk</Link></li>
              <li><Link to="/profile" className="text-white/90 hover:text-white transition-colors">Akun Saya</Link></li>
              <li><Link to="/contact" className="text-white/90 hover:text-white transition-colors">Kontak</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-white">Perusahaan</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-white/90 hover:text-white transition-colors">Tentang Kami</a></li>
              <li><a href="#" className="text-white/90 hover:text-white transition-colors">Karir</a></li>
              <li><a href="#" className="text-white/90 hover:text-white transition-colors">Syarat & Ketentuan</a></li>
              <li><a href="#" className="text-white/90 hover:text-white transition-colors">Kebijakan Privasi</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-white">Newsletter</h4>
            <p className="text-white text-sm mb-3">Daftar untuk dapatkan promo terbaru</p>
            <form className="flex gap-2">
              <input type="email" placeholder="Email Anda" aria-label="Email untuk newsletter" className="w-full rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-300" />
              <button className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white px-4 rounded-md">Ikut</button>
            </form>

            <div className="mt-6">
              <h5 className="text-white text-sm mb-2">Metode Pembayaran</h5>
              <div className="flex items-center gap-3">
                <div className="w-10 h-6 bg-white rounded-sm flex items-center justify-center text-gray-800 text-xs">VISA</div>
                <div className="w-10 h-6 bg-white rounded-sm flex items-center justify-center text-gray-800 text-xs">MC</div>
                <div className="w-10 h-6 bg-white rounded-sm flex items-center justify-center text-gray-800 text-xs">PAY</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between">
          <p className="text-sm text-white/90">&copy; {new Date().getFullYear()} Bilsnack.id. Semua hak dilindungi.</p>
          <a href="#top" className="text-sm mt-3 md:mt-0 text-white hover:text-yellow-50">Kembali ke atas ↑</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
