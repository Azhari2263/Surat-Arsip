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

interface VerifikasiViewProps {
  naskahList: NaskahDinas[];
  currentUser: UserProfile;
  onVerifikasiKeputusan: (
    naskahId: string,
    keputusan: 'DISETUJUI' | 'PERLU_PERBAIKAN',
    catatan: string,
    checklist: ChecklistVerifikasi
  ) => void;
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

  // Verification Decision Form State inside Timeline modal
  const [catatanVerifikator, setCatatanVerifikator] = useState('');
  const [checklist, setChecklist] = useState<ChecklistVerifikasi>({
    kesesuaianFormatTemplate: true,
    kelengkapanStruktur: true,
    ketepatanBahasaTataLetak: true,
    kesesuaianNomorKlasifikasi: true,
    kepatuhanPedomanHukum: true,
  });

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

      if (filterStatus !== 'all' && item.status !== filterStatus) return false;
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
    setCatatanVerifikator('');
    setChecklist({
      kesesuaianFormatTemplate: true,
      kelengkapanStruktur: true,
      ketepatanBahasaTataLetak: true,
      kesesuaianNomorKlasifikasi: true,
      kepatuhanPedomanHukum: true,
    });
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

  const submitDecision = (keputusan: 'DISETUJUI' | 'PERLU_PERBAIKAN') => {
    if (!selectedNaskah) return;

    if (keputusan === 'PERLU_PERBAIKAN' && !catatanVerifikator.trim()) {
      alert('Mohon cantumkan rincian bagian naskah yang perlu diperbaiki oleh konseptor.');
      return;
    }

    onVerifikasiKeputusan(
      selectedNaskah.id,
      keputusan,
      catatanVerifikator.trim() ||
        (keputusan === 'DISETUJUI'
          ? 'Naskah dinas telah diperiksa dan disetujui sesuai pedoman tata naskah dinas BPS.'
          : 'Draf perlu disesuaikan kembali.'),
      checklist
    );

    setSelectedNaskah(null);
    onToast(
      keputusan === 'DISETUJUI'
        ? `✔ Draf ${selectedNaskah.nomorRegistrasi} telah Terverifikasi (Siap TTD)`
        : `⚠ Draf ${selectedNaskah.nomorRegistrasi} dikembalikan untuk perbaikan`
    );
  };

