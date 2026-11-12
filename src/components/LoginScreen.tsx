import React, { useState } from 'react';
import {
  Lock,
  User,
  ShieldCheck,
  ArrowRight,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { AppConfig, UserProfile } from '../types';

interface LoginScreenProps {
  userList: UserProfile[];
  onLoginSuccess: (user: UserProfile) => void;
  config: AppConfig;
  onSyncUsers?: () => Promise<void>;
  isSyncingUsers?: boolean;
  onOpenSetupDatabase?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  userList,
  onLoginSuccess,
  config,
  onSyncUsers,
  isSyncingUsers = false,
  onOpenSetupDatabase,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanInput = identifier.trim().toLowerCase();
    const cleanPass = password;

    if (!cleanInput) {
      setErrorMessage('Silakan masukkan Username Anda.');
      return;
    }

    if (!cleanPass) {
      setErrorMessage('Silakan masukkan kata sandi akun Anda.');
      return;
    }

    setIsAuthenticating(true);

    try {
      // Autentikasi langsung terhadap data pengguna dari database Google Spreadsheet (Sheet "Pengguna")
      const matchedUser = userList.find(
        (u) =>
          u.username.toLowerCase() === cleanInput ||
          (u.nip && u.nip.trim() === identifier.trim())
      );

      if (!matchedUser) {
        setErrorMessage(
          'Username tidak ditemukan dalam database Google Spreadsheet. Pastikan akun telah terdaftar aktif pada sheet "Pengguna".'
        );
        setIsAuthenticating(false);
        return;
      }

      if (matchedUser.statusAktif === false) {
        setErrorMessage(
          'Akun ini berstatus nonaktif. Silakan hubungi Administrator Tata Usaha untuk pengaktifan kembali.'
        );
        setIsAuthenticating(false);
        return;
      }

      if (matchedUser.password && matchedUser.password !== cleanPass) {
        setErrorMessage('Kata sandi yang Anda masukkan salah. Silakan periksa kembali.');
        setIsAuthenticating(false);
        return;
      }

      onLoginSuccess(matchedUser);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0a2747] to-[#071c33] flex flex-col justify-between relative overflow-hidden font-sans selection:bg-amber-400 selection:text-slate-900">
      {/* Decorative ambient background glows with subtle pulsing */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar / Institutional Identity */}
      <header className="relative z-10 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 pt-5 sm:pt-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-xs text-slate-300 font-medium">
          <Building2 className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">Badan Pusat Statistik</span>
          <span className="text-slate-500 hidden sm:inline">•</span>
          <span className="text-amber-300 font-semibold">Provinsi Kalimantan Barat</span>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-slate-300 backdrop-blur-md shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono font-semibold">Unit 6100</span>
        </div>
      </header>

      {/* Main Centered Card Container */}
      <main className="relative z-10 w-full max-w-md mx-auto px-4 sm:px-6 my-auto py-6 sm:py-8 flex items-center justify-center">
        <div className="w-full bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-slate-950/30 border border-white/30 p-7 sm:p-9 transition-all duration-300 animate-in fade-in zoom-in-95">
          
          {/* Logo BPS & Header */}
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-white p-2.5 shadow-md border border-slate-200/90 flex items-center justify-center transition-transform duration-300 hover:scale-105">
              <img
                src="/BPS.png"
                alt="Logo BPS"
                className="w-full h-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src.includes('BPS.png')) {
                    target.src = '/Logo BPS.png';
                  } else if (target.src.includes('Logo BPS.png')) {
                    target.src = 'https://kalbar.bps.go.id/_next/image?url=%2Fassets%2Flogo-bps.png&w=3840&q=75';
                  }
                }}
              />
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wider uppercase bg-blue-50 text-[#0f4c82] border border-blue-200/70 mt-4 mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0f4c82]" />
              <span>Masuk Ke Sistem</span>
            </span>

            <h1 className="text-xl sm:text-2xl font-black font-heading text-slate-900 tracking-tight leading-tight">
              Naskah Dinas & Arsip Digital
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
              Badan Pusat Statistik Provinsi Kalimantan Barat
            </p>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {/* Form Login */}
          <form onSubmit={handleManualLogin} className="mt-5 space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Masukkan username"
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50/60 hover:bg-white focus:bg-white focus:border-[#0f4c82] focus:ring-3 focus:ring-blue-100 outline-none transition-all duration-200 placeholder:text-slate-400 text-slate-900 font-medium shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi akun"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-2.5 sm:py-3 text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50/60 hover:bg-white focus:bg-white focus:border-[#0f4c82] focus:ring-3 focus:ring-blue-100 outline-none transition-all duration-200 placeholder:text-slate-400 text-slate-900 font-medium shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors duration-200 cursor-pointer"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-3 sm:py-3.5 px-4 rounded-xl font-bold text-white text-xs sm:text-sm bg-gradient-to-r from-[#0f4c82] via-[#1a6bb5] to-[#1a7a4a] hover:opacity-95 active:scale-[0.99] shadow-md shadow-blue-900/15 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer mt-3 disabled:opacity-50"
            >
              {isAuthenticating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Sistem</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200" />
                </>
              )}
            </button>
          </form>

          {/* Database Setup Helper if Sheet Empty */}
          {userList.length === 0 && onOpenSetupDatabase && (
            <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs">
              <div className="font-bold text-amber-900 flex items-center gap-1.5 mb-1">
                <AlertCircle className="w-4 h-4 text-amber-700" />
                <span>Sheet Pengguna Belum Terisi</span>
              </div>
              <p className="text-amber-800 leading-relaxed text-[11px]">
                Sheet "Pengguna" pada Google Spreadsheet belum memuat data akun.
              </p>
              <button
                onClick={onOpenSetupDatabase}
                className="mt-2 w-full px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition-colors cursor-pointer text-center shadow-xs"
              >
                Inisialisasi Sheet Database Pengguna
              </button>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-4 text-center text-xs text-slate-400">
        <p className="font-medium text-slate-300">
          Badan Pusat Statistik Provinsi Kalimantan Barat © 2026
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Tim Umum & Humas· Tata Kelola Naskah Dinas & Kearsipan Elektronik
        </p>
      </footer>
    </div>
  );
};
