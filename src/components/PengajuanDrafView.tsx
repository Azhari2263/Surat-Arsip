import React, { useState, useMemo } from 'react';
import {
  FileText,
  Upload,
  UserCheck,
  CheckCircle2,
  Calendar,
  Building,
  Info,
  X,
  FileCheck,
  ChevronDown,
  Sparkles,
  Search,
  Clock,
  AlertTriangle,
  Archive,
  Eye,
  Filter,
  Download,
  CheckCircle,
  RefreshCw,
  PlusCircle,
  ListOrdered,
  ChevronRight,
} from 'lucide-react';
import { JenisNaskahDinas, NaskahDinas, StatusNaskah, SuratKeluar, UserProfile, UserRole } from '../types';
import { TIM_KERJA_OPTIONS, DAFTAR_KLASIFIKASI_BPS } from '../data/bpsClassifications';
import { tentukanVerifikator } from '../data/verifikatorData';
import { NaskahTimelineModal } from './NaskahTimelineModal';
import { formatTanggalIndo } from '../utils/storage';

interface PengajuanDrafViewProps {
  currentUser: UserProfile;
  suratList: SuratKeluar[];
  naskahList?: NaskahDinas[];
  onSubmitDraf: (
    data: Omit<NaskahDinas, 'id' | 'nomorRegistrasi' | 'status' | 'riwayatVersi' | 'riwayatVerifikasi' | 'waktuUpdate'>
  ) => void;
  onNavigateToPedoman: () => void;
  onOpenRevisiModal?: (naskah: NaskahDinas) => void;
  onToast?: (msg: string) => void;
}

const DAFTAR_JENIS_NASKAH: JenisNaskahDinas[] = [
  'Surat Dinas Biasa',
  'Nota Dinas',
  'Surat Keputusan (SK)',
  'Surat Tugas',
  'Surat Perjanjian / Kerjasama',
  'Berita Acara',
  'Pengumuman',
  'Surat Undangan',
  'Surat Keterangan',
  'Surat Edaran',
];

