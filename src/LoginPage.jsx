import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, you'd validate credentials against a backend.
    // Here, we'll just simulate a successful login.
    if (email && password) {
      login({ name: "Test User", email: email });
      navigate("/");
    } else {
      alert("Harap masukkan email dan kata sandi.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white px-6 py-12">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left illustration / promo */}
        <div className="hidden md:flex flex-col items-start justify-center space-y-6 px-6">
          <div className="bg-gradient-to-br from-yellow-200 via-yellow-100 to-white p-6 rounded-3xl shadow-lg">
            <h2 className="text-2xl font-extrabold text-yellow-800">Billsnack</h2>
            <p className="text-gray-600 mt-2">Belanja cemilan favoritmu dengan cepat dan mudah.</p>
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

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold py-3 rounded-full shadow-md transition transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-60"
              >
                Masuk
              </button>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200" />
                <div className="text-sm text-gray-400">atau masuk dengan</div>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button type="button" aria-label="Masuk dengan Google" className="flex items-center justify-center gap-2 border border-gray-200 py-2 rounded-lg hover:shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 533.5 544.3" className="w-5 h-5">
                    <path fill="#4285f4" d="M533.5 278.4c0-18.6-1.5-36.6-4.3-54H272v102.3h146.9c-6.3 34-25 62.8-53.4 82v68.2h86.3c50.4-46.4 81.7-114.8 81.7-198.5z"/>
                    <path fill="#34a853" d="M272 544.3c72.6 0 133.6-24.1 178.2-65.3l-86.3-68.2c-24 16.1-54.8 25.6-91.9 25.6-70.7 0-130.6-47.7-152.1-111.7H30.1v70.3C74.4 492 166.7 544.3 272 544.3z"/>
                    <path fill="#fbbc04" d="M119.9 323.7c-10.6-31.5-10.6-65.6 0-97.1V156.2H30.1c-39.6 77.1-39.6 169.6 0 246.7l89.8-79.2z"/>
                    <path fill="#ea4335" d="M272 107.6c39.6 0 75.2 13.6 103.2 40.3l77.4-77.4C405.6 24.2 344.6 0 272 0 166.7 0 74.4 52.3 30.1 133.8l89.8 79.2C141.4 155.3 201.3 107.6 272 107.6z"/>
                  </svg>
                  Google
                </button>
                <button type="button" aria-label="Masuk dengan Twitter" className="flex items-center justify-center gap-2 border border-gray-200 py-2 rounded-lg hover:shadow-sm">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2a10 10 0 100 20 10 10 0 000-20z" fill="#1DA1F2"/></svg>
                  Twitter
                </button>
              </div>

              <p className="text-center text-gray-500 text-sm mt-4">
                Belum punya akun?
                <Link to="/register" className="ml-2 inline-block text-yellow-700 font-semibold px-3 py-1 border border-yellow-200 rounded-full hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-yellow-300">
                  Daftar
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
