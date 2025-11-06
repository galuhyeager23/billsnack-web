// Fix: Creating ProfilePage for user profile management
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "./contexts/AuthContext";

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    gender: "",
    address: "",
    postalCode: "",
    city: "",
    province: "",
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        // prefer username from user, else derive from email, else from name
        username: user.username || (user.email ? user.email.split('@')[0] : (user.name ? user.name.replace(/\s+/g, '').toLowerCase() : '')),
        email: user.email || "",
        phone: user.phone || user.tel || "",
        gender: user.gender || "",
        address: user.address || "",
        postalCode: user.postalCode || "",
        city: user.city || "",
        province: user.province || "",
      });
      // load avatar preview if available
      if (user.profileImage) {
        setAvatarPreview(user.profileImage);
      }
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    // basic validation: type and size
    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran gambar maksimal 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...formData };
    if (avatarPreview) payload.profileImage = avatarPreview;
    else payload.profileImage = null;
    updateProfile(payload);
    alert("Profil berhasil diperbarui!");
  };

  if (!user) {
    return (
      <div className="px-8 sm:px-12 lg:px-16 py-20 text-center">
        <h1 className="text-3xl font-bold">
          Silakan masuk untuk melihat profil Anda
        </h1>
      </div>
    );
  }

  return (
    <div className="px-8 sm:px-12 lg:px-16 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Profil Saya</h1>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-gray-400">No Image</div>
                )}
              </div>
              <label className="absolute -bottom-2 right-0 bg-white rounded-full p-1 shadow-md">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </label>
            </div>
            <div>
              <div className="flex gap-2">
                <button type="button" onClick={() => fileInputRef.current && fileInputRef.current.click()} className="px-3 py-2 bg-yellow-500 text-white rounded-md">Unggah</button>
                <button type="button" onClick={handleRemoveAvatar} className="px-3 py-2 border rounded-md">Hapus</button>
              </div>
              <p className="text-sm text-gray-500 mt-2">Format: JPG/PNG, max 2MB</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Depan
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Belakang
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="Masukkan username Anda"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alamat Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nomor Telepon
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="Masukkan nomor telepon Anda"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jenis Kelamin
            </label>
            <div className="flex gap-6">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="Laki-laki"
                  checked={formData.gender === "Laki-laki"}
                  onChange={handleChange}
                  className="mr-2"
                  required
                />
                Laki-laki
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="Perempuan"
                  checked={formData.gender === "Perempuan"}
                  onChange={handleChange}
                  className="mr-2"
                  required
                />
                Perempuan
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alamat
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="Masukkan alamat lengkap Anda"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kode Pos
              </label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="12345"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kota/Kecamatan
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Jakarta"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Provinsi
              </label>
              <input
                type="text"
                name="province"
                value={formData.province}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="DKI Jakarta"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4 pt-6">
            <button
              type="submit"
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white px-6 py-3 rounded-md font-semibold shadow-md transition transform hover:-translate-y-0.5 active:scale-95"
            >
              Perbarui Profil
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
