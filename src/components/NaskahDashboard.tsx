import React, { useState } from 'react';
import {
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Archive,
  ArrowRight,
  Upload,
  Search,
  BookOpen,
  ShieldCheck,
  Sparkles,
  Layers,
  FileCheck,
  CheckSquare,
  Users,
  Settings,
  Database,
  ExternalLink,
  Table2,
  Eye,
  Building,
  UserCheck,
  ChevronDown,
} from 'lucide-react';
import { NaskahDinas, StatusNaskah, UserProfile } from '../types';
import { NaskahTimelineModal } from './NaskahTimelineModal';
import { formatTanggalIndo } from '../utils/storage';

interface NaskahDashboardProps {
  naskahList: NaskahDinas[];
  currentUser: UserProfile;
  onNavigateTab: (tab: 'dashboard' | 'pengajuan' | 'verifikasi' | 'arsip' | 'pedoman' | 'penomoran' | 'pengguna') => void;
  onSelectNaskahDetail: (naskah: NaskahDinas) => void;
  onOpenSettings?: () => void;
  onOpenSetupDatabase?: () => void;
}

export const NaskahDashboard: React.FC<NaskahDashboardProps> = ({
  naskahList,
  currentUser,
  onNavigateTab,
  onSelectNaskahDetail,
  onOpenSettings,
  onOpenSetupDatabase,
}) => {
  const [selectedTimelineNaskah, setSelectedTimelineNaskah] = useState<NaskahDinas | null>(null);
  const [isAlurOpen, setIsAlurOpen] = useState(false);

  const countDiajukan = naskahList.filter(
    (n) => n.status === 'MENUNGGU_VERIFIKASI' || n.status === 'DRAF_DIAJUKAN' || n.status === 'SEDANG_DIPERIKSA'
  ).length;
  const countPerbaikan = naskahList.filter((n) => n.status === 'PERLU_PERBAIKAN').length;
  const countTerverifikasi = naskahList.filter(
    (n) => n.status === 'MENUNGGU_PENOMORAN' || n.status === 'NOMOR_DITERBITKAN' || n.status === 'TERVERIFIKASI'
  ).length;
  const countFinal = naskahList.filter((n) => n.status === 'SELESAI_ARSIP' || n.status === 'FINAL_DIARSIPKAN').length;
  const countTotal = naskahList.length;

  // Pending for current user role
  const pendingForCurrentUser = naskahList.filter((n) => {
    if (currentUser.role === 'KONSEPTOR') {
      return (
        (n.status === 'PERLU_PERBAIKAN' || n.status === 'NOMOR_DITERBITKAN' || n.status === 'MENUNGGU_DOKUMEN_FINAL') &&
        (n.namaKonseptor.toLowerCase() === currentUser.nama.toLowerCase() ||
          n.unitKerja.toLowerCase() === currentUser.unitKerja.toLowerCase())
      );
    }
    if (currentUser.role === 'ADMIN' || currentUser.role === 'ARSIPARIS') {
      return (
        n.status === 'MENUNGGU_VERIFIKASI' ||
        n.status === 'DRAF_DIAJUKAN' ||
        n.status === 'MENUNGGU_PENOMORAN' ||
        n.status === 'TERVERIFIKASI'
      );
    }
    // Specific verifier
    return (
      n.roleVerifikatorDitunjuk === currentUser.role &&
      (n.status === 'MENUNGGU_VERIFIKASI' || n.status === 'DRAF_DIAJUKAN')
    );
  });

  // Konseptor submissions
  const mySubmissions = naskahList.filter(
    (n) =>
      currentUser.role === 'ADMIN' ||
      n.namaKonseptor.toLowerCase() === currentUser.nama.toLowerCase() ||
      n.unitKerja.toLowerCase() === currentUser.unitKerja.toLowerCase()
  );

  const handleMetricClick = (preferredTab: 'pengajuan' | 'verifikasi' | 'arsip' | 'penomoran') => {
    if (currentUser.allowedTabs.includes(preferredTab)) {
      onNavigateTab(preferredTab);
    } else {
      // Fallback to dashboard or permitted tab
      if (currentUser.role === 'KONSEPTOR' && currentUser.allowedTabs.includes('pengajuan')) {
        onNavigateTab('pengajuan');
      } else if (currentUser.allowedTabs.includes('arsip')) {
        onNavigateTab('arsip');
      }
    }
  };

  const getRoleDisplayName = (role: string) => {
    if (role === 'ADMIN') return 'Administrator Tata Usaha';
    if (role === 'ARSIPARIS') return 'Arsiparis Ahli';
    if (role === 'KONSEPTOR') return 'Konseptor Pegawai';
    if (role === 'VIEWER') return 'Viewer / Tamu Eksternal';
    return `Verifikator ${currentUser.nama} (${role.replace('VERIFIKATOR_', 'Tim ')})`;
  };

  return (
    <div className="space-y-6">
      {/* Welcome & Role Context Banner */}
      <div className="bg-gradient-to-r from-[#0f4c82] via-[#1a6bb5] to-[#1a7a4a] text-white p-6 sm:p-7 xl:p-8 rounded-2xl shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#e06c1a] text-white uppercase tracking-wider mb-2.5 shadow-xs">
              <span>{getRoleDisplayName(currentUser.role)}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-heading tracking-tight leading-snug">
              Selamat Datang, {currentUser.nama}
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 mt-1.5 max-w-3xl xl:max-w-4xl leading-relaxed">
              Unit: <strong className="text-amber-300 font-semibold">{currentUser.unitKerja}</strong> · Jabatan: {currentUser.jabatan}. Pantau alur penyusunan naskah dinas, verifikasi mutu tata kearsipan, hingga pengesahan dan penyimpanan arsip digital BPS Provinsi Kalimantan Barat.
            </p>
          </div>

          {/* Role-tailored action buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Konseptor Actions */}
            {currentUser.allowedTabs.includes('pengajuan') && (
              <button
                onClick={() => onNavigateTab('pengajuan')}
                className="px-4 py-2.5 rounded-xl bg-white text-[#0f4c82] hover:bg-blue-50 font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>+ Ajukan Draf Naskah</span>
              </button>
            )}

            {/* Verifikator Actions */}
            {currentUser.allowedTabs.includes('verifikasi') && (
              <button
                onClick={() => onNavigateTab('verifikasi')}
                className="px-4 py-2.5 rounded-xl bg-white text-[#0f4c82] hover:bg-blue-50 font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Buka Meja Verifikasi</span>
                {countDiajukan > 0 && (
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-extrabold text-[10px] flex items-center justify-center">
                    {countDiajukan}
                  </span>
                )}
              </button>
            )}

            {/* Arsiparis / Admin Arsip Digital */}
            {currentUser.allowedTabs.includes('arsip') && (
              <button
                onClick={() => onNavigateTab('arsip')}
                className="px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs transition-all border border-white/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Archive className="w-4 h-4" />
                <span>Arsip Digital ({countFinal})</span>
              </button>
            )}

            {/* Admin Exclusive Quick Actions */}
            {currentUser.role === 'ADMIN' && (
              <>
                <button
                  onClick={() => onNavigateTab('pengguna')}
                  className="px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs transition-all border border-white/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  <span>Kelola Pengguna</span>
                </button>

                {onOpenSetupDatabase && (
                  <button
                    onClick={onOpenSetupDatabase}
                    className="px-3.5 py-2.5 rounded-xl bg-emerald-800/50 hover:bg-emerald-800/70 text-emerald-200 font-semibold text-xs transition-all border border-emerald-400/30 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Database className="w-4 h-4 text-emerald-300" />
                    <span>Database Sheet</span>
                  </button>
                )}
              </>
            )}

            <button
              onClick={() => onNavigateTab('pedoman')}
              className="px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs transition-all border border-white/20 flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Pedoman</span>
            </button>
          </div>
        </div>

        {/* Pending tasks alert if any */}
        {pendingForCurrentUser.length > 0 && (
          <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span>
                Terdapat <strong className="text-white">{pendingForCurrentUser.length} naskah dinas</strong> yang memerlukan tindakan Anda saat ini.
              </span>
            </div>
            <button
              onClick={() =>
                onNavigateTab(currentUser.role === 'KONSEPTOR' ? 'pengajuan' : 'verifikasi')
              }
              className="underline text-white font-bold hover:text-amber-300 cursor-pointer flex items-center gap-1"
            >
              <span>Periksa Antrian Sekarang</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 5-Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 xl:gap-4.5">
        {/* Total Pengajuan */}
        <div className="p-4 sm:p-5 xl:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between min-h-[120px] xl:min-h-[135px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] xl:text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Naskah
            </span>
            <div className="w-8 h-8 xl:w-9 xl:h-9 rounded-xl bg-blue-50 text-[#0f4c82] flex items-center justify-center border border-blue-100">
              <FileText className="w-4 h-4 xl:w-4.5 xl:h-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono-tabular leading-tight">{countTotal}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Database Spreadsheet</div>
          </div>
        </div>

        {/* Menunggu Verifikasi */}
        <div
          onClick={() => handleMetricClick('verifikasi')}
          className="p-4 sm:p-5 xl:p-6 rounded-2xl bg-blue-50/60 border border-blue-200 shadow-xs hover:shadow-md hover:bg-blue-50 hover:border-blue-300 transition-all flex flex-col justify-between min-h-[120px] xl:min-h-[135px] cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] xl:text-xs font-bold text-blue-800 uppercase tracking-wider group-hover:text-[#0f4c82]">
              Menunggu Verif
            </span>
            <div className="w-8 h-8 xl:w-9 xl:h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center border border-blue-200">
              <Clock className="w-4 h-4 xl:w-4.5 xl:h-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-blue-900 font-mono-tabular leading-tight">{countDiajukan}</div>
            <div className="text-[11px] text-blue-700/80 mt-0.5">Dalam antrian verifikator</div>
          </div>
        </div>

        {/* Perlu Perbaikan */}
        <div
          onClick={() => handleMetricClick('pengajuan')}
          className="p-4 sm:p-5 xl:p-6 rounded-2xl bg-rose-50/60 border border-rose-200 shadow-xs hover:shadow-md hover:bg-rose-50 hover:border-rose-300 transition-all flex flex-col justify-between min-h-[120px] xl:min-h-[135px] cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] xl:text-xs font-bold text-rose-800 uppercase tracking-wider group-hover:text-rose-900">
              Perlu Perbaikan
            </span>
            <div className="w-8 h-8 xl:w-9 xl:h-9 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center border border-rose-200">
              <AlertTriangle className="w-4 h-4 xl:w-4.5 xl:h-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-rose-900 font-mono-tabular leading-tight">{countPerbaikan}</div>
            <div className="text-[11px] text-rose-700/80 mt-0.5">Catatan revisi konseptor</div>
          </div>
        </div>

        {/* Terverifikasi */}
        <div
          onClick={() => handleMetricClick('verifikasi')}
          className="p-4 sm:p-5 xl:p-6 rounded-2xl bg-emerald-50/60 border border-emerald-200 shadow-xs hover:shadow-md hover:bg-emerald-50 hover:border-emerald-300 transition-all flex flex-col justify-between min-h-[120px] xl:min-h-[135px] cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] xl:text-xs font-bold text-emerald-800 uppercase tracking-wider group-hover:text-emerald-900">
              Terverifikasi
            </span>
            <div className="w-8 h-8 xl:w-9 xl:h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center border border-emerald-200">
              <FileCheck className="w-4 h-4 xl:w-4.5 xl:h-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-emerald-900 font-mono-tabular leading-tight">
              {countTerverifikasi}
            </div>
            <div className="text-[11px] text-emerald-700/80 mt-0.5">Format sah, siap TTD</div>
          </div>
        </div>

        {/* Final & Diarsipkan */}
        <div
          onClick={() => handleMetricClick('arsip')}
          className="p-4 sm:p-5 xl:p-6 rounded-2xl bg-gradient-to-br from-[#0c3e66] via-[#0f4c82] to-[#125d36] text-white shadow-xs hover:shadow-md hover:brightness-105 transition-all flex flex-col justify-between min-h-[120px] xl:min-h-[135px] cursor-pointer col-span-2 sm:col-span-1 border border-blue-900/30 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] xl:text-xs font-bold text-blue-100 uppercase tracking-wider group-hover:text-white">
              Arsip Digital
            </span>
            <div className="w-8 h-8 xl:w-9 xl:h-9 rounded-xl bg-white/15 text-white flex items-center justify-center border border-white/20">
              <Archive className="w-4 h-4 xl:w-4.5 xl:h-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-white font-mono-tabular leading-tight">{countFinal}</div>
            <div className="text-[11px] text-amber-200 font-medium mt-0.5">Sah bertanda tangan & Google Drive</div>
          </div>
        </div>
      </div>

      {/* ── KONSEPTOR EXCLUSIVE SECTION: TIMELINE PROGRES PENGAJUAN TERKINI ── */}
      {currentUser.role === 'KONSEPTOR' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0f4c82] uppercase tracking-wider mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Monitoring Konseptor</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 font-heading">
                Timeline Progres Pengajuan Naskah Anda
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('pengajuan')}
              className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0f4c82] font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors self-start sm:self-auto"
            >
              <span>Buka Seluruh Pengajuan ({mySubmissions.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {mySubmissions.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Belum ada draf naskah yang diajukan. Mulai dengan mengunggah draf pertama Anda melalui tombol di atas.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {mySubmissions.slice(0, 4).map((item) => {
                const isNeedRevision = item.status === 'PERLU_PERBAIKAN';
                const isVerified = item.status === 'TERVERIFIKASI';
                const isArchived = item.status === 'FINAL_DIARSIPKAN';

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedTimelineNaskah(item)}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-[#0f4c82] hover:shadow-xs transition-all cursor-pointer bg-slate-50/50 hover:bg-white flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono-tabular font-bold text-xs text-[#0f4c82]">
                          {item.nomorRegistrasi}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isArchived
                              ? 'bg-teal-50 text-teal-800 border border-teal-200'
                              : isVerified
                              ? 'bg-emerald-100 text-emerald-800'
                              : isNeedRevision
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {isArchived
                            ? '✔ Diarsipkan'
                            : isVerified
                            ? '✔ Disetujui'
                            : isNeedRevision
                            ? '⚠ Perlu Revisi'
                            : 'Verifikasi'}
                        </span>
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 mt-1.5 line-clamp-2">
                        {item.perihal}
                      </h4>

                      <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                        <span>Verifikator: <strong>{item.verifikatorDitunjuk}</strong></span>
                        <span>·</span>
                        <span className="font-mono-tabular">{formatTanggalIndo(item.tanggalPengajuan)}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 text-[11px] flex items-center justify-between text-slate-400">
                      <span className="text-slate-600 font-medium">
                        {item.jenisNaskah}
                      </span>
                      <span className="text-[#1a6bb5] font-bold hover:underline flex items-center gap-1">
                        <span>Buka Timeline</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Alur Proses Diagram Interaktif (Collapsible) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all duration-200">
        <button
          type="button"
          onClick={() => setIsAlurOpen(!isAlurOpen)}
          className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0f4c82] flex items-center justify-center shrink-0 border border-blue-100">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 font-heading leading-tight">
                Standar Alur Proses Naskah Dinas & Kearsipan Digital BPS Kalbar
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                4 Tahapan Resmi: Penyusunan Draf, Verifikasi Mutu, Pengesahan Legal/TTE, & Arsip Digital
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors">
              {isAlurOpen ? 'Tutup Alur' : 'Buka Alur Proses (4 Tahap)'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isAlurOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </button>

        {isAlurOpen && (
          <div className="px-5 pb-5 pt-1 border-t border-slate-100 animate-in fade-in slide-in-from-top-1 duration-200 space-y-3">
            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
              <span>Pedoman Tata Naskah Dinas & Kearsipan BPS Kalbar</span>
              <span className="font-medium">Unit Kerja: 6100</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              {/* Langkah 1 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-bold text-[#1a6bb5] uppercase tracking-wider">
                    Tahap 01
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-1">Konseptor: Susun & Unggah Draf</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Konseptor menyusun draf Word (.docx) sesuai template naskah dinas resmi dan mengisi perihal serta unit kerja pengusul.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                  <span>Status:</span> <span className="text-blue-700">Draf Diajukan</span>
                </div>
              </div>

              {/* Langkah 2 */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-bold text-[#0f4c82] uppercase tracking-wider">
                    Tahap 02
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-1">Verifikasi: Tim & Arsiparis</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Pemeriksaan 5 aspek (format, struktur, EYD, nomor/klasifikasi, kepatuhan hukum). Jika ada catatan, draf dikembalikan untuk perbaikan konseptor.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-blue-200 text-[10px] text-slate-500 flex items-center justify-between">
                  <span className="text-rose-600 font-bold">Perlu Perbaikan</span>
                  <span>/</span>
                  <span className="text-emerald-700 font-bold">Terverifikasi</span>
                </div>
              </div>

              {/* Langkah 3 */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                    Tahap 03
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-1">Penandatanganan (TTE / Basah)</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Draf yang telah berstatus terverifikasi dicetak untuk tanda tangan basah pimpinan atau diproses secara elektronik dengan sertifikasi TTE BSrE.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-emerald-200 text-[10px] text-emerald-800 font-semibold">
                  Proses Pengesahan Legal
                </div>
              </div>

              {/* Langkah 4 */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0c3e66] to-[#0f4c82] text-white flex flex-col justify-between border border-blue-900/30 shadow-xs">
                <div>
                  <div className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                    Tahap 04
                  </div>
                  <h4 className="text-xs font-bold text-white mt-1">Unggah Final & Arsip Digital Google Drive</h4>
                  <p className="text-[11px] text-blue-100/90 mt-1 leading-relaxed">
                    Softcopy PDF naskah resmi yang sah diunggah ke repositori Arsip Digital terpadu. Tersimpan permanen dalam hierarki folder Google Drive dan buku register resmi BPS.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-white/20 text-[10px] text-emerald-300 font-bold">
                  Status: Final Diarsipkan (Google Drive)
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Daftar Naskah Dinas Terkini */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#0f4c82] flex items-center justify-center border border-blue-100">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 font-heading">Naskah Dinas Terkini dalam Sistem</h3>
          </div>
          <button
            onClick={() =>
              handleMetricClick(
                currentUser.allowedTabs.includes('verifikasi') ? 'verifikasi' : 'pengajuan'
              )
            }
            className="text-xs font-bold text-[#1a6bb5] hover:text-[#0f4c82] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Buka Semua Naskah</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {naskahList.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0f4c82] flex items-center justify-center mx-auto border border-blue-100">
                <FileText className="w-6 h-6 opacity-60" />
              </div>
              <div className="max-w-md mx-auto">
                <h4 className="text-sm font-bold text-slate-800">Database Naskah Dinas Masih Kosong</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Data naskah dinas bersumber langsung dari Google Spreadsheet sheet NaskahDinas.
                </p>
              </div>
            </div>
          ) : (
            naskahList.slice(0, 5).map((item) => {
              const isNeedRevision = item.status === 'PERLU_PERBAIKAN';
              const isVerified = item.status === 'TERVERIFIKASI';
              const isArchived = item.status === 'FINAL_DIARSIPKAN';

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedTimelineNaskah(item)}
                  className="p-4 sm:px-6 hover:bg-blue-50/40 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono-tabular font-bold text-xs text-[#0f4c82] bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                        {item.nomorRegistrasi}
                      </span>
                      {item.nomorSuratDipesan && (
                        <span className="font-mono-tabular font-semibold text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                          {item.nomorSuratDipesan}
                        </span>
                      )}
                      <span className="text-[11px] font-medium text-slate-500">
                        {item.jenisNaskah}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-[11px] font-medium text-slate-600">
                        {item.unitKerja}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 mt-1.5 line-clamp-1 group-hover:text-[#0f4c82] transition-colors">
                      {item.perihal}
                    </h4>

                    <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                      <span>Konseptor: <strong className="text-slate-700">{item.namaKonseptor}</strong></span>
                      <span>·</span>
                      <span>Verifikator: <strong className="text-slate-700">{item.verifikatorDitunjuk}</strong></span>
                      <span>·</span>
                      <span>Tanggal: <span className="font-mono-tabular">{formatTanggalIndo(item.tanggalPengajuan)}</span></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        item.status === 'SELESAI_ARSIP' || item.status === 'FINAL_DIARSIPKAN'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : item.status === 'NOMOR_DITERBITKAN' || item.status === 'MENUNGGU_DOKUMEN_FINAL'
                          ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                          : item.status === 'MENUNGGU_PENOMORAN' || item.status === 'TERVERIFIKASI'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : item.status === 'PERLU_PERBAIKAN'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : item.status === 'DITOLAK'
                          ? 'bg-red-50 text-red-800 border-red-200'
                          : 'bg-blue-50 text-blue-800 border-blue-200'
                      }`}
                    >
                      {item.status === 'SELESAI_ARSIP' || item.status === 'FINAL_DIARSIPKAN'
                        ? '✔ Selesai – Arsip Sah'
                        : item.status === 'NOMOR_DITERBITKAN' || item.status === 'MENUNGGU_DOKUMEN_FINAL'
                        ? '✔ No. Terbit (Siap Final)'
                        : item.status === 'MENUNGGU_PENOMORAN' || item.status === 'TERVERIFIKASI'
                        ? 'Menunggu Nomor Surat'
                        : item.status === 'PERLU_PERBAIKAN'
                        ? '⚠ Perlu Perbaikan'
                        : item.status === 'DITOLAK'
                        ? '✕ Ditolak'
                        : 'Menunggu Verifikasi'}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0f4c82] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal Detail Timeline */}
      {selectedTimelineNaskah && (
        <NaskahTimelineModal
          naskah={selectedTimelineNaskah}
          currentUser={currentUser}
          onClose={() => setSelectedTimelineNaskah(null)}
          onOpenRevisiModal={(n) => {
            setSelectedTimelineNaskah(null);
            onSelectNaskahDetail(n);
          }}
        />
      )}
    </div>
  );
};
