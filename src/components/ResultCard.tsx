import React, { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Check,
  Printer,
  RotateCcw,
  Sparkles,
  FileText,
  Download,
  Share2,
  Eye,
} from 'lucide-react';
import { SuratKeluar } from '../types';
import { formatTanggalIndo, formatTanggalWaktuIndo } from '../utils/storage';
import {
  DirectFileInput,
  resolveDirectFileAccess,
  triggerDirectDownload,
} from '../utils/googleDriveSync';
import { FilePreviewModal } from './FilePreviewModal';

interface ResultCardProps {
  surat: SuratKeluar;
  wasMondayPlaceholderCreated?: boolean;
  mondayPlaceholderNomor?: number;
  onReset: () => void;
  onOpenPrint: () => void;
  onToast: (msg: string) => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  surat,
  wasMondayPlaceholderCreated,
  mondayPlaceholderNomor,
  onReset,
  onOpenPrint,
  onToast,
}) => {
  const [copiedNomor, setCopiedNomor] = useState(false);
  const [copiedFull, setCopiedFull] = useState(false);
  const [previewFile, setPreviewFile] = useState<DirectFileInput | null>(null);

  const kodeMap: { [key: string]: string } = {
    B: 'Biasa (Surat Dinas/Rutin)',
    K: 'Khusus (Keputusan/Tugas)',
    R: 'Rahasia (Terbatas/Rahasia)',
  };

  const copyNomor = () => {
    navigator.clipboard.writeText(surat.nomorSuratLengkap);
    setCopiedNomor(true);
    onToast(`✔ Nomor surat ${surat.nomorSuratLengkap} disalin!`);
    setTimeout(() => setCopiedNomor(false), 2500);
  };

  const copyFullText = () => {
    const formatted = `*PERMINTAAN NOMOR SURAT KELUAR BPS KALBAR*
────────────────────────
*Nomor Surat:* ${surat.nomorSuratLengkap}
*Nomor Urut:* #${surat.nomorUrut}
*Kode Surat:* ${surat.kodeSurat} (${kodeMap[surat.kodeSurat] || surat.kodeSurat})
*Klasifikasi:* ${surat.kodeKlasifikasi}
*Perihal:* ${surat.perihal}
*Tujuan:* ${surat.tujuan}
*Tanggal Surat:* ${surat.tanggalSurat}
*Pemohon:* ${surat.namaPegawai}
*Tim Kerja:* ${surat.timKerja}
*Waktu Input:* ${surat.waktuInput}
*Status:* ${surat.status}
────────────────────────
_Arsip Internal TU Kepala BPS Provinsi Kalimantan Barat_`;

    navigator.clipboard.writeText(formatted);
    setCopiedFull(true);
    onToast('✔ Format teks lengkap telah disalin ke clipboard!');
    setTimeout(() => setCopiedFull(false), 2500);
  };

  const detailRows = [
    { label: 'Nomor Urut', value: `#${surat.nomorUrut}`, isMono: true },
    { label: 'Nomor Surat Lengkap', value: surat.nomorSuratLengkap, isMono: true, isHighlight: true },
    { label: 'Kode Surat', value: `${surat.kodeSurat} — ${kodeMap[surat.kodeSurat] || surat.kodeSurat}` },
    { label: 'Kode Klasifikasi', value: surat.kodeKlasifikasi, isMono: true },
    { label: 'Perihal Surat', value: surat.perihal },
    { label: 'Tujuan Surat', value: surat.tujuan },
    { label: 'Tanggal Surat', value: formatTanggalIndo(surat.tanggalSurat) },
    { label: 'Bulan Arsip', value: surat.bulan },
    { label: 'Nama Pegawai Pemohon', value: surat.namaPegawai },
    { label: 'Tim Kerja', value: surat.timKerja },
    { label: 'Waktu Input Data', value: formatTanggalWaktuIndo(surat.waktuInput), isMono: true },
    { label: 'Status Dokumen', value: surat.status, isBadge: true },
  ];

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Banner Utama Hasil */}
      <div className="rounded-2xl overflow-hidden shadow-xl border border-blue-200">
        
        {/* Top Banner Gradient */}
        <div className="relative bg-gradient-to-r from-[#0f4c82] via-[#1a6bb5] to-[#1a7a4a] text-white p-6 sm:p-8 text-center overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#e06c1a] via-[#f08030] to-[#f5a623]" />
          
          <div className="w-14 h-14 rounded-full bg-white/20 text-white flex items-center justify-center mx-auto mb-3 border border-white/30 shadow-inner">
            <CheckCircle2 className="w-8 h-8 text-emerald-300" />
          </div>

          <div className="text-xs font-semibold tracking-widest uppercase text-blue-200 mb-1">
            Nomor Surat Berhasil Diterbitkan
          </div>

          <div className="text-xl sm:text-3xl font-extrabold font-heading text-white tracking-tight break-all mt-2 select-all drop-shadow-xs">
            {surat.nomorSuratLengkap}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={copyNomor}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-[#0f4c82] font-bold text-xs hover:bg-blue-50 transition-all shadow-sm cursor-pointer"
            >
              {copiedNomor ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copiedNomor ? 'Nomor Disalin!' : 'Salin Nomor Surat'}</span>
            </button>

            <button
              onClick={copyFullText}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-medium text-xs transition-all border border-white/30 cursor-pointer"
            >
              {copiedFull ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedFull ? 'Format Teks Disalin!' : 'Salin Format Teks'}</span>
            </button>
          </div>
        </div>

        {/* Monday Rule Alert Notice if Triggered */}
        {wasMondayPlaceholderCreated && (
          <div className="bg-amber-50 border-y border-amber-200 px-6 py-3.5 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <span className="font-bold">🌟 Aturan "Senin Berkah" Terpicu:</span> Anda adalah pengaju pertama di hari ini. Sistem telah otomatis menyisakan slot placeholder kosong dengan nomor <span className="font-mono font-bold text-amber-800">#{mondayPlaceholderNomor}</span> sebagai cadangan arsip TU, dan nomor resmi yang Anda gunakan adalah <span className="font-mono font-bold text-amber-800">#{surat.nomorUrut}</span>.
            </div>
          </div>
        )}

        {/* Table Breakdown */}
        <div className="bg-white divide-y divide-slate-100">
          {detailRows.map((row, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row text-xs sm:text-sm">
              <div className="sm:w-1/3 p-3.5 sm:px-6 bg-slate-50/80 font-semibold text-slate-600 sm:border-r border-slate-100 flex items-center">
                {row.label}
              </div>
              <div className={`p-3.5 sm:px-6 flex-1 text-slate-900 font-medium break-words ${
                row.isHighlight ? 'text-[#0f4c82] font-bold text-sm sm:text-base' : ''
              } ${row.isMono ? 'font-mono-tabular' : ''}`}>
                {row.isBadge ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    {row.value}
                  </span>
                ) : (
                  row.value || '—'
                )}
              </div>
            </div>
          ))}

          {/* Attached Document Row if Available */}
          {surat.fileAttachment && (
            <div className="flex flex-col sm:flex-row text-xs sm:text-sm bg-blue-50/30">
              <div className="sm:w-1/3 p-3.5 sm:px-6 bg-blue-50/70 font-semibold text-slate-700 sm:border-r border-slate-100 flex items-center">
                Dokumen Lampiran
              </div>
              <div className="p-3.5 sm:px-6 flex-1 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-[#1a6bb5] shrink-0" />
                  <span className="font-medium text-slate-800 truncate">{surat.fileAttachment.name}</span>
                  <span className="text-[11px] text-slate-500 font-mono-tabular shrink-0">
                    ({(surat.fileAttachment.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                {resolveDirectFileAccess(surat.fileAttachment).hasAnyAccess && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewFile(surat.fileAttachment!)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-blue-200 bg-white hover:bg-blue-50 text-xs font-bold text-[#0f4c82] cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> Buka File
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const res = triggerDirectDownload(surat.fileAttachment!);
                        if (res.ok) onToast(`✔ Mengunduh ${surat.fileAttachment!.name}`);
                        else onToast(`⚠ ${res.reason || 'Berkas belum tersedia.'}`);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#1a6bb5] hover:underline cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Unduh
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={onOpenPrint}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak / Unduh Bukti</span>
          </button>

          <button
            onClick={onReset}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#1a7a4a] hover:bg-[#15633c] text-white font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Selesai, Buat Permintaan Baru</span>
          </button>
        </div>

      </div>

      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onToast={onToast}
      />
    </div>
  );
};
