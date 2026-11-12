import React, { useState, useMemo } from 'react';
import {
  FileCheck2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Download,
  Filter,
  Search,
  CheckSquare,
  Square,
  MessageSquare,
  FileText,
  UserCheck,
  Send,
  Eye,
  History,
  X,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  PenTool,
  Archive,
  RefreshCw,
  PlusCircle,
  FileSpreadsheet,
  Edit3,
  Trash2,
  Save,
  Copy,
  Check,
} from 'lucide-react';
import {
  CatatanVerifikasi,
  ChecklistVerifikasi,
  JenisNaskahDinas,
  NaskahDinas,
  StatusNaskah,
  UserProfile,
} from '../types';
import { TIM_KERJA_OPTIONS, DAFTAR_KLASIFIKASI_BPS } from '../data/bpsClassifications';
import { tentukanVerifikator } from '../data/verifikatorData';
import { formatTanggalIndo } from '../utils/storage';
import { NaskahTimelineModal } from './NaskahTimelineModal';

interface VerifikasiViewProps {
  naskahList: NaskahDinas[];
  currentUser: UserProfile;
  onVerifikasiKeputusan: (
    naskahId: string,
    keputusan: 'DISETUJUI' | 'PERLU_PERBAIKAN' | 'DITOLAK',
    catatan: string,
    checklist: ChecklistVerifikasi
  ) => void;
  onTerbitkanNomorSurat?: (naskah: NaskahDinas) => void;
  onBukaKembaliNaskah?: (naskahId: string, alasan: string) => void;
  onOpenRevisiModal?: (naskah: NaskahDinas) => void;
  onOpenUnggahFinalModal?: (naskah: NaskahDinas) => void;
  onUpdateNaskah?: (updated: NaskahDinas) => void;
  onDeleteNaskah?: (naskah: NaskahDinas) => void;
  onNavigateToPengajuan?: () => void;
  onOpenSetupDatabase?: () => void;
  onToast: (msg: string) => void;
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

export const VerifikasiView: React.FC<VerifikasiViewProps> = ({
  naskahList,
  currentUser,
  onVerifikasiKeputusan,
  onTerbitkanNomorSurat,
  onBukaKembaliNaskah,
  onOpenRevisiModal,
  onOpenUnggahFinalModal,
  onUpdateNaskah,
  onDeleteNaskah,
  onNavigateToPengajuan,
  onOpenSetupDatabase,
  onToast,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterUnit, setFilterUnit] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected naskah for viewing timeline
  const [selectedNaskah, setSelectedNaskah] = useState<NaskahDinas | null>(null);

  // Edit and Delete states
  const [editingNaskah, setEditingNaskah] = useState<NaskahDinas | null>(null);
  const [deletingNaskah, setDeletingNaskah] = useState<NaskahDinas | null>(null);

  // Edit form fields
  const [editPerihal, setEditPerihal] = useState('');
  const [editJenis, setEditJenis] = useState<JenisNaskahDinas>('Surat Dinas Biasa');
  const [editUnit, setEditUnit] = useState('');
  const [editKlasifikasi, setEditKlasifikasi] = useState('');
  const [editNomorDipesan, setEditNomorDipesan] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyNomorSurat = (nomorSurat: string, itemId: string) => {
    if (!nomorSurat) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(nomorSurat);
    }
    setCopiedId(itemId);
    setTimeout(() => setCopiedId(null), 2500);
    onToast('Nomor surat berhasil disalin');
  };

