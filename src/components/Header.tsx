import React from 'react';
import {
  Settings,
  FileText,
  Table2,
  Layers,
  BarChart3,
  BookOpen,
  Archive,
  LayoutDashboard,
  Send,
  ShieldCheck,
  Database,
  RefreshCw,
  LogOut,
  Users,
} from 'lucide-react';
import { RoleSwitcher } from './RoleSwitcher';
import { UserProfile } from '../types';

export type MainNavTab =
  | 'dashboard'
  | 'pengajuan'
  | 'verifikasi'
  | 'arsip'
  | 'pedoman'
  | 'penomoran'
  | 'pengguna';

interface HeaderProps {
  activeTab: MainNavTab;
  setActiveTab: (tab: MainNavTab) => void;
  onOpenSettings: () => void;
  onOpenSetupDatabase?: () => void;
  onSyncDatabase?: () => void;
  isSyncing?: boolean;
  currentUser: UserProfile;
  userList: UserProfile[];
  onSelectUser: (user: UserProfile) => void;
  onLogout: () => void;
  pendingVerifCount: number;
  totalArsipCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  onOpenSetupDatabase,
  onSyncDatabase,
  isSyncing,
  currentUser,
  userList,
  onSelectUser,
  onLogout,
  pendingVerifCount,
  totalArsipCount,
}) => {
  return (
    <header className="relative bg-gradient-to-r from-[#0a335a] via-[#0f4c82] to-[#125d36] text-white shadow-md overflow-hidden">
      {/* Decorative subtle overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_60%)] pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#e06c1a] via-[#f08030] to-[#f5a623]" />

      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-3 sm:py-3.5 relative z-10">
        
        {/* Top Row: Brand & Role Switcher */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
          
          {/* Brand Identity */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white p-1.5 shadow-md flex items-center justify-center shrink-0 border border-white/50">
              <img
                src="/BPS.png"
                alt="Logo BPS Kalimantan Barat"
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

            <div>
              <div className="text-[10px] sm:text-[11px] font-bold text-amber-300 tracking-wider uppercase">
                Sekretariat TU Kepala · BPS Provinsi Kalimantan Barat
              </div>
              <h1 className="text-base sm:text-lg font-black font-heading tracking-tight text-white leading-tight">
                PENGELOLAAN NASKAH DINAS & ARSIP DIGITAL
              </h1>
              <p className="text-[11px] text-blue-100/90 font-medium mt-0.5">
                Sistem Tata Kelola Naskah Dinas, Verifikasi Mutu, & Penomoran Terpadu (Unit Kerja 6100)
              </p>
            </div>
          </div>

          {/* Right Controls: User Profile, Sync, Admin Settings & Logout */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end flex-wrap">
            <RoleSwitcher
              currentUser={currentUser}
              onSelectUser={onSelectUser}
              pendingCountForUser={pendingVerifCount}
              userList={userList}
              onOpenUserManagement={() => setActiveTab('pengguna')}
              onLogout={onLogout}
            />

            {onSyncDatabase && (
              <button
                onClick={onSyncDatabase}
                disabled={isSyncing}
                className="h-9 inline-flex items-center gap-1.5 px-3 rounded-xl text-xs font-semibold text-white bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 transition-all shadow-xs cursor-pointer whitespace-nowrap disabled:opacity-50"
                title="Tarik data terbaru langsung dari Google Spreadsheet"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-blue-200 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isSyncing ? 'Sinkron...' : 'Sinkron'}</span>
              </button>
            )}

            {currentUser.role === 'ADMIN' && onOpenSetupDatabase && (
              <button
                onClick={onOpenSetupDatabase}
                className="h-9 inline-flex items-center gap-1.5 px-3 rounded-xl text-xs font-semibold text-emerald-100 bg-emerald-800/40 hover:bg-emerald-800/60 active:scale-95 border border-emerald-400/40 transition-all shadow-xs cursor-pointer whitespace-nowrap"
                title="Setup & Inisialisasi Database Google Spreadsheet"
              >
                <Database className="w-3.5 h-3.5 text-emerald-300" />
                <span className="hidden sm:inline">Database Sheet</span>
              </button>
            )}

            {currentUser.role === 'ADMIN' && (
              <button
                onClick={onOpenSettings}
                className="h-9 inline-flex items-center gap-1.5 px-3 rounded-xl text-xs font-semibold text-white/90 bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 transition-all shadow-xs cursor-pointer whitespace-nowrap"
                title="Pengaturan Sistem & Spreadsheet"
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pengaturan</span>
              </button>
            )}

            <button
              onClick={onLogout}
              className="h-9 inline-flex items-center gap-1.5 px-3.5 rounded-xl text-xs font-bold text-rose-100 bg-rose-600/30 hover:bg-rose-600/50 active:scale-95 border border-rose-300/30 transition-all shadow-xs cursor-pointer whitespace-nowrap"
              title="Keluar dari akun saat ini"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-200" />
              <span>Keluar</span>
            </button>
          </div>
        </div>

        {/* Bottom Row: Role-Filtered Navigation Tabs */}
        <div className="mt-3 pt-2.5 border-t border-white/15 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          
          {/* Dashboard (All users) */}
          {currentUser.allowedTabs.includes('dashboard') && (
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`h-9.5 inline-flex items-center gap-2 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-white text-[#0f4c82] shadow-sm scale-[1.01]'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
          )}

          {/* Pengajuan Draf (Konseptor & Admin) */}
          {currentUser.allowedTabs.includes('pengajuan') && (
            <button
              onClick={() => setActiveTab('pengajuan')}
              className={`h-9.5 inline-flex items-center gap-2 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'pengajuan'
                  ? 'bg-white text-[#0f4c82] shadow-sm scale-[1.01]'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Pengajuan Draf</span>
            </button>
          )}

          {/* Verifikasi (Verifikator, Arsiparis, Admin) */}
          {currentUser.allowedTabs.includes('verifikasi') && (
            <button
              onClick={() => setActiveTab('verifikasi')}
              className={`h-9.5 inline-flex items-center gap-2 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'verifikasi'
                  ? 'bg-white text-[#0f4c82] shadow-sm scale-[1.01]'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Meja Verifikasi</span>
              {pendingVerifCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === 'verifikasi' ? 'bg-amber-100 text-[#e06c1a]' : 'bg-amber-500 text-white'
                }`}>
                  {pendingVerifCount}
                </span>
              )}
            </button>
          )}

          {/* Arsip Digital */}
          {currentUser.allowedTabs.includes('arsip') && (
            <button
              onClick={() => setActiveTab('arsip')}
              className={`h-9.5 inline-flex items-center gap-2 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'arsip'
                  ? 'bg-white text-[#0f4c82] shadow-sm scale-[1.01]'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Archive className="w-4 h-4" />
              <span>Arsip Digital</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'arsip' ? 'bg-blue-100 text-[#0f4c82]' : 'bg-white/20 text-white'
              }`}>
                {totalArsipCount}
              </span>
            </button>
          )}

          {/* Pedoman & Template Word */}
          {currentUser.allowedTabs.includes('pedoman') && (
            <button
              onClick={() => setActiveTab('pedoman')}
              className={`h-9.5 inline-flex items-center gap-2 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'pedoman'
                  ? 'bg-white text-[#0f4c82] shadow-sm scale-[1.01]'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Referensi & Pedoman</span>
            </button>
          )}

          {/* Penomoran Surat Keluar (Sheet Keluar26) */}
          {currentUser.allowedTabs.includes('penomoran') && (
            <button
              onClick={() => setActiveTab('penomoran')}
              className={`h-9.5 inline-flex items-center gap-2 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'penomoran'
                  ? 'bg-white text-[#0f4c82] shadow-sm scale-[1.01]'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Table2 className="w-4 h-4" />
              <span>Penomoran Surat Keluar</span>
            </button>
          )}

          {/* Kelola Pengguna Database (Admin) */}
          {currentUser.allowedTabs.includes('pengguna') && (
            <button
              onClick={() => setActiveTab('pengguna')}
              className={`h-9.5 inline-flex items-center gap-2 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'pengguna'
                  ? 'bg-white text-[#0f4c82] shadow-sm scale-[1.01]'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Kelola Pengguna</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
