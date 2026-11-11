import { UserProfile, UserRole } from '../types';

export interface VerifikatorMappingItem {
  nama: string;
  role: UserRole;
  unitKerjaDitangani: string[];
  deskripsi: string;
}

export const VERIFIKATOR_MAPPING: VerifikatorMappingItem[] = [
  {
    nama: 'Yun',
    role: 'VERIFIKATOR_YUN',
    unitKerjaDitangani: ['SDM dan Hukum', 'Keuangan'],
    deskripsi: 'Verifikator Draf Naskah Dinas Tim SDM dan Keuangan',
  },
  {
    nama: 'Amanda',
    role: 'VERIFIKATOR_AMANDA',
    unitKerjaDitangani: ['Neraca'], // Tim Perencanaan dan Neraca
    deskripsi: 'Verifikator Draf Naskah Dinas Tim Perencanaan dan Neraca',
  },
  {
    nama: 'Rania',
    role: 'VERIFIKATOR_RANIA',
    unitKerjaDitangani: ['Distribusi', 'Sosial'],
    deskripsi: 'Verifikator Draf Naskah Dinas Tim Distribusi dan Sosial',
  },
  {
    nama: 'Vivi',
    role: 'VERIFIKATOR_VIVI',
    unitKerjaDitangani: ['Produksi'],
    deskripsi: 'Verifikator Draf Naskah Dinas Tim Produksi',
  },
  {
    nama: 'Agus',
    role: 'VERIFIKATOR_AGUS',
    unitKerjaDitangani: ['IPDS', 'Tim Umum', 'Sekretaris'],
    deskripsi: 'Verifikator Draf Naskah Dinas Tim IPDS serta Tim Umum dan Humas',
  },
  {
    nama: 'Arsiparis BPS',
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

  if (normalized.includes('sdm') || normalized.includes('hukum') || normalized.includes('keuangan')) {
    return { nama: 'Yun', role: 'VERIFIKATOR_YUN', deskripsi: 'Verifikator Tim SDM dan Keuangan' };
  }
  if (normalized.includes('neraca') || normalized.includes('rencana') || normalized.includes('perencanaan')) {
    return { nama: 'Amanda', role: 'VERIFIKATOR_AMANDA', deskripsi: 'Verifikator Tim Perencanaan dan Neraca' };
  }
  if (normalized.includes('distribusi') || normalized.includes('sosial')) {
    return { nama: 'Rania', role: 'VERIFIKATOR_RANIA', deskripsi: 'Verifikator Tim Distribusi dan Sosial' };
  }
  if (normalized.includes('produksi')) {
    return { nama: 'Vivi', role: 'VERIFIKATOR_VIVI', deskripsi: 'Verifikator Tim Produksi' };
  }
  if (normalized.includes('ipds') || normalized.includes('umum') || normalized.includes('humas') || normalized.includes('sekretaris')) {
    return { nama: 'Agus', role: 'VERIFIKATOR_AGUS', deskripsi: 'Verifikator Tim IPDS serta Tim Umum dan Humas' };
  }

  // Default ke Arsiparis untuk unit kerja lainnya
  return { nama: 'Arsiparis BPS', role: 'ARSIPARIS', deskripsi: 'Verifikasi Aspek Kearsipan & Tata Naskah Dinas' };
}
