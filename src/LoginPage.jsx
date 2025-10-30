import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="px-8 sm:px-12 lg:px-16 py-20 flex justify-center">
      <div className="w-full max-w-md">
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8 mb-4"
        >
          <h1 className="text-3xl font-bold text-center mb-6">Masuk</h1>
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="email"
            >
              Alamat Email
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="email"
              type="email"
              placeholder="Masukkan email Anda"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="password"
            >
              Kata Sandi
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              id="password"
              type="password"
              placeholder="******************"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              className="bg-black hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-full focus:outline-none focus:shadow-outline w-full"
              type="submit"
            >
              Masuk
            </button>
          </div>
          <p className="text-center text-gray-500 text-sm mt-6">
            Belum punya akun?{" "}
            <Link
              to="/register"
              className="font-bold text-black hover:underline"
            >
              Daftar
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
