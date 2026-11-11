import React from 'react';
import { Printer, X, Download, ShieldCheck } from 'lucide-react';
import { SuratKeluar, AppConfig } from '../types';
import { formatTanggalIndo, formatTanggalWaktuIndo } from '../utils/storage';

interface PrintReceiptModalProps {
  surat: SuratKeluar;
  config: AppConfig;
  onClose: () => void;
}

export const PrintReceiptModal: React.FC<PrintReceiptModalProps> = ({
  surat,
  config,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[95vh] overflow-y-auto">
        
        {/* Top Control Bar (Hidden on print) */}
        <div className="no-print flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-[#0f4c82]" />
            <h3 className="text-base font-bold text-slate-900">Cetak Bukti Pengambilan Nomor Surat</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-[#0f4c82] hover:bg-[#1a6bb5] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Slip Area */}
        <div className="p-6 sm:p-8 border border-slate-300 rounded-xl bg-white text-slate-900 space-y-6">
          
          {/* Kop Surat BPS Kalbar */}
          <div className="flex items-center justify-between pb-4 border-b-2 border-slate-900 gap-4">
            <div className="w-16 h-16 shrink-0 flex items-center justify-center">
              <img
                src="/BPS.png"
                alt="Logo BPS"
                className="w-full h-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src.includes('BPS.png')) {
                    target.src = '/Logo BPS.png';
                  } else if (target.src.includes('Logo BPS.png')) {
                    target.src = 'https://kalbar.bps.go.id/_next/image?url=%2Fassets%2Flogo-bps.png&w=3840&q=75';
                  }
                }}
              />
            </div>
            <div className="text-center flex-1">
              <h2 className="text-xs font-semibold tracking-wider uppercase text-slate-700">
                BADAN PUSAT STATISTIK
              </h2>
              <h1 className="text-sm sm:text-base font-black font-heading tracking-tight text-slate-900 leading-tight">
                PROVINSI KALIMANTAN BARAT
              </h1>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Jl. Sutan Syahrir No. 24/42, Pontianak 78116 · Telp: (0561) 732049
              </p>
              <p className="text-[10px] text-slate-500 font-mono-tabular">
                Email: bps6100@bps.go.id · Website: kalbar.bps.go.id · Unit Kerja: {config.kodeUnit}
              </p>
            </div>
            <div className="w-16 h-16 shrink-0 hidden sm:block" />
          </div>

          {/* Judul Tanda Terima */}
          <div className="text-center space-y-1">
            <h3 className="text-sm font-bold tracking-wider uppercase underline underline-offset-4 font-heading text-slate-900">
              TANDA BUKTI PENERBITAN NOMOR SURAT KELUAR
            </h3>
            <p className="text-[11px] text-slate-500 font-mono-tabular">
              ID Registrasi: {surat.id} · Waktu Input: {formatTanggalWaktuIndo(surat.waktuInput)}
            </p>
          </div>

          {/* Kotak Nomor Resmi */}
          <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl text-center space-y-1">
            <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
              Nomor Surat Dinas Resmi
            </div>
            <div className="text-xl sm:text-2xl font-black font-heading text-[#0f4c82] tracking-tight break-all font-mono-tabular">
              {surat.nomorSuratLengkap}
            </div>
          </div>

          {/* Rincian Permintaan */}
          <table className="w-full text-xs border border-slate-300 divide-y divide-slate-200">
            <tbody>
              <tr className="divide-x divide-slate-200">
                <td className="w-1/3 p-2.5 bg-slate-50 font-semibold text-slate-700">Nomor Urut Register</td>
                <td className="p-2.5 font-bold font-mono-tabular">#{surat.nomorUrut}</td>
              </tr>
              <tr className="divide-x divide-slate-200">
                <td className="p-2.5 bg-slate-50 font-semibold text-slate-700">Sifat / Kode Surat</td>
                <td className="p-2.5 font-medium">{surat.kodeSurat} ({surat.kodeSurat === 'B' ? 'Biasa' : surat.kodeSurat === 'K' ? 'Khusus' : 'Rahasia'})</td>
              </tr>
              <tr className="divide-x divide-slate-200">
                <td className="p-2.5 bg-slate-50 font-semibold text-slate-700">Kode Klasifikasi</td>
                <td className="p-2.5 font-bold font-mono-tabular">{surat.kodeKlasifikasi}</td>
              </tr>
              <tr className="divide-x divide-slate-200">
                <td className="p-2.5 bg-slate-50 font-semibold text-slate-700">Tanggal Surat</td>
                <td className="p-2.5 font-medium">{formatTanggalIndo(surat.tanggalSurat)}</td>
              </tr>
              <tr className="divide-x divide-slate-200">
                <td className="p-2.5 bg-slate-50 font-semibold text-slate-700">Perihal</td>
                <td className="p-2.5 font-medium">{surat.perihal}</td>
              </tr>
              <tr className="divide-x divide-slate-200">
                <td className="p-2.5 bg-slate-50 font-semibold text-slate-700">Tujuan Surat</td>
                <td className="p-2.5 font-medium">{surat.tujuan}</td>
              </tr>
              <tr className="divide-x divide-slate-200">
                <td className="p-2.5 bg-slate-50 font-semibold text-slate-700">Pegawai Pemohon</td>
                <td className="p-2.5 font-bold">{surat.namaPegawai}</td>
              </tr>
              <tr className="divide-x divide-slate-200">
                <td className="p-2.5 bg-slate-50 font-semibold text-slate-700">Tim Kerja / Fungsi</td>
                <td className="p-2.5 font-medium">{surat.timKerja}</td>
              </tr>
              {surat.fileAttachment && (
                <tr className="divide-x divide-slate-200">
                  <td className="p-2.5 bg-slate-50 font-semibold text-slate-700">Dokumen Lampiran</td>
                  <td className="p-2.5 font-medium">{surat.fileAttachment.name} ({(surat.fileAttachment.size / 1024).toFixed(1)} KB)</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Tanda Tangan & Catatan */}
          <div className="pt-6 grid grid-cols-2 gap-8 text-xs text-center">
            <div>
              <p className="text-slate-500">Pemohon Nomor Surat,</p>
              <div className="h-16 flex items-end justify-center">
                <p className="font-bold underline text-slate-900">{surat.namaPegawai}</p>
              </div>
              <p className="text-[10px] text-slate-400">Tim Kerja: {surat.timKerja}</p>
            </div>

            <div>
              <p className="text-slate-500">Pontianak, {formatTanggalIndo(surat.tanggalSurat)}</p>
              <p className="text-slate-500 font-medium">Petugas Administrasi TU,</p>
              <div className="h-12 flex items-end justify-center">
                <div className="inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <ShieldCheck className="w-3 h-3" /> Terverifikasi Sistem
                </div>
              </div>
              <p className="font-bold underline text-slate-900">Tata Usaha Kepala BPS Prov. Kalbar</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 text-[10px] text-slate-400 text-center">
            Lembar ini merupakan bukti elektronik yang sah dari Sistem Nomor Surat Keluar (Sheet: {config.sheetName} · Unit 6100).
          </div>

        </div>

        {/* Modal Bottom Action (Hidden on print) */}
        <div className="no-print mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 font-semibold text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
