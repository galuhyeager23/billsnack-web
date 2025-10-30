import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "./contexts/CartContext";
import { useAuth } from "./contexts/AuthContext";

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

const CheckoutPage = () => {
  const { cartItems, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState("qris");
  const [shippingMethod, setShippingMethod] = useState("gosend");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        postalCode: user.postalCode || "",
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const discount = subtotal * 0.2;

  // Calculate delivery fee based on shipping method
  const getDeliveryFee = () => {
    switch (shippingMethod) {
      case "gosend":
        return 0; // Free delivery
      case "jne":
        return 5;
      case "jnt":
        return 8;
      default:
        return 15; // Default fallback
    }
  };

  const deliveryFee = getDeliveryFee();
  const total = subtotal - discount + deliveryFee;

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    // Here you would typically process the payment based on method
    console.log(
      "Order placed with payment method:",
      paymentMethod,
      "and shipping method:",
      shippingMethod
    );
    const orderId = Math.random().toString(36).substr(2, 9).toUpperCase();
    clearCart();
    navigate("/order-confirmation", {
      state: { orderId, total, paymentMethod, shippingMethod },
    });
  };

  if (cartItems.length === 0) {
    return (
      <div className="px-8 sm:px-12 lg:px-16 py-20 text-center">
        <h1 className="text-3xl font-bold">Keranjang Anda Kosong</h1>
        <p className="text-gray-600 mt-4">
          Anda perlu menambahkan item ke keranjang sebelum dapat checkout.
        </p>
        <Link
          to="/shop"
          className="mt-6 inline-block bg-black text-white font-semibold py-3 px-8 rounded-full text-lg hover:bg-gray-800 transition duration-300"
        >
          Kembali ke Toko
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <div className="px-8 sm:px-12 lg:px-16 py-12">
        <nav className="flex items-center text-sm text-gray-500 mb-8">
          <Link to="/" className="hover:text-gray-700">
            Beranda
          </Link>{" "}
          <ChevronRightIcon />
          <Link to="/cart" className="hover:text-gray-700">
            Keranjang
          </Link>{" "}
          <ChevronRightIcon />
          <span className="text-gray-700 font-medium">Checkout</span>
        </nav>
        <h1 className="text-4xl font-bold mb-8">Checkout</h1>
        <form
          onSubmit={handlePlaceOrder}
          className="grid grid-cols-1 lg:grid-cols-3 gap-12"
        >
          <div className="lg:col-span-2 bg-white p-8 rounded-lg shadow space-y-8">
            {/* Shipping Information */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Informasi Pengiriman</h2>
              {user && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    Informasi telah diisi sebelumnya dari profil Anda.{" "}
                    <Link
                      to="/profile"
                      className="underline hover:text-blue-600"
                    >
                      Perbarui profil
                    </Link>
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Username"
                  required
                  className="bg-gray-100 p-3 rounded-md w-full sm:col-span-2"
                />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Alamat Email"
                  required
                  className="bg-gray-100 p-3 rounded-md w-full sm:col-span-2"
                />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Nomor Telepon"
                  required
                  className="bg-gray-100 p-3 rounded-md w-full sm:col-span-2"
                />
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Alamat Lengkap"
                  required
                  className="bg-gray-100 p-3 rounded-md w-full sm:col-span-2"
                />
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="Kota"
                  required
                  className="bg-gray-100 p-3 rounded-md w-full"
                />
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  placeholder="Kode Pos"
                  required
                  className="bg-gray-100 p-3 rounded-md w-full"
                />
              </div>
            </div>

            {/* Shipping Method */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Metode Pengiriman</h2>
              <div className="space-y-3">
                <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="shippingMethod"
                    value="gosend"
                    checked={shippingMethod === "gosend"}
                    onChange={(e) => setShippingMethod(e.target.value)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-semibold">GoSend</div>
                    <div className="text-sm text-gray-600">
                      Pengiriman instan dalam 1-2 jam
                    </div>
                    <div className="text-sm font-medium text-green-600">
                      Gratis ongkir
                    </div>
                  </div>
                </label>
                <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="shippingMethod"
                    value="jne"
                    checked={shippingMethod === "jne"}
                    onChange={(e) => setShippingMethod(e.target.value)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-semibold">JNE</div>
                    <div className="text-sm text-gray-600">
                      Pengiriman reguler 2-3 hari kerja
                    </div>
                    <div className="text-sm font-medium text-green-600">
                      Rp5.00
                    </div>
                  </div>
                </label>
                <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="shippingMethod"
                    value="jnt"
                    checked={shippingMethod === "jnt"}
                    onChange={(e) => setShippingMethod(e.target.value)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-semibold">JNT</div>
                    <div className="text-sm text-gray-600">
                      Pengiriman express 1-2 hari kerja
                    </div>
                    <div className="text-sm font-medium text-green-600">
                      Rp8.00
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Payment Information */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Detail Pembayaran</h2>

              {/* Payment Method Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">
                  Pilih Metode Pembayaran
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="qris"
                      checked={paymentMethod === "qris"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <span>QRIS</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank"
                      checked={paymentMethod === "bank"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <span>Transfer Bank</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <span>Bayar di Tempat (COD)</span>
                  </label>
                </div>
              </div>

              {/* Payment Details Based on Method */}
              {paymentMethod === "qris" && (
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">
                    Scan Kode QR untuk Membayar
                  </h3>
                  <div className="bg-white p-4 rounded-lg inline-block">
                    {/* Placeholder for QR Code */}
                    <div className="w-48 h-48 bg-gray-200 flex items-center justify-center rounded-lg">
                      <span className="text-gray-500">Kode QRIS</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-4">
                    Scan kode QR ini dengan aplikasi e-wallet Anda untuk menyelesaikan pembayaran
                  </p>
                  <p className="text-lg font-bold mt-2">
                    Total: Rp{total.toFixed(2)}
                  </p>
                </div>
              )}

              {paymentMethod === "bank" && (
                <div className="p-6 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">
                    Detail Transfer Bank
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Bank:</span>
                      <span>BCA</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Nomor Rekening:</span>
                      <span className="font-mono">1234567890</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Nama Rekening:</span>
                      <span>BillSnack Store</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Jumlah:</span>
                      <span className="font-bold">Rp{total.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-800">
                      <strong>Penting:</strong> Harap sertakan ID pesanan Anda
                      dalam deskripsi transfer. Pesanan Anda akan diproses
                      setelah pembayaran dikonfirmasi (biasanya dalam 1-2 hari kerja).
                    </p>
                  </div>
                </div>
              )}

              {paymentMethod === "cod" && (
                <div className="p-6 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">
                    Bayar di Tempat
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Metode Pembayaran:</span>
                      <span>Bayar di Tempat</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Total Pembayaran:</span>
                      <span className="font-bold">Rp{total.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm text-blue-800">
                      <strong>Catatan:</strong> Anda akan membayar tunai saat
                      pesanan dikirim ke alamat Anda. Harap siapkan jumlah yang tepat
                      untuk pelayanan yang lebih cepat.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white p-8 rounded-lg shadow h-fit">
            <h2 className="text-2xl font-bold mb-6 border-b pb-4">
              Ringkasan Pesanan
            </h2>
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="text-gray-600">
                    {item.name} x {item.quantity}
                  </span>
                  <span className="font-semibold">
                    Rp{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="space-y-4 text-lg mt-6 border-t pt-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">Rp{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Diskon (-20%)</span>
                <span className="font-semibold text-red-500">
                  -Rp{discount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">
                  Biaya Pengiriman (
                  {shippingMethod === "gosend"
                    ? "GoSend"
                    : shippingMethod === "jne"
                    ? "JNE"
                    : shippingMethod === "jnt"
                    ? "JNT"
                    : "Standard"}
                  )
                </span>
                <span className="font-semibold">Rp{deliveryFee.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex justify-between text-2xl font-bold mt-6 border-t pt-4">
              <span>Total</span>
              <span>Rp{total.toFixed(2)}</span>
            </div>

            <button
              type="submit"
              className="w-full mt-6 bg-black text-white font-semibold py-4 px-8 rounded-full text-lg hover:bg-gray-800 transition duration-300"
            >
              Buat Pesanan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutPage;
