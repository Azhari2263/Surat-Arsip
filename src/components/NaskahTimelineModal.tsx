import React, { useState } from 'react';
import {
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Download,
  CheckSquare,
  Square,
  MessageSquare,
  UserCheck,
  ShieldCheck,
  Archive,
  X,
  FileCheck2,
  Calendar,
  Send,
  Building,
  Upload,
  Hash,
  XCircle,
  Unlock,
  History,
  Check,
  ExternalLink,
  ChevronRight,
  Copy,
} from 'lucide-react';
import {
  ChecklistVerifikasi,
  NaskahDinas,
  StatusNaskah,
  UserProfile,
} from '../types';
import { formatTanggalIndo, formatTanggalWaktuIndo } from '../utils/storage';

export interface NaskahTimelineModalProps {
  naskah: NaskahDinas;
  currentUser: UserProfile;
  onClose: () => void;
  onVerifikasiKeputusan?: (
    naskahId: string,
    keputusan: 'DISETUJUI' | 'PERLU_PERBAIKAN' | 'DITOLAK',
    catatan: string,
    checklist: ChecklistVerifikasi
  ) => void;
  onTerbitkanNomorSurat?: (naskah: NaskahDinas) => void;
  onOpenRevisiModal?: (naskah: NaskahDinas) => void;
  onOpenUnggahFinalModal?: (naskah: NaskahDinas) => void;
  onBukaKembaliNaskah?: (naskahId: string, alasan: string) => void;
  onToast?: (msg: string) => void;
}

