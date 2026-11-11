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
  ChevronRight,
  ArrowRight,
  Archive,
  RefreshCw,
  X,
  FileCheck2,
  Calendar,
  Send,
  Building,
  Upload,
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
    keputusan: 'DISETUJUI' | 'PERLU_PERBAIKAN',
    catatan: string,
    checklist: ChecklistVerifikasi
  ) => void;
  onOpenRevisiModal?: (naskah: NaskahDinas) => void;
  onOpenUnggahFinalModal?: (naskah: NaskahDinas) => void;
  onToast?: (msg: string) => void;
}

export const NaskahTimelineModal: React.FC<NaskahTimelineModalProps> = ({
  naskah,
  currentUser,
  onClose,
  onVerifikasiKeputusan,
  onOpenRevisiModal,
  onOpenUnggahFinalModal,
  onToast,
}) => {
  const [catatanVerifikator, setCatatanVerifikator] = useState('');
  const [checklist, setChecklist] = useState<ChecklistVerifikasi>({
    kesesuaianFormatTemplate: true,
    kelengkapanStruktur: true,
    ketepatanBahasaTataLetak: true,
    kesesuaianNomorKlasifikasi: true,
    kepatuhanPedomanHukum: true,
  });

  const isEligibleToVerify = (item: NaskahDinas): boolean => {
    if (currentUser.role === 'ADMIN' || currentUser.role === 'ARSIPARIS') return true;
    return item.roleVerifikatorDitunjuk === currentUser.role;
  };

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
          ? 'Naskah dinas telah diverifikasi dan memenuhi seluruh ketentuan tata kearsipan BPS.'
          : 'Perlu revisi sesuai catatan kearsipan.'),
      checklist
    );
  };

  const renderStatusBadge = (status: StatusNaskah) => {
    switch (status) {
      case 'DRAF_DIAJUKAN':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-[#0f4c82] border border-blue-200 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-blue-600 animate-spin" />
            <span>Tahap 1: Menunggu Verifikasi</span>
          </span>
        );
      case 'SEDANG_DIPERIKSA':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Tahap 2: Sedang Diperiksa</span>
          </span>
        );
      case 'PERLU_PERBAIKAN':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-200 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Tahap 3: Perlu Revisi Konseptor</span>
          </span>
        );
      case 'TERVERIFIKASI':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tahap 4: Terverifikasi (Siap TTD)</span>
          </span>
        );
      case 'FINAL_DIARSIPKAN':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-900 text-emerald-400 border border-slate-700 flex items-center gap-1">
            <Archive className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tahap 5: Sah di Arsip Digital</span>
          </span>
        );
      default:
        return null;
    }
  };

  const isKonseptor =
    currentUser.role === 'KONSEPTOR' ||
    naskah.namaKonseptor.toLowerCase() === currentUser.nama.toLowerCase();

  const isNeedRevision = naskah.status === 'PERLU_PERBAIKAN';
  const isVerified = naskah.status === 'TERVERIFIKASI' || naskah.status === 'FINAL_DIARSIPKAN';
  const isFinalArchived = naskah.status === 'FINAL_DIARSIPKAN';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-[#0a335a] to-[#0f4c82] text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono font-bold text-white tabular-nums">
                {naskah.nomorRegistrasi}
              </span>
              <span className="text-white/60">·</span>
              <span className="text-blue-200">{naskah.jenisNaskah}</span>
              {naskah.nomorSuratDipesan && (
                <>
                  <span className="text-white/60">·</span>
                  <span className="font-mono text-amber-300">
                    Nomor Surat: {naskah.nomorSuratDipesan}
                  </span>
                </>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold font-heading text-white mt-1 line-clamp-1">
              Timeline Progres Pengajuan: {naskah.perihal}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
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
              <span className="text-[10px] text-slate-400 block mt-0.5">{naskah.unitKerja}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                Tanggal Pengajuan
              </span>
              <span className="font-semibold text-slate-800 font-mono-tabular">
                {formatTanggalIndo(naskah.tanggalPengajuan)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Klasifikasi: {naskah.klasifikasiArsip}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                Verifikator Ditunjuk
              </span>
              <span className="font-semibold text-blue-800">{naskah.verifikatorDitunjuk}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{naskah.roleVerifikatorDitunjuk.replace('VERIFIKATOR_', 'Tim ')}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                Status Saat Ini
              </span>
              <div className="mt-1">{renderStatusBadge(naskah.status)}</div>
            </div>
          </div>

          {/* Quick Action Alert for Konseptor when Revision is Needed */}
          {isNeedRevision && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-rose-900 text-sm">
                    Draf Memerlukan Perbaikan / Revisi
                  </div>
                  <p className="text-rose-700 mt-0.5 leading-relaxed">
                    Verifikator telah memberikan catatan pemeriksaan. Silakan perbaiki draf Word Anda dan unggah berkas revisi untuk verifikasi ulang.
                  </p>
                </div>
              </div>
              {onOpenRevisiModal && (currentUser.role === 'KONSEPTOR' || currentUser.role === 'ADMIN') && (
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

          {/* Quick Action for Uploading Final Signed Document */}
          {naskah.status === 'TERVERIFIKASI' && onOpenUnggahFinalModal && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-emerald-900 text-sm">
                    Draf Terverifikasi · Siap Penandatanganan & Pengarsipan
                  </div>
                  <p className="text-emerald-800 mt-0.5 leading-relaxed">
                    Format dan struktur naskah telah disetujui. Setelah ditandatangani oleh pejabat berwenang (TTE BSrE atau tanda tangan basah), unggah berkas PDF resmi ke Arsip Digital.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenUnggahFinalModal(naskah);
                }}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Archive className="w-4 h-4" />
                <span>Unggah PDF Final Sah</span>
              </button>
            </div>
          )}

          {/* TIMELINE SECTION */}
          <div className="space-y-6 relative before:absolute before:left-5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 pl-2">
            {/* ── TAHAP 1: PENGAJUAN DRAF NASKAH DINAS ── */}
            <div className="relative pl-10">
              <div className="absolute left-2.5 -translate-x-1/2 top-0 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow">
                1
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>Tahap 1: Pengajuan Draf Naskah Dinas Dikirim</span>
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono-tabular">
                    {formatTanggalIndo(naskah.tanggalPengajuan)}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Draf diajukan oleh <strong>{naskah.namaKonseptor}</strong> dari unit kerja{' '}
                  <strong>{naskah.unitKerja}</strong> dengan nomor registrasi{' '}
                  <code className="font-mono-tabular bg-slate-100 px-1.5 py-0.5 rounded text-[#0f4c82]">
                    {naskah.nomorRegistrasi}
                  </code>
                  .
                </p>

                {naskah.ringkasanIsi && (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 text-xs">
                    <span className="font-bold block text-[10px] text-slate-400 uppercase">
                      Ringkasan / Urgensi Naskah:
                    </span>
                    <p className="mt-0.5 leading-relaxed">{naskah.ringkasanIsi}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs flex items-center gap-2 text-slate-700">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span className="font-medium">{naskah.drafFile.name}</span>
                    <span className="text-slate-400 text-[10px] font-mono-tabular">
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

            {/* ── TAHAP 2: PENUGASAN VERIFIKATOR ── */}
            <div className="relative pl-10">
              <div className="absolute left-2.5 -translate-x-1/2 top-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold shadow">
                2
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <span>Tahap 2: Penugasan Otomatis Verifikator Tim</span>
                  </h4>
                  <span className="text-[11px] font-semibold text-blue-700">
                    {naskah.roleVerifikatorDitunjuk}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Berdasarkan unit kerja <strong>{naskah.unitKerja}</strong>, sistem menugaskan{' '}
                  <strong>{naskah.verifikatorDitunjuk}</strong> serta Arsiparis BPS Provinsi Kalbar
                  untuk melakukan kendali mutu persuratan.
                </p>
              </div>
            </div>

            {/* ── TAHAP 3: PEMERIKSAAN & TELAAH KEARSIPAN ── */}
            <div className="relative pl-10">
              <div
                className={`absolute left-2.5 -translate-x-1/2 top-0 w-6 h-6 rounded-full text-white flex items-center justify-center text-xs font-bold shadow ${
                  isVerified
                    ? 'bg-emerald-500'
                    : isNeedRevision
                    ? 'bg-rose-500'
                    : 'bg-amber-500'
                }`}
              >
                3
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>Tahap 3: Telaah Kearsipan 5 Aspek Mutu</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">Standar Perka BPS</span>
                </div>

                {/* 5 Parameters Checklist */}
                <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <button
                      type="button"
                      disabled={
                        !isEligibleToVerify(naskah) || naskah.status !== 'DRAF_DIAJUKAN'
                      }
                      onClick={() => toggleCheck('kesesuaianFormatTemplate')}
                      className="text-[#0f4c82]"
                    >
                      {checklist.kesesuaianFormatTemplate ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                    <span
                      className={
                        checklist.kesesuaianFormatTemplate
                          ? 'text-slate-800 font-medium'
                          : 'text-slate-500'
                      }
                    >
                      1. Kesesuaian format dan template naskah dinas resmi BPS
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <button
                      type="button"
                      disabled={
                        !isEligibleToVerify(naskah) || naskah.status !== 'DRAF_DIAJUKAN'
                      }
                      onClick={() => toggleCheck('kelengkapanStruktur')}
                      className="text-[#0f4c82]"
                    >
                      {checklist.kelengkapanStruktur ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                    <span
                      className={
                        checklist.kelengkapanStruktur
                          ? 'text-slate-800 font-medium'
                          : 'text-slate-500'
                      }
                    >
                      2. Kelengkapan struktur naskah (Kop, Nomor, Tanggal, Tujuan, Isi, Penutup, Tembusan)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <button
                      type="button"
                      disabled={
                        !isEligibleToVerify(naskah) || naskah.status !== 'DRAF_DIAJUKAN'
                      }
                      onClick={() => toggleCheck('ketepatanBahasaTataLetak')}
                      className="text-[#0f4c82]"
                    >
                      {checklist.ketepatanBahasaTataLetak ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                    <span
                      className={
                        checklist.ketepatanBahasaTataLetak
                          ? 'text-slate-800 font-medium'
                          : 'text-slate-500'
                      }
                    >
                      3. Ketepatan penggunaan bahasa Indonesia baku (EYD), tanda baca, dan tata letak perataan
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <button
                      type="button"
                      disabled={
                        !isEligibleToVerify(naskah) || naskah.status !== 'DRAF_DIAJUKAN'
                      }
                      onClick={() => toggleCheck('kesesuaianNomorKlasifikasi')}
                      className="text-[#0f4c82]"
                    >
                      {checklist.kesesuaianNomorKlasifikasi ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                    <span
                      className={
                        checklist.kesesuaianNomorKlasifikasi
                          ? 'text-slate-800 font-medium'
                          : 'text-slate-500'
                      }
                    >
                      4. Kesesuaian nomor registrasi, kode klasifikasi kearsipan ({naskah.klasifikasiArsip}), serta jenis naskah
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <button
                      type="button"
                      disabled={
                        !isEligibleToVerify(naskah) || naskah.status !== 'DRAF_DIAJUKAN'
                      }
                      onClick={() => toggleCheck('kepatuhanPedomanHukum')}
                      className="text-[#0f4c82]"
                    >
                      {checklist.kepatuhanPedomanHukum ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                    <span
                      className={
                        checklist.kepatuhanPedomanHukum
                          ? 'text-slate-800 font-medium'
                          : 'text-slate-500'
                      }
                    >
                      5. Kesesuaian dengan dasar hukum dan pedoman tata naskah dinas di lingkungan BPS
                    </span>
                  </label>
                </div>

                {/* Riwayat Catatan Verifikasi Sebelumnya */}
                {naskah.riwayatVerifikasi && naskah.riwayatVerifikasi.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="font-bold text-[11px] text-slate-500 uppercase tracking-wider block">
                      Catatan Hasil Pemeriksaan Verifikator:
                    </span>
                    {naskah.riwayatVerifikasi.map((catatan) => (
                      <div
                        key={catatan.id}
                        className={`p-3 rounded-xl border text-xs ${
                          catatan.statusKeputusan === 'DISETUJUI'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : 'bg-rose-50 border-rose-200 text-rose-900'
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

                {/* Form Keputusan jika draf menunggu verifikasi dan user berwenang */}
                {isEligibleToVerify(naskah) && naskah.status === 'DRAF_DIAJUKAN' && onVerifikasiKeputusan && (
                  <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 space-y-3">
                    <div className="font-bold text-xs text-[#0f4c82] flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4" />
                      <span>Formulir Keputusan Verifikasi ({currentUser.nama})</span>
                    </div>
                    <textarea
                      rows={2}
                      value={catatanVerifikator}
                      onChange={(e) => setCatatanVerifikator(e.target.value)}
                      placeholder="Tuliskan catatan perbaikan untuk konseptor atau catatan persetujuan..."
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:border-[#0f4c82] focus:ring-1 focus:ring-[#0f4c82]"
                    />
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleKirimKeputusan('PERLU_PERBAIKAN')}
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-colors"
                      >
                        Kembalikan untuk Perbaikan
                      </button>
                      <button
                        onClick={() => handleKirimKeputusan('DISETUJUI')}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-colors"
                      >
                        Setujui Draf (Terverifikasi)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── TAHAP 4: PROSES REVISI & PENGIRIMAN ULANG (JIKA ADA RIWAYAT) ── */}
            {naskah.riwayatVersi && naskah.riwayatVersi.length > 0 && (
              <div className="relative pl-10">
                <div className="absolute left-2.5 -translate-x-1/2 top-0 w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold shadow">
                  4
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-purple-600" />
                      <span>Tahap 4: Riwayat Pengiriman Revisi Berkas</span>
                    </h4>
                    <span className="text-[11px] font-bold text-purple-700">
                      {naskah.riwayatVersi.length} Versi Perbaikan
                    </span>
                  </div>
                  <div className="space-y-2 pt-1">
                    {naskah.riwayatVersi.map((v) => (
                      <div
                        key={v.versi}
                        className="p-3 bg-purple-50/60 rounded-xl border border-purple-200/80 text-xs text-purple-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <span>Versi {v.versi}: {v.namaFile}</span>
                            <span className="font-mono-tabular text-[10px] text-slate-400">({v.waktuUnggah})</span>
                          </div>
                          {v.catatanPerbaikan && (
                            <p className="text-slate-600 text-[11px] mt-0.5">
                              Catatan Konseptor: {v.catatanPerbaikan}
                            </p>
                          )}
                        </div>
                        {v.dataUrl && (
                          <a
                            href={v.dataUrl}
                            download={v.namaFile}
                            className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 self-start sm:self-auto"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Unduh v{v.versi}</span>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── TAHAP 5: PERSETUJUAN / PENGESAHAN TTE ATAU BASAH ── */}
            <div className="relative pl-10">
              <div
                className={`absolute left-2.5 -translate-x-1/2 top-0 w-6 h-6 rounded-full text-white flex items-center justify-center text-xs font-bold shadow ${
                  isVerified ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              >
                {naskah.riwayatVersi && naskah.riwayatVersi.length > 0 ? 5 : 4}
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <CheckCircle2
                      className={`w-4 h-4 ${isVerified ? 'text-emerald-600' : 'text-slate-400'}`}
                    />
                    <span>
                      {isVerified
                        ? 'Tahap Persetujuan: Draf Terverifikasi Resmi'
                        : 'Tahap Persetujuan: Menunggu Hasil Verifikasi'}
                    </span>
                  </h4>
                  {isVerified && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Disetujui
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isVerified
                    ? 'Format, kelengkapan unsur, dan klasifikasi draf naskah dinas telah dinyatakan sesuai ketentuan kearsipan BPS. Draf siap dicetak untuk tanda tangan basah atau diproses menggunakan TTE sertifikasi BSrE.'
                    : 'Persetujuan akan diberikan setelah verifikator memeriksa dan menyetujui seluruh parameter tata naskah dinas.'}
                </p>
              </div>
            </div>

            {/* ── TAHAP 6: STATUS AKHIR & ARSIP DIGITAL ── */}
            <div className="relative pl-10">
              <div
                className={`absolute left-2.5 -translate-x-1/2 top-0 w-6 h-6 rounded-full text-white flex items-center justify-center text-xs font-bold shadow ${
                  isFinalArchived ? 'bg-slate-900' : 'bg-slate-300'
                }`}
              >
                {naskah.riwayatVersi && naskah.riwayatVersi.length > 0 ? 6 : 5}
              </div>
              <div
                className={`p-4 rounded-2xl border shadow-xs space-y-2 ${
                  isFinalArchived
                    ? 'bg-slate-900 text-white border-slate-700'
                    : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm flex items-center gap-1.5">
                    <Archive
                      className={`w-4 h-4 ${
                        isFinalArchived ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                    />
                    <span className={isFinalArchived ? 'text-white' : 'text-slate-900'}>
                      Status Akhir: Penyimpanan Arsip Digital Sah
                    </span>
                  </h4>
                  {isFinalArchived && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Sah & Tersimpan
                    </span>
                  )}
                </div>

                {isFinalArchived && naskah.dokumenFinal ? (
                  <div className="space-y-3 pt-1 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">
                          Nomor Surat Sah
                        </span>
                        <span className="font-bold font-mono text-emerald-400">
                          {naskah.dokumenFinal.nomorSuratResmi}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">
                          Tanggal Penetapan
                        </span>
                        <span className="font-semibold text-slate-200 font-mono-tabular">
                          {naskah.dokumenFinal.tanggalPenetapan}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">
                          Penandatangan
                        </span>
                        <span className="font-semibold text-slate-200">
                          {naskah.dokumenFinal.pejabatPenandatangan}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">
                          Metode TTD
                        </span>
                        <span className="font-bold text-amber-300">
                          {naskah.dokumenFinal.tipeTandaTangan}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800 text-[11px]">
                      <span className="text-slate-400">
                        Berkas: <strong>{naskah.dokumenFinal.namaFile}</strong> (
                        {Math.round((naskah.dokumenFinal.ukuranFile || 0) / 1024)} KB) · Lokasi:{' '}
                        {naskah.dokumenFinal.lokasiPenyimpanan || 'Depo Arsip Utama'}
                      </span>
                      {naskah.dokumenFinal.dataUrl && (
                        <a
                          href={naskah.dokumenFinal.dataUrl}
                          download={naskah.dokumenFinal.namaFile}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Unduh Dokumen PDF Sah</span>
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Setelah naskah dinas resmi ditandatangani, softcopy PDF naskah sah akan diunggah ke dalam sistem dan tersimpan permanen di modul Arsip Digital BPS Kalbar.
                  </p>
                )}
              </div>
            </div>
          </div>
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
    </div>
  );
};
