import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const ResellerLoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError('Harap masukkan email dan kata sandi.');
      return;
    }
    setSubmitting(true);
    try {
      // Dummy login - tampilan saja untuk sekarang
      // Simulasi login berhasil
      localStorage.setItem("resellerAuth", JSON.stringify({
        isLoggedIn: true,
        email: email,
        role: "reseller"
      }));
      navigate('/reseller');
    } catch (err) {
      console.error('Login failed', err);
      setError(err && err.message ? err.message : 'Gagal masuk. Periksa kredensial Anda.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white px-6 py-12">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left illustration / promo */}
        <div className="hidden md:flex flex-col items-start justify-center space-y-6 px-6">
          <div className="bg-gradient-to-br from-yellow-200 via-yellow-100 to-white p-6 rounded-3xl shadow-lg">
            <h2 className="text-2xl font-extrabold text-yellow-800">Bilsnack</h2>
            <p className="text-gray-600 mt-2">Portal khusus untuk mitra reseller kami. Kelola dan jual produk dengan mudah.</p>
          </div>
          <div className="w-full rounded-xl overflow-hidden shadow-md">
            <img src="/hero-food.jpg" alt="snack" className="w-full object-cover h-64" onError={(e)=>{e.target.style.display='none'}} />
          </div>
        </div>

        {/* Right: auth card */}
        <div className="flex items-center justify-center">
          <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Masuk</h1>
              <span className="text-sm text-gray-500">Selamat datang kembali 👋</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">Alamat Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="nama@contoh.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-200 py-3 px-4 placeholder-gray-400 focus:ring-2 focus:ring-yellow-300 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">Kata Sandi</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Masukkan kata sandi"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-200 py-3 px-4 pr-12 placeholder-gray-400 focus:ring-2 focus:ring-yellow-300 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    aria-pressed={showPassword}
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? 'Sembunyikan' : 'Tampilkan'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold py-3 rounded-full shadow-md transition transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-60"
                disabled={submitting}
              >
                {submitting ? 'Memproses...' : 'Masuk'}
              </button>

              <p className="text-center text-gray-500 text-sm mt-4">
                Belum terdaftar sebagai reseller?
                <a href="mailto:admin@billsnack.id" className="ml-2 inline-block text-yellow-700 font-semibold px-3 py-1 border border-yellow-200 rounded-full hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-yellow-300">
                  Hubungi Admin
                </a>
              </p>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-center text-gray-600 text-sm mb-3">
                  Kembali ke login pelanggan
                </p>
                <Link 
                  to="/login" 
                  className="w-full block text-center bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
                >
                  Masuk Sebagai Pelanggan
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResellerLoginPage;
