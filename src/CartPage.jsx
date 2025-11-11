import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "./contexts/CartContext";
import formatPrice from "./utils/format";

const ChevronRightIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
);
const TrashIcon = () => (
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
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

const CartItemRow = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();
  const cartItemId = `${item.id}`;

  return (
    <div className="flex items-center py-6 border-b">
      <img
        src={item.image}
        alt={item.name}
        className="w-28 h-28 object-cover rounded-lg"
      />
      <div className="ml-6 flex-grow">
  <h3 className="text-lg font-semibold">{item.name}</h3>
  <p className="text-lg font-bold mt-2">Rp {formatPrice(item.price)}</p>
      </div>
      <div className="flex items-center border rounded-full px-3 py-1">
        <button
          onClick={() => updateQuantity(cartItemId, item.quantity - 1)}
          className="text-gray-500 text-xl"
        >
          -
        </button>
        <span className="w-8 text-center font-semibold">{item.quantity}</span>
        <button
          onClick={() => updateQuantity(cartItemId, item.quantity + 1)}
          className="text-gray-500 text-xl"
        >
          +
        </button>
      </div>
      <p className="w-24 text-center text-lg font-bold">Rp {formatPrice(
        item.price * item.quantity
      )}</p>
      <button
        onClick={() => removeFromCart(cartItemId)}
        className="text-red-500 hover:text-red-700 ml-4"
      >
        <TrashIcon />
      </button>
    </div>
  );
};

const CartPage = () => {
  const { cartItems } = useCart();

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const discount = subtotal * 0.2; // 20% discount
  // Shipping fee is calculated at checkout; do not show it on cart page.
  const total = subtotal - discount;

  return (
    <div className="bg-white">
      <div className="px-8 sm:px-12 lg:px-16 py-12">
        <nav className="flex items-center text-sm text-gray-500 mb-8">
          <Link to="/" className="hover:text-gray-700">
            Beranda
          </Link>{" "}
          <ChevronRightIcon />
          <span className="text-gray-700 font-medium">Keranjang</span>
        </nav>

        <h1 className="text-4xl font-bold mb-8">KERANJANG ANDA</h1>

        {cartItems.length === 0 ? (
          <div className="bg-gray-50 p-12 rounded-lg shadow text-center">
            <h2 className="text-2xl font-semibold">Keranjang Anda kosong</h2>
            <Link
              to="/shop"
              className="mt-4 inline-block bg-amber-500 text-white font-semibold py-3 px-8 rounded-full text-lg hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-300 transition duration-300"
            >
              Lanjut Belanja
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 rounded-lg p-8">
              {cartItems.map((item) => (
                <CartItemRow
                  key={`${item.id}-${item.selectedSize}-${item.selectedColor}`}
                  item={item}
                />
              ))}
            </div>

            <div className="rounded-lg p-8 h-fit">
              <h2 className="text-2xl font-bold mb-6 border-b pb-4">
                Ringkasan Pesanan
              </h2>
              <div className="space-y-4 text-lg">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">Rp {formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Diskon (-20%)</span>
                  <span className="font-semibold text-red-500">-Rp {formatPrice(
                    discount
                  )}</span>
                </div>
                {/* Shipping cost will be shown during checkout */}
              </div>
              <div className="flex justify-between text-2xl font-bold mt-6 border-t pt-4">
                <span>Total</span>
                <span>Rp {formatPrice(total)}</span>
              </div>

              <div className="mt-8 flex">
                <input
                  type="text"
                  placeholder="Tambahkan kode promo"
                  className="flex-grow bg-gray-100 rounded-l-full px-4 py-3 focus:outline-none"
                />
                <button className="bg-amber-500 text-white font-semibold px-6 rounded-r-full hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-300 transition">
                  Terapkan
                </button>
              </div>

              <Link
                to="/checkout"
                className="w-full mt-6 bg-amber-500 text-white font-semibold py-4 px-8 rounded-full text-lg hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-300 transition duration-300 flex items-center justify-center"
              >
                Lanjut ke Checkout <ChevronRightIcon />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
