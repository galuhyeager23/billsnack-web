import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const AdminLoginPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const apiBase =
        import.meta.env.VITE_API_URL ||
        (import.meta.env.PROD
          ? window.location.origin
          : "http://localhost:4000");
      const res = await fetch(`${apiBase}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // send admin:true so backend can treat this as an admin login attempt
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          admin: true,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        // Prefer server-provided error message when available
        const msg =
          data && data.error
            ? data.error
            : "Kredensial admin tidak valid. Silakan coba lagi.";
        setError(msg);
        setSubmitting(false);
        return;
      }
      // expected { user, token }
      if (data && data.token) {
        // store token for admin API calls
        localStorage.setItem("adminToken", data.token);
        // also persist admin user info so Admin dashboard can display the admin name
        if (data.user) {
          try {
            localStorage.setItem("adminUser", JSON.stringify(data.user));
          } catch {
            // ignore storage errors
          }
        }
        // Clear any existing user login to keep admin and user sessions separate
        localStorage.removeItem("billsnack_token");
        localStorage.removeItem("billsnack_user");
        // keep a simple adminAuth flag for layout checks
        localStorage.setItem(
          "adminAuth",
          JSON.stringify({
            isLoggedIn: true,
            email: (data.user && data.user.email) || formData.email,
            loginTime: new Date().toISOString(),
          })
        );
        setSubmitting(false);
        // navigate then reload so AuthProvider reads the persisted user/token
        navigate("/admin");
        window.location.reload();
      } else {
        setError("Login gagal - respon tidak valid");
      }
    } catch (err) {
      console.error("Admin login error", err);
      setError("Terjadi kesalahan saat menghubungkan server");
      setSubmitting(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-white dark:bg-neutral-900 px-6 py-12">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left illustration / promo */}
        <div className="hidden md:flex flex-col items-start justify-center space-y-6 px-6">
          <div className="p-6 rounded-3xl bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/20 dark:to-amber-800/20 border border-yellow-200 dark:border-yellow-700/30 shadow-lg hover:shadow-xl transition-all duration-300">
            <h2 className="text-2xl font-extrabold text-amber-800 dark:text-amber-200">
              Bilsnack
            </h2>
            <p className="text-amber-700 dark:text-amber-300 mt-2">
              Panel Admin Billsnack - Akses Terbatas.
            </p>
          </div>
          <div className="w-full rounded-xl overflow-hidden shadow-md">
            <img
              src="/hero-food.jpg"
              alt="snack"
              className="w-full object-cover h-64"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </div>
        </div>

        {/* Right: admin login card */}
        <div className="flex items-center justify-center">
          {/* PERBAIKAN: Mengganti <form> luar menjadi <div> agar tidak ada nested form */}
          <div className="w-full max-w-md bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/20 dark:to-amber-800/20 border border-yellow-200 dark:border-yellow-700/30 p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-amber-800 dark:text-amber-200">
                Panel Admin
              </h1>
              <span className="text-sm text-amber-700 dark:text-amber-300">
                Akses Terbatas 👑
              </span>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                  Email Admin
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Masukan email admin"
                  className="w-full px-4 py-3 border border-yellow-200 dark:border-yellow-700/30 bg-white dark:bg-neutral-800 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-colors"
                  required
                  aria-label="Email Admin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                  Kata Sandi
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Masukkan kata sandi admin"
                  className="w-full px-4 py-3 border border-yellow-200 dark:border-yellow-700/30 bg-white dark:bg-neutral-800 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-colors"
                  required
                  aria-label="Kata Sandi Admin"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold py-3 px-4 rounded-full hover:from-amber-600 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all duration-300 shadow-lg hover:shadow-xl"
                disabled={submitting}
              >
                {submitting ? "Memproses..." : "Masuk"}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-yellow-200 dark:border-yellow-700/30">
              <p className="text-center text-amber-700 dark:text-amber-300 text-sm mb-3">
                Kembali ke Toko Billsnack
              </p>
              <Link
                to="/"
                className="w-full block text-center btn-secondary font-semibold py-2 px-4 rounded-lg"
              >
                Kunjungi Toko
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;