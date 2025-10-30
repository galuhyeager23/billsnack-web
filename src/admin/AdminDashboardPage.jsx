import React from "react";
import { useProducts } from "../contexts/ProductContext";
import { useAuth } from "../contexts/AuthContext";

const AdminDashboardPage = () => {
  const { products } = useProducts();
  const { user } = useAuth();

  // Mock transaction data
  const transactions = [
    {
      id: "TXN001",
      orderId: "ABC123",
      customer: "John Doe",
      amount: 125.00,
      paymentMethod: "QRIS",
      status: "Selesai",
      date: "2025-10-18"
    },
    {
      id: "TXN002",
      orderId: "DEF456",
      customer: "Jane Smith",
      amount: 89.50,
      paymentMethod: "Transfer Bank",
      status: "Menunggu",
      date: "2025-10-17"
    },
    {
      id: "TXN003",
      orderId: "GHI789",
      customer: "Bob Johnson",
      amount: 245.75,
      paymentMethod: "QRIS",
      status: "Selesai",
      date: "2025-10-16"
    },
    {
      id: "TXN004",
      orderId: "JKL012",
      customer: "Alice Brown",
      amount: 67.25,
      paymentMethod: "Transfer Bank",
      status: "Selesai",
      date: "2025-10-15"
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "Selesai":
        return "text-green-600 bg-green-100";
      case "Menunggu":
        return "text-yellow-600 bg-yellow-100";
      case "Gagal":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Dasbor</h1>
      <p className="text-lg text-gray-600 mb-8">
        Selamat datang kembali, {user?.name || "Admin"}!
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-700">
            Total Produk
          </h2>
          <p className="text-5xl font-bold mt-2 text-blue-600">
            {products.length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-700">
            Total Kategori
          </h2>
          <p className="text-5xl font-bold mt-2 text-green-600">
            {new Set(products.map((p) => p.category)).size}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-700">
            Total Transaksi
          </h2>
          <p className="text-5xl font-bold mt-2 text-purple-600">
            {transactions.length}
          </p>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Transaksi Terbaru</h2>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID Transaksi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID Pesanan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pelanggan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jumlah
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Metode Pembayaran
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {transaction.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.orderId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.customer}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Rp{transaction.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.paymentMethod}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