  // Filtered List
  const filteredList = useMemo(() => {
    return naskahList.filter((item) => {
      // Role scope (Verifiers only see their assigned drafts, Arsiparis/Admin see all)
      if (
        currentUser.role !== 'ADMIN' &&
        currentUser.role !== 'ARSIPARIS' &&
        currentUser.role !== 'KONSEPTOR'
      ) {
        if (item.roleVerifikatorDitunjuk !== currentUser.role) {
          return false;
        }
      }

      if (filterStatus !== 'all') {
        if (filterStatus === 'MENUNGGU_VERIFIKASI') {
          if (
            item.status !== 'MENUNGGU_VERIFIKASI' &&
            item.status !== 'DRAF_DIAJUKAN' &&
            item.status !== 'SEDANG_DIPERIKSA'
          )
            return false;
        } else if (filterStatus === 'MENUNGGU_PENOMORAN') {
          if (
            item.status !== 'MENUNGGU_PENOMORAN' &&
            !(item.status === 'TERVERIFIKASI' && !item.nomorSuratDipesan)
          )
            return false;
        } else if (filterStatus === 'NOMOR_DITERBITKAN') {
          if (
            item.status !== 'NOMOR_DITERBITKAN' &&
            item.status !== 'MENUNGGU_DOKUMEN_FINAL' &&
            !(item.status === 'TERVERIFIKASI' && item.nomorSuratDipesan)
          )
            return false;
        } else if (filterStatus === 'SELESAI_ARSIP') {
          if (item.status !== 'SELESAI_ARSIP' && item.status !== 'FINAL_DIARSIPKAN') return false;
        } else if (item.status !== filterStatus) {
          return false;
        }
      }
      if (filterUnit !== 'all' && item.unitKerja !== filterUnit) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.nomorRegistrasi.toLowerCase().includes(q) ||
          item.perihal.toLowerCase().includes(q) ||
          item.namaKonseptor.toLowerCase().includes(q) ||
          item.jenisNaskah.toLowerCase().includes(q) ||
          (item.nomorSuratDipesan || '').toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [naskahList, currentUser, filterStatus, filterUnit, searchQuery]);

  const handleOpenTimeline = (item: NaskahDinas) => {
    setSelectedNaskah(item);
  };

  const handleOpenEdit = (item: NaskahDinas) => {
    setEditingNaskah(item);
    setEditPerihal(item.perihal);
    setEditJenis(item.jenisNaskah as JenisNaskahDinas);
    setEditUnit(item.unitKerja);
    setEditKlasifikasi(item.klasifikasiArsip || '');
    setEditNomorDipesan(item.nomorSuratDipesan || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNaskah || !onUpdateNaskah) return;

    const newVerif = tentukanVerifikator(editUnit);

    const updated: NaskahDinas = {
      ...editingNaskah,
      perihal: editPerihal.trim(),
      jenisNaskah: editJenis,
      unitKerja: editUnit,
      klasifikasiArsip: editKlasifikasi.trim(),
      nomorSuratDipesan: editNomorDipesan.trim(),
      verifikatorDitunjuk: newVerif.nama,
      roleVerifikatorDitunjuk: newVerif.role,
      waktuUpdate: new Date().toLocaleString('id-ID'),
    };

    onUpdateNaskah(updated);
    setEditingNaskah(null);
    if (selectedNaskah && selectedNaskah.id === updated.id) {
      setSelectedNaskah(updated);
    }
    onToast(`✔ Metadata draf ${updated.nomorRegistrasi} berhasil diperbarui di database!`);
  };

  const handleConfirmDelete = () => {
    if (!deletingNaskah || !onDeleteNaskah) return;
    const reg = deletingNaskah.nomorRegistrasi;
    onDeleteNaskah(deletingNaskah);
    setDeletingNaskah(null);
    if (selectedNaskah && selectedNaskah.id === deletingNaskah.id) {
      setSelectedNaskah(null);
    }
    onToast(`✔ Draf ${reg} telah dihapus dari sistem & database.`);
  };

  const renderStatusBadge = (status: StatusNaskah) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="text-slate-600 font-semibold text-xs flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            <span>Draft</span>
          </span>
        );
      case 'MENUNGGU_VERIFIKASI':
      case 'DRAF_DIAJUKAN':
      case 'SEDANG_DIPERIKSA':
        return (
          <span className="text-amber-700 font-semibold text-xs flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Menunggu Verifikasi</span>
          </span>
        );
      case 'PERLU_PERBAIKAN':
        return (
          <span className="text-rose-700 font-semibold text-xs flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>Perlu Perbaikan</span>
          </span>
        );
      case 'DITOLAK':
        return (
          <span className="text-red-700 font-semibold text-xs flex items-center gap-1">
            <X className="w-3 h-3 text-red-600" />
            <span>Ditolak</span>
          </span>
        );
      case 'MENUNGGU_PENOMORAN':
        return (
          <span className="text-amber-800 font-semibold text-xs flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-amber-600" />
            <span>Menunggu Nomor Surat</span>
          </span>
        );
      case 'NOMOR_DITERBITKAN':
        return (
          <span className="text-indigo-700 font-semibold text-xs flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-indigo-600" />
            <span>Nomor Diterbitkan</span>
          </span>
        );
      case 'MENUNGGU_DOKUMEN_FINAL':
        return (
          <span className="text-cyan-700 font-semibold text-xs flex items-center gap-1">
            <Clock className="w-3 h-3 text-cyan-600" />
            <span>Menunggu Dokumen Sah</span>
          </span>
        );
      case 'TERVERIFIKASI':
        return (
          <span className="text-blue-700 font-semibold text-xs flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            <span>Terverifikasi (Siap TTD)</span>
          </span>
        );
      case 'SELESAI_ARSIP':
      case 'FINAL_DIARSIPKAN':
        return (
          <span className="text-emerald-700 font-semibold text-xs flex items-center gap-1">
            <Archive className="w-3 h-3 text-emerald-600" />
            <span>Selesai – Arsip Sah</span>
          </span>
        );
      default:
        return null;
    }
  };

