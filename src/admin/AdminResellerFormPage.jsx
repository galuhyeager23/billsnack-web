import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const AdminResellerFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    status: "active",
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Jika mode edit, load data resseler (dummy)
  React.useEffect(() => {
    if (isEditing) {
      // Dummy data untuk edit
      const dummyResellers = [
        {
          id: 1,
          name: "Toko Cemilan Jaya",
          email: "toko.jaya@email.com",
          phone: "0812345678",
          address: "Jl. Merdeka No. 10, Bandung",
          status: "active",
        },
        {
          id: 2,
          name: "Reseller Snack Mantap",
          email: "snack.mantap@email.com",
          phone: "0823456789",
          address: "Jl. Sudirman No. 25, Jakarta",
          status: "active",
        },
      ];

      const reseller = dummyResellers.find((r) => r.id === parseInt(id));
      if (reseller) {
        setFormData({
          name: reseller.name,
          email: reseller.email,
          phone: reseller.phone,
          address: reseller.address,
          status: reseller.status,
        });
      }
    }
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nama toko harus diisi";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email harus diisi";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email tidak valid";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Nomor telepon harus diisi";
    }
    if (!formData.address.trim()) {
      newErrors.address = "Alamat harus diisi";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      // Simulasi submit - hanya tampilan saja
      console.log("Form Data:", formData);

      // Tampilkan notifikasi sukses
      alert(
        isEditing
          ? "Reseller berhasil diupdate!"
          : "Reseller berhasil ditambahkan!"
      );

      navigate("/admin/resellers");
    } catch (error) {
      console.error("Error:", error);
      alert("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? "Edit Reseller" : "Tambah Reseller Baru"}
        </h1>
        <p className="text-gray-600 mt-2">
          {isEditing
            ? "Perbarui informasi reseller"
            : "Isi formulir di bawah untuk menambahkan reseller baru"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Nama Toko */}
          <div className="mb-6">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nama Toko <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Contoh: Toko Cemilan Jaya"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-300 focus:border-transparent ${
                errors.name ? "border-red-500" : "border-gray-200"
              }`}
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-600">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="contoh@email.com"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-300 focus:border-transparent ${
                  errors.email ? "border-red-500" : "border-gray-200"
                }`}
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Nomor Telepon */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Nomor Telepon <span className="text-red-600">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="081234567890"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-300 focus:border-transparent ${
                  errors.phone ? "border-red-500" : "border-gray-200"
                }`}
              />
              {errors.phone && (
                <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
              )}
            </div>
          </div>

          {/* Alamat */}
          <div className="mb-6">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              Alamat <span className="text-red-600">*</span>
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Jl. Contoh No. 123, Kota, Provinsi"
              rows={4}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-300 focus:border-transparent resize-vertical ${
                errors.address ? "border-red-500" : "border-gray-200"
              }`}
            />
            {errors.address && (
              <p className="text-red-600 text-sm mt-1">{errors.address}</p>
            )}
          </div>

          {/* Status */}
          <div className="mb-6">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Status <span className="text-red-600">*</span>
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-300 focus:border-transparent"
            >
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting
                ? isEditing
                  ? "Memperbarui..."
                  : "Menambahkan..."
                : isEditing
                ? "Update Reseller"
                : "Tambah Reseller"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin/resellers")}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Batal
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-green-50 border-l-4 border-green-600 rounded-lg p-4 mt-6">
          <p className="text-sm text-green-800">
            <strong>Catatan:</strong> Pastikan semua data reseller yang Anda input sudah benar sebelum menyimpan.
          </p>
        </div>
      </form>
    </div>
  );
};

export default AdminResellerFormPage;
