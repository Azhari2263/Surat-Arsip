import React, { useState } from 'react';
import { AlertTriangle, Upload, X, FileText, CheckCircle2 } from 'lucide-react';
import { NaskahDinas } from '../types';

interface RevisiModalProps {
  naskah: NaskahDinas;
  onClose: () => void;
  onSubmitRevisi: (
    naskahId: string,
    file: { name: string; size: number; type: string; dataUrl?: string },
    diunggahOleh: string,
    catatanPerbaikan: string
  ) => void;
  onToast: (msg: string) => void;
}

export const RevisiModal: React.FC<RevisiModalProps> = ({
  naskah,
  onClose,
  onSubmitRevisi,
  onToast,
}) => {
  const [catatanPerbaikan, setCatatanPerbaikan] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: number;
    type: string;
    dataUrl?: string;
  } | null>(null);

  const lastCatatan = naskah.riwayatVerifikasi.slice(-1)[0];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedFile) {
      alert('Unggah berkas draf Word yang telah diperbaiki.');
      return;
    }
    if (!catatanPerbaikan.trim()) {
      alert('Tuliskan ringkasan bagian apa saja yang telah diperbaiki.');
      return;
    }

    onSubmitRevisi(
      naskah.id,
      uploadedFile,
      naskah.namaKonseptor,
      catatanPerbaikan.trim()
    );
    onToast(`✔ Draf perbaikan (Versi ${naskah.riwayatVersi.length + 1}.0) berhasil diajukan kembali ke verifikator!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto text-slate-900">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Unggah Draf Hasil Perbaikan (Revisi)</h3>
              <p className="text-xs text-slate-500 font-mono-tabular">
                {naskah.nomorRegistrasi} · Versi Berikutnya: v{naskah.riwayatVersi.length + 1}.0
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          
          {/* Kotak Catatan Verifikator yang Harus Diperbaiki */}
          {lastCatatan && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200">
              <div className="font-bold text-rose-900 flex items-center justify-between">
                <span>Catatan Verifikasi dari {lastCatatan.namaVerifikator}:</span>
                <span className="text-[10px] text-rose-600 font-mono-tabular">{lastCatatan.waktu}</span>
              </div>
              <p className="text-rose-800 mt-1 leading-relaxed whitespace-pre-line">
                {lastCatatan.catatan}
              </p>
            </div>
          )}

          {/* Upload Berkas Hasil Perbaikan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Berkas Draf Word Hasil Revisi (.docx) <span className="text-red-500">*</span>
            </label>
            {!uploadedFile ? (
              <label className="border-2 border-dashed border-slate-300 hover:border-[#1a6bb5] rounded-xl p-5 text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-slate-50/50">
                <input
                  type="file"
                  accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Upload className="w-6 h-6 text-[#0f4c82]" />
                <span className="font-semibold text-xs text-[#1a6bb5] underline">Pilih Berkas Draf Word Revisi</span>
                <span className="text-[11px] text-slate-400">Maks. 20 MB</span>
              </label>
            ) : (
              <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/70 flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 text-[#0f4c82] shrink-0" />
                  <span className="font-bold text-slate-800 truncate">{uploadedFile.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setUploadedFile(null)}
                  className="text-slate-400 hover:text-red-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Catatan Penjelasan Perbaikan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Penjelasan Tindak Lanjut Perbaikan <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={catatanPerbaikan}
              onChange={(e) => setCatatanPerbaikan(e.target.value)}
              placeholder="Contoh: Telah menyesuaikan margin kiri menjadi 3 cm, melengkapi tanggal rujukan surat, serta melampirkan checklist..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:border-[#1a6bb5] outline-none"
            />
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
              className="px-5 py-2 rounded-xl bg-[#0f4c82] hover:bg-[#1a6bb5] text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Ajukan Draf Revisi</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
