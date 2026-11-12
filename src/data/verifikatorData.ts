import { UserProfile, UserRole } from '../types';

export interface VerifikatorMappingItem {
  nama: string;
  role: UserRole;
  unitKerjaDitangani: string[];
  deskripsi: string;
}

export const VERIFIKATOR_MAPPING: VerifikatorMappingItem[] = [
  {
    nama: 'M. Yun Imran, S.E.',
    role: 'VERIFIKATOR_YUN',
    unitKerjaDitangani: ['Tim SDM', 'Tim Keuangan', 'SDM dan Hukum', 'Keuangan'],
    deskripsi: 'Verifikator Tim SDM dan Tim Keuangan',
  },
  {
    nama: 'Amanda Putri, A.Md.',
    role: 'VERIFIKATOR_AMANDA',
    unitKerjaDitangani: ['Tim Perencanaan', 'Tim Neraca', 'Neraca'],
    deskripsi: 'Verifikator Tim Perencanaan dan Tim Neraca',
  },
  {
    nama: 'Rania Naila Husna, A.Md.A.B',
    role: 'VERIFIKATOR_RANIA',
    unitKerjaDitangani: ['Tim Distribusi', 'Tim Sosial', 'Distribusi', 'Sosial'],
    deskripsi: 'Verifikator Tim Distribusi dan Tim Sosial',
  },
  {
    nama: 'Alfiana Ayuni, A.Md.',
    role: 'VERIFIKATOR_VIVI',
    unitKerjaDitangani: ['Tim Produksi', 'Produksi'],
    deskripsi: 'Verifikator Tim Produksi',
  },
  {
    nama: 'Agustinus Supriadi, S.M.',
    role: 'VERIFIKATOR_AGUS',
    unitKerjaDitangani: ['Tim IPDS', 'Tim Umum & Humas', 'Tim Umum', 'IPDS', 'Sekretaris'],
    deskripsi: 'Verifikator Tim IPDS dan Tim Umum & Humas',
  },
  {
    nama: 'Arsiparis Ahli BPS Kalbar',
    role: 'ARSIPARIS',
    unitKerjaDitangani: ['Semua Unit Kerja'],
    deskripsi: 'Verifikasi Aspek Kearsipan dan Tata Naskah Dinas Formal',
  },
];

// Seluruh akun pengguna murni bersumber dari database Google Spreadsheet (Sheet Pengguna).
// Tidak ada akun, username, atau password dummy / hardcode di kode aplikasi.
export const DAFTAR_PENGGUNA: UserProfile[] = [];

export function tentukanVerifikator(unitKerja: string): { nama: string; role: UserRole; deskripsi: string } {
  const normalized = unitKerja.toLowerCase();

  // M. Yun Imran, S.E.: Tim SDM dan Tim Keuangan
  if (normalized.includes('sdm') || normalized.includes('hukum') || normalized.includes('keuangan')) {
    return { nama: 'M. Yun Imran, S.E.', role: 'VERIFIKATOR_YUN', deskripsi: 'Verifikator Tim SDM dan Tim Keuangan' };
  }
  // Amanda Putri, A.Md.: Tim Perencanaan dan Tim Neraca
  if (normalized.includes('neraca') || normalized.includes('rencana') || normalized.includes('perencanaan')) {
    return { nama: 'Amanda Putri, A.Md.', role: 'VERIFIKATOR_AMANDA', deskripsi: 'Verifikator Tim Perencanaan dan Tim Neraca' };
  }
  // Rania Naila Husna, A.Md.A.B: Tim Distribusi dan Tim Sosial
  if (normalized.includes('distribusi') || normalized.includes('sosial')) {
    return { nama: 'Rania Naila Husna, A.Md.A.B', role: 'VERIFIKATOR_RANIA', deskripsi: 'Verifikator Tim Distribusi dan Tim Sosial' };
  }
  // Alfiana Ayuni, A.Md.: Tim Produksi
  if (normalized.includes('produksi')) {
    return { nama: 'Alfiana Ayuni, A.Md.', role: 'VERIFIKATOR_VIVI', deskripsi: 'Verifikator Tim Produksi' };
  }
  // Agustinus Supriadi, S.M.: Tim IPDS dan Tim Umum & Humas
  if (normalized.includes('ipds') || normalized.includes('umum') || normalized.includes('humas') || normalized.includes('sekretaris')) {
    return { nama: 'Agustinus Supriadi, S.M.', role: 'VERIFIKATOR_AGUS', deskripsi: 'Verifikator Tim IPDS dan Tim Umum & Humas' };
  }

  // Default ke Arsiparis untuk unit kerja lainnya
  return { nama: 'Arsiparis Ahli BPS Kalbar', role: 'ARSIPARIS', deskripsi: 'Verifikasi Aspek Kearsipan & Tata Naskah Dinas' };
}
