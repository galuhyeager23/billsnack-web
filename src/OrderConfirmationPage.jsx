import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import formatPrice from "./utils/format";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? typeof window !== "undefined"
      ? window.location.origin
      : ""
    : "http://localhost:4000");

// Simple inline modal component to allow leaving a review without navigating away
function ReviewModal({ open, product, onClose, onSuccess, onError }) {
  const { token } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitHover, setSubmitHover] = useState(false);

  const submit = async (ev) => {
    ev.preventDefault();
    if (!token) {
      if (onError)
        onError("Silakan login terlebih dahulu untuk mengirim ulasan.");
      return;
    }
    if (!product || !product.id) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product.id,
          rating: Number(rating),
          comment,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Gagal mengirim ulasan");
      }
      if (onSuccess) onSuccess("Ulasan berhasil dikirim. Terima kasih!");
      setComment("");
      setRating(5);
      if (onClose) onClose();
    } catch (err) {
      console.error("Review submit error", err);
      if (onError) onError(err.message || "Gagal mengirim ulasan");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="card p-6 w-full max-w-lg">
        <div className="flex items-center space-x-4 mb-3">
          {product && product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-12 h-12 object-cover rounded"
            />
          ) : (
            <div className="w-12 h-12 bg-surface rounded flex items-center justify-center text-sm text-muted">
              No
            </div>
          )}
          <h3 className="text-lg font-semibold">
            Tinggalkan Ulasan — {product && product.name}
          </h3>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium">Rating</label>
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="mt-1 rounded-md border px-3 py-2"
            >
              {[5, 4, 3, 2, 1].map((v) => (
                <option key={v} value={v}>
                  {v} bintang
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Ulasan</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => onClose && onClose()}
              className="btn-secondary"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              onMouseEnter={() => setSubmitHover(true)}
              onMouseLeave={() => setSubmitHover(false)}
              className="px-4 py-2 text-white rounded focus:outline-none transition"
              style={{
                backgroundColor: submitting
                  ? "#FFB380"
                  : submitHover
                  ? "#E65A00"
                  : "#FF6B00",
              }}
            >
              {submitting ? "Mengirim..." : "Kirim Ulasan"}
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
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // WhatsApp copy/link state
  const [copySuccess, setCopySuccess] = useState(null);
  // helper to download images (used for QR download)
  const downloadImage = async (url, filename) => {
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error("Network response not ok");
      const blob = await resp.blob();
      const urlObj = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = urlObj;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(urlObj);
      showToast("Mengunduh QR berhasil");
    } catch (err) {
      console.error("Download failed", err);
      showToast("Gagal mengunduh gambar", "error");
    }
  };

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalProduct, setModalProduct] = useState(null);
  const [reviewBtnHover, setReviewBtnHover] = useState(false);

  // helper to build WhatsApp message/link (avoid nested template literals in JSX)

  const getPaymentInstructions = () => {
    switch (paymentMethod) {
      case "qris":
        return (
          <div className="mt-4 p-4 bg-surface-alt border-base rounded-lg">
            <h3 className="font-semibold text-muted">
              QRIS Payment Instructions
            </h3>
            <div className="text-sm text-muted mt-2">
              <p>
                Silakan selesaikan pembayaran QRIS Anda menggunakan aplikasi
                e-wallet pilihan Anda. Pesanan akan diproses setelah pembayaran
                dikonfirmasi.
              </p>
              {/* WhatsApp payment proof UI (styled card) */}
              <div className="mt-4 w-full max-w-md">
                <div className="card p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-green-700"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M20.52 3.478A11.773 11.773 0 0012 .5C6.201.5 1.5 5.201 1.5 11c0 1.945.507 3.78 1.477 5.397L.75 23.25l6.962-2.273A11.986 11.986 0 0012 23.5c5.799 0 10.5-4.701 10.5-10.5 0-2.975-1.168-5.71-3.98-9.522z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <h4 className="text-sm font-semibold">
                          Kirim Bukti Pembayaran ke Admin
                        </h4>
                        <div className="text-xs text-muted">
                          Admin:{" "}
                          <strong className="text">+62 895-2445-2716</strong>
                        </div>
                      </div>
                      <p className="text-sm text-muted mt-1">
                        Setelah melakukan pembayaran, kirim bukti lewat WhatsApp
                        dan sertakan foto bukti serta Order ID.
                      </p>

                      <textarea
                        readOnly
                        rows={3}
                        value={`Halo, saya sudah melakukan pembayaran untuk Order ID: ${orderId}. Total: Rp${formatPrice(
                          total
                        )}. Mohon konfirmasi. Terima kasih.`}
                        className="mt-3 w-full text-sm p-3 rounded-lg border border-base bg-surface resize-none text-muted"
                      />

                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            const msg = `Halo, saya sudah melakukan pembayaran untuk Order ID: ${orderId}. Total: Rp${formatPrice(
                              total
                            )}. Mohon konfirmasi. Terima kasih.`;
                            try {
                              await navigator.clipboard.writeText(msg);
                              setCopySuccess("Tersalin");
                              setTimeout(() => setCopySuccess(null), 2500);
                            } catch (err) {
                              console.error("Copy failed", err);
                              setCopySuccess("Gagal menyalin");
                              setTimeout(() => setCopySuccess(null), 2500);
                            }
                          }}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 17l4 4 4-4m0-12l-4 4-4-4"
                            />
                          </svg>
                          <span>Salin Pesan</span>
                        </button>

                        <a
                          href={`https://wa.me/6288973294105?text=${encodeURIComponent(
                            `Halo, saya sudah melakukan pembayaran untuk Order ID: ${orderId}. Total: Rp${formatPrice(
                              total
                            )}. Mohon konfirmasi. Terima kasih.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition-colors"
                        >
                          <svg
                            className="w-4 h-4"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M20.52 3.478A11.773 11.773 0 0012 .5C6.201.5 1.5 5.201 1.5 11c0 1.945.507 3.78 1.477 5.397L.75 23.25l6.962-2.273A11.986 11.986 0 0012 23.5c5.799 0 10.5-4.701 10.5-10.5 0-2.975-1.168-5.71-3.98-9.522z" />
                          </svg>
                          Kirim via WhatsApp
                        </a>

                        {copySuccess && (
                          <span className="ml-2 text-sm accent-text">
                            {copySuccess}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-col items-center justify-center">
              <p className="text-sm font-medium text-blue-800 mb-2">
                Scan QRIS Code:
              </p>
              <div className="w-64 h-64 bg-surface rounded-lg p-3 shadow-md border border-base">
                <img
                  src="/qrisbillsnack.jpg"
                  alt="QRIS BillSnack"
                  className="w-full h-full object-contain"
                  onError={() => {
                    console.error("Failed to load QRIS image");
                  }}
                />
              </div>
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() =>
                    downloadImage(
                      "/qrisbillsnack.jpg",
                      `qris-${orderId || "order"}.jpg`
                    )
                  }
                  className="btn-secondary"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5 5 5M12 5v12"
                    />
                  </svg>
                  <span className="ml-2">Unduh QR</span>
                </button>
              </div>
            </div>
          </div>
        );
      case "bank":
        return (
          <div className="mt-4 p-4 bg-surface-alt border-base rounded-lg">
            <h3 className="font-semibold text-muted">
              Bank Transfer Instructions
            </h3>
            <div className="text-sm text-muted mt-2 space-y-1">
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
            <p className="text-sm text-muted mt-2">
              Please include order ID <strong>{orderId}</strong> in the transfer
              description. Processing time: 1-2 business days.
            </p>
            {/* WhatsApp payment proof UI for bank transfer */}
            <div className="mt-4 w-full max-w-xs text-left">
              <p className="text-sm font-medium mb-2">
                Kirim Bukti Transfer ke Admin
              </p>
              <p className="text-sm text-muted">
                Setelah melakukan transfer, kirimkan bukti transfer melalui
                WhatsApp ke admin. Sertakan informasi transfer dan Order ID.
              </p>
              <div className="card mt-3 p-3">
                <label className="block text-xs text-muted mb-1">
                  Pesan (tersiap otomatis)
                </label>
                <textarea
                  readOnly
                  rows={3}
                  value={`Halo, saya sudah transfer ke BCA 1234567890 a.n BillSnack Store untuk Order ID: ${orderId}. Total: Rp${formatPrice(
                    total
                  )}. Mohon konfirmasi. Terima kasih.`}
                  className="w-full text-sm p-2 border rounded resize-none bg-surface text-muted border-base"
                />
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        const msg = `Halo, saya sudah transfer ke BCA 1234567890 a.n BillSnack Store untuk Order ID: ${orderId}. Total: Rp${formatPrice(
                          total
                        )}. Mohon konfirmasi. Terima kasih.`;
                        try {
                          await navigator.clipboard.writeText(msg);
                          setCopySuccess("Tersalin");
                          setTimeout(() => setCopySuccess(null), 2500);
                        } catch (err) {
                          console.error("Copy failed", err);
                          setCopySuccess("Gagal menyalin");
                          setTimeout(() => setCopySuccess(null), 2500);
                        }
                      }}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                    >
                      Salin Pesan
                    </button>
                    {copySuccess && (
                      <span className="text-sm text-muted">{copySuccess}</span>
                    )}
                  </div>
                  <a
                    href={`https://wa.me/6288973294105?text=${encodeURIComponent(
                      `Halo, saya sudah transfer ke BCA 1234567890 a.n BillSnack Store untuk Order ID: ${orderId}. Total: Rp${formatPrice(
                        total
                      )}. Mohon konfirmasi. Terima kasih.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition-colors"
                  >
                    Kirim via WhatsApp
                  </a>
                </div>
                <p className="mt-2 text-xs text-muted">
                  Nomor admin:{" "}
                  <strong className="text">+62 895-2445-2716</strong>
                </p>
              </div>
            </div>
          </div>
        );
      case "cod":
        return (
          <div className="mt-4 p-4 bg-surface-alt border-base rounded-lg">
            <h3 className="font-semibold text-muted">
              Cash on Delivery Instructions
            </h3>
            <p className="text-sm text-muted mt-2">
              You will pay in cash when your order is delivered to your address.
              Please prepare the exact amount of{" "}
              <strong className="text">Rp{formatPrice(total)}</strong> for
              faster service.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-neutral-900 dark:to-neutral-800">
      <div className="px-8 sm:px-12 lg:px-16 py-20">
        <div className="card p-12 max-w-4xl mx-auto shadow-2xl">
          {/* Success Animation */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg
                  className="h-12 w-12 text-green-600 dark:text-green-400"
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
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full animate-bounce">
                <span className="text-white text-xs font-bold flex items-center justify-center h-full">
                  ✓
                </span>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Pesanan Berhasil!
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Terima kasih telah berbelanja di Billsnack. Pesanan Anda sedang
              diproses.
            </p>
          </div>

          {/* Order Details Card */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-neutral-800 dark:to-neutral-700 rounded-xl p-6 mb-8 border border-blue-200 dark:border-neutral-600">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Detail Pesanan
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">
                    ID Pesanan:
                  </span>
                  <span className="font-mono font-semibold text-gray-900 dark:text-white">
                    {orderId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">
                    Total Pembayaran:
                  </span>
                  <span className="font-bold text-lg text-green-600 dark:text-green-400">
                    Rp{formatPrice(total)}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">
                    Metode Pembayaran:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {paymentMethod === "qris"
                      ? "QRIS"
                      : paymentMethod === "bank"
                      ? "Transfer Bank"
                      : paymentMethod === "cod"
                      ? "Bayar di Tempat"
                      : paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">
                    Pengiriman:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {shippingMethod === "gosend"
                      ? "GoSend (Instant)"
                      : shippingMethod === "jne"
                      ? "JNE (2-3 hari)"
                      : shippingMethod === "jnt"
                      ? "JNT (1-2 hari)"
                      : shippingMethod}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-gray-200 dark:border-neutral-600 text-center shadow-lg">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Pembayaran
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Selesaikan pembayaran sesuai instruksi di bawah
              </p>
            </div>
            <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-gray-200 dark:border-neutral-600 text-center shadow-lg">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-yellow-600 dark:text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Pemrosesan
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Pesanan akan diproses dalam 1-2 hari kerja
              </p>
            </div>
            <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-gray-200 dark:border-neutral-600 text-center shadow-lg">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Pengiriman
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Barang akan dikirim sesuai metode yang dipilih
              </p>
            </div>
          </div>

          {/* Render Payment Instructions */}
          {getPaymentInstructions()}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Link
              to="/orders"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Lihat Riwayat Pesanan
            </Link>
            <Link
              to="/shop"
              className="inline-flex items-center justify-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              Lanjut Belanja
            </Link>
          </div>

          {/* Purchased Items List */}
          {location.state &&
            location.state.items &&
            location.state.items.length > 0 && (
              <div className="mt-6 text-left">
                <h3 className="text-lg font-semibold mb-3">
                  Produk yang dibeli
                </h3>
                <div className="space-y-3">
                  {location.state.items.map((it) => (
                    <div
                      key={it.id}
                      className="flex items-center justify-between p-3 border rounded card"
                    >
                      <div className="flex items-center space-x-3">
                        {it.image ? (
                          <img
                            src={it.image}
                            alt={it.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-surface rounded flex items-center justify-center text-sm text-muted">
                            No Image
                          </div>
                        )}
                        <div className="font-medium">{it.name}</div>
                      </div>
                      <div className="space-x-2">
                        <Link
                          to={`/product/${it.id}`}
                          className="text-sm accent-text underline"
                        >
                          Lihat Produk
                        </Link>
                        <button
                          onClick={() => {
                            setModalProduct(it);
                            setModalOpen(true);
                          }}
                          onMouseEnter={() => setReviewBtnHover(true)}
                          onMouseLeave={() => setReviewBtnHover(false)}
                          className="inline-block ml-2 text-white text-sm px-3 py-1 rounded focus:outline-none transition"
                          style={{
                            backgroundColor: reviewBtnHover
                              ? "#E65A00"
                              : "#FF6B00",
                          }}
                        >
                          Tinggalkan Ulasan
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50`}>
          <div
            className={`px-4 py-2 rounded shadow-lg ${
              toast.type === "error"
                ? "bg-red-600 text-white"
                : "bg-green-600 text-white"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}

      {/* Review Modal - Perlu dirender agar popup berfungsi */}
      <ReviewModal
        open={modalOpen}
        product={modalProduct}
        onClose={() => setModalOpen(false)}
        onSuccess={(msg) => showToast(msg, "success")}
        onError={(msg) => showToast(msg, "error")}
      />
    </div>
  );
};

export default OrderConfirmationPage;
