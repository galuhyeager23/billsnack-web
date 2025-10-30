import React from "react";
import { Link } from "react-router-dom";

const SocialIcon = ({ children }) => (
  <a href="#" className="text-gray-500 hover:text-black">
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
    <footer className="bg-white">
      <div className="px-8 sm:px-12 lg:px-16 py-12">
        <div className="flex justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-wider mb-4">
              Billsnack.id
            </h2>
            <p className="text-gray-600 max-w-sm">
              Tujuan utama Anda untuk camilan dan makanan ringan yang lezat. Kami menawarkan produk berkualitas premium dan layanan pelanggan yang luar biasa.
            </p>
            <div className="flex space-x-4 mt-6 justify-center">
              <SocialIcon>
                <TwitterIcon />
              </SocialIcon>
              <SocialIcon>
                <FacebookIcon />
              </SocialIcon>
              <SocialIcon>
                <InstagramIcon />
              </SocialIcon>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 text-center text-gray-500">
          <p>
            &copy; {new Date().getFullYear()} Billsnack.id. Seluruh hak cipta.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
