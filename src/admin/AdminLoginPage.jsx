import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const AdminLoginPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Default admin credentials
  const ADMIN_EMAIL = "admin@billsnack.id";
  const ADMIN_PASSWORD = "admin123456";

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate credentials
    if (
      formData.email === ADMIN_EMAIL &&
      formData.password === ADMIN_PASSWORD
    ) {
      // Store admin auth in localStorage
      localStorage.setItem(
        "adminAuth",
        JSON.stringify({
          isLoggedIn: true,
          email: formData.email,
          loginTime: new Date().toISOString(),
        })
      );
      navigate("/admin");
    } else {
      setError("Kredensial admin tidak valid. Silakan coba lagi.");
      setFormData({ email: "", password: "" });
    }
  };

  return (
    <div className="px-8 sm:px-12 lg:px-16 py-20 flex justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-2">Panel Admin</h1>
          <p className="text-center text-gray-600 mb-8">
            Akses Terbatas - Hanya Login Admin
          </p>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Admin
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Masukan email admin"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kata Sandi
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Masukkan kata sandi admin"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-black text-white font-semibold py-3 px-4 rounded-full hover:bg-gray-800 transition duration-300"
            >
              Masuk
            </button>
          </form>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900 mb-2">
              <strong>📌 Kredensial Admin Demo:</strong>
            </p>
            <p className="text-sm text-blue-800">
              Email:{" "}
              <code className="bg-blue-100 px-2 py-1">admin@billsnack.id</code>
            </p>
            <p className="text-sm text-blue-800">
              Kata Sandi:{" "}
              <code className="bg-blue-100 px-2 py-1">admin123456</code>
            </p>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Bukan admin?{" "}
              <Link to="/" className="text-black font-semibold hover:underline">
                Kembali ke Toko
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
