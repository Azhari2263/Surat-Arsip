import React from 'react';
import {
  ChevronDown,
  User,
  Shield,
  LogOut,
  Building,
  Briefcase,
  Users,
  ArrowRight,
  Lock,
  CreditCard,
} from 'lucide-react';
import { UserProfile } from '../types';

interface RoleSwitcherProps {
  currentUser: UserProfile;
  onSelectUser?: (user: UserProfile) => void;
  pendingCountForUser?: number;
  userList?: UserProfile[];
  onOpenUserManagement?: () => void;
  onLogout?: () => void;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  currentUser,
  pendingCountForUser = 0,
  onOpenUserManagement,
  onLogout,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  const getRoleInitials = (role: string) => {
    if (role === 'ADMIN') return 'AD';
    if (role === 'ARSIPARIS') return 'AR';
    if (role === 'KONSEPTOR') return 'KP';
    if (role === 'VIEWER') return 'VW';
    return 'VR';
  };

  const getRoleBadgeStyle = (role: string) => {
    if (role === 'ADMIN') return 'bg-purple-100 text-purple-900 border-purple-200';
    if (role === 'ARSIPARIS') return 'bg-emerald-100 text-emerald-900 border-emerald-200';
    if (role === 'KONSEPTOR') return 'bg-blue-100 text-[#0f4c82] border-blue-200';
    if (role === 'VIEWER') return 'bg-slate-100 text-slate-800 border-slate-200';
    return 'bg-amber-100 text-amber-900 border-amber-200';
  };

  const getRoleDisplayName = (role: string) => {
    if (role === 'ADMIN') return 'Administrator Tata Usaha';
    if (role === 'ARSIPARIS') return 'Arsiparis Ahli';
    if (role === 'KONSEPTOR') return 'Konseptor Pegawai';
    if (role === 'VIEWER') return 'Viewer / Tamu';
    return role.replace('VERIFIKATOR_', 'Verifikator Tim ');
  };

  return (
    <div className="relative">
      {/* Trigger Button: User Profile Pill */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-medium transition-all shadow-xs cursor-pointer"
        title="Buka Menu Profil Pengguna"
        aria-expanded={isOpen}
      >
        <div className="w-6 h-6 rounded-lg bg-[#e06c1a] text-white flex items-center justify-center font-bold text-[11px] shrink-0 shadow-inner">
          {getRoleInitials(currentUser.role)}
        </div>
        <div className="text-left hidden sm:block max-w-[160px]">
          <div className="text-[11px] font-bold leading-tight truncate">{currentUser.nama}</div>
          <div className="text-[9px] text-blue-100 truncate">{currentUser.jabatan}</div>
        </div>
        {pendingCountForUser > 0 && (
          <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-900 font-extrabold text-[10px] flex items-center justify-center shrink-0">
            {pendingCountForUser}
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-white/80 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Modal / Dropdown: User Profile Card */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-900/20 sm:bg-transparent"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 max-h-[82vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 p-4 text-slate-900 animate-in fade-in zoom-in-95 duration-150">
            {/* User Header Profile */}
            <div className="flex items-start gap-3 pb-3.5 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0f4c82] to-[#1a6bb5] text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                {getRoleInitials(currentUser.role)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug break-words">
                    {currentUser.nama}
                  </h4>
                </div>
                <div className="text-[11px] text-slate-500 font-mono-tabular mt-0.5 break-all">
                  @{currentUser.username}
                </div>
                <div className="mt-1.5">
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border ${getRoleBadgeStyle(currentUser.role)}`}>
                    {getRoleDisplayName(currentUser.role)}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Detail Fields (Read-Only) */}
            <div className="py-3 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-3 text-slate-600 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                <span className="flex items-center gap-1.5 text-slate-500 text-[11px] shrink-0">
                  <CreditCard className="w-3.5 h-3.5 text-[#0f4c82]" />
                  <span>NIP</span>
                </span>
                <span className="font-mono-tabular font-semibold text-slate-800 text-[11px] text-right break-all">
                  {currentUser.nip || '-'}
                </span>
              </div>

              <div className="flex items-start justify-between gap-3 text-slate-600 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                <span className="flex items-center gap-1.5 text-slate-500 text-[11px] shrink-0 pt-0.5">
                  <Briefcase className="w-3.5 h-3.5 text-[#0f4c82]" />
                  <span>Jabatan</span>
                </span>
                <span className="font-medium text-slate-800 text-[11px] text-right break-words min-w-0 flex-1 leading-snug">
                  {currentUser.jabatan || '-'}
                </span>
              </div>

              <div className="flex items-start justify-between gap-3 text-slate-600 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                <span className="flex items-center gap-1.5 text-slate-500 text-[11px] shrink-0 pt-0.5">
                  <Building className="w-3.5 h-3.5 text-[#0f4c82]" />
                  <span>Tim / Unit</span>
                </span>
                <span className="font-medium text-slate-800 text-[11px] text-right break-words min-w-0 flex-1 leading-snug">
                  {currentUser.unitKerja || '-'}
                </span>
              </div>

              {currentUser.lingkupVerifikasi && (
                <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-[11px] text-amber-900">
                  <div className="font-semibold flex items-center gap-1 text-[10px] text-amber-800 uppercase tracking-wider">
                    <Shield className="w-3 h-3 text-amber-600" />
                    <span>Lingkup Verifikasi</span>
                  </div>
                  <div className="mt-0.5 leading-relaxed break-words">{currentUser.lingkupVerifikasi}</div>
                </div>
              )}
            </div>

            {/* Security Note */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2 text-[10px] text-slate-500 leading-relaxed mb-3">
              <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>
                Akun diverifikasi dari database Google Spreadsheet. Untuk berganti akun pengguna, silakan keluar terlebih dahulu.
              </span>
            </div>

            {/* Admin Action: Manage Users in Spreadsheet */}
            {currentUser.role === 'ADMIN' && onOpenUserManagement && (
              <div className="mb-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenUserManagement();
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#0f4c82]" />
                    <span>Kelola Pengguna di Spreadsheet</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            )}

            {/* Logout Action */}
            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onLogout();
                }}
                className="w-full py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600" />
                <span>Keluar dari Akun</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
