import React from "react";
import { Link, useNavigate } from "react-router-dom";
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
  const { cartItems, getCartItemsBySeller } = useCart();
  const navigate = useNavigate();

  const cartsBySeller = getCartItemsBySeller();

  const calculateTotalBySeller = (items) => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount = subtotal * 0.2;
    return { subtotal, discount, total: subtotal - discount };
  };

  const handleCheckoutSeller = (sellerId) => {
    // Navigate to checkout with specific seller
    navigate('/checkout', { state: { checkoutSellerId: sellerId } });
  };

  const grandTotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const grandDiscount = grandTotal * 0.2;
  const finalTotal = grandTotal - grandDiscount;

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
          <div className="space-y-6">
            {/* Group items by seller */}
            {cartsBySeller.map((sellerCart, index) => {
              const { subtotal, discount, total } = calculateTotalBySeller(sellerCart.items);
              return (
                <div key={sellerCart.sellerId} className="bg-white rounded-lg p-6 shadow-lg border border-gray-200">
                  {/* Seller Header */}
                  <div className="flex items-center justify-between border-b pb-4 mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        {sellerCart.sellerName}
                      </h2>
                      {sellerCart.resellerEmail && (
                        <p className="text-sm text-gray-500 mt-1">{sellerCart.resellerEmail}</p>
                      )}
                    </div>
                  </div>

                  {/* Cart Items for this seller */}
                  <div className="space-y-4">
                    {sellerCart.items.map((item) => (
                      <CartItemRow key={`${item.id}-${item.selectedSize}-${item.selectedColor}`} item={item} />
                    ))}
                  </div>

                  {/* Seller Summary & Checkout Button */}
                  <div className="mt-6 pt-4 border-t bg-gray-50 rounded-lg p-4">
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-semibold">Rp {formatPrice(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Diskon (-20%)</span>
                        <span className="font-semibold text-red-500">-Rp {formatPrice(discount)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Total Toko</span>
                        <span className="text-blue-600">Rp {formatPrice(total)}</span>
                      </div>
                    </div>

                    {/* Checkout Button for this seller */}
                    <button
                      onClick={() => handleCheckoutSeller(sellerCart.sellerId)}
                      className="w-full bg-amber-500 text-white font-semibold py-3 px-6 rounded-full text-lg hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-300 transition duration-300 flex items-center justify-center"
                    >
                      Checkout Toko Ini <ChevronRightIcon />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Total Summary Card */}
            {cartsBySeller.length > 1 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
                <h3 className="text-lg font-bold text-blue-900 mb-4">Ringkasan Total Belanja</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-800">Total dari {cartsBySeller.length} toko</span>
                    <span className="font-bold text-blue-900">Rp {formatPrice(
                      cartsBySeller.reduce((sum, seller) => {
                        const { total } = calculateTotalBySeller(seller.items);
                        return sum + total;
                      }, 0)
                    )}</span>
                  </div>
                </div>
                <p className="text-xs text-blue-700 mt-4">
                  💡 Setiap toko akan diproses sebagai pesanan terpisah
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