  const isEligibleToVerify = (item: NaskahDinas) => {
    if (currentUser.role === 'ADMIN' || currentUser.role === 'ARSIPARIS') return true;
    return item.roleVerifikatorDitunjuk === currentUser.role;
  };

  const canEditOrDelete = (item: NaskahDinas) => {
    if (currentUser.role === 'ADMIN') return true;
    return currentUser.nama === item.namaKonseptor;
  };

  return (
    <div className="space-y-5">
      
      {/* Header Info Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-heading">
              Alur Timeline Verifikasi & Kendali Mutu Naskah Dinas
            </h2>
            <span className="text-xs font-semibold text-slate-500 font-mono tabular-nums">
              ({filteredList.length} Berkas)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Pemeriksaan berurutan: Pengajuan Draf → Penugasan Verifikator → Telaah Kearsipan 5 Aspek → Keputusan Koreksi → Pengesahan TTE → Arsip Digital.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {currentUser.allowedTabs.includes('pengajuan') && onNavigateToPengajuan && (
            <button
              onClick={onNavigateToPengajuan}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-[#0f4c82] hover:bg-[#0b3860] text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Ajukan Draf Baru</span>
            </button>
          )}
          {currentUser.role === 'ADMIN' && onOpenSetupDatabase && (
            <button
              onClick={onOpenSetupDatabase}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span className="hidden sm:inline">Database Spreadsheet</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari registrasi, perihal, atau konseptor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 text-xs sm:text-sm rounded-xl border border-slate-300 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0f4c82] focus:ring-2 focus:ring-[#0f4c82]/20 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-10 text-xs px-3.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-medium outline-none focus:border-[#0f4c82] focus:ring-2 focus:ring-[#0f4c82]/20 transition-all cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="MENUNGGU_VERIFIKASI">Menunggu Verifikasi</option>
            <option value="PERLU_PERBAIKAN">Perlu Perbaikan</option>
            <option value="DITOLAK">Ditolak</option>
            <option value="MENUNGGU_PENOMORAN">Menunggu Penerbitan Nomor Surat</option>
            <option value="NOMOR_DITERBITKAN">Nomor Surat Diterbitkan</option>
            <option value="SELESAI_ARSIP">Selesai – Arsip Tersimpan</option>
          </select>

          <select
            value={filterUnit}
            onChange={(e) => setFilterUnit(e.target.value)}
            className="h-10 text-xs px-3.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-medium outline-none focus:border-[#0f4c82] focus:ring-2 focus:ring-[#0f4c82]/20 transition-all cursor-pointer"
          >
            <option value="all">Semua Unit Kerja</option>
            {TIM_KERJA_OPTIONS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* Main List of Naskah */}
      {filteredList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0f4c82] flex items-center justify-center mx-auto border border-blue-100">
            <FileText className="w-7 h-7 opacity-70" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-800">
              {searchQuery || filterStatus !== 'all' || filterUnit !== 'all'
                ? 'Tidak ada draf yang cocok dengan filter'
                : 'Belum Ada Draf Naskah Dinas Terdaftar'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {searchQuery || filterStatus !== 'all' || filterUnit !== 'all'
                ? 'Silakan sesuaikan kata kunci pencarian atau setel ulang filter status/unit kerja.'
                : 'Data naskah murni bersumber dari Google Spreadsheet resmi. Silakan ajukan draf baru atau lakukan inisialisasi/sinkronisasi.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            {currentUser.allowedTabs.includes('pengajuan') && onNavigateToPengajuan && (
              <button
                onClick={onNavigateToPengajuan}
                className="px-4 py-2 bg-[#0f4c82] hover:bg-[#0b3860] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Ajukan Draf Naskah Pertama</span>
              </button>
            )}
            {currentUser.role === 'ADMIN' && onOpenSetupDatabase && (
              <button
                onClick={onOpenSetupDatabase}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-emerald-700" />
                <span>Cek Database Spreadsheet</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredList.map((item) => {
            const hasManagePerm = canEditOrDelete(item);
            const isWaitingNumber =
              item.status === 'MENUNGGU_PENOMORAN' ||
              (item.status === 'TERVERIFIKASI' && !item.nomorSuratDipesan);
            const isNumberIssued =
              item.status === 'NOMOR_DITERBITKAN' ||
              item.status === 'MENUNGGU_DOKUMEN_FINAL' ||
              (item.nomorSuratDipesan &&
                item.status !== 'SELESAI_ARSIP' &&
                item.status !== 'FINAL_DIARSIPKAN');

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-300 p-4.5 sm:p-5.5 shadow-xs transition-all hover:shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                {/* Left: Metadata info */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-[#0f4c82] tabular-nums">
                      {item.nomorRegistrasi}
                    </span>
                    <span className="text-slate-300">·</span>
                    {renderStatusBadge(item.status)}
                    <span className="text-slate-300">·</span>
                    <span className="font-medium text-slate-500">
                      {item.jenisNaskah}
                    </span>
                    {item.nomorSuratDipesan && (
                      <>
                        <span className="text-slate-300">·</span>
                        <div className="inline-flex items-center gap-1.5 font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <span className="font-semibold tabular-nums">No. Surat: {item.nomorSuratDipesan}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyNomorSurat(item.nomorSuratDipesan!, item.id);
                            }}
                            className="p-0.5 hover:bg-emerald-100 rounded text-emerald-700 transition-colors cursor-pointer flex items-center gap-0.5 text-[10px] font-sans font-bold"
                            title="Salin Nomor Surat ke Clipboard"
                          >
                            {copiedId === item.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Tersalin</span>
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

                  <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-1">
                    {item.perihal}
                  </h3>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-2 text-xs text-slate-500">
                    <span>Unit: <strong className="text-slate-700">{item.unitKerja}</strong></span>
                    <span>·</span>
                    <span>Konseptor: <strong className="text-slate-700">{item.namaKonseptor}</strong></span>
                    <span>·</span>
                    <span>Verifikator: <strong className="text-blue-800">{item.verifikatorDitunjuk}</strong></span>
                    <span>·</span>
                    <span>Tgl: <span className="font-mono tabular-nums">{formatTanggalIndo(item.tanggalPengajuan)}</span></span>
                  </div>
                </div>

                {/* Right: Quick Actions & Timeline Button */}
                <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 flex-wrap">
                  
                  {/* Download Word Draft */}
                  {item.drafFile?.dataUrl ? (
                    <a
                      href={item.drafFile.dataUrl}
                      download={item.drafFile.name}
                      className="p-2 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg border border-slate-200 text-xs font-medium flex items-center gap-1.5"
                      title="Unduh Berkas Draf Word"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Draf Word</span>
                    </a>
                  ) : null}

                  {/* If needs revision & user is konseptor/admin */}
                  {item.status === 'PERLU_PERBAIKAN' && onOpenRevisiModal && (
                    <button
                      onClick={() => onOpenRevisiModal(item)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Unggah Revisi</span>
                    </button>
                  )}

                  {/* If waiting for number & user is Admin OR assigned verifier */}
                  {isWaitingNumber &&
                    (currentUser.role === 'ADMIN' ||
                      currentUser.role === item.roleVerifikatorDitunjuk ||
                      currentUser.nama.toLowerCase() === item.verifikatorDitunjuk.toLowerCase()) &&
                    onTerbitkanNomorSurat && (
                      <button
                        onClick={() => onTerbitkanNomorSurat(item)}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                        title="Terbitkan nomor surat resmi dari register"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Terbitkan Nomor</span>
                      </button>
                    )}

                  {/* If number issued & user can upload final document */}
                  {isNumberIssued && onOpenUnggahFinalModal && (
                    <button
                      onClick={() => onOpenUnggahFinalModal(item)}
                      className="px-3 py-1.5 bg-[#0f4c82] hover:bg-[#0a335a] text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                      title="Unggah berkas final bertanda tangan"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>Unggah Final Sah</span>
                    </button>
                  )}

                  {/* Edit Metadata Button */}
                  {hasManagePerm && onUpdateNaskah && (
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg border border-slate-200 text-xs transition-colors cursor-pointer"
                      title="Ubah metadata draf ini"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Delete Draft Button */}
                  {hasManagePerm && onDeleteNaskah && item.status !== 'FINAL_DIARSIPKAN' && (
                    <button
                      onClick={() => setDeletingNaskah(item)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 text-xs transition-colors cursor-pointer"
                      title="Hapus draf naskah ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* View Sequential Timeline Modal */}
                  <button
                    onClick={() => handleOpenTimeline(item)}
                    className="px-3.5 py-1.5 bg-[#0f4c82] hover:bg-[#0b3860] text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Timeline & Verifikasi</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* SEQUENTIAL VERIFICATION TIMELINE MODAL */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {selectedNaskah && (
        <NaskahTimelineModal
          naskah={selectedNaskah}
          currentUser={currentUser}
          onClose={() => setSelectedNaskah(null)}
          onVerifikasiKeputusan={(naskahId, keputusan, catatan, checklist) => {
            onVerifikasiKeputusan(naskahId, keputusan, catatan, checklist);
            setSelectedNaskah(null);
          }}
          onTerbitkanNomorSurat={onTerbitkanNomorSurat}
          onOpenRevisiModal={onOpenRevisiModal}
          onOpenUnggahFinalModal={onOpenUnggahFinalModal}
          onBukaKembaliNaskah={onBukaKembaliNaskah}
          onToast={onToast}
        />
      )}

      {/* Modal Ubah Metadata Draf Naskah */}
      {editingNaskah && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Ubah Metadata Draf {editingNaskah.nomorRegistrasi}
                </h3>
              </div>
              <button
                onClick={() => setEditingNaskah(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Perihal Naskah Dinas *</label>
                <textarea
                  rows={2}
                  required
                  value={editPerihal}
                  onChange={(e) => setEditPerihal(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-[#0f4c82] focus:ring-1 focus:ring-blue-100 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Naskah</label>
                  <select
                    value={editJenis}
                    onChange={(e) => setEditJenis(e.target.value as JenisNaskahDinas)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-[#0f4c82] bg-white outline-none"
                  >
                    {DAFTAR_JENIS_NASKAH.map((j) => (
                      <option key={j} value={j}>
                        {j}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit Kerja Pengusul</label>
                  <select
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-[#0f4c82] bg-white outline-none"
                  >
                    {TIM_KERJA_OPTIONS.map((tim) => (
                      <option key={tim} value={tim}>
                        {tim}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kode Klasifikasi Arsip</label>
                  <input
                    type="text"
                    value={editKlasifikasi}
                    onChange={(e) => setEditKlasifikasi(e.target.value)}
                    placeholder="Contoh: VS.100"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:border-[#0f4c82] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Surat Dipesan</label>
                  <input
                    type="text"
                    value={editNomorDipesan}
                    onChange={(e) => setEditNomorDipesan(e.target.value)}
                    placeholder="Contoh: B-367/6100/..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:border-[#0f4c82] outline-none"
                  />
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingNaskah(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#0f4c82] hover:bg-[#0b3860] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Hapus Draf Naskah */}
      {deletingNaskah && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Hapus Draf {deletingNaskah.nomorRegistrasi}?
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus berkas usulan draf ini? Data akan dihapus dari aplikasi dan database Google Spreadsheet.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div><strong className="text-slate-700">Perihal:</strong> {deletingNaskah.perihal}</div>
              <div><strong className="text-slate-700">Konseptor:</strong> {deletingNaskah.namaKonseptor} ({deletingNaskah.unitKerja})</div>
              <div><strong className="text-slate-700">Verifikator:</strong> {deletingNaskah.verifikatorDitunjuk}</div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingNaskah(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
