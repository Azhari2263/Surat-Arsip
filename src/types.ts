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
  googleDriveFolderId?: string;
  daftarTimKerja?: string[];
  pemetaanVerifikator?: Record<string, { nama: string; role: UserRole; jabatan?: string }>;
  syncIntervalSeconds?: number;
  lastConfigUpdate?: string;
  updatedBy?: string;
}

export interface PengaturanItemSpreadsheet {
  kunci: string;
  nilai: string;
  kategori: string;
  deskripsi: string;
  waktuUpdate: string;
  diupdateOleh: string;
}

export type TipeAktivitas =
  | 'PENGAJUAN_DRAF'
  | 'PENGAJUAN_BARU'
  | 'VERIFIKASI_SETUJU'
  | 'VERIFIKASI_PERBAIKAN'
  | 'REVISI_DIMINTA'
  | 'VERIFIKASI_TOLAK'
  | 'PENOLAKAN'
  | 'NOMOR_TERBIT'
  | 'UNGGAH_FINAL'
  | 'ARSIP_FINAL'
  | 'BUKA_KEMBALI'
  | 'HAPUS_NASKAH'
  | 'HAPUS_ARSIP'
  | 'HAPUS_DATA'
  | 'PENGATURAN_UPDATE';

export interface AktivitasNotifikasi {
  id: string;
  tipe?: TipeAktivitas;
  tipeAktivitas: TipeAktivitas;
  judul: string;
  pesan?: string;
  deskripsi: string;
  naskahId?: string;
  nomorRegistrasi?: string;
  nomorSurat?: string;
  unitKerja?: string;
  waktu: string;
  aktor?: string;
  pelaku: string;
  roleAktor?: string;
  rolePelaku: string;
  targetRoles?: string[];
  targetKonseptor?: string;
  dibaca: boolean;
}