  const toggleCheck = (key: keyof ChecklistVerifikasi) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderStatusBadge = (status: StatusNaskah) => {
    switch (status) {
      case 'DRAF_DIAJUKAN':
        return (
          <span className="text-amber-700 font-semibold text-xs flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Menunggu Verifikasi</span>
          </span>
        );
      case 'PERLU_PERBAIKAN':
        return (
          <span className="text-rose-700 font-semibold text-xs flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Perlu Perbaikan</span>
          </span>
        );
      case 'TERVERIFIKASI':
        return (
          <span className="text-blue-700 font-semibold text-xs flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Terverifikasi (Siap TTD)</span>
          </span>
        );
      case 'FINAL_DIARSIPKAN':
        return (
          <span className="text-emerald-700 font-semibold text-xs flex items-center gap-1">
            <Archive className="w-3 h-3" />
            <span>Final & Diarsipkan</span>
          </span>
        );
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
            <option value="DRAF_DIAJUKAN">Menunggu Verifikasi</option>
            <option value="PERLU_PERBAIKAN">Perlu Perbaikan</option>
            <option value="TERVERIFIKASI">Terverifikasi (Siap TTD)</option>
            <option value="FINAL_DIARSIPKAN">Final & Diarsipkan</option>
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
                        <span className="font-mono text-emerald-700 font-semibold tabular-nums">
                          No. Surat: {item.nomorSuratDipesan}
                        </span>
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

                  {/* If verified & user is konseptor/arsiparis/admin */}
                  {item.status === 'TERVERIFIKASI' && onOpenUnggahFinalModal && (
                    <button
                      onClick={() => onOpenUnggahFinalModal(item)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>Unggah PDF Final</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-[#0a335a] to-[#0f4c82] text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono font-bold text-white tabular-nums">
                    {selectedNaskah.nomorRegistrasi}
                  </span>
                  <span className="text-white/60">·</span>
                  <span className="text-blue-200">
                    {selectedNaskah.jenisNaskah}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold font-heading text-white mt-1 line-clamp-1">
                  Timeline Verifikasi: {selectedNaskah.perihal}
                </h3>
              </div>
              <button
                onClick={() => setSelectedNaskah(null)}
                className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 text-xs sm:text-sm">
              
              {/* Top Overview Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Konseptor</span>
                  <span className="font-semibold text-slate-800">{selectedNaskah.namaKonseptor}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Unit Kerja</span>
                  <span className="font-semibold text-slate-800">{selectedNaskah.unitKerja}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Verifikator Ditunjuk</span>
                  <span className="font-semibold text-blue-800">{selectedNaskah.verifikatorDitunjuk}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Status Saat Ini</span>
                  <div>{renderStatusBadge(selectedNaskah.status)}</div>
                </div>
              </div>

              {/* TIMELINE SECTION */}
              <div className="space-y-6 relative before:absolute before:left-5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 pl-2">
                
                {/* ── STEP 1: PENGAJUAN DRAF ── */}
                <div className="relative pl-10">
                  <div className="absolute left-2.5 -translate-x-1/2 top-0 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow">
                    1
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <span>Tahap 1: Pengajuan Draf Naskah Dinas Awal</span>
                      </h4>
                      <span className="text-[11px] text-slate-400 font-mono tabular-nums">{formatTanggalIndo(selectedNaskah.tanggalPengajuan)}</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Draf diajukan oleh <strong>{selectedNaskah.namaKonseptor}</strong> dari <strong>{selectedNaskah.unitKerja}</strong> dengan nomor registrasi <code className="font-mono tabular-nums">{selectedNaskah.nomorRegistrasi}</code>.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs flex items-center gap-2 text-slate-700">
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span>{selectedNaskah.drafFile.name}</span>
                        <span className="text-slate-400 text-[10px] font-mono tabular-nums">({Math.round((selectedNaskah.drafFile.size || 0) / 1024)} KB)</span>
                      </div>
                      {selectedNaskah.drafFile.dataUrl && (
                        <a
                          href={selectedNaskah.drafFile.dataUrl}
                          download={selectedNaskah.drafFile.name}
                          className="px-3 py-1.5 bg-[#0f4c82] hover:bg-[#0b3860] text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Unduh Word</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── STEP 2: PENUGASAN VERIFIKATOR ── */}
                <div className="relative pl-10">
                  <div className="absolute left-2.5 -translate-x-1/2 top-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold shadow">
                    2
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-blue-600" />
                        <span>Tahap 2: Penugasan Otomatis Verifikator Tim</span>
                      </h4>
                      <span className="text-[11px] font-semibold text-blue-700">
                        {selectedNaskah.roleVerifikatorDitunjuk}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Berdasarkan unit kerja <strong>{selectedNaskah.unitKerja}</strong>, sistem menugaskan <strong>{selectedNaskah.verifikatorDitunjuk}</strong> serta Arsiparis BPS Provinsi Kalbar untuk melakukan kendali mutu persuratan.
                    </p>
                  </div>
                </div>

                {/* ── STEP 3: TELAAH KEARSIPAN & KENDALI MUTU ── */}
                <div className="relative pl-10">
                  <div className={`absolute left-2.5 -translate-x-1/2 top-0 w-6 h-6 rounded-full text-white flex items-center justify-center text-xs font-bold shadow ${
                    selectedNaskah.status === 'TERVERIFIKASI' || selectedNaskah.status === 'FINAL_DIARSIPKAN'
                      ? 'bg-emerald-500'
                      : selectedNaskah.status === 'PERLU_PERBAIKAN'
                      ? 'bg-rose-500'
                      : 'bg-amber-500'
                  }`}>
                    3
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-amber-600" />
                        <span>Tahap 3: Telaah Kearsipan 5 Aspek Mutu</span>
                      </h4>
                      <span className="text-[11px] text-slate-400">Standar Perka BPS</span>
                    </div>

                    {/* 5 Parameters Checklist */}
                    <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                      
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <button
                          type="button"
                          disabled={!isEligibleToVerify(selectedNaskah) || selectedNaskah.status !== 'DRAF_DIAJUKAN'}
                          onClick={() => toggleCheck('kesesuaianFormatTemplate')}
                          className="text-[#0f4c82]"
                        >
                          {checklist.kesesuaianFormatTemplate ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                        <span className={checklist.kesesuaianFormatTemplate ? 'text-slate-800 font-medium' : 'text-slate-500'}>
                          1. Kesesuaian format dan template naskah dinas resmi BPS
                        </span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <button
                          type="button"
                          disabled={!isEligibleToVerify(selectedNaskah) || selectedNaskah.status !== 'DRAF_DIAJUKAN'}
                          onClick={() => toggleCheck('kelengkapanStruktur')}
                          className="text-[#0f4c82]"
                        >
                          {checklist.kelengkapanStruktur ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                        <span className={checklist.kelengkapanStruktur ? 'text-slate-800 font-medium' : 'text-slate-500'}>
                          2. Kelengkapan struktur dan unsur naskah (Kop, Nomor, Tanggal, Tujuan, Isi, Penutup, Tembusan)
                        </span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <button
                          type="button"
                          disabled={!isEligibleToVerify(selectedNaskah) || selectedNaskah.status !== 'DRAF_DIAJUKAN'}
                          onClick={() => toggleCheck('ketepatanBahasaTataLetak')}
                          className="text-[#0f4c82]"
                        >
                          {checklist.ketepatanBahasaTataLetak ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                        <span className={checklist.ketepatanBahasaTataLetak ? 'text-slate-800 font-medium' : 'text-slate-500'}>
                          3. Ketepatan penggunaan bahasa Indonesia baku (EYD), tanda baca, dan tata letak perataan
                        </span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <button
                          type="button"
                          disabled={!isEligibleToVerify(selectedNaskah) || selectedNaskah.status !== 'DRAF_DIAJUKAN'}
                          onClick={() => toggleCheck('kesesuaianNomorKlasifikasi')}
                          className="text-[#0f4c82]"
                        >
                          {checklist.kesesuaianNomorKlasifikasi ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                        <span className={checklist.kesesuaianNomorKlasifikasi ? 'text-slate-800 font-medium' : 'text-slate-500'}>
                          4. Kesesuaian nomor registrasi surat, kode klasifikasi kearsipan ({selectedNaskah.klasifikasiArsip || 'HK.010/PR.100'}), serta jenis naskah
                        </span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <button
                          type="button"
                          disabled={!isEligibleToVerify(selectedNaskah) || selectedNaskah.status !== 'DRAF_DIAJUKAN'}
                          onClick={() => toggleCheck('kepatuhanPedomanHukum')}
                          className="text-[#0f4c82]"
                        >
                          {checklist.kepatuhanPedomanHukum ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                        <span className={checklist.kepatuhanPedomanHukum ? 'text-slate-800 font-medium' : 'text-slate-500'}>
                          5. Kesesuaian dengan dasar hukum dan peraturan tata naskah dinas yang berlaku di lingkungan BPS
                        </span>
                      </label>

                    </div>

                    {/* Decision Input if user is verifier & status is DRAF_DIAJUKAN */}
                    {isEligibleToVerify(selectedNaskah) && selectedNaskah.status === 'DRAF_DIAJUKAN' && (
                      <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-[#0f4c82]" />
                            <span>Catatan & Rekomendasi Verifikator ({currentUser.nama})</span>
                          </label>
                        </div>
                        <textarea
                          rows={3}
                          value={catatanVerifikator}
                          onChange={(e) => setCatatanVerifikator(e.target.value)}
                          placeholder="Masukkan catatan koreksi (wajib jika memilih 'Perlu Perbaikan') atau catatan persetujuan..."
                          className="w-full p-2.5 text-xs bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0f4c82]"
                        />

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => submitDecision('PERLU_PERBAIKAN')}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Kembalikan untuk Perbaikan</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => submitDecision('DISETUJUI')}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Setujui (Terverifikasi)</span>
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                </div>

                {/* ── STEP 4: KEPUTUSAN & RIWAYAT CATATAN ── */}
                <div className="relative pl-10">
                  <div className={`absolute left-2.5 -translate-x-1/2 top-0 w-6 h-6 rounded-full text-white flex items-center justify-center text-xs font-bold shadow ${
                    selectedNaskah.riwayatVerifikasi.length > 0 ? 'bg-purple-600' : 'bg-slate-300'
                  }`}>
                    4
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <History className="w-4 h-4 text-purple-600" />
                        <span>Tahap 4: Riwayat Verifikasi & Pengembalian Draf</span>
                      </h4>
                      <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                        {selectedNaskah.riwayatVerifikasi.length} Riwayat
                      </span>
                    </div>

                    {selectedNaskah.riwayatVerifikasi.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">
                        Belum ada riwayat keputusan verifikasi dari petugas.
                      </p>
                    ) : (
                      <div className="space-y-2 pt-1">
                        {selectedNaskah.riwayatVerifikasi.map((rv, idx) => {
                          const isApproved = rv.statusKeputusan === 'DISETUJUI' || rv.keputusan === 'DISETUJUI';
                          return (
                            <div
                              key={idx}
                              className={`p-3 rounded-lg border text-xs ${
                                isApproved
                                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                                  : 'bg-rose-50/70 border-rose-200 text-rose-900'
                              }`}
                            >
                              <div className="flex items-center justify-between font-semibold mb-1">
                                <span className="flex items-center gap-1.5">
                                  {isApproved ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                  )}
                                  <span>{isApproved ? 'DISETUJUI / TERVERIFIKASI' : 'KEMBALIKAN PERLU PERBAIKAN'}</span>
                                  <span className="text-slate-500 font-normal">oleh {rv.namaVerifikator} ({rv.roleVerifikator})</span>
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono tabular-nums">{rv.waktu}</span>
                              </div>
                              <p className="text-slate-700 bg-white/70 p-2 rounded border border-slate-200/60">
                                "{rv.catatan}"
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Riwayat Versi Revisi */}
                    {selectedNaskah.riwayatVersi && selectedNaskah.riwayatVersi.length > 1 && (
                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[11px] font-bold text-slate-700 block mb-1">Riwayat Versi Berkas:</span>
                        <div className="space-y-1">
                          {selectedNaskah.riwayatVersi.map((v) => (
                            <div key={v.versi} className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded border border-slate-200">
                              <span className="font-semibold text-slate-700">Versi {v.versi} ({v.namaFile})</span>
                              <span className="text-[10px] text-slate-400 font-mono tabular-nums">{v.waktuUnggah} oleh {v.diunggahOleh}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── STEP 5: PROSES PENANDATANGANAN RESMI ── */}
                <div className="relative pl-10">
                  <div className={`absolute left-2.5 -translate-x-1/2 top-0 w-6 h-6 rounded-full text-white flex items-center justify-center text-xs font-bold shadow ${
                    selectedNaskah.status === 'TERVERIFIKASI' || selectedNaskah.status === 'FINAL_DIARSIPKAN'
                      ? 'bg-blue-600'
                      : 'bg-slate-300'
                  }`}>
                    5
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <PenTool className="w-4 h-4 text-blue-600" />
                        <span>Tahap 5: Penandatanganan Resmi (TTE / Konvensional)</span>
                      </h4>
                      <span className="text-[11px] text-slate-400">Kepala BPS / Pejabat Penandatangan</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Naskah dinas yang telah berstatus <strong>Terverifikasi</strong> siap diajukan ke Pejabat Penandatangan menggunakan Sertifikat Elektronik Balai Sertifikasi Elektronik (BSrE BSSN) atau tanda tangan basah resmi.
                    </p>
                    {selectedNaskah.status === 'TERVERIFIKASI' && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-center justify-between">
                        <span className="text-xs text-blue-900 font-semibold">
                          Dokumen siap ditandatangani. Lanjutkan dengan mengunggah PDF final bertanda tangan.
                        </span>
                        {onOpenUnggahFinalModal && (
                          <button
                            onClick={() => {
                              setSelectedNaskah(null);
                              onOpenUnggahFinalModal(selectedNaskah);
                            }}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow cursor-pointer flex items-center gap-1"
                          >
                            <Archive className="w-3.5 h-3.5" />
                            <span>Unggah PDF Sah</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── STEP 6: ARSIP DIGITAL SAH ── */}
                <div className="relative pl-10">
                  <div className={`absolute left-2.5 -translate-x-1/2 top-0 w-6 h-6 rounded-full text-white flex items-center justify-center text-xs font-bold shadow ${
                    selectedNaskah.status === 'FINAL_DIARSIPKAN' ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}>
                    6
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <Archive className="w-4 h-4 text-emerald-600" />
                        <span>Tahap 6: Pengarsipan Digital Sah (Lembar ArsipDigital)</span>
                      </h4>
                      <span className="text-[11px] text-slate-400">Penyimpanan Permanen</span>
                    </div>

                    {selectedNaskah.status === 'FINAL_DIARSIPKAN' && selectedNaskah.dokumenFinal ? (
                      <div className="bg-emerald-50 p-3.5 rounded-lg border border-emerald-200 space-y-2 text-xs">
                        <div className="flex items-center justify-between font-bold text-emerald-900">
                          <span className="font-mono tabular-nums">Nomor Surat Resmi: {selectedNaskah.dokumenFinal.nomorSuratResmi}</span>
                          <span className="text-emerald-800 font-semibold text-[11px]">
                            {selectedNaskah.dokumenFinal.tipeTandaTangan}
                          </span>
                        </div>
                        <div className="text-slate-600 space-y-1">
                          <p>Pejabat Penandatangan: <strong>{selectedNaskah.dokumenFinal.pejabatPenandatangan}</strong></p>
                          <p>Tanggal Penetapan: <strong className="font-mono tabular-nums">{selectedNaskah.dokumenFinal.tanggalPenetapan}</strong></p>
                          <p>Tingkat Keamanan: <strong>{selectedNaskah.dokumenFinal.tingkatKeamanan}</strong></p>
                          <p>Lokasi Lemari/Folder: <strong>{selectedNaskah.dokumenFinal.lokasiPenyimpanan || 'Repositori Digital Cloud BPS'}</strong></p>
                        </div>
                        {selectedNaskah.dokumenFinal.dataUrl && (
                          <div className="pt-2">
                            <a
                              href={selectedNaskah.dokumenFinal.dataUrl}
                              download={selectedNaskah.dokumenFinal.namaFile}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold text-xs shadow-xs"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Unduh Naskah Sah ({selectedNaskah.dokumenFinal.namaFile})</span>
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">
                        Menunggu penyelesaian verifikasi dan pengunggahan berkas PDF bertanda tangan resmi.
                      </p>
                    )}
                  </div>
                </div>

              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {canEditOrDelete(selectedNaskah) && onUpdateNaskah && (
                  <button
                    onClick={() => {
                      const item = selectedNaskah;
                      setSelectedNaskah(null);
                      handleOpenEdit(item);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Ubah Metadata</span>
                  </button>
                )}
                {canEditOrDelete(selectedNaskah) && onDeleteNaskah && selectedNaskah.status !== 'FINAL_DIARSIPKAN' && (
                  <button
                    onClick={() => {
                      const item = selectedNaskah;
                      setSelectedNaskah(null);
                      setDeletingNaskah(item);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Draf</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => setSelectedNaskah(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Tutup Timeline
              </button>
            </div>

          </div>
        </div>
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
