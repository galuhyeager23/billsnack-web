import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import formatPrice from "./utils/format";

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:4000';

// Simple inline modal component to allow leaving a review without navigating away
function ReviewModal({ open, product, onClose, onSuccess, onError }) {
  const { token } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitHover, setSubmitHover] = useState(false);

  const submit = async (ev) => {
    ev.preventDefault();
    if (!token) {
      if (onError) onError('Silakan login terlebih dahulu untuk mengirim ulasan.');
      return;
    }
    if (!product || !product.id) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: product.id, rating: Number(rating), comment }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Gagal mengirim ulasan');
      }
      if (onSuccess) onSuccess('Ulasan berhasil dikirim. Terima kasih!');
      setComment('');
      setRating(5);
      if (onClose) onClose();
    } catch (err) {
      console.error('Review submit error', err);
      if (onError) onError(err.message || 'Gagal mengirim ulasan');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-green-50 rounded-lg p-6 w-full max-w-lg border border-green-100">
        <div className="flex items-center space-x-4 mb-3">
          {product && product.image ? (
            <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded" />
          ) : (
            <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-sm text-gray-500">No</div>
          )}
          <h3 className="text-lg font-semibold">Tinggalkan Ulasan — {product && product.name}</h3>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium">Rating</label>
            <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="mt-1 rounded-md border px-3 py-2">
              {[5,4,3,2,1].map(v => <option key={v} value={v}>{v} bintang</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Ulasan</label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4} className="mt-1 w-full rounded-md border px-3 py-2" />
          </div>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={() => onClose && onClose()} className="px-4 py-2 border border-gray-300 rounded bg-white hover:bg-gray-50">Batal</button>
            <button
              type="submit"
              disabled={submitting}
              onMouseEnter={() => setSubmitHover(true)}
              onMouseLeave={() => setSubmitHover(false)}
              className="px-4 py-2 text-white rounded focus:outline-none transition"
              style={{ backgroundColor: submitting ? '#FFB380' : (submitHover ? '#E65A00' : '#FF6B00') }}
            >
              {submitting ? 'Mengirim...' : 'Kirim Ulasan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const OrderConfirmationPage = () => {
  const location = useLocation();
  const { orderId, total, paymentMethod, shippingMethod } = location.state || {
    orderId: "N/A",
    total: 0,
    paymentMethod: "qris",
    shippingMethod: "gosend",
  };

  // Toast state for small notifications
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalProduct, setModalProduct] = useState(null);
  const [reviewBtnHover, setReviewBtnHover] = useState(false);

  const getPaymentInstructions = () => {
    switch (paymentMethod) {
      case "qris":
        return (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
            <h3 className="font-semibold text-blue-800">
              QRIS Payment Instructions
            </h3>
            <p className="text-sm text-blue-700 mt-2">
              Please complete your QRIS payment using your preferred e-wallet
              app. Your order will be processed once payment is confirmed.
            </p>
            <div className="mt-4 flex items-center justify-center">
              <div className="w-56 h-56 bg-white rounded-lg p-3 flex items-center justify-center">
                <img
                  src="/assets/qrisbillsnack.jpg"
                  alt="QRIS BillSnack"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    try {
                      if (e && e.target) e.target.src = '/qris-billsnack.svg';
                    } catch {
                      /* ignore */
                    }
                  }}
                />
              </div>
            </div>
          </div>
        );
      case "bank":
        return (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
            <h3 className="font-semibold text-green-800">
              Bank Transfer Instructions
            </h3>
            <div className="text-sm text-green-700 mt-2 space-y-1">
              <p>
                <strong>Bank:</strong> BCA
              </p>
              <p>
                <strong>Account Number:</strong> 1234567890
              </p>
              <p>
                <strong>Account Name:</strong> BillSnack Store
              </p>
              <p>
                <strong>Amount:</strong> Rp{formatPrice(total)}
              </p>
            </div>
            <p className="text-sm text-green-700 mt-2">
              Please include order ID <strong>{orderId}</strong> in the transfer
              description. Processing time: 1-2 business days.
            </p>
          </div>
        );
      case "cod":
        return (
          <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded">
            <h3 className="font-semibold text-orange-800">
              Cash on Delivery Instructions
            </h3>
            <p className="text-sm text-orange-700 mt-2">
              You will pay in cash when your order is delivered to your address.
              Please prepare the exact amount of{" "}
              <strong>Rp{formatPrice(total)}</strong> for faster service.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="px-8 sm:px-12 lg:px-16 py-20 text-center">
      <div className="bg-white p-12 rounded-lg shadow-lg max-w-4xl mx-auto">
        <svg
          className="h-16 w-16 text-green-500 mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h1 className="text-3xl font-bold text-gray-900">
          Thank You For Your Order!
        </h1>
        <p className="text-gray-600 mt-4">
          Your order has been placed successfully. A confirmation email has been
          sent to you.
        </p>
        <div className="mt-8 border-t border-b py-4">
          <p className="text-lg">
            Order ID:{" "}
            <span className="font-semibold text-black">{orderId}</span>
          </p>
          <p className="text-lg">
            Order Total: {" "}
            <span className="font-semibold text-black">
              Rp{formatPrice(total)}
            </span>
          </p>
          <p className="text-lg">
            Payment Method:{" "}
            <span className="font-semibold text-black">
              {paymentMethod === "qris"
                ? "QRIS"
                : paymentMethod === "bank"
                ? "Bank Transfer"
                : paymentMethod === "cod"
                ? "Cash on Delivery"
                : paymentMethod}
            </span>
          </p>
          <p className="text-lg">
            Shipping Method:{" "}
            <span className="font-semibold text-black">
              {shippingMethod === "gosend"
                ? "GoSend (Instant)"
                : shippingMethod === "jne"
                ? "JNE (2-3 days)"
                : shippingMethod === "jnt"
                ? "JNT (1-2 days)"
                : shippingMethod}
            </span>
          </p>
        </div>
  {getPaymentInstructions()}
  {/* Review Modal markup */}
  <ReviewModal open={modalOpen} product={modalProduct} onClose={() => setModalOpen(false)} onSuccess={(m) => showToast(m || 'Ulasan tersimpan')} onError={(m) => showToast(m || 'Gagal', 'error')} />
        <Link
          to="/shop"
          className="mt-8 inline-block bg-amber-500 text-white font-semibold py-3 px-8 rounded-full text-lg hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-300 transition duration-300"
        >
          Continue Shopping
        </Link>
        {/* Purchased items — show quick links to leave reviews */}
        {location.state && location.state.items && location.state.items.length > 0 && (
          <div className="mt-6 text-left">
            <h3 className="text-lg font-semibold mb-3">Produk yang dibeli</h3>
            <div className="space-y-3">
              {location.state.items.map((it) => (
                <div key={it.id} className="flex items-center justify-between p-3 border rounded bg-green-50 border-green-100">
                  <div className="flex items-center space-x-3">
                    {it.image ? (
                      <img src={it.image} alt={it.name} className="w-16 h-16 object-cover rounded" />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-sm text-gray-500">No Image</div>
                    )}
                    <div className="font-medium">{it.name}</div>
                  </div>
                  <div className="space-x-2">
                    <Link to={`/product/${it.id}`} className="text-sm text-blue-600 underline">Lihat Produk</Link>
                    <button
                      onClick={() => { setModalProduct(it); setModalOpen(true); }}
                      onMouseEnter={() => setReviewBtnHover(true)}
                      onMouseLeave={() => setReviewBtnHover(false)}
                      className="inline-block ml-2 text-white text-sm px-3 py-1 rounded focus:outline-none transition"
                      style={{ backgroundColor: reviewBtnHover ? '#E65A00' : '#FF6B00' }}
                    >
                      Tinggalkan Ulasan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* toast */}
        {toast && (
          <div className={`fixed top-6 right-6 z-50 ${toast.type === 'error' ? '' : ''}`}>
            <div className={`px-4 py-2 rounded shadow-lg ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
              {toast.message}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
