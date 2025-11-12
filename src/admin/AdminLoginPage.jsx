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
      const res = await fetch(`${(import.meta.env.VITE_API_URL || 'http://localhost:4000')}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // send admin:true so backend can treat this as an admin login attempt
        body: JSON.stringify({ email: formData.email, password: formData.password, admin: true }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        // Prefer server-provided error message when available
        const msg = (data && data.error) ? data.error : 'Kredensial admin tidak valid. Silakan coba lagi.';
        setError(msg);
        setSubmitting(false);
        return;
      }
      // expected { user, token }
      if (data && data.token) {
        // store token for admin API calls
        localStorage.setItem('adminToken', data.token);
        // also persist admin user info so Admin dashboard can display the admin name
        if (data.user) {
          try {
            localStorage.setItem('billsnack_user', JSON.stringify(data.user));
          } catch {
            // ignore storage errors
          }
          // also persist standard token so AuthProvider can pick it up after reload
          try { localStorage.setItem('billsnack_token', data.token); } catch { /* ignore */ }
        }
        // keep a simple adminAuth flag for layout checks
        localStorage.setItem(
          'adminAuth',
          JSON.stringify({ isLoggedIn: true, email: (data.user && data.user.email) || formData.email, loginTime: new Date().toISOString() })
        );
        setSubmitting(false);
        // navigate then reload so AuthProvider reads the persisted user/token
        navigate('/admin');
        window.location.reload();
      } else {
        setError('Login gagal - respon tidak valid');
      }
    } catch (err) {
      console.error('Admin login error', err);
      setError('Terjadi kesalahan saat menghubungkan server');
      setSubmitting(false);
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
              className="w-full bg-amber-500 text-white font-semibold py-3 px-4 rounded-full hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-300 transition duration-300"
              disabled={submitting}
            >
              {submitting ? 'Memproses...' : 'Masuk'}
            </button>
          </form>
          {/* Demo credentials removed for security - contact admin to obtain credentials */}

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
