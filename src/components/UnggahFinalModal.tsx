import React, { useState } from 'react';
import { Archive, Upload, X, FileText, ShieldCheck, AlertCircle, Eye } from 'lucide-react';
import { DokumenFinal, NaskahDinas, TipeTandaTangan } from '../types';
import { DirectFileInput, extractBulanFolder, extractTahun } from '../utils/googleDriveSync';
import { FilePreviewModal } from './FilePreviewModal';

interface UnggahFinalModalProps {
  naskah: NaskahDinas;
  onClose: () => void;
  onSubmitFinal: (naskahId: string, dokumenFinal: DokumenFinal) => void;
  onToast: (msg: string) => void;
}

export const UnggahFinalModal: React.FC<UnggahFinalModalProps> = ({
  naskah,
  onClose,
  onSubmitFinal,
  onToast,
}) => {
  const [nomorSuratResmi, setNomorSuratResmi] = useState(
    naskah.nomorSuratDipesan || `B-368/6100/${naskah.klasifikasiArsip}/2026`
  );
  const [tanggalPenetapan, setTanggalPenetapan] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [tipeTandaTangan, setTipeTandaTangan] = useState<TipeTandaTangan>('TTE');
  const [pejabatPenandatangan, setPejabatPenandatangan] = useState(
    'Kepala BPS Provinsi Kalimantan Barat'
  );
  const [tingkatKeamanan, setTingkatKeamanan] = useState<'Biasa' | 'Terbatas' | 'Rahasia' | 'Sangat Rahasia'>('Biasa');
  const [lokasiPenyimpanan, setLokasiPenyimpanan] = useState(
    'Server Cloud BPS / Lemari Berkas TU Kalbar 2026'
  );

  const [uploadedPdf, setUploadedPdf] = useState<{
    name: string;
    size: number;
    type: string;
    dataUrl?: string;
  } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<DirectFileInput | null>(null);

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      const msg = 'Naskah dinas final wajib berupa file PDF (hasil scan bertanda tangan atau dokumen TTE).';
      setFormError(msg);
      onToast(`⚠ ${msg}`);
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      const msg = 'Ukuran file PDF maksimal 25 MB.';
      setFormError(msg);
      onToast(`⚠ ${msg}`);
      return;
    }

    setFormError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedPdf({
        name: file.name,
        size: file.size,
        type: file.type || 'application/pdf',
        dataUrl: event.target?.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedPdf) {
      const msg = 'Silakan pilih dan unggah file PDF naskah dinas final yang telah ditandatangani.';
      setFormError(msg);
      onToast(`⚠ ${msg}`);
      return;
    }
    if (!nomorSuratResmi.trim()) {
      const msg = 'Nomor surat dinas resmi wajib diisi.';
      setFormError(msg);
      onToast(`⚠ ${msg}`);
      return;
    }
    setFormError(null);

    const now = new Date();
    const waktuUnggah = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;

    // format tanggal penetapan ke dd/MM/yyyy
    const parts = tanggalPenetapan.split('-');
    const tglPenetapanFormatted = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : tanggalPenetapan;

    const finalDoc: DokumenFinal = {
      nomorSuratResmi: nomorSuratResmi.trim(),
      tanggalPenetapan: tglPenetapanFormatted,
      tipeTandaTangan,
      pejabatPenandatangan: pejabatPenandatangan.trim(),
      namaFile: uploadedPdf.name,
      ukuranFile: uploadedPdf.size,
      dataUrl: uploadedPdf.dataUrl,
      waktuUnggah,
      klasifikasiArsip: naskah.klasifikasiArsip,
      kodeUnitArsip: '6100',
      tingkatKeamanan,
      lokasiPenyimpanan: lokasiPenyimpanan.trim(),
    };

    onSubmitFinal(naskah.id, finalDoc);
    onToast(`✔ Naskah dinas resmi ${nomorSuratResmi} telah sah dan masuk ke Arsip Digital!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto text-slate-900">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Unggah Naskah Dinas Final (Sah)</h3>
              <p className="text-xs text-slate-500">
                Penyimpanan softcopy resmi bertanda tangan ke Arsip Digital BPS Kalbar
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <div className="font-bold text-emerald-950 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Pengesahan Arsip Digital</span>
            </div>
            <p className="text-emerald-800 text-[11px] mt-0.5 leading-relaxed">
              Pastikan dokumen naskah dinas telah ditandatangani secara sah (melalui sertifikat elektronik TTE BSrE atau tanda tangan basah pimpinan yang telah dipindai/scan).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            
            {/* Nomor Surat Dinas Resmi */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor Surat Dinas Resmi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={nomorSuratResmi}
                onChange={(e) => setNomorSuratResmi(e.target.value)}
                placeholder="Contoh: B-368/61000/PR.100/2026"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:border-[#1a6bb5] outline-none"
              />
            </div>

            {/* Tanggal Penetapan / TTD */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Penetapan Surat <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={tanggalPenetapan}
                onChange={(e) => setTanggalPenetapan(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:border-[#1a6bb5] outline-none"
              />
            </div>

            {/* Tipe Tanda Tangan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Metode Tanda Tangan <span className="text-red-500">*</span>
              </label>
              <select
                value={tipeTandaTangan}
                onChange={(e) => setTipeTandaTangan(e.target.value as TipeTandaTangan)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:border-[#1a6bb5] outline-none"
              >
                <option value="TTE">TTE (Tanda Tangan Elektronik BSrE)</option>
                <option value="KONVENSIONAL">Konvensional (Tanda Tangan Basah / Scan)</option>
              </select>
            </div>

            {/* Pejabat Penandatangan */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pejabat Penandatangan
              </label>
              <input
                type="text"
                value={pejabatPenandatangan}
                onChange={(e) => setPejabatPenandatangan(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:border-[#1a6bb5] outline-none"
              />
            </div>

            {/* Tingkat Keamanan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tingkat Keamanan Dokumen
              </label>
              <select
                value={tingkatKeamanan}
                onChange={(e) => setTingkatKeamanan(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:border-[#1a6bb5] outline-none"
              >
                <option value="Biasa">Biasa / Terbuka</option>
                <option value="Terbatas">Terbatas</option>
                <option value="Rahasia">Rahasia</option>
                <option value="Sangat Rahasia">Sangat Rahasia</option>
              </select>
            </div>

            {/* Lokasi Penyimpanan Fisik/Digital */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lokasi Penyimpanan Berkas
              </label>
              <input
                type="text"
                value={lokasiPenyimpanan}
                onChange={(e) => setLokasiPenyimpanan(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:border-[#1a6bb5] outline-none"
              />
            </div>

          </div>

          {/* Lokasi Target Google Drive */}
          <div className="p-3 bg-teal-50/80 border border-teal-200 rounded-xl text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-teal-900">
              <Archive className="w-4 h-4 text-teal-700" />
              <span>Hierarki Google Drive Otomatis:</span>
            </div>
            <div className="p-2 bg-white rounded-lg border border-teal-100 font-mono text-[11px] text-teal-900 font-semibold break-words">
              Folder Induk &gt; {extractTahun(tanggalPenetapan)} &gt; {naskah.unitKerja} &gt; {extractBulanFolder(tanggalPenetapan)} &gt; Arsip
            </div>
            <p className="text-[10px] text-slate-500">
              Dokumen draf akan dipindahkan ke folder <strong>Arsip</strong> resmi, terhubung ke nomor surat dan Sheet ArsipDigital tanpa duplikasi.
            </p>
          </div>

          {/* Unggah Softcopy PDF Final */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Berkas PDF Naskah Dinas Final Bertanda Tangan <span className="text-red-500">*</span>
            </label>
            {!uploadedPdf ? (
              <label className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-xl p-5 text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-emerald-50/30">
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handlePdfUpload}
                  className="hidden"
                />
                <Upload className="w-6 h-6 text-emerald-700" />
                <span className="font-semibold text-xs text-emerald-800 underline">Pilih Berkas PDF Naskah Final</span>
                <span className="text-[11px] text-slate-400">Format PDF (Maks. 25 MB)</span>
              </label>
            ) : (
              <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/70 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="font-bold text-slate-800 truncate">{uploadedPdf.name}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPreviewFile(uploadedPdf)}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    title="Buka File PDF sebelum menyimpan"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Buka File</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadedPdf(null)}
                    className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                    title="Hapus file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#1a7a4a] hover:bg-[#15633c] text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Archive className="w-4 h-4" />
              <span>Simpan ke Arsip Digital</span>
            </button>
          </div>

        </form>

      </div>

      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onToast={onToast}
      />
    </div>
  );
};
