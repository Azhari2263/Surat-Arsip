import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Shield,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  KeyRound,
  Eye,
  EyeOff,
  RefreshCw,
  Database,
  Building,
  Briefcase,
  AlertTriangle,
  X,
  FileCheck2,
  Check,
} from 'lucide-react';
import { TabKey, UserProfile, UserRole } from '../types';
import { mapRoleToAllowedTabs } from '../utils/userStorage';
import { DAFTAR_TIM_KERJA } from '../data/bpsClassifications';

interface UserManagementViewProps {
  userList: UserProfile[];
  currentUser: UserProfile;
  onSaveUser: (user: UserProfile) => Promise<boolean>;
  onDeleteUser: (userId: string, username: string) => Promise<boolean>;
  onSyncSpreadsheet: () => Promise<void>;
  isSyncing: boolean;
}

const AVAILABLE_ROLES: { role: UserRole; label: string; desc: string; defaultUnit: string }[] = [
  { role: 'ADMIN', label: 'Administrator Tata Usaha', desc: 'Akses penuh seluruh modul, penerbitan nomor & pengelolaan pengguna', defaultUnit: 'Pimpinan & TU Kepala' },
  { role: 'ARSIPARIS', label: 'Arsiparis', desc: 'Verifikasi tata kearsipan, persetujuan akhir & arsip', defaultUnit: 'Tata Usaha / Kearsipan' },
  { role: 'KONSEPTOR', label: 'Konseptor Pegawai', desc: 'Penyusunan draf naskah dinas, revisi & unggah dokumen final', defaultUnit: 'Tim Sosial' },
  { role: 'VERIFIKATOR_YUN', label: 'Verifikator M. Yun Imran, S.E. (SDM & Keuangan)', desc: 'Pemeriksaan draf naskah Tim SDM dan Tim Keuangan', defaultUnit: 'Tim SDM' },
  { role: 'VERIFIKATOR_AMANDA', label: 'Verifikator Amanda Putri, A.Md. (Perencanaan & Neraca)', desc: 'Pemeriksaan draf naskah Tim Perencanaan dan Tim Neraca', defaultUnit: 'Tim Neraca' },
  { role: 'VERIFIKATOR_RANIA', label: 'Verifikator Rania Naila Husna, A.Md.A.B (Distribusi & Sosial)', desc: 'Pemeriksaan draf naskah Tim Distribusi dan Tim Sosial', defaultUnit: 'Tim Distribusi' },
  { role: 'VERIFIKATOR_VIVI', label: 'Verifikator Alfiana Ayuni, A.Md. (Produksi)', desc: 'Pemeriksaan draf naskah Tim Produksi', defaultUnit: 'Tim Produksi' },
  { role: 'VERIFIKATOR_AGUS', label: 'Verifikator Agustinus Supriadi, S.M. (IPDS & Umum/Humas)', desc: 'Pemeriksaan draf naskah Tim IPDS dan Tim Umum & Humas', defaultUnit: 'Tim IPDS' },
  { role: 'VIEWER', label: 'Viewer / Tamu (Read-Only)', desc: 'Hanya melihat register arsip dan pedoman', defaultUnit: 'Pengawasan / Tamu' },
];

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  userList,
  currentUser,
  onSaveUser,
  onDeleteUser,
  onSyncSpreadsheet,
  isSyncing,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AKTIF' | 'NONAKTIF'>('ALL');

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  // Form Fields
  const [formData, setFormData] = useState<{
    id: string;
    username: string;
    password: string;
    nip: string;
    nama: string;
    jabatan: string;
    unitKerja: string;
    role: UserRole;
    lingkupVerifikasi: string;
    statusAktif: boolean;
  }>({
    id: '',
    username: '',
    password: '',
    nip: '',
    nama: '',
    jabatan: '',
    unitKerja: 'Sosial',
    role: 'KONSEPTOR',
    lingkupVerifikasi: 'Penyusunan Draf Naskah Dinas',
    statusAktif: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation Modal
  const [deleteCandidate, setDeleteCandidate] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Metrics
  const metrics = useMemo(() => {
    const total = userList.length;
    const aktif = userList.filter((u) => u.statusAktif !== false).length;
    const nonaktif = total - aktif;
    const verifikator = userList.filter((u) => u.role.startsWith('VERIFIKATOR_')).length;
    const konseptor = userList.filter((u) => u.role === 'KONSEPTOR').length;
    const admin = userList.filter((u) => u.role === 'ADMIN').length;
    return { total, aktif, nonaktif, verifikator, konseptor, admin };
  }, [userList]);

  // Filtered List
  const filteredUsers = useMemo(() => {
    return userList.filter((u) => {
      const matchSearch =
        u.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.nip && u.nip.includes(searchTerm)) ||
        u.unitKerja.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.jabatan.toLowerCase().includes(searchTerm.toLowerCase());

      const matchRole = roleFilter === 'ALL' || u.role === roleFilter;

      const isUserActive = u.statusAktif !== false;
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'AKTIF' && isUserActive) ||
        (statusFilter === 'NONAKTIF' && !isUserActive);

      return matchSearch && matchRole && matchStatus;
    });
  }, [userList, searchTerm, roleFilter, statusFilter]);

  const handleOpenAdd = () => {
    setModalMode('add');
    setEditingUser(null);
    setFormData({
      id: `usr-${Date.now().toString(36)}`,
      username: '',
      password: '',
      nip: '',
      nama: '',
      jabatan: '',
      unitKerja: 'Sosial',
      role: 'KONSEPTOR',
      lingkupVerifikasi: 'Penyusunan Draf Naskah Dinas',
      statusAktif: true,
    });
    setFormError('');
    setShowPassword(false);
    setShowModal(true);
  };

  const handleOpenEdit = (user: UserProfile) => {
    setModalMode('edit');
    setEditingUser(user);
    setFormData({
      id: user.id,
      username: user.username,
      password: user.password || '',
      nip: user.nip || '',
      nama: user.nama,
      jabatan: user.jabatan,
      unitKerja: user.unitKerja,
      role: user.role,
      lingkupVerifikasi: user.lingkupVerifikasi || '',
      statusAktif: user.statusAktif !== false,
    });
    setFormError('');
    setShowPassword(false);
    setShowModal(true);
  };

  const handleRoleChange = (newRole: UserRole) => {
    const roleMeta = AVAILABLE_ROLES.find((r) => r.role === newRole);
    setFormData((prev) => ({
      ...prev,
      role: newRole,
      unitKerja: roleMeta?.defaultUnit || prev.unitKerja,
      lingkupVerifikasi: roleMeta?.desc || prev.lingkupVerifikasi,
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanUsername = formData.username.trim().toLowerCase();
    if (!cleanUsername) {
      setFormError('Username wajib diisi.');
      return;
    }

    if (!formData.nama.trim()) {
      setFormError('Nama lengkap pegawai wajib diisi.');
      return;
    }

    if (!formData.password) {
      setFormError('Kata sandi tidak boleh kosong.');
      return;
    }

    // Check duplicate username in Add mode
    if (modalMode === 'add') {
      const exists = userList.some(
        (u) => u.username.toLowerCase() === cleanUsername
      );
      if (exists) {
        setFormError(`Username "${cleanUsername}" sudah digunakan. Silakan pilih username lain.`);
        return;
      }
    }

    const payload: UserProfile = {
      id: formData.id || `usr-${Date.now().toString(36)}`,
      username: cleanUsername,
      password: formData.password,
      nip: formData.nip.trim() || undefined,
      nama: formData.nama.trim(),
      jabatan: formData.jabatan.trim() || 'Pegawai BPS',
      unitKerja: formData.unitKerja.trim() || 'Umum',
      role: formData.role,
      lingkupVerifikasi: formData.lingkupVerifikasi.trim() || undefined,
      allowedTabs: mapRoleToAllowedTabs(formData.role),
      statusAktif: formData.statusAktif,
    };

    setIsSubmitting(true);
    try {
      const ok = await onSaveUser(payload);
      if (ok) {
        setShowModal(false);
      } else {
        setFormError('Gagal menyimpan data ke database spreadsheet.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Terjadi kesalahan sistem saat menyimpan data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;

    if (deleteCandidate.id === currentUser.id || deleteCandidate.username.toLowerCase() === currentUser.username.toLowerCase()) {
      setDeleteError('Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.');
      return;
    }

    setDeleteError(null);
    setIsDeleting(true);
    try {
      const ok = await onDeleteUser(deleteCandidate.id, deleteCandidate.username);
      if (ok) {
        setDeleteCandidate(null);
      } else {
        setDeleteError('Gagal menghapus pengguna dari database spreadsheet.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === 'ADMIN') return 'bg-purple-100 text-purple-900 border-purple-200';
    if (role === 'ARSIPARIS') return 'bg-emerald-100 text-emerald-900 border-emerald-200';
    if (role === 'KONSEPTOR') return 'bg-blue-100 text-[#0f4c82] border-blue-200';
    if (role === 'VIEWER') return 'bg-slate-100 text-slate-800 border-slate-200';
    return 'bg-amber-100 text-amber-900 border-amber-200';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Heading */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#0f4c82] border border-blue-200/60 mb-2">
            <Database className="w-3.5 h-3.5 text-[#1a6bb5]" />
            <span>Database Google Spreadsheet · Sheet "Pengguna"</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
            Pengelolaan Akun Pengguna & Hak Akses
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Seluruh data akun, username, kata sandi, dan hak akses disimpan dan disinkronkan secara langsung ke sheet <strong>Pengguna</strong> pada Google Spreadsheet. Tidak ada akun dummy atau hardcode.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={onSyncSpreadsheet}
            disabled={isSyncing}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Muat ulang akun langsung dari Google Spreadsheet"
          >
            <RefreshCw className={`w-4 h-4 text-[#0f4c82] ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Database'}</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0f4c82] to-[#1a6bb5] hover:opacity-95 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Pengguna Baru</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Akun</div>
          <div className="text-xl font-black text-slate-900 font-mono-tabular mt-1">{metrics.total}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Tersimpan di Sheet</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Akun Aktif</div>
          <div className="text-xl font-black text-emerald-700 font-mono-tabular mt-1">{metrics.aktif}</div>
          <div className="text-[10px] text-emerald-600/70 mt-0.5">Dapat Login</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Admin TU</div>
          <div className="text-xl font-black text-purple-700 font-mono-tabular mt-1">{metrics.admin}</div>
          <div className="text-[10px] text-purple-600/70 mt-0.5">Akses Penuh</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Verifikator Tim</div>
          <div className="text-xl font-black text-amber-700 font-mono-tabular mt-1">{metrics.verifikator}</div>
          <div className="text-[10px] text-amber-600/70 mt-0.5">5 Unit Kerja</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Konseptor</div>
          <div className="text-xl font-black text-blue-700 font-mono-tabular mt-1">{metrics.konseptor}</div>
          <div className="text-[10px] text-blue-600/70 mt-0.5">Pengaju Draf</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Nonaktif</div>
          <div className="text-xl font-black text-slate-600 font-mono-tabular mt-1">{metrics.nonaktif}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Akses Dinonaktifkan</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan nama, username, NIP, unit kerja, atau jabatan..."
            className="w-full h-10 pl-10 pr-4 text-xs sm:text-sm rounded-xl border border-slate-300 text-slate-800 focus:border-[#0f4c82] focus:ring-2 focus:ring-[#0f4c82]/20 outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Role:</span>
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 text-xs px-3.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-700 outline-none focus:border-[#0f4c82] focus:ring-2 focus:ring-[#0f4c82]/20 transition-all cursor-pointer"
          >
            <option value="ALL">Semua Peran ({userList.length})</option>
            <option value="ADMIN">ADMIN (Tata Usaha)</option>
            <option value="ARSIPARIS">ARSIPARIS</option>
            <option value="KONSEPTOR">KONSEPTOR</option>
            <option value="VERIFIKATOR_YUN">Verifikator Yun</option>
            <option value="VERIFIKATOR_AMANDA">Verifikator Amanda</option>
            <option value="VERIFIKATOR_RANIA">Verifikator Rania</option>
            <option value="VERIFIKATOR_VIVI">Verifikator Vivi</option>
            <option value="VERIFIKATOR_AGUS">Verifikator Agus</option>
            <option value="VIEWER">VIEWER (Read-Only)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-10 text-xs px-3.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-700 outline-none focus:border-[#0f4c82] focus:ring-2 focus:ring-[#0f4c82]/20 transition-all cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="AKTIF">Hanya Aktif</option>
            <option value="NONAKTIF">Hanya Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Pengguna & NIP</th>
                <th className="px-4 py-3">Username & Kata Sandi</th>
                <th className="px-4 py-3">Jabatan & Unit Kerja</th>
                <th className="px-4 py-3">Role / Kewenangan</th>
                <th className="px-4 py-3">Lingkup Verifikasi</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-slate-600">Tidak ada pengguna yang cocok dengan kriteria pencarian.</p>
                      <p className="text-[11px] text-slate-400">Coba ubah kata kunci atau reset filter peran.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = u.id === currentUser.id || u.username.toLowerCase() === currentUser.username.toLowerCase();
                  const isAktif = u.statusAktif !== false;

                  return (
                    <tr
                      key={u.id || u.username}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        !isAktif ? 'bg-slate-50/40 opacity-75' : ''
                      }`}
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#0f4c82] font-black text-xs flex items-center justify-center shrink-0">
                            {u.nama.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{u.nama}</span>
                              {isCurrent && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-blue-600 text-white">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono-tabular">
                              {u.nip ? `NIP: ${u.nip}` : 'NIP: -'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-mono-tabular">
                        <div className="font-bold text-slate-800">@{u.username}</div>
                        <div className="text-[10px] text-slate-400">
                          {u.password ? '••••••••' : '(Tanpa sandi)'}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-800">{u.jabatan}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3 text-slate-400" />
                          <span>{u.unitKerja}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${getRoleBadge(u.role)}`}>
                          {u.role.replace('VERIFIKATOR_', 'VERIF. ')}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {u.allowedTabs.length} Modul Akses
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-slate-600 max-w-xs truncate" title={u.lingkupVerifikasi || '-'}>
                        {u.lingkupVerifikasi || '-'}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        {isAktif ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Aktif</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <XCircle className="w-3 h-3" />
                            <span>Nonaktif</span>
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 hover:text-[#0f4c82] hover:border-blue-200 text-slate-600 transition-colors cursor-pointer"
                            title="Edit data dan kata sandi pengguna"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setDeleteCandidate(u)}
                            disabled={isCurrent}
                            className={`p-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer ${
                              isCurrent
                                ? 'opacity-30 cursor-not-allowed text-slate-400'
                                : 'hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-slate-600'
                            }`}
                            title={isCurrent ? 'Tidak dapat menghapus akun Anda sendiri' : 'Hapus pengguna dari database'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-gradient-to-r from-[#0f4c82] to-[#1a6bb5] text-white flex items-center justify-between">
              <div>
                <h3 className="font-heading font-black text-base sm:text-lg">
                  {modalMode === 'add' ? 'Tambah Pengguna Baru' : 'Perbarui Data Pengguna'}
                </h3>
                <p className="text-xs text-blue-100">
                  Data akan langsung disimpan ke sheet <strong>Pengguna</strong> pada Google Spreadsheet
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Username */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Username Login <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                    placeholder="Contoh: agus, rania, statistisi1"
                    disabled={modalMode === 'edit'}
                    className={`w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs outline-none focus:border-[#0f4c82] ${
                      modalMode === 'edit' ? 'bg-slate-100 cursor-not-allowed' : ''
                    }`}
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Gunakan huruf kecil tanpa spasi
                  </span>
                </div>

                {/* Password */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kata Sandi <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Masukkan kata sandi akun"
                      className="w-full pl-3 pr-9 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:border-[#0f4c82]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Disimpan terenkripsi di Google Spreadsheet
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nama Lengkap */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Lengkap & Gelar <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    placeholder="Contoh: Rania Novita, S.Tr.Stat"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:border-[#0f4c82]"
                  />
                </div>

                {/* NIP Pegawai */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    NIP Pegawai (18 digit)
                  </label>
                  <input
                    type="text"
                    value={formData.nip}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value.replace(/\D/g, '') })}
                    placeholder="Contoh: 199211052015032001"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs outline-none focus:border-[#0f4c82]"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Peran / Hak Akses (Role) <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-xs outline-none focus:border-[#0f4c82]"
                >
                  {AVAILABLE_ROLES.map((r) => (
                    <option key={r.role} value={r.role}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <div className="mt-1.5 p-2 rounded-lg bg-blue-50/70 text-[11px] text-blue-900 border border-blue-100 flex items-start gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#0f4c82] shrink-0 mt-0.5" />
                  <span>
                    {AVAILABLE_ROLES.find((r) => r.role === formData.role)?.desc}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Jabatan */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jabatan Pegawai
                  </label>
                  <input
                    type="text"
                    value={formData.jabatan}
                    onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                    placeholder="Contoh: Statistisi Ahli Muda"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:border-[#0f4c82]"
                  />
                </div>

                {/* Unit Kerja */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Unit Kerja / Tim Kerja <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.unitKerja}
                    onChange={(e) => setFormData({ ...formData, unitKerja: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs outline-none focus:border-[#0f4c82]"
                  >
                    <option value="">— Pilih Tim Kerja —</option>
                    {DAFTAR_TIM_KERJA.map((tim) => (
                      <option key={tim} value={tim}>
                        {tim}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Lingkup Verifikasi */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Lingkup Verifikasi / Keterangan Penugasan
                </label>
                <input
                  type="text"
                  value={formData.lingkupVerifikasi}
                  onChange={(e) => setFormData({ ...formData, lingkupVerifikasi: e.target.value })}
                  placeholder="Contoh: Tim Distribusi dan Sosial"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:border-[#0f4c82]"
                />
              </div>

              {/* Status Aktif Switch */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <div>
                  <div className="font-bold text-slate-800">Status Akun Aktif</div>
                  <div className="text-[11px] text-slate-400">
                    Jika dinonaktifkan, pengguna tidak dapat masuk ke dalam sistem.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.statusAktif}
                    onChange={(e) => setFormData({ ...formData, statusAktif: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0f4c82]"></div>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0f4c82] to-[#1a6bb5] hover:opacity-95 text-white font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{modalMode === 'add' ? 'Simpan Pengguna' : 'Perbarui Pengguna'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-black text-lg text-slate-900">
              Hapus Pengguna?
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Apakah Anda yakin ingin menghapus akun <strong>{deleteCandidate.nama}</strong> (@{deleteCandidate.username})? Data ini akan dihapus secara permanen dari Sheet <strong>Pengguna</strong> pada Google Spreadsheet.
            </p>

            {deleteError && (
              <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {deleteError}
              </div>
            )}

            <div className="mt-6 flex items-center justify-center gap-2.5">
              <button
                onClick={() => {
                  setDeleteError(null);
                  setDeleteCandidate(null);
                }}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Ya, Hapus Akun</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
