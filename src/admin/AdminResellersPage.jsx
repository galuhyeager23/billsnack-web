import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const AdminResellersPage = () => {
  const [resellers, setResellers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Dummy data for resselers
  useEffect(() => {
    const dummyResellers = [
      {
        id: 1,
        name: "Toko Cemilan Jaya",
        email: "toko.jaya@email.com",
        phone: "0812345678",
        address: "Jl. Merdeka No. 10, Bandung",
        status: "active",
        totalProducts: 12,
        totalSales: 156,
        joinDate: "2024-01-15",
      },
      {
        id: 2,
        name: "Reseller Snack Mantap",
        email: "snack.mantap@email.com",
        phone: "0823456789",
        address: "Jl. Sudirman No. 25, Jakarta",
        status: "active",
        totalProducts: 8,
        totalSales: 89,
        joinDate: "2024-02-20",
      },
      {
        id: 3,
        name: "Cemilan Nusantara",
        email: "cemilan.nusantara@email.com",
        phone: "0834567890",
        address: "Jl. Ahmad Yani No. 5, Surabaya",
        status: "inactive",
        totalProducts: 5,
        totalSales: 45,
        joinDate: "2024-03-10",
      },
      {
        id: 4,
        name: "Snack Pilihan Terbaik",
        email: "snack.terbaik@email.com",
        phone: "0845678901",
        address: "Jl. Gatot Subroto No. 30, Medan",
        status: "active",
        totalProducts: 15,
        totalSales: 234,
        joinDate: "2024-01-05",
      },
    ];
    setResellers(dummyResellers);
  }, []);

  // Filter resellers based on search and status
  const filteredResellers = resellers.filter((reseller) => {
    const matchesSearch =
      reseller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reseller.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || reseller.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = (id, name) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus resseler "${name}"?`)) {
      setResellers(resellers.filter((reseller) => reseller.id !== id));
      alert("Resseler berhasil dihapus!");
    }
  };

  const toggleStatus = (id) => {
    setResellers(
      resellers.map((reseller) =>
        reseller.id === id
          ? {
              ...reseller,
              status: reseller.status === "active" ? "inactive" : "active",
            }
          : reseller
      )
    );
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Kelola Resseler</h1>
          <Link
            to="/admin/resellers/new"
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-md font-semibold transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Resseler
          </Link>
        </div>

        {/* Search and Filter */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <input
            type="text"
            placeholder="Cari nama atau email resseler..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
          <div className="text-sm text-gray-600 flex items-center justify-end">
            Total: <span className="font-bold ml-2">{filteredResellers.length}</span>
          </div>
        </div>
      </div>

      {/* Resellers Table */}
      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        {filteredResellers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 text-lg">Tidak ada resseler ditemukan</p>
          </div>
        ) : (
          <table className="w-full text-left table-auto">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="p-4 font-semibold">Nama Toko</th>
                <th className="p-4 font-semibold">Email</th>
                <th className="p-4 font-semibold">Telepon</th>
                <th className="p-4 font-semibold">Produk</th>
                <th className="p-4 font-semibold">Penjualan</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredResellers.map((reseller) => (
                <tr key={reseller.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <div>
                      <p className="font-semibold text-gray-900">{reseller.name}</p>
                      <p className="text-sm text-gray-500">{reseller.address}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <a href={`mailto:${reseller.email}`} className="text-blue-600 hover:underline">
                      {reseller.email}
                    </a>
                  </td>
                  <td className="p-4">{reseller.phone}</td>
                  <td className="p-4">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                      {reseller.totalProducts}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                      {reseller.totalSales}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleStatus(reseller.id)}
                      className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors ${
                        reseller.status === "active"
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "bg-red-100 text-red-800 hover:bg-red-200"
                      }`}
                    >
                      {reseller.status === "active" ? "Aktif" : "Nonaktif"}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Link
                        to={`/admin/resellers/edit/${reseller.id}`}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-md text-sm font-semibold transition-colors flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(reseller.id, reseller.name)}
                        className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-md text-sm font-semibold transition-colors flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminResellersPage;
