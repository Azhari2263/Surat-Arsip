import React, { useState, useMemo, useEffect } from 'react';
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
  Lock,
  Copy,
  Check,
  Hash,
  Send,
  HelpCircle,
} from 'lucide-react';
import {
  AppConfig,
  JenisNaskahDinas,
  KodeSuratType,
  NaskahDinas,
  StatusNaskah,
  SuratKeluar,
  UserProfile,
  UserRole,
} from '../types';
import { TIM_KERJA_OPTIONS, DAFTAR_TIM_KERJA, DAFTAR_KLASIFIKASI_BPS } from '../data/bpsClassifications';
import { tentukanVerifikator } from '../data/verifikatorData';
import { NaskahTimelineModal } from './NaskahTimelineModal';
import { formatTanggalIndo } from '../utils/storage';
import {
  DirectFileInput,
  resolveDirectFileAccess,
  triggerDirectDownload,
} from '../utils/googleDriveSync';
import { FilePreviewModal } from './FilePreviewModal';

interface PengajuanDrafViewProps {
  currentUser: UserProfile;
  suratList: SuratKeluar[];
  naskahList?: NaskahDinas[];
  preselectedKosong?: SuratKeluar | null;
  config?: AppConfig;
  onClearPreselectedKosong?: () => void;
  onSubmitDraf: (
    data: Omit<
      NaskahDinas,
      | 'id'
      | 'nomorRegistrasi'
      | 'status'
      | 'riwayatVersi'
      | 'riwayatVerifikasi'
      | 'waktuUpdate'
    >
  ) => void;
  onNavigateToPedoman: () => void;
  onOpenRevisiModal?: (naskah: NaskahDinas) => void;
  onOpenUnggahFinalModal?: (naskah: NaskahDinas) => void;
  onTerbitkanNomorSurat?: (naskah: NaskahDinas) => void;
  onVerifikasiKeputusan?: (
    naskahId: string,
    keputusan: 'DISETUJUI' | 'PERLU_PERBAIKAN' | 'DITOLAK',
    catatan: string,
    checklist: any
  ) => void;
  onBukaKembaliNaskah?: (naskahId: string, alasan: string) => void;
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
  preselectedKosong,
  config,
  onClearPreselectedKosong,
  onSubmitDraf,
  onNavigateToPedoman,
  onOpenRevisiModal,
  onOpenUnggahFinalModal,
  onTerbitkanNomorSurat,
  onVerifikasiKeputusan,
  onBukaKembaliNaskah,
  onToast,
}) => {
  const [subTab, setSubTab] = useState<'form' | 'timeline'>('form');
  const [previewFile, setPreviewFile] = useState<DirectFileInput | null>(null);

  // Form Fields - Sesuai Ketentuan Integrasi Penuh
  const [jenisNaskah, setJenisNaskah] = useState<JenisNaskahDinas>('Surat Dinas Biasa');
  const [kodeSurat, setKodeSurat] = useState<KodeSuratType>('B');
  const [perihal, setPerihal] = useState('');
  const [tujuan, setTujuan] = useState('');
  const [tanggalSurat, setTanggalSurat] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [namaKonseptor, setNamaKonseptor] = useState(currentUser.nama);
  const [klasifikasiArsip, setKlasifikasiArsip] = useState('VS.100');
  const [ringkasanIsi, setRingkasanIsi] = useState('');

  // Mode Penomoran Terintegrasi: 'baru' (Nomor Otomatis) | 'kosong' (Gunakan Slot Kosong Tersedia)
  const [modePenomoran, setModePenomoran] = useState<'baru' | 'kosong'>('baru');
  const [selectedKosongNomor, setSelectedKosongNomor] = useState<number | null>(null);

  // Field Tim Kerja Konseptor: Read-Only otomatis dari profil akun login; Admin dapat memilih dari daftar dropdown
  const [adminSelectedUnitKerja, setAdminSelectedUnitKerja] = useState<string>(() => {
    if (currentUser.unitKerja && currentUser.unitKerja !== 'Semua Unit Kerja') {
      return currentUser.unitKerja;
    }
    return 'Tim Sosial';
  });

  const unitKerja = useMemo(() => {
    if (currentUser.role === 'KONSEPTOR') {
      return currentUser.unitKerja || 'Tim Sosial';
    }
    return adminSelectedUnitKerja;
  }, [currentUser.role, currentUser.unitKerja, adminSelectedUnitKerja]);

  // Penentuan Verifikator Otomatis berdasarkan Unit Kerja Akun Konseptor & Custom Mapping dari Pengaturan Spreadsheet
  const verifikatorInfo = useMemo(
    () => tentukanVerifikator(unitKerja, config?.pemetaanVerifikator),
    [unitKerja, config?.pemetaanVerifikator]
  );

  // List slot nomor kosong yang tersedia di register
  const emptySuratList = useMemo(
    () => suratList.filter((s) => s.status === 'KOSONG'),
    [suratList]
  );

  // Sync jika ada slot kosong yang dipilih dari tabel atau subtab nomor kosong
  useEffect(() => {
    if (preselectedKosong) {
      setModePenomoran('kosong');
      setSelectedKosongNomor(preselectedKosong.nomorUrut);
      setSubTab('form');
    }
  }, [preselectedKosong]);

  // Uploaded Word file (.docx / .doc)
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
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Timeline Filter & Search for Konseptor
  const [timelineSearch, setTimelineSearch] = useState('');
  const [timelineStatusFilter, setTimelineStatusFilter] = useState<string>('all');
  const [selectedTimelineNaskah, setSelectedTimelineNaskah] = useState<NaskahDinas | null>(null);

  // Konseptor submissions: filter by user or show all if Admin
  const mySubmissions = useMemo(() => {
    return naskahList.filter((item) => {
      if (currentUser.role === 'ADMIN' || currentUser.role === 'ARSIPARIS') return true;
      return (
        item.namaKonseptor.toLowerCase() === currentUser.nama.toLowerCase() ||
        item.unitKerja.toLowerCase() === currentUser.unitKerja.toLowerCase()
      );
    });
  }, [naskahList, currentUser]);

  const filteredMySubmissions = useMemo(() => {
    return mySubmissions.filter((item) => {
      if (timelineStatusFilter !== 'all') {
        if (timelineStatusFilter === 'MENUNGGU_VERIFIKASI') {
          if (
            item.status !== 'MENUNGGU_VERIFIKASI' &&
            item.status !== 'DRAF_DIAJUKAN' &&
            item.status !== 'SEDANG_DIPERIKSA'
          )
            return false;
        } else if (timelineStatusFilter === 'MENUNGGU_PENOMORAN') {
          if (
            item.status !== 'MENUNGGU_PENOMORAN' &&
            !(item.status === 'TERVERIFIKASI' && !item.nomorSuratDipesan)
          )
            return false;
        } else if (timelineStatusFilter === 'NOMOR_DITERBITKAN') {
          if (
            item.status !== 'NOMOR_DITERBITKAN' &&
            item.status !== 'MENUNGGU_DOKUMEN_FINAL' &&
            !(item.status === 'TERVERIFIKASI' && item.nomorSuratDipesan)
          )
            return false;
        } else if (timelineStatusFilter === 'SELESAI_ARSIP') {
          if (item.status !== 'SELESAI_ARSIP' && item.status !== 'FINAL_DIARSIPKAN') return false;
        } else if (item.status !== timelineStatusFilter) {
          return false;
        }
      }
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
      const msg = 'File draf naskah dinas wajib berformat Microsoft Word (.doc atau .docx)';
      setErrors((prev) => ({ ...prev, uploadedFile: msg }));
      if (onToast) onToast(`⚠ ${msg}`);
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      const msg = 'Ukuran file maksimal 20 MB';
      setErrors((prev) => ({ ...prev, uploadedFile: msg }));
      if (onToast) onToast(`⚠ ${msg}`);
      return;
    }

    setErrors((prev) => {
      const next = { ...prev };
      delete next.uploadedFile;
      return next;
    });

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
    if (!tujuan.trim()) errs.tujuan = 'Tujuan surat dinas (Kepada Yth.) wajib diisi';
    if (!namaKonseptor.trim()) errs.namaKonseptor = 'Nama konseptor pegawai wajib diisi';
    if (!klasifikasiArsip.trim()) errs.klasifikasiArsip = 'Kode klasifikasi arsip wajib diisi';
    if (modePenomoran === 'kosong' && !selectedKosongNomor) {
      errs.selectedKosongNomor = 'Pilih salah satu nomor urut kosong yang tersedia';
    }
    if (!uploadedFile) {
      errs.uploadedFile = 'Unggah file draf naskah dinas dalam format Word (.doc/.docx)';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const today = new Date();
    const tglPengajuan = `${String(today.getDate()).padStart(2, '0')}/${String(
      today.getMonth() + 1
    ).padStart(2, '0')}/${today.getFullYear()}`;

    // Format tanggal surat dinas ke dd/MM/yyyy
    let tglSuratFormatted = tglPengajuan;
    if (tanggalSurat) {
      const parts = tanggalSurat.split('-');
      if (parts.length === 3) {
        tglSuratFormatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }

    onSubmitDraf({
      jenisNaskah,
      kodeSurat,
      perihal: perihal.trim(),
      tujuan: tujuan.trim(),
      unitKerja, // Read-only dari akun login
      namaKonseptor: namaKonseptor.trim(),
      tanggalPengajuan: tglPengajuan,
      tanggalSurat: tglSuratFormatted,
      verifikatorDitunjuk: verifikatorInfo.nama,
      roleVerifikatorDitunjuk: verifikatorInfo.role,
      klasifikasiArsip: klasifikasiArsip.trim(),
      nomorUrutKosongDipilih:
        modePenomoran === 'kosong' && selectedKosongNomor ? selectedKosongNomor : undefined,
      ringkasanIsi: ringkasanIsi.trim(),
      drafFile: uploadedFile!,
    });

    setIsSubmitting(false);

    // Reset form dan alihkan ke tab timeline
    setPerihal('');
    setTujuan('');
    setRingkasanIsi('');
    setUploadedFile(null);
    setModePenomoran('baru');
    setSelectedKosongNomor(null);
    if (onClearPreselectedKosong) onClearPreselectedKosong();
    setSubTab('timeline');
  };

  // Fungsi Salin Nomor Surat ke Clipboard
  const handleCopyNomorSurat = (nomorSurat: string, itemId: string) => {
    if (!nomorSurat) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(nomorSurat);
    }
    setCopiedId(itemId);
    setTimeout(() => setCopiedId(null), 2500);
    if (onToast) {
      onToast('Nomor surat berhasil disalin');
    }
  };

  const getStatusBadgeStyle = (status: StatusNaskah) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'MENUNGGU_VERIFIKASI':
      case 'DRAF_DIAJUKAN':
      case 'SEDANG_DIPERIKSA':
        return 'bg-blue-100 text-[#0f4c82] border-blue-200';
      case 'PERLU_PERBAIKAN':
        return 'bg-rose-100 text-rose-900 border-rose-200';
      case 'DITOLAK':
        return 'bg-red-100 text-red-900 border-red-300';
      case 'MENUNGGU_PENOMORAN':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'NOMOR_DITERBITKAN':
        return 'bg-indigo-100 text-indigo-900 border-indigo-200';
      case 'MENUNGGU_DOKUMEN_FINAL':
        return 'bg-cyan-100 text-cyan-900 border-cyan-200';
      case 'TERVERIFIKASI':
        return 'bg-emerald-100 text-emerald-900 border-emerald-200';
      case 'SELESAI_ARSIP':
      case 'FINAL_DIARSIPKAN':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusLabel = (status: StatusNaskah) => {
    switch (status) {
      case 'DRAFT':
        return 'Draft';
      case 'MENUNGGU_VERIFIKASI':
      case 'DRAF_DIAJUKAN':
        return 'Menunggu Verifikasi';
      case 'SEDANG_DIPERIKSA':
        return 'Sedang Diperiksa';
      case 'PERLU_PERBAIKAN':
        return 'Perlu Perbaikan';
      case 'DITOLAK':
        return 'Ditolak';
      case 'MENUNGGU_PENOMORAN':
        return 'Menunggu Nomor Surat';
      case 'NOMOR_DITERBITKAN':
        return 'Nomor Surat Diterbitkan';
      case 'MENUNGGU_DOKUMEN_FINAL':
        return 'Menunggu Unggah Final Sah';
      case 'TERVERIFIKASI':
        return 'Disetujui (Siap Nomor/TTD)';
      case 'SELESAI_ARSIP':
      case 'FINAL_DIARSIPKAN':
        return 'Selesai – Arsip Permanen';
      default:
        return status;
    }
  };

  const getProgressStepIndex = (status: StatusNaskah): number => {
    switch (status) {
      case 'DRAFT':
        return 0;
      case 'MENUNGGU_VERIFIKASI':
      case 'DRAF_DIAJUKAN':
      case 'SEDANG_DIPERIKSA':
      case 'PERLU_PERBAIKAN':
      case 'DITOLAK':
        return 1;
      case 'MENUNGGU_PENOMORAN':
      case 'TERVERIFIKASI':
        return 2;
      case 'NOMOR_DITERBITKAN':
      case 'MENUNGGU_DOKUMEN_FINAL':
        return 3;
      case 'SELESAI_ARSIP':
      case 'FINAL_DIARSIPKAN':
        return 4;
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
            <span>Kewenangan: Konseptor Pegawai ({currentUser.nama})</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
            Pengajuan Draf Naskah Dinas & Permintaan Nomor Surat
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Formulir terpadu untuk penyusunan draf naskah dinas, verifikasi mutu tata naskah, otomatisasi penugasan verifikator tim kerja, hingga penerbitan nomor surat keluar resmi BPS Provinsi Kalimantan Barat.
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
            <span>Formulir Pengajuan Terpadu</span>
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
                placeholder="Cari berdasarkan nomor registrasi, nomor surat, perihal, atau jenis naskah..."
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
                <option value="MENUNGGU_VERIFIKASI">Menunggu Verifikasi</option>
                <option value="PERLU_PERBAIKAN">Perlu Perbaikan / Revisi</option>
                <option value="DITOLAK">Ditolak</option>
                <option value="MENUNGGU_PENOMORAN">Menunggu Penerbitan Nomor Surat</option>
                <option value="NOMOR_DITERBITKAN">Nomor Surat Diterbitkan</option>
                <option value="SELESAI_ARSIP">Selesai – Diarsipkan</option>
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
                Anda belum memiliki draf pengajuan naskah dinas. Silakan gunakan form pengajuan terpadu untuk mengajukan draf baru.
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
                const isRejected = item.status === 'DITOLAK';
                const isWaitingNumber =
                  item.status === 'MENUNGGU_PENOMORAN' ||
                  (item.status === 'TERVERIFIKASI' && !item.nomorSuratDipesan);
                const isNumberIssued =
                  item.status === 'NOMOR_DITERBITKAN' ||
                  item.status === 'MENUNGGU_DOKUMEN_FINAL' ||
                  (item.nomorSuratDipesan &&
                    item.status !== 'SELESAI_ARSIP' &&
                    item.status !== 'FINAL_DIARSIPKAN');
                const isArchived =
                  item.status === 'SELESAI_ARSIP' || item.status === 'FINAL_DIARSIPKAN';

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

                          {/* Tombol Salin Nomor Surat jika nomor sudah diterbitkan */}
                          {item.nomorSuratDipesan && (
                            <>
                              <span className="text-slate-300">·</span>
                              <div className="inline-flex items-center gap-1.5 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                                <span className="font-mono text-emerald-800 font-bold text-xs">
                                  {item.nomorSuratDipesan}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopyNomorSurat(item.nomorSuratDipesan!, item.id)
                                  }
                                  className="p-1 hover:bg-emerald-100 rounded text-emerald-700 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                                  title="Salin Nomor Surat ke Clipboard"
                                >
                                  {copiedId === item.id ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-600" />
                                      <span className="text-emerald-700">Tersalin</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Salin</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-slate-900 mt-1">{item.perihal}</h3>
                        {item.tujuan && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            Tujuan: <strong className="text-slate-700">{item.tujuan}</strong>
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${getStatusBadgeStyle(
                            item.status
                          )}`}
                        >
                          {item.status === 'MENUNGGU_VERIFIKASI' && (
                            <Clock className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                          )}
                          {item.status === 'PERLU_PERBAIKAN' && (
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          )}
                          {item.status === 'DITOLAK' && (
                            <X className="w-3.5 h-3.5 text-red-600" />
                          )}
                          {item.status === 'MENUNGGU_PENOMORAN' && (
                            <Hash className="w-3.5 h-3.5 text-amber-600" />
                          )}
                          {item.status === 'NOMOR_DITERBITKAN' && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                          )}
                          {item.status === 'SELESAI_ARSIP' && (
                            <Archive className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                          <span>{getStatusLabel(item.status)}</span>
                        </span>
                      </div>
                    </div>

                    {/* Timeline 5-Stage Stepper Bar */}
                    <div className="py-2">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Tahapan Terpadu Pengajuan & Penerbitan:
                      </div>
                      <div className="grid grid-cols-5 gap-2 text-center text-[11px]">
                        {/* Step 1: Draf Dikirim */}
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
                          <span className="font-bold line-clamp-1">1. Draf Diajukan</span>
                          <span className="text-[9px] text-slate-400 font-mono-tabular truncate">
                            {formatTanggalIndo(item.tanggalPengajuan)}
                          </span>
                        </div>

                        {/* Step 2: Pemeriksaan Verifikator */}
                        <div
                          className={`p-2 rounded-xl border flex flex-col items-center gap-1 ${
                            isNeedRevision
                              ? 'bg-rose-50 border-rose-200 text-rose-900 ring-2 ring-rose-200'
                              : isRejected
                              ? 'bg-red-50 border-red-300 text-red-900'
                              : stepIndex >= 2
                              ? 'bg-blue-50/80 border-blue-200 text-[#0f4c82]'
                              : 'bg-slate-50 border-slate-200 text-slate-400'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                              isNeedRevision
                                ? 'bg-rose-600 text-white'
                                : isRejected
                                ? 'bg-red-600 text-white'
                                : stepIndex >= 2
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-300 text-slate-600'
                            }`}
                          >
                            2
                          </div>
                          <span className="font-bold line-clamp-1">2. Verifikasi Mutu</span>
                          <span className="text-[9px] text-slate-500 truncate">{item.verifikatorDitunjuk}</span>
                        </div>

                        {/* Step 3: Nomor Surat Diterbitkan */}
                        <div
                          className={`p-2 rounded-xl border flex flex-col items-center gap-1 ${
                            stepIndex >= 3 || isNumberIssued
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                              : isWaitingNumber
                              ? 'bg-amber-50 border-amber-300 text-amber-900 animate-pulse'
                              : 'bg-slate-50 border-slate-200 text-slate-400'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                              stepIndex >= 3 || isNumberIssued
                                ? 'bg-indigo-600 text-white'
                                : isWaitingNumber
                                ? 'bg-amber-600 text-white'
                                : 'bg-slate-300 text-slate-600'
                            }`}
                          >
                            3
                          </div>
                          <span className="font-bold line-clamp-1">3. Nomor Surat</span>
                          <span className="text-[9px] text-slate-500 truncate">
                            {item.nomorSuratDipesan ? 'Diterbitkan' : isWaitingNumber ? 'Menunggu Terbit' : 'Belum'}
                          </span>
                        </div>

                        {/* Step 4: Tanda Tangan Sah */}
                        <div
                          className={`p-2 rounded-xl border flex flex-col items-center gap-1 ${
                            isArchived
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                              : isNumberIssued
                              ? 'bg-cyan-50 border-cyan-200 text-cyan-900'
                              : 'bg-slate-50 border-slate-200 text-slate-400'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                              isArchived
                                ? 'bg-emerald-600 text-white'
                                : isNumberIssued
                                ? 'bg-cyan-600 text-white'
                                : 'bg-slate-300 text-slate-600'
                            }`}
                          >
                            4
                          </div>
                          <span className="font-bold line-clamp-1">4. Tanda Tangan Sah</span>
                          <span className="text-[9px] text-slate-500 truncate">
                            {isArchived ? 'Selesai TTD' : isNumberIssued ? 'Proses TTE/Basah' : 'Menunggu'}
                          </span>
                        </div>

                        {/* Step 5: Final di Arsip Digital */}
                        <div
                          className={`p-2 rounded-xl border flex flex-col items-center gap-1 ${
                            isArchived
                              ? 'bg-teal-50 border-teal-200 text-teal-800'
                              : 'bg-slate-50 border-slate-200 text-slate-400'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                              isArchived ? 'bg-teal-600 text-white' : 'bg-slate-300 text-slate-600'
                            }`}
                          >
                            5
                          </div>
                          <span className="font-bold line-clamp-1">5. Arsip Digital</span>
                          <span className="text-[9px] truncate">
                            {isArchived ? 'Tersimpan Sah' : 'Menunggu Berkas'}
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

                    {/* Notice if rejected */}
                    {isRejected && (
                      <div className="p-3.5 rounded-xl bg-red-50 border border-red-300 text-xs text-red-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="font-bold text-red-900 flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                            <span>Pengajuan Ditolak oleh {item.verifikatorDitunjuk}:</span>
                          </div>
                          <p className="text-red-800 leading-relaxed italic pl-5.5">
                            "{item.alasanPenolakan || 'Format atau substansi tidak sesuai ketentuan kearsipan BPS.'}"
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Notice & Action if Number Issued (Tahap Finalisasi) */}
                    {isNumberIssued && (
                      <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="font-bold text-indigo-900 flex items-center gap-1.5 flex-wrap">
                            <CheckCircle2 className="w-4 h-4 text-indigo-700 shrink-0" />
                            <span>Nomor Surat Resmi Diterbitkan:</span>
                            <span className="font-mono bg-white px-2 py-0.5 rounded border border-indigo-200 text-indigo-950 font-bold select-all">
                              {item.nomorSuratDipesan}
                            </span>
                            {/* Tombol Salin Nomor Surat */}
                            <button
                              type="button"
                              onClick={() =>
                                handleCopyNomorSurat(item.nomorSuratDipesan!, item.id)
                              }
                              className="px-2.5 py-1 bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-300 font-bold rounded-lg shadow-2xs flex items-center gap-1 transition-all cursor-pointer"
                              title="Salin Nomor Surat ke Clipboard"
                            >
                              {copiedId === item.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-700">Tersalin</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Salin Nomor Surat</span>
                                </>
                              )}
                            </button>
                          </div>
                          <p className="text-indigo-800 leading-relaxed pl-5.5">
                            Nomor surat telah resmi tercatat di register keluar BPS. Silakan cantumkan nomor surat ini pada naskah, selesaikan tanda tangan resmi (TTE BSrE / tanda tangan basah), lalu unggah berkas final ke Arsip Digital.
                          </p>
                        </div>

                        {onOpenUnggahFinalModal && (
                          <button
                            onClick={() => onOpenUnggahFinalModal(item)}
                            className="px-4 py-2 bg-[#0f4c82] hover:bg-[#0a335a] text-white font-bold rounded-xl shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Archive className="w-3.5 h-3.5" />
                            <span>Unggah Dokumen Final (Sah)</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Footer Row: Metadata & Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-500 border-t border-slate-100">
                      <div className="flex flex-wrap items-center gap-3">
                        <span>Verifikator: <strong className="text-slate-700">{item.verifikatorDitunjuk}</strong></span>
                        <span>·</span>
                        <span>Klasifikasi: <strong className="font-mono text-slate-700">{item.klasifikasiArsip}</strong></span>
                        {item.drafFile?.name && (
                          <>
                            <span>·</span>
                            <span>Berkas: <strong>{item.drafFile.name}</strong></span>
                          </>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {(() => {
                          const draftInput: DirectFileInput = {
                            name: item.drafFile?.name || 'draf.docx',
                            type: item.drafFile?.type,
                            size: item.drafFile?.size,
                            dataUrl: item.drafFile?.dataUrl,
                            driveFileId: item.driveDraftFileId,
                            driveUrl: item.driveDraftUrl,
                          };
                          const access = resolveDirectFileAccess(draftInput, config?.googleDriveFolderId);
                          if (!access.hasAnyAccess) return null;
                          return (
                            <>
                              <button
                                type="button"
                                onClick={() => setPreviewFile(draftInput)}
                                className="px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-[#0f4c82] font-semibold flex items-center gap-1.5 cursor-pointer"
                                title={`Buka File ${draftInput.name}`}
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Buka File</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const res = triggerDirectDownload(draftInput, config?.googleDriveFolderId);
                                  if (res.ok) onToast?.(`✔ Mengunduh ${draftInput.name}`);
                                  else onToast?.(`⚠ ${res.reason || 'Berkas belum tersedia.'}`);
                                }}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-1.5 cursor-pointer"
                                title={`Unduh ${draftInput.name}`}
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Unduh Word</span>
                              </button>
                            </>
                          );
                        })()}

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
      {/* SUBTAB 1: FORMULIR PENGAJUAN DRAF TERPADU                        */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {subTab === 'form' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 mb-6 gap-3">
            <div>
              <h3 className="font-bold text-base text-slate-900 font-heading flex items-center gap-2">
                <span>Formulir Pengajuan Draf Naskah & Permintaan Nomor Surat</span>
                <span className="text-xs bg-blue-50 text-[#0f4c82] px-2.5 py-0.5 rounded-full border border-blue-200 font-mono">
                  Unit 6100
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Isi seluruh data yang dibutuhkan dalam satu alur terpadu. Data akan otomatis diteruskan dari verifikasi mutu hingga penerbitan nomor surat resmi.
              </p>
            </div>
            <button
              type="button"
              onClick={onNavigateToPedoman}
              className="px-3 py-1.5 rounded-lg bg-blue-50 text-[#0f4c82] hover:bg-blue-100 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Pedoman & Template Naskah</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Bagian 1: Identitas dan Klasifikasi Naskah */}
            <div className="p-4.5 rounded-2xl bg-slate-50/70 border border-slate-200/90 space-y-4">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#0f4c82]" />
                <span>1. Klasifikasi & Sifat Naskah Dinas</span>
              </div>

              {/* Sifat Naskah / Kode Surat (B / K / R) */}
              <div>
                <label className="block font-bold text-slate-700 text-xs mb-2">
                  Sifat Naskah Dinas (Kode Surat) <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      kodeSurat === 'B'
                        ? 'bg-blue-50/80 border-[#0f4c82] ring-1 ring-[#0f4c82]'
                        : 'bg-white border-slate-200 hover:bg-slate-100/60'
                    }`}
                  >
                    <input
                      type="radio"
                      name="kodeSurat"
                      value="B"
                      checked={kodeSurat === 'B'}
                      onChange={() => setKodeSurat('B')}
                      className="mt-0.5 text-[#0f4c82] focus:ring-[#0f4c82]"
                    />
                    <div>
                      <div className="font-bold text-xs text-slate-900">B – Biasa / Rutin</div>
                      <div className="text-[11px] text-slate-500">
                        Surat keluar dinas umum, undangan, pengumuman, dsb.
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      kodeSurat === 'K'
                        ? 'bg-blue-50/80 border-[#0f4c82] ring-1 ring-[#0f4c82]'
                        : 'bg-white border-slate-200 hover:bg-slate-100/60'
                    }`}
                  >
                    <input
                      type="radio"
                      name="kodeSurat"
                      value="K"
                      checked={kodeSurat === 'K'}
                      onChange={() => setKodeSurat('K')}
                      className="mt-0.5 text-[#0f4c82] focus:ring-[#0f4c82]"
                    />
                    <div>
                      <div className="font-bold text-xs text-slate-900">K – Keputusan (SK)</div>
                      <div className="text-[11px] text-slate-500">
                        Keputusan Kepala BPS / Keputusan Penetapan resmi
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      kodeSurat === 'R'
                        ? 'bg-blue-50/80 border-[#0f4c82] ring-1 ring-[#0f4c82]'
                        : 'bg-white border-slate-200 hover:bg-slate-100/60'
                    }`}
                  >
                    <input
                      type="radio"
                      name="kodeSurat"
                      value="R"
                      checked={kodeSurat === 'R'}
                      onChange={() => setKodeSurat('R')}
                      className="mt-0.5 text-[#0f4c82] focus:ring-[#0f4c82]"
                    />
                    <div>
                      <div className="font-bold text-xs text-slate-900">R – Rahasia</div>
                      <div className="text-[11px] text-slate-500">
                        Dokumen berkode rahasia / terbatas khusus
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Jenis Naskah Dinas */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Jenis Naskah Dinas <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={jenisNaskah}
                    onChange={(e) => setJenisNaskah(e.target.value as JenisNaskahDinas)}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-300 bg-white font-medium text-xs sm:text-sm text-slate-800 focus:border-[#0f4c82] focus:ring-2 focus:ring-[#0f4c82]/20 outline-none transition-all cursor-pointer"
                  >
                    {DAFTAR_JENIS_NASKAH.map((jenis) => (
                      <option key={jenis} value={jenis}>
                        {jenis}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Kode Klasifikasi Arsip BPS */}
                <div className="relative">
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Kode Klasifikasi Arsip BPS <span className="text-red-500">*</span>
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

                  {errors.klasifikasiArsip && (
                    <p className="text-red-600 text-[11px] mt-1 font-medium">
                      {errors.klasifikasiArsip}
                    </p>
                  )}

                  {/* Dropdown Pencarian Kode Klasifikasi */}
                  {showKlasifSearch && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 z-30 p-2.5 text-xs">
                      <input
                        type="text"
                        value={searchKlasifText}
                        onChange={(e) => setSearchKlasifText(e.target.value)}
                        placeholder="Ketik kata kunci klasifikasi (cth: sensus, hukum, keuangan, humas)..."
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
                              <span className="truncate max-w-[220px] text-slate-500 text-[11px]">
                                {k.nama}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bagian 2: Data Konseptor & Penugasan Verifikator Otomatis */}
            <div className="p-4.5 rounded-2xl bg-blue-50/40 border border-blue-200/80 space-y-4">
              <div className="text-xs font-bold text-[#0f4c82] uppercase tracking-wider flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#0f4c82]" />
                <span>2. Identitas Konseptor & Verifikator Terpilih</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Tim Kerja Konseptor: Read-Only Berdasarkan Akun Login */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <span>Tim Kerja Konseptor</span>
                    {currentUser.role === 'KONSEPTOR' ? (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />
                        <span>Terkunci Otomatis (Profil Akun)</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                        Pilihan Dropdown
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    {currentUser.role === 'KONSEPTOR' ? (
                      <>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={unitKerja}
                          className="w-full h-10 px-3.5 pr-10 rounded-xl border border-slate-300 bg-slate-100 text-slate-800 font-bold text-xs sm:text-sm cursor-not-allowed select-none"
                        />
                        <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                      </>
                    ) : (
                      <select
                        value={unitKerja}
                        onChange={(e) => setAdminSelectedUnitKerja(e.target.value)}
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold text-xs sm:text-sm focus:border-[#0f4c82] outline-none"
                      >
                        {(config?.daftarTimKerja && config.daftarTimKerja.length > 0
                          ? config.daftarTimKerja
                          : DAFTAR_TIM_KERJA
                        ).map((tim) => (
                          <option key={tim} value={tim}>
                            {tim}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {currentUser.role === 'KONSEPTOR'
                      ? `Tim kerja terisi otomatis dari profil akun Anda (${currentUser.username}) dan tidak dapat diubah secara manual.`
                      : 'Pilih tim kerja pengaju dari daftar tim kerja resmi BPS Kalbar.'}
                  </p>
                </div>

                {/* Verifikator Otomatis Berdasarkan Unit Kerja */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <span>Verifikator yang Bertugas</span>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                      Sistem Otomatis
                    </span>
                  </label>
                  <div className="p-2.5 rounded-xl border border-blue-200 bg-white flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-[#0f4c82]">{verifikatorInfo.nama}</div>
                      <div className="text-[11px] text-slate-500">{verifikatorInfo.deskripsi}</div>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Pengajuan akan langsung ditujukan ke verifikator tim kerja Anda untuk diverifikasi & diterbitkan nomor suratnya.
                  </p>
                </div>

                {/* Nama Konseptor Pegawai */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Nama Konseptor Pegawai <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={namaKonseptor}
                    onChange={(e) => setNamaKonseptor(e.target.value)}
                    placeholder="Nama lengkap penyusun naskah"
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-800 focus:border-[#0f4c82] focus:ring-2 focus:ring-[#0f4c82]/20 outline-none transition-all"
                  />
                  {errors.namaKonseptor && (
                    <p className="text-red-600 text-[11px] mt-1 font-medium">{errors.namaKonseptor}</p>
                  )}
                </div>

                {/* Tanggal Surat Dinas */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Tanggal Surat Dinas <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={tanggalSurat}
                    onChange={(e) => setTanggalSurat(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-800 focus:border-[#0f4c82] focus:ring-2 focus:ring-[#0f4c82]/20 outline-none transition-all cursor-pointer font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Tanggal resmi yang tercantum pada surat keluar.
                  </p>
                </div>
              </div>
            </div>

            {/* Bagian 3: Konten Naskah & Tujuan */}
            <div className="space-y-4 text-xs">
              {/* Tujuan Surat Dinas */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Tujuan Surat Dinas (Kepada Yth.) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={tujuan}
                  onChange={(e) => setTujuan(e.target.value)}
                  placeholder="Contoh: Kepala BPS Kabupaten/Kota se-Provinsi Kalimantan Barat ATAU Kepala Dinas Pertanian Prov. Kalbar"
                  className={`w-full h-10 px-3.5 rounded-xl border text-xs sm:text-sm text-slate-800 outline-none transition-all ${
                    errors.tujuan
                      ? 'border-red-400 bg-red-50/30 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                      : 'border-slate-300 focus:border-[#0f4c82] focus:ring-2 focus:ring-[#0f4c82]/20'
                  }`}
                />
                {errors.tujuan && (
                  <p className="text-red-600 text-[11px] mt-1 font-medium">{errors.tujuan}</p>
                )}
              </div>

              {/* Perihal Naskah Dinas */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Perihal / Judul Naskah Dinas <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={perihal}
                  onChange={(e) => setPerihal(e.target.value)}
                  placeholder="Contoh: Undangan Rapat Evaluasi Sensus Pertanian 2026 atau Permohonan Kebutuhan Sarana Prasarana"
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

              {/* Ringkasan / Urgensi Naskah */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Ringkasan / Urgensi Naskah Dinas (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={ringkasanIsi}
                  onChange={(e) => setRingkasanIsi(e.target.value)}
                  placeholder="Catatan ringkas mengenai urgensi, batas waktu, atau konteks kegiatan untuk verifikator tim..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-800 focus:border-[#0f4c82] focus:ring-2 focus:ring-[#0f4c82]/20 outline-none transition-all"
                />
              </div>
            </div>

            {/* Bagian 4: Opsi Nomor Surat (Otomatis Baru / Gunakan Nomor Kosong) */}
            <div className="p-4.5 rounded-2xl bg-amber-50/40 border border-amber-200/80 space-y-3 text-xs">
              <div className="font-bold text-amber-900 uppercase tracking-wider flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-amber-700" />
                  <span>3. Opsi Alokasi Nomor Surat Keluar</span>
                </div>
                {emptySuratList.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                    Tersedia {emptySuratList.length} Slot Kosong
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    modePenomoran === 'baru'
                      ? 'bg-white border-amber-500 ring-1 ring-amber-500 shadow-2xs'
                      : 'bg-white/60 border-slate-200 hover:bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="modePenomoran"
                    value="baru"
                    checked={modePenomoran === 'baru'}
                    onChange={() => {
                      setModePenomoran('baru');
                      setSelectedKosongNomor(null);
                    }}
                    className="mt-0.5 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <div className="font-bold text-slate-900">Nomor Urut Baru Otomatis (Rekomendasi)</div>
                    <div className="text-[11px] text-slate-500">
                      Sistem akan menerbitkan nomor urut berikutnya secara otomatis saat draf disetujui.
                    </div>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    modePenomoran === 'kosong'
                      ? 'bg-white border-amber-500 ring-1 ring-amber-500 shadow-2xs'
                      : 'bg-white/60 border-slate-200 hover:bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="modePenomoran"
                    value="kosong"
                    checked={modePenomoran === 'kosong'}
                    onChange={() => setModePenomoran('kosong')}
                    className="mt-0.5 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <div className="font-bold text-slate-900">Gunakan Slot Nomor Kosong / Cadangan</div>
                    <div className="text-[11px] text-slate-500">
                      Pilih dari nomor kosong yang tercipta pada aturan Senin atau pembatalan sebelumnya.
                    </div>
                  </div>
                </label>
              </div>

              {/* Pemilih Slot Nomor Kosong jika Mode Kosong Aktif */}
              {modePenomoran === 'kosong' && (
                <div className="mt-3 p-3.5 bg-white rounded-xl border border-amber-300 space-y-2">
                  <label className="block font-bold text-slate-800">
                    Pilih Nomor Kosong yang Akan Diklaim <span className="text-red-500">*</span>
                  </label>
                  {emptySuratList.length === 0 ? (
                    <div className="text-slate-500 text-xs italic">
                      Saat ini tidak ada slot nomor kosong di register. Silakan gunakan opsi "Nomor Urut Baru Otomatis".
                    </div>
                  ) : (
                    <select
                      value={selectedKosongNomor || ''}
                      onChange={(e) => setSelectedKosongNomor(Number(e.target.value) || null)}
                      className="w-full h-10 px-3 rounded-xl border border-amber-400 bg-white font-mono text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                    >
                      <option value="">-- Pilih Nomor Kosong yang Tersedia --</option>
                      {emptySuratList.map((item) => (
                        <option key={item.id} value={item.nomorUrut}>
                          Urut #{item.nomorUrut} · {item.nomorSuratLengkap} · Bulan: {item.bulan || '-'}
                        </option>
                      ))}
                    </select>
                  )}
                  {errors.selectedKosongNomor && (
                    <p className="text-red-600 text-[11px] font-medium">
                      {errors.selectedKosongNomor}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Bagian 5: Upload Berkas Draf Word (.docx) */}
            <div className="text-xs">
              <label className="block font-bold text-slate-700 mb-1.5">
                Berkas Draf Naskah Dinas (Microsoft Word .docx / .doc) <span className="text-red-500">*</span>
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
                    Batas ukuran berkas maksimal 20 MB · Format wajib Microsoft Word (.docx)
                  </span>
                </label>
              </div>

              {errors.uploadedFile && (
                <p className="text-red-600 text-[11px] mt-1.5 font-medium">{errors.uploadedFile}</p>
              )}

              {uploadedFile && (
                <div className="mt-3 p-3.5 rounded-xl bg-blue-50/90 border border-blue-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-5 h-5 text-blue-700 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-900 truncate">{uploadedFile.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono-tabular">
                        {(uploadedFile.size / 1024).toFixed(1)} KB · Siap Diajukan ke Verifikator
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewFile(uploadedFile)}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-100 text-[#0f4c82] border border-blue-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Buka File sebelum mengirim"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Buka File</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadedFile(null)}
                      className="p-1 rounded hover:bg-white text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                      title="Hapus berkas"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Form Action Buttons */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                Verifikator Penerima: <strong className="text-[#0f4c82]">{verifikatorInfo.nama}</strong> ({unitKerja})
              </div>

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
                    <Send className="w-4 h-4" />
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
          naskah={naskahList.find((n) => n.id === selectedTimelineNaskah.id) || selectedTimelineNaskah}
          currentUser={currentUser}
          onClose={() => setSelectedTimelineNaskah(null)}
          onOpenRevisiModal={(n) => {
            setSelectedTimelineNaskah(null);
            if (onOpenRevisiModal) onOpenRevisiModal(n);
          }}
          onOpenUnggahFinalModal={(n) => {
            setSelectedTimelineNaskah(null);
            if (onOpenUnggahFinalModal) onOpenUnggahFinalModal(n);
          }}
          onTerbitkanNomorSurat={onTerbitkanNomorSurat}
          onVerifikasiKeputusan={onVerifikasiKeputusan}
          onBukaKembaliNaskah={onBukaKembaliNaskah}
          onToast={onToast}
        />
      )}
      <FilePreviewModal
        file={previewFile}
        rootFolderId={config?.googleDriveFolderId}
        onClose={() => setPreviewFile(null)}
        onToast={onToast}
      />
    </div>
  );
};