export const PengajuanDrafView: React.FC<PengajuanDrafViewProps> = ({
  currentUser,
  suratList,
  naskahList = [],
  onSubmitDraf,
  onNavigateToPedoman,
  onOpenRevisiModal,
  onToast,
}) => {
  const [subTab, setSubTab] = useState<'form' | 'timeline'>('form');

  // Form Fields
  const [jenisNaskah, setJenisNaskah] = useState<JenisNaskahDinas>('Surat Dinas Biasa');
  const [perihal, setPerihal] = useState('');
  const [unitKerja, setUnitKerja] = useState(
    currentUser.unitKerja !== 'Semua Unit Kerja' ? currentUser.unitKerja : 'Sosial'
  );
  const [namaKonseptor, setNamaKonseptor] = useState(currentUser.nama);
  const [klasifikasiArsip, setKlasifikasiArsip] = useState('VS.100');
  const [nomorSuratDipesan, setNomorSuratDipesan] = useState('');
  const [ringkasanIsi, setRingkasanIsi] = useState('');

  // Uploaded Word file
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: number;
    type: string;
    dataUrl?: string;
  } | null>(null);

  // Classification search dropdown
  const [showKlasifSearch, setShowKlasifSearch] = useState(false);
  const [searchKlasifText, setSearchKlasifText] = useState('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timeline Filter & Search for Konseptor
  const [timelineSearch, setTimelineSearch] = useState('');
  const [timelineStatusFilter, setTimelineStatusFilter] = useState<string>('all');
  const [selectedTimelineNaskah, setSelectedTimelineNaskah] = useState<NaskahDinas | null>(null);

  // Auto-derived verifier based on unit kerja
  const verifikatorInfo = tentukanVerifikator(unitKerja);

  // Available completed letter numbers from register
  const availableNomorSurat = suratList.filter((s) => s.status === 'LENGKAP');

  // Konseptor submissions: filter by user or show all if Admin
  const mySubmissions = useMemo(() => {
    return naskahList.filter((item) => {
      if (currentUser.role === 'ADMIN') return true;
      return (
        item.namaKonseptor.toLowerCase() === currentUser.nama.toLowerCase() ||
        item.unitKerja.toLowerCase() === currentUser.unitKerja.toLowerCase()
      );
    });
  }, [naskahList, currentUser]);

  const filteredMySubmissions = useMemo(() => {
    return mySubmissions.filter((item) => {
      if (timelineStatusFilter !== 'all' && item.status !== timelineStatusFilter) return false;
      if (timelineSearch.trim()) {
        const q = timelineSearch.toLowerCase();
        return (
          item.perihal.toLowerCase().includes(q) ||
          item.nomorRegistrasi.toLowerCase().includes(q) ||
          item.jenisNaskah.toLowerCase().includes(q) ||
          (item.nomorSuratDipesan || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [mySubmissions, timelineStatusFilter, timelineSearch]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'doc' && ext !== 'docx') {
      alert('File draf naskah dinas wajib berformat Microsoft Word (.doc atau .docx)');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      alert('Ukuran file maksimal 20 MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedFile({
        name: file.name,
        size: file.size,
        type: file.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        dataUrl: event.target?.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const validate = (): boolean => {
    const errs: { [key: string]: string } = {};
    if (!perihal.trim()) errs.perihal = 'Perihal naskah dinas wajib diisi';
    if (!namaKonseptor.trim()) errs.namaKonseptor = 'Nama konseptor wajib diisi';
    if (!unitKerja) errs.unitKerja = 'Pilih unit kerja pengusul';
    if (!uploadedFile) errs.uploadedFile = 'Unggah file draf naskah dinas dalam format Word (.doc/.docx)';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const today = new Date();
    const tglPengajuan = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

    onSubmitDraf({
      jenisNaskah,
      perihal: perihal.trim(),
      unitKerja,
      namaKonseptor: namaKonseptor.trim(),
      tanggalPengajuan: tglPengajuan,
      verifikatorDitunjuk: verifikatorInfo.nama,
      roleVerifikatorDitunjuk: verifikatorInfo.role,
      klasifikasiArsip: klasifikasiArsip.trim(),
      nomorSuratDipesan: nomorSuratDipesan.trim() || undefined,
      ringkasanIsi: ringkasanIsi.trim(),
      drafFile: uploadedFile!,
    });

    setIsSubmitting(false);

    // Reset form and switch to timeline tab to show new submission
    setPerihal('');
    setRingkasanIsi('');
    setUploadedFile(null);
    setSubTab('timeline');
  };

  const getStatusBadgeStyle = (status: StatusNaskah) => {
    switch (status) {
      case 'DRAF_DIAJUKAN':
        return 'bg-blue-100 text-[#0f4c82] border-blue-200';
      case 'SEDANG_DIPERIKSA':
        return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'PERLU_PERBAIKAN':
        return 'bg-rose-100 text-rose-900 border-rose-200';
      case 'TERVERIFIKASI':
        return 'bg-emerald-100 text-emerald-900 border-emerald-200';
      case 'FINAL_DIARSIPKAN':
        return 'bg-slate-900 text-emerald-400 border-slate-700';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusLabel = (status: StatusNaskah) => {
    switch (status) {
      case 'DRAF_DIAJUKAN':
        return 'Menunggu Verifikasi';
      case 'SEDANG_DIPERIKSA':
        return 'Sedang Diperiksa';
      case 'PERLU_PERBAIKAN':
        return 'Perlu Revisi';
      case 'TERVERIFIKASI':
        return 'Terverifikasi (Siap TTD)';
      case 'FINAL_DIARSIPKAN':
        return 'Final di Arsip Digital';
      default:
        return status;
    }
  };

  // Helper to determine step index (1 to 5)
  const getProgressStepIndex = (status: StatusNaskah): number => {
    switch (status) {
      case 'DRAF_DIAJUKAN':
        return 1;
      case 'SEDANG_DIPERIKSA':
        return 2;
      case 'PERLU_PERBAIKAN':
        return 2; // In review stage with return
      case 'TERVERIFIKASI':
        return 4;
      case 'FINAL_DIARSIPKAN':
        return 5;
      default:
        return 1;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#0f4c82] border border-blue-200/70 mb-2">
            <UserCheck className="w-3.5 h-3.5 text-[#1a6bb5]" />
            <span>Kewenangan: Konseptor Pegawai & Unit Pengusul</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
            Pengajuan & Timeline Progres Naskah Dinas
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Ajukan draf naskah dinas dalam format Microsoft Word (.docx) dan pantau perkembangan alur verifikasi dari pengiriman awal hingga pengesahan dan penyimpanan arsip digital.
          </p>
        </div>

        {/* Sub-tab switcher */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200 self-start md:self-auto shrink-0">
          <button
            onClick={() => setSubTab('form')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              subTab === 'form'
                ? 'bg-[#0f4c82] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Form Pengajuan Baru</span>
          </button>

          <button
            onClick={() => setSubTab('timeline')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              subTab === 'timeline'
                ? 'bg-[#0f4c82] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Timeline Progres Saya</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                subTab === 'timeline' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {mySubmissions.length}
            </span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* SUBTAB 2: TIMELINE PROGRES PENGAJUAN SAYA (ROLE KONSEPTOR)        */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {subTab === 'timeline' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={timelineSearch}
                onChange={(e) => setTimelineSearch(e.target.value)}
                placeholder="Cari berdasarkan nomor registrasi, perihal, atau jenis naskah..."
                className="w-full h-10 pl-10 pr-4 text-xs sm:text-sm rounded-xl border border-slate-300 text-slate-800 focus:border-[#0f4c82] focus:ring-2 focus:ring-[#0f4c82]/20 outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0 font-medium">
                <Filter className="w-3.5 h-3.5" />
                <span>Status:</span>
              </div>
              <select
                value={timelineStatusFilter}
                onChange={(e) => setTimelineStatusFilter(e.target.value)}
                className="h-10 text-xs px-3.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-medium outline-none focus:border-[#0f4c82] focus:ring-2 focus:ring-[#0f4c82]/20 transition-all cursor-pointer"
              >
                <option value="all">Semua Status ({mySubmissions.length})</option>
                <option value="DRAF_DIAJUKAN">Menunggu Verifikasi</option>
                <option value="PERLU_PERBAIKAN">Perlu Perbaikan / Revisi</option>
                <option value="TERVERIFIKASI">Terverifikasi (Siap TTD)</option>
                <option value="FINAL_DIARSIPKAN">Final Diarsipkan</option>
              </select>
            </div>
          </div>

          {/* List of Submissions with Interactive Timeline Cards */}
          {filteredMySubmissions.length === 0 ? (
            <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0f4c82] flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6 opacity-60" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Belum Ada Pengajuan Naskah</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Anda belum memiliki pengajuan naskah dinas dalam sistem. Silakan klik tombol "Ajukan Draf Naskah Baru" untuk memulai.
              </p>
              <button
                onClick={() => setSubTab('form')}
                className="px-4 py-2 rounded-xl bg-[#0f4c82] hover:bg-[#1a6bb5] text-white text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Buat Pengajuan Draf Baru</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMySubmissions.map((item) => {
                const stepIndex = getProgressStepIndex(item.status);
                const isNeedRevision = item.status === 'PERLU_PERBAIKAN';
                const isVerified = item.status === 'TERVERIFIKASI';
                const isArchived = item.status === 'FINAL_DIARSIPKAN';

                // Get latest review note if any
                const latestNote =
                  item.riwayatVerifikasi && item.riwayatVerifikasi.length > 0
                    ? item.riwayatVerifikasi[item.riwayatVerifikasi.length - 1]
                    : null;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all p-5 space-y-4"
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono-tabular font-bold text-xs text-[#0f4c82] bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200/70">
                            {item.nomorRegistrasi}
                          </span>
                          <span className="text-xs font-bold text-slate-700">{item.jenisNaskah}</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Building className="w-3.5 h-3.5" />
                            <span>{item.unitKerja}</span>
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mt-1">{item.perihal}</h3>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${getStatusBadgeStyle(
                            item.status
                          )}`}
                        >
                          {item.status === 'DRAF_DIAJUKAN' && (
                            <Clock className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                          )}
                          {item.status === 'PERLU_PERBAIKAN' && (
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          )}
                          {item.status === 'TERVERIFIKASI' && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                          {item.status === 'FINAL_DIARSIPKAN' && (
                            <Archive className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                          <span>{getStatusLabel(item.status)}</span>
                        </span>
                      </div>
                    </div>

                    {/* Timeline 5-Stage Stepper Bar */}
                    <div className="py-2">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Tahapan Progres Naskah:
                      </div>
                      <div className="grid grid-cols-5 gap-2 text-center text-[11px]">
                        {/* Step 1: Pengajuan Dikirim */}
                        <div
                          className={`p-2 rounded-xl border flex flex-col items-center gap-1 ${
                            stepIndex >= 1
                              ? 'bg-blue-50/80 border-blue-200 text-[#0f4c82]'
                              : 'bg-slate-50 border-slate-200 text-slate-400'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                              stepIndex >= 1 ? 'bg-[#0f4c82] text-white' : 'bg-slate-300 text-slate-600'
                            }`}
                          >
                            1
                          </div>
                          <span className="font-bold line-clamp-1">1. Dikirim</span>
                          <span className="text-[9px] text-slate-400 font-mono-tabular truncate">
                            {formatTanggalIndo(item.tanggalPengajuan)}
                          </span>
                        </div>

                        {/* Step 2: Pemeriksaan Verifikator */}
                        <div
                          className={`p-2 rounded-xl border flex flex-col items-center gap-1 ${
                            isNeedRevision
                              ? 'bg-rose-50 border-rose-200 text-rose-900 ring-2 ring-rose-200'
                              : stepIndex >= 2
                              ? 'bg-blue-50/80 border-blue-200 text-[#0f4c82]'
                              : 'bg-slate-50 border-slate-200 text-slate-400'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                              isNeedRevision
                                ? 'bg-rose-600 text-white'
                                : stepIndex >= 2
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-300 text-slate-600'
                            }`}
                          >
                            2
                          </div>
                          <span className="font-bold line-clamp-1">2. Verifikasi</span>
                          <span className="text-[9px] text-slate-500 truncate">{item.verifikatorDitunjuk}</span>
                        </div>

                        {/* Step 3: Revisi (jika ada) */}
                        <div
                          className={`p-2 rounded-xl border flex flex-col items-center gap-1 ${
                            item.riwayatVersi && item.riwayatVersi.length > 0
                              ? 'bg-purple-50 border-purple-200 text-purple-900'
                              : isNeedRevision
                              ? 'bg-rose-50/60 border-rose-200 text-rose-800'
                              : 'bg-slate-50 border-slate-200 text-slate-400'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                              item.riwayatVersi && item.riwayatVersi.length > 0
                                ? 'bg-purple-600 text-white'
                                : isNeedRevision
                                ? 'bg-rose-500 text-white animate-pulse'
                                : 'bg-slate-300 text-slate-600'
                            }`}
                          >
                            3
                          </div>
                          <span className="font-bold line-clamp-1">3. Revisi</span>
                          <span className="text-[9px] text-slate-500 truncate">
                            {item.riwayatVersi?.length ? `${item.riwayatVersi.length}x Revisi` : isNeedRevision ? 'Diperlukan' : 'Sesuai'}
                          </span>
                        </div>

                        {/* Step 4: Persetujuan / Terverifikasi */}
                        <div
                          className={`p-2 rounded-xl border flex flex-col items-center gap-1 ${
                            isVerified
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                              : 'bg-slate-50 border-slate-200 text-slate-400'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                              isVerified ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-600'
                            }`}
                          >
                            4
                          </div>
                          <span className="font-bold line-clamp-1">4. Disetujui</span>
                          <span className="text-[9px] text-slate-500 truncate">
                            {isVerified ? 'Siap TTD' : 'Menunggu'}
                          </span>
                        </div>

                        {/* Step 5: Final di Arsip Digital */}
                        <div
                          className={`p-2 rounded-xl border flex flex-col items-center gap-1 ${
                            isArchived
                              ? 'bg-slate-900 border-slate-700 text-emerald-400'
                              : 'bg-slate-50 border-slate-200 text-slate-400'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                              isArchived ? 'bg-emerald-500 text-slate-900' : 'bg-slate-300 text-slate-600'
                            }`}
                          >
                            5
                          </div>
                          <span className="font-bold line-clamp-1">5. Diarsipkan</span>
                          <span className="text-[9px] truncate">
                            {isArchived ? 'Sah & Lengkap' : 'Menunggu TTD'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Notice if revision is requested */}
                    {isNeedRevision && latestNote && (
                      <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="font-bold text-rose-900 flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>Catatan Perbaikan dari {latestNote.namaVerifikator}:</span>
                          </div>
                          <p className="text-rose-700 leading-relaxed italic pl-5.5">
                            "{latestNote.catatan}"
                          </p>
                        </div>

                        {onOpenRevisiModal && (
                          <button
                            onClick={() => onOpenRevisiModal(item)}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Unggah Revisi (.docx)</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Footer Row: Metadata & Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-500 border-t border-slate-100">
                      <div className="flex flex-wrap items-center gap-3">
                        <span>Verifikator: <strong>{item.verifikatorDitunjuk}</strong></span>
                        <span>·</span>
                        <span>Klasifikasi: <strong className="font-mono">{item.klasifikasiArsip}</strong></span>
                        {item.drafFile?.name && (
                          <>
                            <span>·</span>
                            <span>Berkas: <strong>{item.drafFile.name}</strong></span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {item.drafFile?.dataUrl && (
                          <a
                            href={item.drafFile.dataUrl}
                            download={item.drafFile.name}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Unduh Word</span>
                          </a>
                        )}

                        <button
                          onClick={() => setSelectedTimelineNaskah(item)}
                          className="px-3.5 py-1.5 rounded-lg bg-[#0f4c82] hover:bg-[#1a6bb5] text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat Timeline Detail</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* SUBTAB 1: FORMULIR PENGAJUAN DRAF NASKAH BARU                    */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {subTab === 'form' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div>
              <h3 className="font-bold text-base text-slate-900 font-heading">
                Formulir Pengajuan Draf Naskah Dinas (.docx)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Isi metadata naskah dan unggah draf Word resmi untuk diteruskan ke verifikator tim kerja.
              </p>
            </div>
            <button
              type="button"
              onClick={onNavigateToPedoman}
              className="px-3 py-1.5 rounded-lg bg-blue-50 text-[#0f4c82] hover:bg-blue-100 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Lihat Template Naskah</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              {/* Jenis Naskah */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Jenis Naskah Dinas <span className="text-red-500">*</span>
                </label>
                <select
                  value={jenisNaskah}
                  onChange={(e) => setJenisNaskah(e.target.value as JenisNaskahDinas)}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-300 bg-white font-medium text-xs sm:text-sm text-slate-800 focus:border-[#0f4c82] focus:ring-2 focus:ring-[#0f4c82]/20 outline-none transition-all"
                >
                  {DAFTAR_JENIS_NASKAH.map((jenis) => (
                    <option key={jenis} value={jenis}>
                      {jenis}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Format struktur dan template disesuaikan dengan jenis naskah yang dipilih.
                </p>
              </div>

              {/* Unit Kerja Pengusul */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Unit Kerja / Tim Kerja <span className="text-red-500">*</span>
                </label>
                <select
                  value={unitKerja}
                  onChange={(e) => setUnitKerja(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-300 bg-white font-medium text-xs sm:text-sm text-slate-800 focus:border-[#0f4c82] focus:ring-2 focus:ring-[#0f4c82]/20 outline-none transition-all"
                >
                  {TIM_KERJA_OPTIONS.map((tim) => (
                    <option key={tim} value={tim}>
                      {tim}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-[#0f4c82]" />
                  <span>
                    Verifikator Otomatis: <strong className="text-slate-700">{verifikatorInfo.nama}</strong> ({verifikatorInfo.role.replace('VERIFIKATOR_', 'Tim ')})
                  </span>
                </p>
              </div>
            </div>

            {/* Perihal Naskah */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Perihal / Judul Naskah Dinas <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={perihal}
                onChange={(e) => setPerihal(e.target.value)}
                placeholder="Contoh: Undangan Rapat Evaluasi Sensus Pertanian 2026 atau Nota Dinas Permohonan Sarpras"
                className={`w-full h-10 px-3.5 rounded-xl border text-xs sm:text-sm text-slate-800 outline-none transition-all ${
                  errors.perihal
                    ? 'border-red-400 bg-red-50/30 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                    : 'border-slate-300 focus:border-[#0f4c82] focus:ring-2 focus:ring-[#0f4c82]/20'
                }`}
              />
              {errors.perihal && (
                <p className="text-red-600 text-[11px] mt-1 font-medium">{errors.perihal}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              {/* Nama Konseptor */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Nama Konseptor Pegawai <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={namaKonseptor}
                  onChange={(e) => setNamaKonseptor(e.target.value)}
                  placeholder="Nama lengkap penyusun draf"
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-800 focus:border-[#0f4c82] focus:ring-2 focus:ring-[#0f4c82]/20 outline-none transition-all"
                />
              </div>

              {/* Klasifikasi Arsip BPS */}
              <div className="relative">
                <label className="block font-bold text-slate-700 mb-1.5">
                  Kode Klasifikasi Arsip <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={klasifikasiArsip}
                    onChange={(e) => setKlasifikasiArsip(e.target.value.toUpperCase())}
                    placeholder="Contoh: VS.100, HK.010, KU.001"
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-300 font-mono text-xs sm:text-sm text-slate-800 uppercase focus:border-[#0f4c82] focus:ring-2 focus:ring-[#0f4c82]/20 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKlasifSearch(!showKlasifSearch)}
                    className="h-10 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-300 text-xs font-bold shrink-0 cursor-pointer transition-colors"
                  >
                    Cari Kode
                  </button>
                </div>

                {/* Dropdown pencarian kode klasifikasi */}
                {showKlasifSearch && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 z-30 p-2.5 text-xs">
                    <input
                      type="text"
                      value={searchKlasifText}
                      onChange={(e) => setSearchKlasifText(e.target.value)}
                      placeholder="Ketik nama atau kode arsip..."
                      className="w-full h-9 px-3 border border-slate-300 rounded-lg text-xs outline-none focus:border-[#0f4c82] focus:ring-1 focus:ring-[#0f4c82] mb-1.5"
                    />
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {DAFTAR_KLASIFIKASI_BPS.filter(
                        (k) =>
                          k.kode.toLowerCase().includes(searchKlasifText.toLowerCase()) ||
                          k.nama.toLowerCase().includes(searchKlasifText.toLowerCase())
                      )
                        .slice(0, 10)
                        .map((k) => (
                          <div
                            key={k.kode}
                            onClick={() => {
                              setKlasifikasiArsip(k.kode);
                              setShowKlasifSearch(false);
                            }}
                            className="p-2 hover:bg-blue-50 rounded-lg cursor-pointer flex items-center justify-between text-slate-700 transition-colors"
                          >
                            <span className="font-mono font-bold text-[#0f4c82]">{k.kode}</span>
                            <span className="truncate max-w-[220px] text-slate-500 text-[11px]">{k.nama}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Nomor Surat Keluar Terkait (Opsional) */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Nomor Surat Keluar dari Register (Opsional)
              </label>
              <select
                value={nomorSuratDipesan}
                onChange={(e) => setNomorSuratDipesan(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl border border-slate-300 bg-white font-mono text-xs sm:text-sm text-slate-800 focus:border-[#0f4c82] focus:ring-2 focus:ring-[#0f4c82]/20 outline-none transition-all"
              >
                <option value="">-- Pilih jika nomor surat telah diambil sebelumnya di modul Penomoran --</option>
                {availableNomorSurat.map((surat) => (
                  <option key={surat.id} value={surat.nomorSuratLengkap}>
                    {surat.nomorSuratLengkap} — {surat.perihal.slice(0, 50)}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Jika nomor surat belum diambil, nomor resmi dapat ditetapkan nanti setelah naskah disetujui.
              </p>
            </div>

            {/* Ringkasan Isi Naskah */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Ringkasan / Urgensi Naskah Dinas (Opsional)
              </label>
              <textarea
                rows={3}
                value={ringkasanIsi}
                onChange={(e) => setRingkasanIsi(e.target.value)}
                placeholder="Catatan ringkas mengenai urgensi, batas waktu, atau konteks kegiatan untuk verifikator..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-800 focus:border-[#0f4c82] focus:ring-2 focus:ring-[#0f4c82]/20 outline-none transition-all"
              />
            </div>

            {/* Upload File Draf Word (.docx) */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Unggah Berkas Draf Naskah Dinas (Microsoft Word .docx / .doc) <span className="text-red-500">*</span>
              </label>
              <div
                className={`p-6 border-2 border-dashed rounded-2xl text-center transition-all ${
                  errors.uploadedFile
                    ? 'border-red-300 bg-red-50/20'
                    : 'border-slate-300 hover:border-[#0f4c82] bg-slate-50/50 hover:bg-blue-50/20'
                }`}
              >
                <input
                  type="file"
                  id="draft-upload-input"
                  accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="draft-upload-input"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#0f4c82] flex items-center justify-center shadow-xs">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-bold text-xs sm:text-sm text-[#0f4c82] hover:underline">
                      Pilih berkas Word (.doc / .docx)
                    </span>
                    <span className="text-xs text-slate-500 block mt-0.5">atau tarik dan lepas berkas di sini</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Batas ukuran berkas maksimal 20 MB · Wajib format Microsoft Word
                  </span>
                </label>
              </div>

              {errors.uploadedFile && (
                <p className="text-red-600 text-[11px] mt-1.5 font-medium">{errors.uploadedFile}</p>
              )}

              {uploadedFile && (
                <div className="mt-3 p-3.5 rounded-xl bg-blue-50/90 border border-blue-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-5 h-5 text-blue-700" />
                    <div>
                      <div className="font-bold text-xs text-slate-900">{uploadedFile.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono-tabular">
                        {(uploadedFile.size / 1024).toFixed(1)} KB · Siap Diajukan
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadedFile(null)}
                    className="p-1 rounded hover:bg-white text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Form Action Buttons */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-white text-xs sm:text-sm bg-gradient-to-r from-[#0f4c82] via-[#1a6bb5] to-[#1a7a4a] hover:opacity-95 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Mengirim Draf...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Kirim Draf ke Verifikator ({verifikatorInfo.nama})</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Detail Timeline Full View */}
      {selectedTimelineNaskah && (
        <NaskahTimelineModal
          naskah={selectedTimelineNaskah}
          currentUser={currentUser}
          onClose={() => setSelectedTimelineNaskah(null)}
          onOpenRevisiModal={(n) => {
            setSelectedTimelineNaskah(null);
            if (onOpenRevisiModal) onOpenRevisiModal(n);
          }}
          onToast={onToast}
        />
      )}
    </div>
  );
};
