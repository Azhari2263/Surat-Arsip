import React, { useState, useEffect } from 'react';
import {
  FileText,
  Lock,
  Upload,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Info,
  X,
  FileCheck,
  ChevronDown,
  Search,
  Building,
} from 'lucide-react';
import { KodeSuratType, SubmitSuratPayload, SuratKeluar } from '../types';
import { BULAN_LIST, DAFTAR_KLASIFIKASI_BPS, TIM_KERJA_OPTIONS } from '../data/bpsClassifications';
import { formatTanggalIndo } from '../utils/storage';

interface LetterFormProps {
  onSubmit: (payload: SubmitSuratPayload, simulateMonday: boolean) => Promise<void>;
  emptyList: SuratKeluar[];
  preselectedKosong?: SuratKeluar | null;
  onClearPreselectedKosong?: () => void;
  nextNomorBaru: number;
}

export const LetterForm: React.FC<LetterFormProps> = ({
  onSubmit,
  emptyList,
  preselectedKosong,
  onClearPreselectedKosong,
  nextNomorBaru,
}) => {
  // Mode: 'baru' | 'kosong'
  const [mode, setMode] = useState<'baru' | 'kosong'>('baru');
  const [selectedBulan, setSelectedBulan] = useState<string>('Semua');
  const [selectedKosongItem, setSelectedKosongItem] = useState<SuratKeluar | null>(null);

  // Form Fields
  const [kodeSurat, setKodeSurat] = useState<KodeSuratType>('B');
  const [kodeKlasifikasi, setKodeKlasifikasi] = useState<string>('');
  const [perihal, setPerihal] = useState<string>('');
  const [tujuan, setTujuan] = useState<string>('');
  const [namaPegawai, setNamaPegawai] = useState<string>('');
  const [timKerja, setTimKerja] = useState<string>('');
  const [timKerjaLainnya, setTimKerjaLainnya] = useState<string>('');
  const [tanggalSurat, setTanggalSurat] = useState<string>('');

  // Classification helper dropdown
  const [showKlasifSuggestions, setShowKlasifSuggestions] = useState<boolean>(false);
  const [searchKlasifQuery, setSearchKlasifQuery] = useState<string>('');

  // Uploaded Document
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: number;
    type: string;
    dataUrl?: string;
  } | null>(null);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Today's date setup
  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setTanggalSurat(`${yyyy}-${mm}-${dd}`);
  }, []);

  // Sync preselected empty number if passed from other views
  useEffect(() => {
    if (preselectedKosong) {
      setMode('kosong');
      setSelectedKosongItem(preselectedKosong);
    }
  }, [preselectedKosong]);

  // Filtered empty numbers based on month chip
  const filteredEmptyList = emptyList.filter(item => {
    if (selectedBulan === 'Semua') return true;
    return (item.bulan || '').toLowerCase() === selectedBulan.toLowerCase();
  });

  // Filtered classification codes
  const filteredKlasifikasi = DAFTAR_KLASIFIKASI_BPS.filter(
    k =>
      k.kode.toLowerCase().includes(searchKlasifQuery.toLowerCase()) ||
      k.nama.toLowerCase().includes(searchKlasifQuery.toLowerCase()) ||
      k.kategori.toLowerCase().includes(searchKlasifQuery.toLowerCase())
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('Ukuran file maksimal 15MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedFile({
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: event.target?.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!kodeKlasifikasi.trim()) {
      newErrors.kodeKlasifikasi = 'Kode klasifikasi wajib diisi';
    } else if (kodeKlasifikasi.trim().length > 6) {
      newErrors.kodeKlasifikasi = 'Maksimal 6 karakter';
    }

    if (!perihal.trim()) {
      newErrors.perihal = 'Perihal surat wajib diisi';
    }

    if (!tujuan.trim()) {
      newErrors.tujuan = 'Tujuan surat wajib diisi';
    }

    if (!namaPegawai.trim()) {
      newErrors.namaPegawai = 'Nama pegawai pemohon wajib diisi';
    }

    if (!timKerja) {
      newErrors.timKerja = 'Pilih tim kerja pemohon';
    } else if (timKerja === 'Lainnya' && !timKerjaLainnya.trim()) {
      newErrors.timKerjaLainnya = 'Nama tim kerja lainnya wajib diisi';
    }

    if (mode === 'kosong' && !selectedKosongItem) {
      newErrors.kosongItem = 'Silakan pilih salah satu nomor kosong dari daftar';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(
        {
          kodeSurat,
          kodeKlasifikasi: kodeKlasifikasi.trim().toUpperCase(),
          perihal: perihal.trim(),
          tujuan: tujuan.trim(),
          tanggalSurat,
          namaPegawai: namaPegawai.trim(),
          timKerja,
          timKerjaLainnya: timKerjaLainnya.trim(),
          isKosongMode: mode === 'kosong',
          nomorUrutKosong: selectedKosongItem ? selectedKosongItem.nomorUrut : null,
          fileAttachment: uploadedFile || undefined,
        },
        false
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSaturday = () => {
    if (!tanggalSurat) return false;
    const parts = tanggalSurat.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.getDay() === 6;
    }
    return false;
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-200/90 overflow-hidden">
      {/* Card Header */}
      <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#0f4c82] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              Form Permintaan Nomor Surat
            </h2>
            <p className="text-xs text-slate-500">
              Isi data surat dinas keluar secara lengkap dan tepat.
            </p>
          </div>
        </div>

        {mode === 'baru' && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200/70 text-xs font-semibold text-[#0f4c82]">
            <span>Perkiraan Nomor:</span>
            <span className="font-mono-tabular font-bold">#{nextNomorBaru}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-7">
        
        {/* ── SECTION 1: JENIS PERMINTAAN ── */}
        <div>
          <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span>01. Jenis Permintaan Nomor</span>
            <span className="h-px bg-slate-200 flex-1" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Mode Baru */}
            <button
              type="button"
              onClick={() => {
                setMode('baru');
                if (onClearPreselectedKosong) onClearPreselectedKosong();
              }}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                mode === 'baru'
                  ? 'border-[#1a6bb5] bg-gradient-to-br from-blue-50/80 to-indigo-50/40 shadow-xs ring-2 ring-blue-500/15'
                  : 'border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="text-2xl mb-2">🆕</span>
                {mode === 'baru' && (
                  <CheckCircle2 className="w-5 h-5 text-[#1a6bb5]" />
                )}
              </div>
              <div>
                <div className="font-bold text-sm text-slate-900">Nomor Baru</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Nomor urut baru otomatis sesuai antrian permohonan terkini.
                </div>
              </div>
            </button>

            {/* Mode Kosong */}
            <button
              type="button"
              onClick={() => setMode('kosong')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between relative ${
                mode === 'kosong'
                  ? 'border-emerald-600 bg-gradient-to-br from-emerald-50/80 to-teal-50/40 shadow-xs ring-2 ring-emerald-500/15'
                  : 'border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="text-2xl mb-2">🔍</span>
                {mode === 'kosong' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : emptyList.length > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    {emptyList.length} Tersedia
                  </span>
                ) : null}
              </div>
              <div>
                <div className="font-bold text-sm text-slate-900">Nomor Kosong</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Klaim nomor urut yang belum diisi (placeholder arsip / Senin Berkah).
                </div>
              </div>
            </button>
          </div>

          {/* Info Banner Mode Baru */}
          {mode === 'baru' && (
            <div className="mt-3.5 p-3.5 rounded-xl bg-blue-50/90 border border-blue-200 text-xs text-[#0f4c82] flex items-start gap-2.5">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#1a6bb5]" />
              <div className="flex-1 leading-relaxed">
                <span className="font-semibold">Ketentuan Nomor Baru:</span> Nomor surat baru otomatis diterbitkan sesuai urutan register. Tanggal surat dikunci secara otomatis ke tanggal hari ini sesuai tata kelola TU BPS Kalbar.
              </div>
            </div>
          )}

          {/* Panel Pemilihan Nomor Kosong */}
          {mode === 'kosong' && (
            <div className="mt-4 p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                  Filter berdasarkan Bulan
                </div>
                <div className="text-xs font-medium text-emerald-700 font-mono-tabular">
                  {filteredEmptyList.length} nomor ditemukan
                </div>
              </div>

              {/* Month Chips */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedBulan('Semua')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    selectedBulan === 'Semua'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-500'
                  }`}
                >
                  Semua Bulan
                </button>
                {BULAN_LIST.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setSelectedBulan(b)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                      selectedBulan === b
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-500'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>

              {/* Empty Numbers List */}
              <div className="max-h-56 overflow-y-auto space-y-2 pt-1 pr-1">
                {filteredEmptyList.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500 bg-white rounded-lg border border-dashed border-slate-300">
                    Tidak ada nomor kosong untuk filter bulan ini.
                  </div>
                ) : (
                  filteredEmptyList.map((item) => {
                    const isSelected = selectedKosongItem?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedKosongItem(item)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-emerald-100/90 border-emerald-600 ring-2 ring-emerald-500/20'
                            : 'bg-white border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#0f4c82] font-mono-tabular">
                              No. Urut: #{item.nomorUrut}
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-800">
                              {item.bulan || 'Tanpa Bulan'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 font-mono-tabular mt-0.5">
                            {item.nomorSuratLengkap}
                          </div>
                          <div className="text-[11px] text-emerald-800 font-medium mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Tanggal Register: {item.tanggalSurat ? formatTanggalIndo(item.tanggalSurat) : 'Belum diisi'}</span>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isSelected ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-md border border-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Terpilih
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md hover:bg-emerald-600 hover:text-white transition-colors">
                              Pilih
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {errors.kosongItem && (
                <p className="text-xs text-red-600 font-medium">{errors.kosongItem}</p>
              )}
            </div>
          )}
        </div>

        {/* ── SECTION 2: UPLOAD SURAT / DOKUMEN PENDUKUNG ── */}
        <div>
          <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span>02. Upload Draft / Disposisi Surat (Opsional)</span>
            <span className="h-px bg-slate-200 flex-1" />
          </div>

          {!uploadedFile ? (
            <label className="border-2 border-dashed border-slate-300 hover:border-[#1a6bb5] rounded-xl p-5 text-center flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50/50 hover:bg-blue-50/30 transition-all">
              <input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-10 h-10 rounded-full bg-blue-100 text-[#0f4c82] flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-[#1a6bb5] underline">Klik untuk mengunggah</span>
                <span className="text-xs text-slate-500"> atau seret file draft/lampiran ke sini</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Format: PDF, DOCX, JPG, PNG (Maksimal 15MB)
              </p>
            </label>
          ) : (
            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[#0f4c82] text-white flex items-center justify-center shrink-0">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">{uploadedFile.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono-tabular">
                    {(uploadedFile.size / 1024).toFixed(1)} KB · {uploadedFile.type || 'Dokumen'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={removeUploadedFile}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                title="Hapus file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* ── SECTION 3: DATA SURAT ── */}
        <div>
          <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span>03. Data & Metadata Surat</span>
            <span className="h-px bg-slate-200 flex-1" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* KODE SURAT */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Kode Surat <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { kode: 'B' as KodeSuratType, label: 'Biasa', desc: 'Surat Dinas / Rutin', color: 'blue' },
                  { kode: 'K' as KodeSuratType, label: 'Khusus', desc: 'Surat Keputusan / Tugas', color: 'emerald' },
                  { kode: 'R' as KodeSuratType, label: 'Rahasia', desc: 'Bersifat Rahasia', color: 'rose' },
                ].map((item) => {
                  const isActive = kodeSurat === item.kode;
                  return (
                    <button
                      key={item.kode}
                      type="button"
                      onClick={() => setKodeSurat(item.kode)}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        isActive
                          ? 'border-[#0f4c82] bg-gradient-to-br from-blue-50 to-indigo-50/60 shadow-xs ring-2 ring-blue-500/15'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className={`text-2xl font-black font-heading ${
                        isActive ? 'text-[#0f4c82]' : 'text-slate-400'
                      }`}>
                        {item.kode}
                      </div>
                      <div className="text-xs font-bold text-slate-800 mt-1">{item.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* KODE KLASIFIKASI */}
            <div className="relative">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Kode Klasifikasi <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowKlasifSuggestions(!showKlasifSuggestions)}
                    className="text-[11px] font-semibold text-[#1a6bb5] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Search className="w-3 h-3" />
                    Daftar Kode BPS
                  </button>
                  <span className={`text-[11px] font-mono-tabular ${
                    kodeKlasifikasi.length > 6 ? 'text-red-600 font-bold' : 'text-slate-400'
                  }`}>
                    {kodeKlasifikasi.length} / 6
                  </span>
                </div>
              </div>

              <input
                type="text"
                maxLength={6}
                value={kodeKlasifikasi}
                onChange={(e) => setKodeKlasifikasi(e.target.value.toUpperCase())}
                placeholder="Contoh: PR.100, KU.010, VS.100"
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                  errors.kodeKlasifikasi
                    ? 'border-red-500 bg-red-50/30 focus:ring-2 focus:ring-red-200'
                    : 'border-slate-300 bg-slate-50/40 focus:bg-white focus:border-[#1a6bb5] focus:ring-2 focus:ring-blue-100'
                }`}
              />

              {errors.kodeKlasifikasi && (
                <p className="text-[11px] text-red-600 font-medium mt-1">{errors.kodeKlasifikasi}</p>
              )}

              {/* Suggestions dropdown */}
              {showKlasifSuggestions && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-2 max-h-60 overflow-y-auto">
                  <div className="px-2 py-1 mb-1.5 border-b border-slate-100">
                    <input
                      type="text"
                      placeholder="Cari kode atau kategori..."
                      value={searchKlasifQuery}
                      onChange={(e) => setSearchKlasifQuery(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    {filteredKlasifikasi.map((item) => (
                      <div
                        key={item.kode}
                        onClick={() => {
                          setKodeKlasifikasi(item.kode);
                          setShowKlasifSuggestions(false);
                          setSearchKlasifQuery('');
                        }}
                        className="p-2 rounded-lg hover:bg-blue-50 cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-[#0f4c82] font-mono-tabular">{item.kode}</span>
                          <span className="text-slate-700 ml-2">{item.nama}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {item.kategori}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* TANGGAL SURAT */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  Tanggal Surat
                  {mode === 'baru' && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                </label>
                <span className="text-[11px] text-slate-400">
                  {mode === 'baru' ? 'Otomatis terkunci hari ini' : 'Sesuai slot kosong'}
                </span>
              </div>

              <input
                type="date"
                value={tanggalSurat}
                readOnly={mode === 'baru'}
                onChange={(e) => setTanggalSurat(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm font-medium ${
                  mode === 'baru'
                    ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                    : 'bg-white text-slate-900 border-slate-300'
                }`}
              />

              {isSaturday() && (
                <p className="text-[11px] text-amber-600 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Hari ini hari Sabtu (periksa kembali tanggal operasional dinas).
                </p>
              )}
            </div>

            {/* PERIHAL SURAT */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Perihal Surat <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                value={perihal}
                onChange={(e) => setPerihal(e.target.value)}
                placeholder="Tuliskan perihal surat secara lengkap dan jelas (contoh: Permohonan Data Dukung Evaluasi SPIP Triwulan III)..."
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm transition-all ${
                  errors.perihal
                    ? 'border-red-500 bg-red-50/30 focus:ring-2 focus:ring-red-200'
                    : 'border-slate-300 bg-slate-50/40 focus:bg-white focus:border-[#1a6bb5] focus:ring-2 focus:ring-blue-100'
                }`}
              />
              {errors.perihal && (
                <p className="text-[11px] text-red-600 font-medium mt-1">{errors.perihal}</p>
              )}
            </div>

            {/* TUJUAN SURAT */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Tujuan Surat Kepada <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                value={tujuan}
                onChange={(e) => setTujuan(e.target.value)}
                placeholder="Instansi, pejabat, atau pihak penerima surat (contoh: Kepala Dinas Sosial Provinsi Kalimantan Barat)..."
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm transition-all ${
                  errors.tujuan
                    ? 'border-red-500 bg-red-50/30 focus:ring-2 focus:ring-red-200'
                    : 'border-slate-300 bg-slate-50/40 focus:bg-white focus:border-[#1a6bb5] focus:ring-2 focus:ring-blue-100'
                }`}
              />
              {errors.tujuan && (
                <p className="text-[11px] text-red-600 font-medium mt-1">{errors.tujuan}</p>
              )}
            </div>

            {/* NAMA PEGAWAI */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nama Pegawai yang Meminta <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={namaPegawai}
                onChange={(e) => setNamaPegawai(e.target.value)}
                placeholder="Nama pegawai pemohon beserta gelar..."
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm transition-all ${
                  errors.namaPegawai
                    ? 'border-red-500 bg-red-50/30 focus:ring-2 focus:ring-red-200'
                    : 'border-slate-300 bg-slate-50/40 focus:bg-white focus:border-[#1a6bb5] focus:ring-2 focus:ring-blue-100'
                }`}
              />
              {errors.namaPegawai && (
                <p className="text-[11px] text-red-600 font-medium mt-1">{errors.namaPegawai}</p>
              )}
            </div>

            {/* TIM KERJA */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Tim Kerja <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={timKerja}
                  onChange={(e) => setTimKerja(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm appearance-none pr-10 transition-all ${
                    errors.timKerja
                      ? 'border-red-500 bg-red-50/30 focus:ring-2 focus:ring-red-200'
                      : 'border-slate-300 bg-slate-50/40 focus:bg-white focus:border-[#1a6bb5] focus:ring-2 focus:ring-blue-100'
                  }`}
                >
                  <option value="">— Pilih Tim Kerja —</option>
                  {TIM_KERJA_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
              </div>

              {errors.timKerja && (
                <p className="text-[11px] text-red-600 font-medium mt-1">{errors.timKerja}</p>
              )}

              {/* Conditional Tim Kerja Lainnya */}
              {timKerja === 'Lainnya' && (
                <div className="mt-2.5">
                  <input
                    type="text"
                    value={timKerjaLainnya}
                    onChange={(e) => setTimKerjaLainnya(e.target.value)}
                    placeholder="Tuliskan nama tim kerja lainnya..."
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:border-[#1a6bb5] focus:ring-2 focus:ring-blue-100"
                  />
                  {errors.timKerjaLainnya && (
                    <p className="text-[11px] text-red-600 font-medium mt-1">
                      {errors.timKerjaLainnya}
                    </p>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ── SUBMIT BUTTON ── */}
        <div className="pt-2 border-t border-slate-100">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 rounded-xl font-bold text-white text-base bg-gradient-to-r from-[#0f4c82] via-[#1a6bb5] to-[#1a7a4a] hover:opacity-95 shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Memproses Permintaan Nomor Surat...</span>
              </>
            ) : (
              <>
                <span>📤 Ambil Nomor Surat Saya</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
