import React, { useState } from 'react';
import {
  BookOpen,
  FileText,
  Download,
  Scale,
  CheckCircle2,
  Copy,
  Search,
  ExternalLink,
  Layers,
  ShieldCheck,
  Info,
  Eye,
} from 'lucide-react';
import { DAFTAR_PEDOMAN_HUKUM, DAFTAR_TEMPLATE_NASKAH, STANDAR_TATA_NASKAH } from '../data/pedomanData';
import { DAFTAR_KLASIFIKASI_BPS } from '../data/bpsClassifications';
import {
  downloadWordTemplate,
  generateWordTemplateHtml,
  getWordTemplateFileName,
} from '../utils/templateDownloader';
import { DirectFileInput } from '../utils/googleDriveSync';
import { FilePreviewModal } from './FilePreviewModal';

interface PedomanReferensiViewProps {
  onToast: (msg: string) => void;
}

export const PedomanReferensiView: React.FC<PedomanReferensiViewProps> = ({ onToast }) => {
  const [activeSubTab, setActiveSubTab] = useState<'template' | 'hukum' | 'format' | 'klasifikasi'>('template');
  const [searchKlasifikasi, setSearchKlasifikasi] = useState('');
  const [copiedKode, setCopiedKode] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<DirectFileInput | null>(null);

  const filteredKlasifikasi = DAFTAR_KLASIFIKASI_BPS.filter(
    (k) =>
      k.kode.toLowerCase().includes(searchKlasifikasi.toLowerCase()) ||
      k.nama.toLowerCase().includes(searchKlasifikasi.toLowerCase()) ||
      k.kategori.toLowerCase().includes(searchKlasifikasi.toLowerCase())
  );

  const handleCopyKode = (kode: string) => {
    navigator.clipboard.writeText(kode);
    setCopiedKode(kode);
    onToast(`✔ Kode klasifikasi ${kode} telah disalin!`);
    setTimeout(() => setCopiedKode(null), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-start gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-blue-100 text-[#0f4c82] flex items-center justify-center shrink-0 mt-0.5">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 font-heading">
            Pusat Referensi & Pedoman Tata Naskah Dinas BPS
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
            Kumpulan template resmi Microsoft Word, landasan peraturan perundang-undangan kearsipan, standar format & margin, serta kamus kode klasifikasi persuratan resmi BPS Provinsi Kalimantan Barat.
          </p>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSubTab('template')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'template'
              ? 'bg-[#0f4c82] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Template Naskah Word ({DAFTAR_TEMPLATE_NASKAH.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('format')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'format'
              ? 'bg-[#0f4c82] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Standar Format & Anatomi</span>
        </button>

        <button
          onClick={() => setActiveSubTab('hukum')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'hukum'
              ? 'bg-[#0f4c82] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Dasar Hukum & Peraturan ({DAFTAR_PEDOMAN_HUKUM.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('klasifikasi')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'klasifikasi'
              ? 'bg-[#0f4c82] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Kamus Klasifikasi Arsip</span>
        </button>
      </div>

      {/* SUB TAB 1: TEMPLATE WORD */}
      {activeSubTab === 'template' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-[#0f4c82] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>Klik <strong>"Unduh Template Word"</strong> pada jenis naskah yang diinginkan untuk mendapatkan berkas siap pakai berkop resmi BPS Kalbar.</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DAFTAR_TEMPLATE_NASKAH.map((tpl) => (
              <div
                key={tpl.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-[#0f4c82]">
                      {tpl.jenis}
                    </span>
                    <span className="text-[11px] font-mono-tabular text-slate-400">
                      {tpl.format} · {tpl.ukuran}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mt-2 font-heading">
                    {tpl.judul}
                  </h3>

                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {tpl.deskripsi}
                  </p>

                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Struktur Pokok Naskah:
                    </span>
                    <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">
                      {tpl.struktur.slice(0, 4).map((s, idx) => (
                        <li key={idx} className="truncate">{s}</li>
                      ))}
                      {tpl.struktur.length > 4 && (
                        <li className="text-slate-400 font-medium">+{tpl.struktur.length - 4} elemen lainnya</li>
                      )}
                    </ul>
                  </div>

                  <div className="mt-2.5 text-[11px] text-slate-400 italic">
                    {tpl.keterangan}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewFile({
                        name: getWordTemplateFileName(tpl),
                        type: 'application/msword',
                        htmlContent: generateWordTemplateHtml(tpl),
                      })
                    }
                    className="py-2.5 px-3.5 rounded-xl font-bold text-xs border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-[#0f4c82] flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
                    title={`Buka File ${tpl.judul}`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Buka File</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      downloadWordTemplate(tpl);
                      onToast(`✔ Mengunduh ${tpl.judul} (.doc)`);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-[#0f4c82] hover:bg-[#1a6bb5] text-white flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Template (.doc)</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB TAB 2: STANDAR FORMAT & ANATOMI */}
      {activeSubTab === 'format' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 text-xs text-slate-700">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-heading mb-1">
              Standar Format Pengetikan & Anatomi Naskah Dinas BPS
            </h3>
            <p className="text-xs text-slate-500">
              Sesuai Peraturan Kepala Badan Pusat Statistik Nomor 11 Tahun 2021 tentang Tata Naskah Dinas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold uppercase text-[#0f4c82] tracking-wider">01. Kertas & Ukuran</span>
              <div className="text-sm font-bold text-slate-900">{STANDAR_TATA_NASKAH.kertas}</div>
              <p className="text-[11px] text-slate-500">
                Wajib menggunakan kertas putih HVS A4 untuk seluruh naskah dinas biasa, nota dinas, dan surat keputusan.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold uppercase text-[#0f4c82] tracking-wider">02. Margin / Batas Tepi</span>
              <div className="font-mono-tabular font-bold text-slate-900 space-y-0.5">
                <div>Kiri: {STANDAR_TATA_NASKAH.margin.kiri}</div>
                <div>Kanan: {STANDAR_TATA_NASKAH.margin.kanan}</div>
                <div>Atas: {STANDAR_TATA_NASKAH.margin.atas} · Bawah: {STANDAR_TATA_NASKAH.margin.bawah}</div>
              </div>
              <p className="text-[11px] text-slate-500">
                Margin kiri 3 cm untuk keperluan penyerbukan atau penjilidan arsip.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold uppercase text-[#0f4c82] tracking-wider">03. Tipografi & Huruf</span>
              <div className="text-sm font-bold text-slate-900">{STANDAR_TATA_NASKAH.font.pilihan}</div>
              <div className="text-[11px] text-slate-500">Spasi pengetikan: {STANDAR_TATA_NASKAH.font.spasi}</div>
              <p className="text-[11px] text-slate-500">
                Judul naskah menggunakan huruf kapital bold center.
              </p>
            </div>
          </div>

          {/* Anatomi Struktur Surat */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-sm text-slate-900">Anatomi Tiga Bagian Pokok Naskah Dinas</h4>
            
            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40">
                <span className="font-bold text-xs text-[#0f4c82]">A. Bagian Kepala (Heading)</span>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  Memuat Kop Naskah Dinas (Lambang Negara untuk SK / Logo BPS untuk surat dinas), Nama Jabatan atau Unit Satker, Alamat lengkap satker, Nomor Surat, Sifat (B/K/R), Lampiran, Perihal, serta Alamat Tujuan yang terhormat.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40">
                <span className="font-bold text-xs text-emerald-800">B. Bagian Batang Tubuh (Body)</span>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  Terdiri atas kalimat pembuka yang menerangkan dasar/latar belakang surat, isi surat yang memuat materi pokok secara sistematis dengan butir-butir bernomor, dan kalimat penutup kedinasan.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40">
                <span className="font-bold text-xs text-amber-800">C. Bagian Kaki (Closing)</span>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  Memuat Nama Jabatan penandatangan, tanda tangan basah atau QR-Code Tanda Tangan Elektronik (TTE) tersertifikasi Balai Sertifikasi Elektronik (BSrE), Nama Lengkap Pejabat, NIP, cap dinas (jika manual), serta tembusan jika surat perlu diketahui pihak lain.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* SUB TAB 3: DASAR HUKUM & PERATURAN */}
      {activeSubTab === 'hukum' && (
        <div className="space-y-3">
          {DAFTAR_PEDOMAN_HUKUM.map((hukum) => (
            <div
              key={hukum.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1 max-w-3xl">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                    {hukum.kategori}
                  </span>
                  <span className="text-xs font-mono-tabular font-bold text-slate-800">
                    {hukum.nomor} Tahun {hukum.tahun}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 font-heading">
                  {hukum.judul}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {hukum.deskripsi}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <a
                  href={`https://kalbar.bps.go.id`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-xs"
                >
                  <span>Portal JDIH</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUB TAB 4: KAMUS KLASIFIKASI ARSIP */}
      {activeSubTab === 'klasifikasi' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-heading">
                Kamus Kode Klasifikasi Arsip dan Persuratan BPS
              </h3>
              <p className="text-xs text-slate-500">
                Pilih atau salin kode klasifikasi untuk mengisi nomor surat dinas keluar.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari kode atau kategori..."
                value={searchKlasifikasi}
                onChange={(e) => setSearchKlasifikasi(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-[#1a6bb5] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
            {filteredKlasifikasi.map((item) => {
              const isCopied = copiedKode === item.kode;
              return (
                <div
                  key={item.kode}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-[#1a6bb5] transition-all flex items-start justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono-tabular font-black text-sm text-[#0f4c82]">
                        {item.kode}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-200 text-slate-700">
                        {item.kategori}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-800 mt-1">
                      {item.nama}
                    </p>
                  </div>

                  <button
                    onClick={() => handleCopyKode(item.kode)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-[#0f4c82] hover:bg-blue-50 transition-colors cursor-pointer shrink-0"
                    title="Salin kode"
                  >
                    {isCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onToast={onToast}
      />

    </div>
  );
};