export interface RiwayatPenghapusanAudit {
  id: string;
  waktu: string;
  pengguna?: string;
  dihapusOleh?: string;
  rolePengguna?: string;
  role?: string;
  tipeData?: 'NASKAH_DRAF' | 'ARSIP_DIGITAL' | 'SURAT_REGISTER';
  tipe?: 'DRAF' | 'ARSIP';
  nomorIdentifikasi?: string;
  nomorIdentitas?: string;
  perihal?: string;
  unitKerja?: string;
  fileIdsDrive?: string[];
  statusDrive: 'BERHASIL' | 'GAGAL' | 'SEBAGIAN' | 'TIDAK_ADA_FILE';
  jumlahFileDihapus?: number;
  keterangan: string;
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
  // Standarisasi Status Resmi Terpadu
  | 'DRAFT' // Konseptor: Pengajuan masih disusun dan belum dikirim
  | 'MENUNGGU_VERIFIKASI' // Verifikator: Draf menunggu pemeriksaan
  | 'PERLU_PERBAIKAN' // Konseptor: Draf dikembalikan untuk direvisi
  | 'DITOLAK' // Verifikator: Pengajuan dihentikan dengan alasan penolakan
  | 'MENUNGGU_PENOMORAN' // Admin/Petugas: Draf lolos verifikasi, menunggu penerbitan nomor surat
  | 'NOMOR_DITERBITKAN' // Admin/Petugas: Nomor surat telah diberikan & terhubung ke register
  | 'MENUNGGU_DOKUMEN_FINAL' // Konseptor: Menunggu surat yang telah ditandatangani
  | 'SELESAI_ARSIP' // Sistem: Dokumen final berhasil diarsipkan
  // Kompatibilitas Data Lama
  | 'DRAF_DIAJUKAN'
  | 'SEDANG_DIPERIKSA'
  | 'TERVERIFIKASI'
  | 'DISETUJUI'
  | 'FINAL_DIARSIPKAN';

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
  | 'VERIFIKATOR_YUN' // Tim SDM dan Keuangan (M. Yun Imran, S.E.)
  | 'VERIFIKATOR_AMANDA' // Tim Perencanaan dan Neraca (Amanda Putri, A.Md.)
  | 'VERIFIKATOR_RANIA' // Tim Distribusi dan Sosial (Rania Naila Husna, A.Md.A.B)
  | 'VERIFIKATOR_VIVI' // Tim Produksi (Alfiana Ayuni, A.Md.)
  | 'VERIFIKATOR_AGUS' // Tim IPDS dan Tim Umum & Humas (Agustinus Supriadi, S.M.)
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

export interface LogAktivitasNaskah {
  id: string;
  waktu: string;
  namaPengguna: string;
  rolePengguna: UserRole | string;
  statusSebelumnya: string;
  statusTerbaru: string;
  keterangan: string;
  catatan?: string;
}

export interface CatatanVerifikasi {
  id: string;
  waktu: string;
  namaVerifikator: string;
  roleVerifikator: UserRole;
  statusKeputusan: 'DISETUJUI' | 'PERLU_PERBAIKAN' | 'DITOLAK' | 'CATATAN_PEMERIKSAAN';
  keputusan?: 'DISETUJUI' | 'PERLU_PERBAIKAN' | 'DITOLAK';
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
  driveFileId?: string;
  driveUrl?: string;
}

export interface DokumenFinal {
  nomorSuratResmi: string;
  perihal?: string;
  jenisNaskah?: string;
  unitKerja?: string;
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
  driveFileId?: string;
  driveUrl?: string;
  driveFolderId?: string;
  driveFolderPath?: string;
}

export interface ArsipDigitalRecord {
  nomorSuratResmi: string;
  jenisNaskah: string;
  perihal: string;
  unitKerja: string;
  tanggalPenetapan: string;
  tipeTandaTangan: TipeTandaTangan;
  pejabatPenandatangan: string;
  namaFile: string;
  tingkatKeamanan: 'Biasa' | 'Terbatas' | 'Rahasia' | 'Sangat Rahasia';
  lokasiPenyimpanan?: string;
  waktuUnggah: string;
  driveFileId?: string;
  driveUrl?: string;
  driveFolderPath?: string;
  nomorRegistrasi?: string;
}

export interface DriveArchiveFile {
  fileId: string;
  fileName: string;
  fileUrl: string;
  downloadUrl?: string;
  mimeType?: string;
  size?: number;
  tahun?: string;
  timKerja?: string;
  bulan?: string;
  subfolder?: string;
  folderPath?: string;
  updatedAt?: string;
}

export interface NaskahDinas {
  id: string;
  nomorRegistrasi: string; // e.g. ND-2026-001
  nomorSuratDipesan?: string; // dari sistem penomoran BPS (e.g. B-368/6100/VS.100/2026)
  suratId?: string; // id surat terkait di database SuratKeluar
  nomorUrutSurat?: number; // nomor urut register
  kodeSurat?: KodeSuratType; // Sifat naskah: 'B' (Biasa) | 'K' (Keputusan) | 'R' (Rahasia)
  tanggalSurat?: string; // Tanggal surat dinas (dd/MM/yyyy)
  nomorUrutKosongDipilih?: number; // Nomor urut kosong yang dipilih jika klaim slot nomor kosong
  jenisNaskah: JenisNaskahDinas;
  perihal: string;
  tujuan?: string; // Tujuan surat dinas (Kepada Yth.)
  unitKerja: string;
  namaKonseptor: string;
  tanggalPengajuan: string; // dd/MM/yyyy
  status: StatusNaskah;
  verifikatorDitunjuk: string; // Nama Verifikator resmi
  roleVerifikatorDitunjuk: UserRole;
  klasifikasiArsip: string;
  alasanPenolakan?: string;
  isReopenedByAdmin?: boolean;
  drafFile: {
    name: string;
    size: number;
    type: string;
    dataUrl?: string;
  };
  riwayatVersi: VersiDokumen[];
  riwayatVerifikasi: CatatanVerifikasi[];
  riwayatAktivitas?: LogAktivitasNaskah[];
  dokumenFinal?: DokumenFinal;
  waktuUpdate: string;
  ringkasanIsi?: string;
  driveDraftFileId?: string;
  driveDraftUrl?: string;
  driveDraftFolderId?: string;
  driveDraftFolderPath?: string;
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