export const NaskahTimelineModal: React.FC<NaskahTimelineModalProps> = ({
  naskah,
  currentUser,
  onClose,
  onVerifikasiKeputusan,
  onTerbitkanNomorSurat,
  onOpenRevisiModal,
  onOpenUnggahFinalModal,
  onBukaKembaliNaskah,
  onToast,
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'audit'>('timeline');
  const [catatanVerifikator, setCatatanVerifikator] = useState('');
  const [showTolakModal, setShowTolakModal] = useState(false);
  const [alasanPenolakanText, setAlasanPenolakanText] = useState('');
  const [showBukaKembaliModal, setShowBukaKembaliModal] = useState(false);
  const [alasanBukaKembaliText, setAlasanBukaKembaliText] = useState('');

  const [checklist, setChecklist] = useState<ChecklistVerifikasi>({
    kesesuaianFormatTemplate: true,
    kelengkapanStruktur: true,
    ketepatanBahasaTataLetak: true,
    kesesuaianNomorKlasifikasi: true,
    kepatuhanPedomanHukum: true,
  });

  const [copiedNomor, setCopiedNomor] = useState(false);

  // Verifikator yang ditunjuk untuk naskah ini
  const isAssignedVerifier =
    currentUser.role === naskah.roleVerifikatorDitunjuk ||
    currentUser.nama.toLowerCase() === naskah.verifikatorDitunjuk.toLowerCase();

  // Kewenangan penerbitan nomor: Admin dan Verifikator yang bertugas
  const canIssueNumber =
    (currentUser.role === 'ADMIN' || isAssignedVerifier) && !!onTerbitkanNomorSurat;

  const handleCopyNomorSurat = (nomorSurat: string) => {
    if (!nomorSurat) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(nomorSurat);
    }
    setCopiedNomor(true);
    setTimeout(() => setCopiedNomor(false), 2500);
    if (onToast) {
      onToast('Nomor surat berhasil disalin');
    }
  };

  const isEligibleToVerify = (item: NaskahDinas): boolean => {
    if (currentUser.role === 'ADMIN' || currentUser.role === 'ARSIPARIS') return true;
    return item.roleVerifikatorDitunjuk === currentUser.role;
  };

  const isKonseptor =
    currentUser.role === 'KONSEPTOR' ||
    naskah.namaKonseptor.toLowerCase() === currentUser.nama.toLowerCase();

  const toggleCheck = (field: keyof ChecklistVerifikasi) => {
    setChecklist((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleKirimKeputusan = (keputusan: 'DISETUJUI' | 'PERLU_PERBAIKAN') => {
    if (keputusan === 'PERLU_PERBAIKAN' && !catatanVerifikator.trim()) {
      alert('Wajib mengisi catatan perbaikan agar konseptor mengetahui bagian yang perlu direvisi.');
      return;
    }

    if (!onVerifikasiKeputusan) return;

    onVerifikasiKeputusan(
      naskah.id,
      keputusan,
      catatanVerifikator.trim() ||
        (keputusan === 'DISETUJUI'
          ? 'Naskah dinas telah diverifikasi dan memenuhi seluruh ketentuan kearsipan BPS. Diteruskan untuk penerbitan nomor surat.'
          : 'Perlu revisi sesuai catatan kearsipan.'),
      checklist
    );
  };

  const handleConfirmTolak = () => {
    if (!alasanPenolakanText.trim()) {
      alert('Alasan penolakan pengajuan wajib diisi.');
      return;
    }
    if (!onVerifikasiKeputusan) return;

    onVerifikasiKeputusan(
      naskah.id,
      'DITOLAK',
      alasanPenolakanText.trim(),
      checklist
    );
    setShowTolakModal(false);
  };

  const handleConfirmBukaKembali = () => {
    if (!alasanBukaKembaliText.trim()) {
      alert('Alasan pembukaan kembali pengajuan wajib diisi.');
      return;
    }
    if (!onBukaKembaliNaskah) return;
    onBukaKembaliNaskah(naskah.id, alasanBukaKembaliText.trim());
    setShowBukaKembaliModal(false);
  };

  const renderStatusBadge = (status: StatusNaskah) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            <span>Draft</span>
          </span>
        );
      case 'MENUNGGU_VERIFIKASI':
      case 'DRAF_DIAJUKAN':
      case 'SEDANG_DIPERIKSA':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-[#0f4c82] border border-blue-200 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-600 animate-spin" />
            <span>Menunggu Verifikasi</span>
          </span>
        );
      case 'PERLU_PERBAIKAN':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-200 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Perlu Perbaikan</span>
          </span>
        );
      case 'DITOLAK':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-900 border border-red-300 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            <span>Ditolak</span>
          </span>
        );
      case 'MENUNGGU_PENOMORAN':
      case 'TERVERIFIKASI':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-amber-700" />
            <span>Menunggu Penerbitan Nomor Surat</span>
          </span>
        );
      case 'NOMOR_DITERBITKAN':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-900 border border-indigo-200 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-700" />
            <span>Nomor Surat Diterbitkan</span>
          </span>
        );
      case 'MENUNGGU_DOKUMEN_FINAL':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-100 text-cyan-900 border border-cyan-200 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-700" />
            <span>Menunggu Unggah Dokumen Final</span>
          </span>
        );
      case 'SELESAI_ARSIP':
      case 'FINAL_DIARSIPKAN':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1.5">
            <Archive className="w-3.5 h-3.5 text-emerald-700" />
            <span>Selesai – Arsip Tersimpan</span>
          </span>
        );
      default:
        return null;
    }
  };

  const getStepProgressIndex = (status: StatusNaskah): number => {
    switch (status) {
      case 'DRAFT':
        return 0;
      case 'MENUNGGU_VERIFIKASI':
      case 'DRAF_DIAJUKAN':
      case 'SEDANG_DIPERIKSA':
        return 1;
      case 'PERLU_PERBAIKAN':
        return 1;
      case 'DITOLAK':
        return 1;
      case 'MENUNGGU_PENOMORAN':
      case 'TERVERIFIKASI':
        return 2;
      case 'NOMOR_DITERBITKAN':
        return 3;
      case 'MENUNGGU_DOKUMEN_FINAL':
        return 3;
      case 'SELESAI_ARSIP':
      case 'FINAL_DIARSIPKAN':
        return 4;
      default:
        return 1;
    }
  };

  const isNeedRevision = naskah.status === 'PERLU_PERBAIKAN';
  const isRejected = naskah.status === 'DITOLAK';
  const isWaitingNumber =
    naskah.status === 'MENUNGGU_PENOMORAN' || (naskah.status === 'TERVERIFIKASI' && !naskah.nomorSuratDipesan);
  const isNumberIssued =
    naskah.status === 'NOMOR_DITERBITKAN' ||
    naskah.status === 'MENUNGGU_DOKUMEN_FINAL' ||
    (naskah.nomorSuratDipesan && naskah.status !== 'SELESAI_ARSIP' && naskah.status !== 'FINAL_DIARSIPKAN');
  const isFinalArchived =
    naskah.status === 'SELESAI_ARSIP' || naskah.status === 'FINAL_DIARSIPKAN';

  const stepIndex = getStepProgressIndex(naskah.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-[#0a335a] to-[#0f4c82] text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span className="font-mono font-bold text-white tabular-nums bg-white/10 px-2 py-0.5 rounded">
                {naskah.nomorRegistrasi}
              </span>
              <span className="text-white/60">·</span>
              <span className="text-blue-200 font-medium">{naskah.jenisNaskah}</span>
              {naskah.nomorSuratDipesan && (
                <>
                  <span className="text-white/60">·</span>
                  <div className="inline-flex items-center gap-1.5 font-mono text-amber-300 font-bold bg-amber-400/20 px-2 py-0.5 rounded border border-amber-300/30">
                    <span>No. Surat: {naskah.nomorSuratDipesan}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyNomorSurat(naskah.nomorSuratDipesan!)}
                      className="ml-1 px-1.5 py-0.5 bg-amber-400/30 hover:bg-amber-400/50 text-white rounded text-[10px] font-sans font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Salin Nomor Surat ke Clipboard"
                    >
                      {copiedNomor ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-300" />
                          <span>Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Salin Nomor Surat</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold font-heading text-white mt-1 line-clamp-1">
              Alur Terintegrasi: {naskah.perihal}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Alur Proses vs Audit Trail */}
        <div className="px-6 pt-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3.5 py-2 font-bold text-xs rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'timeline'
                  ? 'bg-white text-[#0f4c82] border-t border-x border-slate-200 -mb-px'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Alur Proses & Verifikasi</span>
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3.5 py-2 font-bold text-xs rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'audit'
                  ? 'bg-white text-[#0f4c82] border-t border-x border-slate-200 -mb-px'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Riwayat Aktivitas ({naskah.riwayatAktivitas?.length || 1})</span>
            </button>
          </div>

          <div className="hidden sm:block pb-1.5">
            {renderStatusBadge(naskah.status)}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 text-xs sm:text-sm">
          {/* Top Overview Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                Konseptor Pengusul
              </span>
              <span className="font-semibold text-slate-800">{naskah.namaKonseptor}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">{naskah.unitKerja}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                Tanggal Pengajuan
              </span>
              <span className="font-semibold text-slate-800 font-mono-tabular">
                {formatTanggalIndo(naskah.tanggalPengajuan)}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Klasifikasi: {naskah.klasifikasiArsip}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                Verifikator Ditunjuk
              </span>
              <span className="font-semibold text-blue-800">{naskah.verifikatorDitunjuk}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">{naskah.roleVerifikatorDitunjuk.replace('VERIFIKATOR_', 'Tim ')}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                Status Saat Ini
              </span>
              <div className="mt-1">{renderStatusBadge(naskah.status)}</div>
            </div>
          </div>

          {/* Stepper Progres Terintegrasi */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
              Tahap Alur Kerja Terpadu
            </span>
            <div className="grid grid-cols-4 gap-2 relative">
              {/* Stage 1 */}
              <div className={`p-2.5 rounded-xl border text-center transition-all ${
                stepIndex >= 1
                  ? 'bg-blue-50 border-blue-200 text-blue-900 font-semibold'
                  : 'bg-white border-slate-200 text-slate-400'
              }`}>
                <div className={`w-5 h-5 mx-auto rounded-full flex items-center justify-center text-[10px] font-bold mb-1 ${
                  stepIndex > 1 ? 'bg-emerald-600 text-white' : stepIndex === 1 ? 'bg-[#0f4c82] text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {stepIndex > 1 ? <Check className="w-3 h-3" /> : '1'}
                </div>
                <div className="text-[11px] leading-tight font-bold">1. Draf & Verifikasi</div>
                <span className="text-[9px] text-slate-500 hidden sm:inline">Pemeriksaan mutu</span>
              </div>

              {/* Stage 2 */}
              <div className={`p-2.5 rounded-xl border text-center transition-all ${
                stepIndex >= 2
                  ? 'bg-blue-50 border-blue-200 text-blue-900 font-semibold'
                  : 'bg-white border-slate-200 text-slate-400'
              }`}>
                <div className={`w-5 h-5 mx-auto rounded-full flex items-center justify-center text-[10px] font-bold mb-1 ${
                  stepIndex > 2 ? 'bg-emerald-600 text-white' : stepIndex === 2 ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {stepIndex > 2 ? <Check className="w-3 h-3" /> : '2'}
                </div>
                <div className="text-[11px] leading-tight font-bold">2. Permintaan Nomor</div>
                <span className="text-[9px] text-slate-500 hidden sm:inline">Otomatis ke TU</span>
              </div>

              {/* Stage 3 */}
              <div className={`p-2.5 rounded-xl border text-center transition-all ${
                stepIndex >= 3
                  ? 'bg-blue-50 border-blue-200 text-blue-900 font-semibold'
                  : 'bg-white border-slate-200 text-slate-400'
              }`}>
                <div className={`w-5 h-5 mx-auto rounded-full flex items-center justify-center text-[10px] font-bold mb-1 ${
                  stepIndex > 3 ? 'bg-emerald-600 text-white' : stepIndex === 3 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {stepIndex > 3 ? <Check className="w-3 h-3" /> : '3'}
                </div>
                <div className="text-[11px] leading-tight font-bold">3. Tanda Tangan</div>
                <span className="text-[9px] text-slate-500 hidden sm:inline">TTE / Basah</span>
              </div>

              {/* Stage 4 */}
              <div className={`p-2.5 rounded-xl border text-center transition-all ${
                stepIndex >= 4
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold'
                  : 'bg-white border-slate-200 text-slate-400'
              }`}>
                <div className={`w-5 h-5 mx-auto rounded-full flex items-center justify-center text-[10px] font-bold mb-1 ${
                  stepIndex === 4 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {stepIndex === 4 ? <Check className="w-3 h-3" /> : '4'}
                </div>
                <div className="text-[11px] leading-tight font-bold">4. Arsip Digital</div>
                <span className="text-[9px] text-slate-500 hidden sm:inline">Tersimpan permanen</span>
              </div>
            </div>
          </div>

          {/* Alert: Perlu Revisi */}
          {isNeedRevision && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-rose-900 text-sm">
                    Draf Memerlukan Perbaikan / Revisi
                  </div>
                  <p className="text-rose-700 mt-0.5 leading-relaxed">
                    Verifikator mengembalikan draf ini dengan catatan perbaikan. Silakan perbaiki file Word dan unggah revisi untuk diverifikasi ulang.
                  </p>
                </div>
              </div>
              {onOpenRevisiModal && (isKonseptor || currentUser.role === 'ADMIN') && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenRevisiModal(naskah);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Unggah Revisi (.docx)</span>
                </button>
              )}
            </div>
          )}

          {/* Alert: Ditolak */}
          {isRejected && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-300 text-xs text-red-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-red-900 text-sm">
                    Pengajuan Naskah Ditolak
                  </div>
                  <p className="text-red-700 mt-0.5 leading-relaxed">
                    <strong>Alasan Penolakan:</strong> {naskah.alasanPenolakan || 'Tidak memenuhi kriteria tata persuratan BPS.'}
                  </p>
                </div>
              </div>
              {currentUser.role === 'ADMIN' && (
                <button
                  onClick={() => setShowBukaKembaliModal(true)}
                  className="px-3.5 py-1.5 bg-red-800 hover:bg-red-900 text-white font-bold rounded-xl shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Buka Kembali Pengajuan</span>
                </button>
              )}
            </div>
          )}

          {/* Alert: Menunggu Nomor Surat */}
          {isWaitingNumber && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Hash className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-amber-900 text-sm">
                    Draf Disetujui · Siap Diterbitkan Nomor Surat
                  </div>
                  <p className="text-amber-800 mt-0.5 leading-relaxed">
                    Draf telah disetujui verifikator. Verifikator yang bertugas ({naskah.verifikatorDitunjuk}) atau Administrator TU memiliki kewenangan menerbitkan nomor surat resmi secara langsung.
                  </p>
                </div>
              </div>
              {canIssueNumber && (
                <button
                  onClick={() => onTerbitkanNomorSurat(naskah)}
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Hash className="w-4 h-4" />
                  <span>Terbitkan Nomor Surat Sekarang</span>
                </button>
              )}
            </div>
          )}

          {/* Alert: Nomor Surat Diterbitkan -> Konseptor upload Final */}
          {isNumberIssued && (
            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-indigo-900 text-sm flex items-center gap-2 flex-wrap">
                    <span>Nomor Surat Resmi Diterbitkan:</span>
                    <span className="font-mono bg-white px-2.5 py-0.5 rounded-lg border border-indigo-200 text-indigo-950 font-bold select-all">
                      {naskah.nomorSuratDipesan}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyNomorSurat(naskah.nomorSuratDipesan!)}
                      className="px-2.5 py-1 bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-300 font-bold rounded-lg shadow-2xs flex items-center gap-1 transition-all cursor-pointer text-xs"
                      title="Salin Nomor Surat ke Clipboard"
                    >
                      {copiedNomor ? (
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
                  <p className="text-indigo-800 mt-1 leading-relaxed">
                    Setelah naskah resmi ditandatangani oleh pimpinan/pejabat berwenang (TTE BSrE atau tanda tangan basah), konseptor mengunggah dokumen PDF final ke Arsip Digital.
                  </p>
                </div>
              </div>
              {onOpenUnggahFinalModal && (isKonseptor || currentUser.role === 'ADMIN' || currentUser.role === 'ARSIPARIS') && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenUnggahFinalModal(naskah);
                  }}
                  className="px-4 py-2 bg-[#0f4c82] hover:bg-[#0a335a] text-white font-bold rounded-xl shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Archive className="w-4 h-4" />
                  <span>Unggah Dokumen Final (Sah)</span>
                </button>
              )}
            </div>
          )}

          {/* Alert: Selesai - Arsip Tersimpan */}
          {isFinalArchived && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Archive className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-emerald-900 text-sm">
                    Selesai – Dokumen Telah Diarsipkan Secara Permanen
                  </div>
                  <p className="text-emerald-800 mt-0.5 leading-relaxed">
                    Berkas naskah dinas resmi #{naskah.dokumenFinal?.nomorSuratResmi || naskah.nomorSuratDipesan} telah tersimpan di repositori Arsip Digital BPS Kalbar dan terkunci.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {naskah.dokumenFinal?.dataUrl && (
                  <a
                    href={naskah.dokumenFinal.dataUrl}
                    download={naskah.dokumenFinal.namaFile}
                    className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh PDF Sah</span>
                  </a>
                )}
                {currentUser.role === 'ADMIN' && (
                  <button
                    onClick={() => setShowBukaKembaliModal(true)}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Unlock className="w-3.5 h-3.5 text-slate-600" />
                    <span>Buka Kunci (Admin)</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: TIMELINE DETAIL */}
          {activeTab === 'timeline' && (
            <div className="space-y-6 relative before:absolute before:left-5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 pl-2">
              {/* TAHAP 1: PENGAJUAN */}
              <div className="relative pl-10">
                <div className="absolute left-2.5 -translate-x-1/2 top-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow">
                  1
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>Tahap 1: Pengajuan Draf Naskah Dinas</span>
                    </h4>
                    <span className="text-[11px] text-slate-400 font-mono-tabular">
                      {formatTanggalIndo(naskah.tanggalPengajuan)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Diajukan oleh <strong>{naskah.namaKonseptor}</strong> ({naskah.unitKerja}) dengan nomor registrasi{' '}
                    <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[#0f4c82]">
                      {naskah.nomorRegistrasi}
                    </code>
                    .
                  </p>
                  {naskah.ringkasanIsi && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 text-xs">
                      <span className="font-bold block text-[10px] text-slate-400 uppercase">
                        Ringkasan Isi / Urgensi:
                      </span>
                      <p className="mt-0.5 leading-relaxed">{naskah.ringkasanIsi}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs flex items-center gap-2 text-slate-700">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span className="font-medium">{naskah.drafFile.name}</span>
                      <span className="text-slate-400 text-[10px]">
                        ({Math.round((naskah.drafFile.size || 0) / 1024)} KB)
                      </span>
                    </div>
                    {naskah.drafFile.dataUrl && (
                      <a
                        href={naskah.drafFile.dataUrl}
                        download={naskah.drafFile.name}
                        className="px-3 py-1.5 bg-[#0f4c82] hover:bg-[#0b3860] text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh Word</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* TAHAP 2: PEMERIKSAAN VERIFIKATOR */}
              <div className="relative pl-10">
                <div className={`absolute left-2.5 -translate-x-1/2 top-0 w-6 h-6 rounded-full text-white flex items-center justify-center text-xs font-bold shadow ${
                  isRejected ? 'bg-red-500' : isNeedRevision ? 'bg-rose-500' : stepIndex >= 2 ? 'bg-emerald-600' : 'bg-amber-500'
                }`}>
                  2
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      <span>Tahap 2: Telaah & Pengendalian Mutu Kearsipan</span>
                    </h4>
                    <span className="text-[11px] font-semibold text-blue-700">
                      Verifikator: {naskah.verifikatorDitunjuk}
                    </span>
                  </div>

                  {/* Checklist 5 Parameter */}
                  <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                    <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Parameter Pengujian Tata Naskah BPS:
                    </div>
                    {[
                      { key: 'kesesuaianFormatTemplate', label: '1. Kesesuaian format dan template resmi BPS' },
                      { key: 'kelengkapanStruktur', label: '2. Kelengkapan struktur naskah (Kop, Nomor, Tanggal, Tujuan, Isi, Penutup)' },
                      { key: 'ketepatanBahasaTataLetak', label: '3. Ketepatan tata bahasa Indonesia baku (EYD) dan tata letak perataan' },
                      { key: 'kesesuaianNomorKlasifikasi', label: `4. Kesesuaian kode klasifikasi kearsipan (${naskah.klasifikasiArsip})` },
                      { key: 'kepatuhanPedomanHukum', label: '5. Kepatuhan terhadap pedoman dan dasar hukum tata persuratan BPS' },
                    ].map((item) => (
                      <label key={item.key} className="flex items-center gap-2 cursor-pointer select-none">
                        <button
                          type="button"
                          disabled={!isEligibleToVerify(naskah) || (naskah.status !== 'MENUNGGU_VERIFIKASI' && naskah.status !== 'DRAF_DIAJUKAN')}
                          onClick={() => toggleCheck(item.key as keyof ChecklistVerifikasi)}
                          className="text-[#0f4c82]"
                        >
                          {checklist[item.key as keyof ChecklistVerifikasi] ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                        <span className={checklist[item.key as keyof ChecklistVerifikasi] ? 'text-slate-800 font-medium' : 'text-slate-500'}>
                          {item.label}
                        </span>
                      </label>
                    ))}
                  </div>

                  {/* Riwayat Catatan Verifikasi */}
                  {naskah.riwayatVerifikasi && naskah.riwayatVerifikasi.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <span className="font-bold text-[11px] text-slate-500 uppercase tracking-wider block">
                        Catatan Hasil Telaah Verifikator:
                      </span>
                      {naskah.riwayatVerifikasi.map((catatan) => (
                        <div
                          key={catatan.id}
                          className={`p-3 rounded-xl border text-xs ${
                            catatan.statusKeputusan === 'DISETUJUI'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                              : catatan.statusKeputusan === 'DITOLAK'
                              ? 'bg-red-50 border-red-200 text-red-950'
                              : 'bg-rose-50 border-rose-200 text-rose-950'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span>
                              {catatan.namaVerifikator} ({catatan.roleVerifikator.replace('VERIFIKATOR_', 'Verif. ')})
                            </span>
                            <span className="font-mono-tabular text-[10px] text-slate-500">
                              {catatan.waktu}
                            </span>
                          </div>
                          <p className="mt-1 leading-relaxed">{catatan.catatan}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Formulir Keputusan Verifikator jika status MENUNGGU_VERIFIKASI */}
                  {isEligibleToVerify(naskah) &&
                    (naskah.status === 'MENUNGGU_VERIFIKASI' || naskah.status === 'DRAF_DIAJUKAN') &&
                    onVerifikasiKeputusan && (
                      <div className="p-3.5 bg-blue-50/80 rounded-xl border border-blue-200 space-y-3">
                        <div className="font-bold text-xs text-[#0f4c82] flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <MessageSquare className="w-4 h-4" />
                            <span>Keputusan Verifikasi ({currentUser.nama})</span>
                          </span>
                          <span className="text-[10px] text-slate-500 font-normal">
                            Pilih Setujui, Kembalikan, atau Tolak
                          </span>
                        </div>
                        <textarea
                          rows={2}
                          value={catatanVerifikator}
                          onChange={(e) => setCatatanVerifikator(e.target.value)}
                          placeholder="Tuliskan catatan telaah (wajib diisi jika mengembalikan untuk perbaikan)..."
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:border-[#0f4c82] focus:ring-1 focus:ring-[#0f4c82]"
                        />
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setShowTolakModal(true)}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Tolak Pengajuan</span>
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleKirimKeputusan('PERLU_PERBAIKAN')}
                              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Kembalikan untuk Perbaikan</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleKirimKeputusan('DISETUJUI')}
                              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1 shadow-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Setujui Draf (Lanjut ke Nomor Surat)</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              </div>

              {/* TAHAP 3: PERMINTAAN & PENERBITAN NOMOR SURAT BARU */}
              <div className="relative pl-10">
                <div className={`absolute left-2.5 -translate-x-1/2 top-0 w-6 h-6 rounded-full text-white flex items-center justify-center text-xs font-bold shadow ${
                  stepIndex >= 3 ? 'bg-indigo-600' : 'bg-slate-300'
                }`}>
                  3
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Hash className={`w-4 h-4 ${stepIndex >= 3 ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <span>Tahap 3: Permintaan Nomor Surat Baru Terintegrasi</span>
                    </h4>
                    {naskah.nomorSuratDipesan && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                          {naskah.nomorSuratDipesan}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyNomorSurat(naskah.nomorSuratDipesan!)}
                          className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Salin Nomor Surat ke Clipboard"
                        >
                          {copiedNomor ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700">Tersalin</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Salin Nomor Surat</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {naskah.nomorSuratDipesan ? (
                      <>
                        Nomor surat resmi <strong className="font-mono text-[#0f4c82]">{naskah.nomorSuratDipesan}</strong> telah diterbitkan dan terhubung otomatis dengan buku register surat keluar (Sheet Keluar26).
                      </>
                    ) : isWaitingNumber ? (
                      <>
                        Draf telah disetujui. Verifikator yang bertugas ({naskah.verifikatorDitunjuk}) atau Administrator TU berwenang menerbitkan nomor surat resmi tanpa perlu menginput ulang data.
                      </>
                    ) : (
                      <>
                        Setelah draf disetujui oleh verifikator, nomor surat dapat diterbitkan oleh verifikator yang bertugas atau Administrator.
                      </>
                    )}
                  </p>

                  {/* Tombol Terbitkan Nomor untuk Verifikator yang ditunjuk dan Admin */}
                  {isWaitingNumber && canIssueNumber && (
                    <div className="pt-2">
                      <button
                        onClick={() => onTerbitkanNomorSurat(naskah)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                      >
                        <Hash className="w-4 h-4" />
                        <span>Terbitkan Nomor Surat dari Register</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* TAHAP 4: FINALISASI & PENYIMPANAN ARSIP DIGITAL */}
              <div className="relative pl-10">
                <div className={`absolute left-2.5 -translate-x-1/2 top-0 w-6 h-6 rounded-full text-white flex items-center justify-center text-xs font-bold shadow ${
                  isFinalArchived ? 'bg-emerald-600' : 'bg-slate-300'
                }`}>
                  4
                </div>
                <div className={`p-4 rounded-2xl border shadow-xs space-y-2 ${
                  isFinalArchived
                    ? 'bg-gradient-to-br from-teal-50/80 to-emerald-50/60 border-teal-200 text-slate-800'
                    : 'bg-white border-slate-200 text-slate-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm flex items-center gap-1.5">
                      <Archive className={`w-4 h-4 ${isFinalArchived ? 'text-teal-700' : 'text-slate-400'}`} />
                      <span className={isFinalArchived ? 'text-teal-950 font-bold' : 'text-slate-900'}>
                        Tahap 4: Penyimpanan Arsip Digital (Dokumen Sah)
                      </span>
                    </h4>
                    {isFinalArchived && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-300">
                        Sah & Terkunci
                      </span>
                    )}
                  </div>

                  {isFinalArchived && naskah.dokumenFinal ? (
                    <div className="space-y-3 pt-1 text-xs">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-3 rounded-xl border border-teal-200/80">
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase font-bold">
                            Nomor Surat Sah
                          </span>
                          <span className="font-bold font-mono text-emerald-800">
                            {naskah.dokumenFinal.nomorSuratResmi}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase font-bold">
                            Tanggal Penetapan
                          </span>
                          <span className="font-semibold text-slate-800 font-mono-tabular">
                            {naskah.dokumenFinal.tanggalPenetapan}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase font-bold">
                            Penandatangan
                          </span>
                          <span className="font-semibold text-slate-800">
                            {naskah.dokumenFinal.pejabatPenandatangan}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase font-bold">
                            Metode TTD
                          </span>
                          <span className="font-bold text-teal-800">
                            {naskah.dokumenFinal.tipeTandaTangan}
                          </span>
                        </div>
                      </div>

                      {/* Google Drive Organization Folder */}
                      <div className="p-2.5 bg-white/90 rounded-xl border border-teal-200 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-slate-500 font-medium">Google Drive:</span>
                          <span className="font-mono text-teal-900 font-semibold truncate">
                            {naskah.dokumenFinal.googleDrive?.hierarchyPath || `1_Xsmp2dafHvoyhXuhS1x1_GkbWDy7i0S / ${new Date().getFullYear()} / ${naskah.unitKerja} / Arsip`}
                          </span>
                        </div>
                        <a
                          href={naskah.dokumenFinal.googleDrive?.webViewLink || 'https://drive.google.com/drive/folders/1_Xsmp2dafHvoyhXuhS1x1_GkbWDy7i0S'}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 bg-teal-100 hover:bg-teal-200 text-teal-900 rounded font-semibold text-[11px] shrink-0"
                        >
                          Buka Drive
                        </a>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-teal-100 text-[11px]">
                        <span className="text-slate-600">
                          Berkas: <strong>{naskah.dokumenFinal.namaFile}</strong> (
                          {Math.round((naskah.dokumenFinal.ukuranFile || 0) / 1024)} KB)
                        </span>
                        {naskah.dokumenFinal.dataUrl && (
                          <a
                            href={naskah.dokumenFinal.dataUrl}
                            download={naskah.dokumenFinal.namaFile}
                            className="px-3 py-1.5 bg-[#0f4c82] hover:bg-[#1a6bb5] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Unduh Dokumen PDF Sah</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Setelah dokumen selesai ditandatangani oleh pejabat berwenang, konseptor atau petugas mengunggah dokumen PDF final ke Arsip Digital.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: AUDIT TRAIL / RIWAYAT AKTIVITAS */}
          {activeTab === 'audit' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Catatan Log Lengkap (Audit Trail) Siklus Hidup Pengajuan</span>
                <span className="font-mono-tabular">{naskah.riwayatAktivitas?.length || 1} entri terekam</span>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3 w-40">Waktu & Tanggal</th>
                        <th className="p-3 w-44">Pelaksana / Aktor</th>
                        <th className="p-3 w-44">Status Alur</th>
                        <th className="p-3">Keterangan Aktivitas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {(naskah.riwayatAktivitas || []).map((act, idx) => (
                        <tr key={act.id || idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3 font-mono-tabular text-slate-600 whitespace-nowrap">
                            {formatTanggalWaktuIndo(act.waktu)}
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{act.namaPengguna}</div>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {String(act.rolePengguna).replace('VERIFIKATOR_', 'Verifikator ')}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                {act.statusSebelumnya}
                              </span>
                              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                {act.statusTerbaru}
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            <p className="text-slate-800 leading-relaxed">{act.keterangan}</p>
                            {act.catatan && (
                              <p className="mt-1 text-[11px] text-slate-500 italic bg-slate-50 p-1.5 rounded border border-slate-200">
                                "{act.catatan}"
                              </p>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Pembaruan Terakhir: <strong className="font-mono-tabular">{formatTanggalWaktuIndo(naskah.waktuUpdate || naskah.tanggalPengajuan)}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Modal Dialog: Tolak Pengajuan */}
      {showTolakModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl p-5 shadow-2xl border border-red-200 space-y-4">
            <div className="flex items-center gap-2.5 text-red-700">
              <XCircle className="w-6 h-6" />
              <h4 className="font-bold text-base">Tolak Pengajuan Draf Naskah</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pengajuan akan dihentikan dan konseptor tidak dapat melanjutkan alur proses ini. Silakan tuliskan alasan penolakan secara jelas.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alasan Penolakan (Wajib Diisi):
              </label>
              <textarea
                rows={3}
                value={alasanPenolakanText}
                onChange={(e) => setAlasanPenolakanText(e.target.value)}
                placeholder="Contoh: Format naskah tidak sesuai kewenangan unit kerja atau substansi telah diakomodasi surat lain..."
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowTolakModal(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmTolak}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer shadow-xs"
              >
                Konfirmasi Penolakan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dialog: Buka Kembali Pengajuan (Khusus Admin) */}
      {showBukaKembaliModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl p-5 shadow-2xl border border-amber-200 space-y-4">
            <div className="flex items-center gap-2.5 text-amber-700">
              <Unlock className="w-6 h-6" />
              <h4 className="font-bold text-base">Buka Kembali Pengajuan (Admin)</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pengajuan ini akan dibuka kembali statusnya agar dapat diperbaiki atau diproses ulang. Tindakan ini akan dicatat ke dalam audit trail.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alasan Pembukaan Kembali (Wajib Diisi):
              </label>
              <textarea
                rows={3}
                value={alasanBukaKembaliText}
                onChange={(e) => setAlasanBukaKembaliText(e.target.value)}
                placeholder="Tuliskan alasan koreksi atau pembukaan kembali pengajuan..."
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBukaKembaliModal(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmBukaKembali}
                className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold cursor-pointer shadow-xs"
              >
                Konfirmasi Buka Kembali
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
