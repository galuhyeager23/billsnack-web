import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const AdminResellerFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const { token } = useAuth() || {};
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  const authHeaderToken = adminToken || token || null;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    status: "active",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEditing) return;

    const load = async () => {
      try {
        // try to load from API if token available, otherwise keep dummy/demo behavior
        if (authHeaderToken) {
          const resp = await fetch(`/api/admin/users/${id}`, {
            headers: { Authorization: `Bearer ${authHeaderToken}` },
          });
          if (!resp.ok) throw new Error("Failed to load user");
          const data = await resp.json();
          setFormData((prev) => ({
            ...prev,
            name: data.store_name || data.first_name || "",
            email: data.email || "",
            phone: data.phone || data.rp_phone || "",
            address: data.address || "",
            status: data.is_active ? "active" : "inactive",
          }));
          return;
        }

        // fallback dummy data when not connected to API
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
            password: "",
          });
        }
      } catch (err) {
        console.error("Failed to load reseller", err);
        // keep going; user can still edit
      }
    };

    load();
  }, [id, isEditing, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Nama toko harus diisi";
    if (!formData.email.trim()) newErrors.email = "Email harus diisi";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Email tidak valid";
    if (!formData.phone.trim()) newErrors.phone = "Nomor telepon harus diisi";
    if (!formData.address.trim()) newErrors.address = "Alamat harus diisi";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const payload = {
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        store_name: formData.name,
      };
      if (formData.password) payload.password = formData.password;

      if (authHeaderToken) {
        if (isEditing) {
          payload.is_active = formData.status === "active";
          const resp = await fetch(`/api/admin/users/${id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authHeaderToken}`,
            },
            body: JSON.stringify(payload),
          });
          if (!resp.ok) throw new Error("Update failed");
          alert("Reseller berhasil diupdate!");
        } else {
          payload.role = "reseller";
          const resp = await fetch("/api/admin/users", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authHeaderToken}`,
            },
            body: JSON.stringify(payload),
          });
          if (!resp.ok) {
            const err = await resp.json().catch(() => null);
            throw new Error(err && err.error ? err.error : "Create failed");
          }
          alert("Reseller berhasil ditambahkan!");
        }
      } else {
        // No token / offline mode - simulate success
        alert(isEditing ? "Reseller berhasil diupdate!" : "Reseller berhasil ditambahkan!");
      }

      navigate("/admin/resellers");
    } catch (err) {
      console.error(err);
      alert(err.message || "Gagal menyimpan reseller");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto mb-6">
        <h1 className="text-2xl font-bold">
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
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
          </div>

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
              {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
            </div>

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
              {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
            </div>
          </div>

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
            {errors.address && <p className="text-red-600 text-sm mt-1">{errors.address}</p>}
          </div>

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

          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password (opsional)
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={isEditing ? "Kosongkan jika tidak ingin mengubah password" : "Password untuk reseller"}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-300 focus:border-transparent border-gray-200`}
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (isEditing ? "Memperbarui..." : "Menambahkan...") : isEditing ? "Update Reseller" : "Tambah Reseller"}
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
