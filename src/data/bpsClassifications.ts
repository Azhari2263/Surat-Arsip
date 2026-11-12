export interface KlasifikasiItem {
  kode: string;
  nama: string;
  kategori: string;
}

export const DAFTAR_KLASIFIKASI_BPS: KlasifikasiItem[] = [
  { kode: 'PR.100', nama: 'Perencanaan Program dan Anggaran', kategori: 'Perencanaan' },
  { kode: 'PR.200', nama: 'Evaluasi & Laporan Kinerja (LAKIP/SAKIP)', kategori: 'Perencanaan' },
  { kode: 'KU.010', nama: 'Pengelolaan Keuangan & Perbendaharaan', kategori: 'Keuangan' },
  { kode: 'KU.020', nama: 'Akuntansi & Verifikasi Dokumen Keuangan', kategori: 'Keuangan' },
  { kode: 'KP.010', nama: 'Formasi, Rekrutmen & Administrasi SDM', kategori: 'Kepegawaian' },
  { kode: 'KP.020', nama: 'Mutasi, Promosi, Cuti & Disiplin Pegawai', kategori: 'Kepegawaian' },
  { kode: 'KP.030', nama: 'Pengembangan Kompetensi & Pelatihan', kategori: 'Kepegawaian' },
  { kode: 'HM.100', nama: 'Hubungan Masyarakat, Publikasi & Pers', kategori: 'Humas' },
  { kode: 'HM.200', nama: 'Kerjasama Antar Lembaga / MoU', kategori: 'Humas' },
  { kode: 'TU.010', nama: 'Tata Persuratan, Ekspedisi & Kearsipan', kategori: 'Tata Usaha' },
  { kode: 'TU.020', nama: 'Pengelolaan BMN, Rumah Tangga & Sarpras', kategori: 'Tata Usaha' },
  { kode: 'VS.100', nama: 'Statistik Sosial (Susenas, Sakernas, Podes)', kategori: 'Statistik Sosial' },
  { kode: 'VS.200', nama: 'Statistik Produksi (Pertanian, Industri, PEK)', kategori: 'Statistik Produksi' },
  { kode: 'VS.300', nama: 'Statistik Distribusi & Jasa (Inflasi, Ekspor)', kategori: 'Statistik Distribusi' },
  { kode: 'VS.400', nama: 'Neraca Wilayah & Analisis Statistik (PDRB)', kategori: 'Neraca' },
  { kode: 'TI.100', nama: 'Pengelolaan TI, Jaringan & Keamanan Siber', kategori: 'IPDS' },
  { kode: 'TI.200', nama: 'Diseminasi, Website & Pelayanan Terpadu', kategori: 'IPDS' },
  { kode: 'HK.010', nama: 'Penyusunan Peraturan, Keputusan & Advokasi', kategori: 'Hukum' },
];

export const DAFTAR_TIM_KERJA = [
  'Tim SDM',
  'Tim Keuangan',
  'Tim Perencanaan',
  'Tim Neraca',
  'Tim Distribusi',
  'Tim Sosial',
  'Tim Produksi',
  'Tim IPDS',
  'Tim Umum & Humas',
  'Tata Usaha / Kearsipan',
  'Pimpinan & TU Kepala',
] as const;

export const TIM_KERJA_OPTIONS: string[] = [...DAFTAR_TIM_KERJA];

export const BULAN_LIST = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const DEFAULT_DRIVE_FOLDER_ID = '1_Xsmp2dafHvoyhXuhS1x1_GkbWDy7i0S';

export const DEFAULT_PEMETAAN_VERIFIKATOR: Record<string, { nama: string; role: any; deskripsi: string }> = {
  'Tim SDM': { nama: 'M. Yun Imran, S.E.', role: 'VERIFIKATOR_YUN', deskripsi: 'Verifikator Tim SDM dan Tim Keuangan' },
  'Tim Keuangan': { nama: 'M. Yun Imran, S.E.', role: 'VERIFIKATOR_YUN', deskripsi: 'Verifikator Tim SDM dan Tim Keuangan' },
  'Tim Perencanaan': { nama: 'Amanda Putri, A.Md.', role: 'VERIFIKATOR_AMANDA', deskripsi: 'Verifikator Tim Perencanaan dan Tim Neraca' },
  'Tim Neraca': { nama: 'Amanda Putri, A.Md.', role: 'VERIFIKATOR_AMANDA', deskripsi: 'Verifikator Tim Perencanaan dan Tim Neraca' },
  'Tim Distribusi': { nama: 'Rania Naila Husna, A.Md.A.B', role: 'VERIFIKATOR_RANIA', deskripsi: 'Verifikator Tim Distribusi dan Tim Sosial' },
  'Tim Sosial': { nama: 'Rania Naila Husna, A.Md.A.B', role: 'VERIFIKATOR_RANIA', deskripsi: 'Verifikator Tim Distribusi dan Tim Sosial' },
  'Tim Produksi': { nama: 'Alfiana Ayuni, A.Md.', role: 'VERIFIKATOR_VIVI', deskripsi: 'Verifikator Tim Produksi' },
  'Tim IPDS': { nama: 'Agustinus Supriadi, S.M.', role: 'VERIFIKATOR_AGUS', deskripsi: 'Verifikator Tim IPDS dan Tim Umum & Humas' },
  'Tim Umum & Humas': { nama: 'Agustinus Supriadi, S.M.', role: 'VERIFIKATOR_AGUS', deskripsi: 'Verifikator Tim IPDS dan Tim Umum & Humas' },
  'Tata Usaha / Kearsipan': { nama: 'Arsiparis Ahli BPS Kalbar', role: 'ARSIPARIS', deskripsi: 'Verifikasi Aspek Kearsipan dan Tata Naskah Dinas Formal' },
  'Pimpinan & TU Kepala': { nama: 'Arsiparis Ahli BPS Kalbar', role: 'ARSIPARIS', deskripsi: 'Verifikasi Tata Usaha Kepala' },
};

export const DEFAULT_CONFIG = {
  spreadsheetId: '1Pf0RmsY1zaJYds2kN969J01gmhMybkehcAyjwHo4byg',
  appsScriptUrl: 'https://script.google.com/macros/s/AKfycbwqkoaf5CgOLS8bnGJHwCacg7nR92XyA68pcqbvOPouMghd9HA7j62Hezojh-wPS0_h/exec',
  sheetName: 'Keluar26',
  nomorBaruMulaiDari: 367,
  kodeUnit: '6100',
  whatsappAdmin: '6281253817688',
  enableMondayRule: true,
  googleDriveFolderId: DEFAULT_DRIVE_FOLDER_ID,
  daftarTimKerja: [...DAFTAR_TIM_KERJA],
  pemetaanVerifikator: DEFAULT_PEMETAAN_VERIFIKATOR,
  syncIntervalSeconds: 10,
  lastConfigUpdate: new Date().toISOString(),
  updatedBy: 'Sistem Inisial',
};
