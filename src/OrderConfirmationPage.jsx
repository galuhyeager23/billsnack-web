import React from "react";
import { Link, useLocation } from "react-router-dom";

const OrderConfirmationPage = () => {
  const location = useLocation();
  const { orderId, total, paymentMethod, shippingMethod } = location.state || {
    orderId: "N/A",
    total: 0,
    paymentMethod: "qris",
    shippingMethod: "gosend",
  };

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
                <strong>Amount:</strong> Rp{total.toFixed(2)}
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
              <strong>Rp{total.toFixed(2)}</strong> for faster service.
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
            Order Total:{" "}
            <span className="font-semibold text-black">
              Rp{total.toFixed(2)}
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
        <Link
          to="/shop"
          className="mt-8 inline-block bg-amber-500 text-white font-semibold py-3 px-8 rounded-full text-lg hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-300 transition duration-300"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
