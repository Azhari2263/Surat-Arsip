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
  notifications?: import('../types').AktivitasNotifikasi[];
  onMarkAllNotificationsRead?: () => void;
  onMarkNotificationRead?: (id: string) => void;
  onSelectNotification?: (notif: import('../types').AktivitasNotifikasi) => void;
  syncIntervalSeconds?: number;
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
  notifications = [],
  onMarkAllNotificationsRead,
  onMarkNotificationRead,
  onSelectNotification,
  syncIntervalSeconds = 10,
}) => {
  const [showNotifMenu, setShowNotifMenu] = React.useState(false);
  const [filterNotif, setFilterNotif] = React.useState<'semua' | 'unread'>('semua');
  const notifRef = React.useRef<HTMLDivElement>(null);

  // Close notifications on outside click
  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifMenu(false);
      }
    };
    if (showNotifMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showNotifMenu]);

  const unreadCount = React.useMemo(() => {
    return notifications.filter((n) => !n.dibaca).length;
  }, [notifications]);

  const displayedNotifications = React.useMemo(() => {
    if (filterNotif === 'unread') {
      return notifications.filter((n) => !n.dibaca);
    }
    return notifications;
  }, [notifications, filterNotif]);

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
                Sistem Tata Kelola Naskah Dinas, Verifikasi, & Arsip Terpadu
              </p>
            </div>
          </div>

          {/* Right Controls: Live Sync, Notifications, User Profile, Sync, Admin Settings & Logout */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end flex-wrap">
            
            {/* Live Sync Status Indicator Badge */}
            <div
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/10 border border-white/15 text-[11px] font-medium text-blue-100"
              title={`Sinkronisasi latar otomatis aktif setiap ${syncIntervalSeconds} detik`}
            >
              <span className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
              <span className="font-semibold text-white/90">
                {isSyncing ? 'Sinkronisasi...' : 'Live Sync'}
              </span>
              <span className="text-white/50 text-[10px]">({syncIntervalSeconds}s)</span>
            </div>

            {/* Notification Bell with Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className={`h-9 relative inline-flex items-center justify-center w-9 rounded-xl transition-all cursor-pointer border ${
                  showNotifMenu
                    ? 'bg-white text-[#0f4c82] border-white shadow-sm'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                }`}
                title="Pemberitahuan Aktivitas Terkini"
                aria-label="Notifikasi Aktivitas"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-amber-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs border-2 border-[#0f4c82] animate-bounce">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 text-slate-900 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-3.5 bg-gradient-to-r from-slate-50 to-blue-50/50 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>Pemberitahuan Aktivitas</span>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0f4c82] text-white">
                            {unreadCount} baru
                          </span>
                        )}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Perubahan status naskah dinas & arsip secara realtime
                      </p>
                    </div>
                    {unreadCount > 0 && onMarkAllNotificationsRead && (
                      <button
                        onClick={() => {
                          onMarkAllNotificationsRead();
                        }}
                        className="text-[11px] font-semibold text-[#0f4c82] hover:text-[#1a6bb5] cursor-pointer"
                      >
                        Tandai Semua
                      </button>
                    )}
                  </div>

                  {/* Filter tabs */}
                  <div className="flex border-b border-slate-100 bg-slate-50/50 px-3 py-1.5 gap-2">
                    <button
                      onClick={() => setFilterNotif('semua')}
                      className={`text-[11px] font-semibold px-2 py-1 rounded-lg cursor-pointer transition-colors ${
                        filterNotif === 'semua'
                          ? 'bg-white text-[#0f4c82] shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Semua ({notifications.length})
                    </button>
                    <button
                      onClick={() => setFilterNotif('unread')}
                      className={`text-[11px] font-semibold px-2 py-1 rounded-lg cursor-pointer transition-colors ${
                        filterNotif === 'unread'
                          ? 'bg-white text-[#0f4c82] shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Belum Dibaca ({unreadCount})
                    </button>
                  </div>

                  {/* Notification List */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {displayedNotifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400">
                        <svg
                          className="w-8 h-8 mx-auto mb-2 text-slate-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.5"
                            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                          />
                        </svg>
                        <p className="text-xs font-medium">Belum ada aktivitas baru</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Notifikasi akan muncul otomatis saat ada update</p>
                      </div>
                    ) : (
                      displayedNotifications.map((notif) => {
                        return (
                          <div
                            key={notif.id}
                            onClick={() => {
                              if (!notif.dibaca && onMarkNotificationRead) {
                                onMarkNotificationRead(notif.id);
                              }
                              if (onSelectNotification) {
                                onSelectNotification(notif);
                              }
                              setShowNotifMenu(false);
                            }}
                            className={`p-3 transition-colors cursor-pointer text-left hover:bg-slate-50 flex gap-2.5 items-start ${
                              !notif.dibaca ? 'bg-blue-50/40' : ''
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                !notif.dibaca ? 'bg-[#0f4c82]' : 'bg-transparent'
                              }`}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[11px] font-bold text-slate-900 truncate">
                                  {notif.judul}
                                </span>
                                <span className="text-[9px] text-slate-400 whitespace-nowrap">
                                  {notif.waktu}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
                                {notif.deskripsi}
                              </p>
                              <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500">
                                <span>Oleh: <strong className="text-slate-700">{notif.pelaku}</strong></span>
                                {notif.nomorRegistrasi && (
                                  <span className="font-mono text-[9px] bg-slate-100 px-1.5 py-0.2 rounded text-slate-600">
                                    {notif.nomorRegistrasi}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
                    <span className="text-[10px] text-slate-400 font-medium">
                      Sinkron otomatis dengan Google Spreadsheet
                    </span>
                  </div>
                </div>
              )}
            </div>

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
