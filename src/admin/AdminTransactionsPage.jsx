import React, { useState } from "react";

const AdminTransactionsPage = () => {
  // Mock transaction data
  const [transactions] = useState([
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
    },
    {
      id: "TXN005",
      orderId: "MNO345",
      customer: "Charlie Wilson",
      amount: 199.99,
      paymentMethod: "QRIS",
      status: "Gagal",
      date: "2025-10-14"
    },
    {
      id: "TXN006",
      orderId: "PQR678",
      customer: "Diana Prince",
      amount: 156.75,
      paymentMethod: "COD",
      status: "Dikirim",
      date: "2025-10-13"
    },
    {
      id: "TXN007",
      orderId: "STU901",
      customer: "Eve Adams",
      amount: 89.25,
      paymentMethod: "COD",
      status: "Dalam Pengiriman",
      date: "2025-10-12"
    },
    {
      id: "TXN008",
      orderId: "VWX234",
      customer: "Frank Miller",
      amount: 234.50,
      paymentMethod: "COD",
      status: "Dikirim",
      date: "2025-10-11"
    }
  ]);

  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState("All");

  const getStatusColor = (status) => {
    switch (status) {
      case "Selesai":
        return "text-green-600 bg-green-100";
      case "Menunggu":
        return "text-yellow-600 bg-yellow-100";
      case "Gagal":
        return "text-red-600 bg-red-100";
      case "Dikirim":
        return "text-blue-600 bg-blue-100";
      case "Dalam Pengiriman":
        return "text-orange-600 bg-orange-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const statusMatch = filterStatus === "All" || transaction.status === filterStatus;
    const paymentMatch = filterPaymentMethod === "All" || transaction.paymentMethod === filterPaymentMethod;
    return statusMatch && paymentMatch;
  });

  const totalAmount = filteredTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Transaksi</h1>
      <p className="text-lg text-gray-600 mb-8">
        Kelola dan pantau semua transaksi pembayaran
      </p>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Total Transaksi</h3>
          <p className="text-3xl font-bold mt-2 text-blue-600">{transactions.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Selesai</h3>
          <p className="text-3xl font-bold mt-2 text-green-600">
            {transactions.filter(t => t.status === "Selesai").length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Menunggu</h3>
          <p className="text-3xl font-bold mt-2 text-yellow-600">
            {transactions.filter(t => t.status === "Menunggu").length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Dikirim</h3>
          <p className="text-3xl font-bold mt-2 text-blue-600">
            {transactions.filter(t => t.status === "Dikirim").length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Dalam Pengiriman</h3>
          <p className="text-3xl font-bold mt-2 text-orange-600">
            {transactions.filter(t => t.status === "Dalam Pengiriman").length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Total Pendapatan</h3>
          <p className="text-3xl font-bold mt-2 text-purple-600">
            Rp{transactions.filter(t => t.status === "Selesai" || t.status === "Dikirim").reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">Semua Status</option>
              <option value="Selesai">Selesai</option>
              <option value="Menunggu">Menunggu</option>
              <option value="Gagal">Gagal</option>
              <option value="Dikirim">Dikirim</option>
              <option value="Dalam Pengiriman">Dalam Pengiriman</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Metode Pembayaran</label>
            <select
              value={filterPaymentMethod}
              onChange={(e) => setFilterPaymentMethod(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">Semua Metode</option>
              <option value="QRIS">QRIS</option>
              <option value="Transfer Bank">Transfer Bank</option>
              <option value="COD">COD</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Daftar Transaksi ({filteredTransactions.length} transaksi)
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Total Jumlah: Rp{totalAmount.toFixed(2)}
          </p>
        </div>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button className="text-blue-600 hover:text-blue-900 mr-2">
                      Lihat
                    </button>
                    {transaction.status === "Menunggu" && (
                      <button className="text-green-600 hover:text-green-900 mr-2">
                        Konfirmasi
                      </button>
                    )}
                    {transaction.status === "Dalam Pengiriman" && transaction.paymentMethod === "COD" && (
                      <button className="text-blue-600 hover:text-blue-900">
                        Tandai Dikirim
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredTransactions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Tidak ada transaksi yang ditemukan sesuai filter yang dipilih.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTransactionsPage;