export type KodeSuratType = 'B' | 'K' | 'R';

export interface SuratKeluar {
  id: string;
  nomorSuratLengkap: string;
  kodeSurat: KodeSuratType;
  nomorUrut: number;
  kodeKlasifikasi: string;
  perihal: string;
  tujuan: string;
  tanggalSurat: string; // dd/MM/yyyy
  bulan: string; // Januari, Februari, etc.
  namaPegawai: string;
  timKerja: string;
  waktuInput: string; // dd/MM/yyyy HH:mm:ss
  status: 'LENGKAP' | 'KOSONG';
  fileAttachment?: {
    name: string;
    size: number;
    type: string;
    dataUrl?: string;
  };
}

export interface AppConfig {
  spreadsheetId: string;
  appsScriptUrl: string;
  sheetName: string;
  nomorBaruMulaiDari: number;
  kodeUnit: string;
  whatsappAdmin: string;
  enableMondayRule: boolean;
}

export interface SubmitSuratPayload {
  kodeSurat: KodeSuratType;
  kodeKlasifikasi: string;
  perihal: string;
  tujuan: string;
  tanggalSurat: string;
  namaPegawai: string;
  timKerja: string;
  timKerjaLainnya?: string;
  isKosongMode: boolean;
  nomorUrutKosong?: number | null;
  fileAttachment?: {
    name: string;
    size: number;
    type: string;
    dataUrl?: string;
  };
}

export interface SubmitResult {
  success: boolean;
  error?: string;
  data?: SuratKeluar;
  wasMondayPlaceholderCreated?: boolean;
  mondayPlaceholderNomor?: number;
}

export interface StatsData {
  total: number;
  terisi: number;
  kosong: number;
  terakhir: number;
}

// ══════════════════════════════════════════════════════════════════
// NASKAH DINAS & ARSIP DIGITAL TYPES
// ══════════════════════════════════════════════════════════════════

export type JenisNaskahDinas =
  | 'Surat Dinas Biasa'
  | 'Nota Dinas'
  | 'Surat Keputusan (SK)'
  | 'Surat Tugas'
  | 'Surat Perjanjian / Kerjasama'
  | 'Berita Acara'
  | 'Pengumuman'
  | 'Surat Undangan'
  | 'Surat Keterangan'
  | 'Surat Edaran';

export type StatusNaskah =
  | 'DRAF_DIAJUKAN' // Menunggu Verifikasi
  | 'SEDANG_DIPERIKSA' // Dalam Proses Pemeriksaan
  | 'PERLU_PERBAIKAN' // Dikembalikan untuk Revisi
  | 'TERVERIFIKASI' // Draf Disetujui (Belum Sah - Menunggu TTD/TTE)
  | 'FINAL_DIARSIPKAN'; // Naskah Dinas Sah Ditandatangani & Masuk Arsip Digital

export type TipeTandaTangan = 'TTE' | 'KONVENSIONAL';

export type TabKey =
  | 'dashboard'
  | 'pengajuan'
  | 'verifikasi'
  | 'arsip'
  | 'pedoman'
  | 'penomoran'
  | 'pengguna';

export type UserRole =
  | 'KONSEPTOR'
  | 'VERIFIKATOR_YUN' // Tim SDM dan Keuangan
  | 'VERIFIKATOR_AMANDA' // Tim Perencanaan dan Neraca
  | 'VERIFIKATOR_RANIA' // Tim Distribusi dan Sosial
  | 'VERIFIKATOR_VIVI' // Tim Produksi
  | 'VERIFIKATOR_AGUS' // Tim IPDS, Tim Umum dan Humas
  | 'ARSIPARIS' // Aspek Kearsipan & Tata Naskah
  | 'ADMIN' // Administrator TU
  | 'VIEWER'; // Pengamat / Tamu (Read-Only)

export interface UserProfile {
  id: string;
  username: string;
  password?: string;
  nip?: string;
  role: UserRole;
  nama: string;
  jabatan: string;
  unitKerja: string;
  lingkupVerifikasi?: string;
  allowedTabs: TabKey[];
  statusAktif?: boolean;
}

export interface ChecklistVerifikasi {
  kesesuaianFormatTemplate: boolean;
  kelengkapanStruktur: boolean;
  ketepatanBahasaTataLetak: boolean;
  kesesuaianNomorKlasifikasi: boolean;
  kepatuhanPedomanHukum: boolean;
}

export interface CatatanVerifikasi {
  id: string;
  waktu: string;
  namaVerifikator: string;
  roleVerifikator: UserRole;
  statusKeputusan: 'DISETUJUI' | 'PERLU_PERBAIKAN' | 'CATATAN_PEMERIKSAAN';
  keputusan?: 'DISETUJUI' | 'PERLU_PERBAIKAN';
  catatan: string;
  checklist: ChecklistVerifikasi;
  fileCatatanRevisi?: {
    name: string;
    size: number;
    dataUrl?: string;
  };
}

export interface VersiDokumen {
  versi: number;
  waktuUnggah: string;
  namaFile: string;
  ukuranFile: number;
  dataUrl?: string;
  diunggahOleh: string;
  catatanPerbaikan?: string;
}

export interface DokumenFinal {
  nomorSuratResmi: string;
  tanggalPenetapan: string;
  tipeTandaTangan: TipeTandaTangan;
  pejabatPenandatangan: string;
  namaFile: string;
  ukuranFile: number;
  dataUrl?: string;
  waktuUnggah: string;
  klasifikasiArsip: string;
  kodeUnitArsip: string;
  tingkatKeamanan: 'Biasa' | 'Terbatas' | 'Rahasia' | 'Sangat Rahasia';
  lokasiPenyimpanan?: string;
}

export interface NaskahDinas {
  id: string;
  nomorRegistrasi: string; // e.g. ND-2026-001
  nomorSuratDipesan?: string; // dari sistem penomoran BPS
  jenisNaskah: JenisNaskahDinas;
  perihal: string;
  unitKerja: string;
  namaKonseptor: string;
  tanggalPengajuan: string; // dd/MM/yyyy
  status: StatusNaskah;
  verifikatorDitunjuk: string; // Nama Verifikator (Yun, Amanda, Rania, Vivi, Agus, Arsiparis)
  roleVerifikatorDitunjuk: UserRole;
  klasifikasiArsip: string;
  drafFile: {
    name: string;
    size: number;
    type: string;
    dataUrl?: string;
  };
  riwayatVersi: VersiDokumen[];
  riwayatVerifikasi: CatatanVerifikasi[];
  dokumenFinal?: DokumenFinal;
  waktuUpdate: string;
  ringkasanIsi?: string;
}

export interface TemplateNaskah {
  id: string;
  jenis: JenisNaskahDinas;
  judul: string;
  deskripsi: string;
  format: 'DOCX' | 'PDF';
  ukuran: string;
  diperbarui: string;
  struktur: string[];
  keterangan: string;
}

export interface PedomanHukum {
  id: string;
  judul: string;
  nomor: string;
  tahun: string;
  kategori: 'Peraturan BPS' | 'Undang-Undang' | 'Peraturan ANRI' | 'Pedoman Teknis';
  deskripsi: string;
  linkDownload?: string;
}
