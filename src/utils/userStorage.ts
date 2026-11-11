import { TabKey, UserProfile, UserRole } from '../types';

const STORAGE_KEY_USERS = 'bps_kalbar_users_v2';

export function mapRoleToAllowedTabs(role: UserRole): TabKey[] {
  switch (role) {
    case 'ADMIN':
      return ['dashboard', 'pengajuan', 'verifikasi', 'arsip', 'pedoman', 'penomoran', 'pengguna'];
    case 'ARSIPARIS':
      return ['dashboard', 'verifikasi', 'arsip', 'pedoman', 'penomoran'];
    case 'KONSEPTOR':
      return ['dashboard', 'pengajuan', 'arsip', 'pedoman', 'penomoran'];
    case 'VERIFIKATOR_YUN':
    case 'VERIFIKATOR_AMANDA':
    case 'VERIFIKATOR_RANIA':
    case 'VERIFIKATOR_VIVI':
    case 'VERIFIKATOR_AGUS':
      return ['dashboard', 'verifikasi', 'arsip', 'pedoman'];
    case 'VIEWER':
      return ['dashboard', 'arsip', 'pedoman', 'penomoran'];
    default:
      return ['dashboard', 'arsip', 'pedoman'];
  }
}

export function getStoredUserList(): UserProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredUserList(list: UserProfile[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function addUserItem(
  newUser: UserProfile,
  currentList: UserProfile[]
): UserProfile[] {
  const listCopy = [...currentList];
  const existsIndex = listCopy.findIndex(
    u => u.username.toLowerCase() === newUser.username.toLowerCase() || u.id === newUser.id
  );
  if (existsIndex >= 0) {
    listCopy[existsIndex] = newUser;
  } else {
    listCopy.push(newUser);
  }
  saveStoredUserList(listCopy);
  return listCopy;
}

export function updateUserItem(
  updatedUser: UserProfile,
  currentList: UserProfile[]
): UserProfile[] {
  const listCopy = currentList.map(u =>
    u.id === updatedUser.id || u.username.toLowerCase() === updatedUser.username.toLowerCase()
      ? { ...u, ...updatedUser }
      : u
  );
  saveStoredUserList(listCopy);
  return listCopy;
}

export function deleteUserItem(
  userIdOrUsername: string,
  currentList: UserProfile[]
): UserProfile[] {
  const listCopy = currentList.filter(
    u => u.id !== userIdOrUsername && u.username.toLowerCase() !== userIdOrUsername.toLowerCase()
  );
  saveStoredUserList(listCopy);
  return listCopy;
}

/**
 * Template akun kedinasan standar resmi BPS Kalbar untuk keperluan inisialisasi awal ke sheet Google Spreadsheet
 */
export function getStandardInitialAccounts(): UserProfile[] {
  return [
    {
      id: 'usr-admin-tu',
      username: 'admin',
      password: 'bpskalbar61000()',
      nip: '197609211999031002',
      role: 'ADMIN',
      nama: 'Administrator Tata Usaha',
      jabatan: 'Koordinator Tata Usaha Kepala BPS',
      unitKerja: 'Pimpinan & TU Kepala',
      lingkupVerifikasi: 'Akses Penuh Pengelolaan & Konfigurasi',
      allowedTabs: mapRoleToAllowedTabs('ADMIN'),
      statusAktif: true,
    },
    {
      id: 'usr-arsiparis-1',
      username: 'arsiparis',
      password: 'arsiparis61000',
      nip: '197905102003122001',
      role: 'ARSIPARIS',
      nama: 'Arsiparis Ahli BPS Kalbar',
      jabatan: 'Arsiparis Koordinator Tata Kearsipan',
      unitKerja: 'Tata Usaha / Kearsipan',
      lingkupVerifikasi: 'Seluruh Tata Kelola Naskah Dinas & Kearsipan',
      allowedTabs: mapRoleToAllowedTabs('ARSIPARIS'),
      statusAktif: true,
    },
    {
      id: 'usr-konseptor-1',
      username: 'konseptor',
      password: 'konseptor61000',
      nip: '199503152019011002',
      role: 'KONSEPTOR',
      nama: 'Dwi Prasetyo, S.Tr.Stat',
      jabatan: 'Statistisi Ahli Pertama / Konseptor',
      unitKerja: 'Sosial',
      lingkupVerifikasi: 'Penyusunan Draf Naskah Dinas',
      allowedTabs: mapRoleToAllowedTabs('KONSEPTOR'),
      statusAktif: true,
    },
    {
      id: 'usr-verif-yun',
      username: 'yun',
      password: 'yun61000',
      nip: '198708122010012003',
      role: 'VERIFIKATOR_YUN',
      nama: 'Yun',
      jabatan: 'Verifikator SDM & Keuangan',
      unitKerja: 'SDM dan Keuangan',
      lingkupVerifikasi: 'Tim SDM dan Keuangan',
      allowedTabs: mapRoleToAllowedTabs('VERIFIKATOR_YUN'),
      statusAktif: true,
    },
    {
      id: 'usr-verif-amanda',
      username: 'amanda',
      password: 'amanda61000',
      nip: '199004222014022004',
      role: 'VERIFIKATOR_AMANDA',
      nama: 'Amanda',
      jabatan: 'Verifikator Perencanaan & Neraca',
      unitKerja: 'Neraca Wilayah',
      lingkupVerifikasi: 'Tim Perencanaan dan Neraca',
      allowedTabs: mapRoleToAllowedTabs('VERIFIKATOR_AMANDA'),
      statusAktif: true,
    },
    {
      id: 'usr-verif-rania',
      username: 'rania',
      password: 'rania61000',
      nip: '199211052015032001',
      role: 'VERIFIKATOR_RANIA',
      nama: 'Rania',
      jabatan: 'Verifikator Distribusi & Sosial',
      unitKerja: 'Statistik Distribusi',
      lingkupVerifikasi: 'Tim Distribusi dan Sosial',
      allowedTabs: mapRoleToAllowedTabs('VERIFIKATOR_RANIA'),
      statusAktif: true,
    },
    {
      id: 'usr-verif-vivi',
      username: 'vivi',
      password: 'vivi61000',
      nip: '198906182012012005',
      role: 'VERIFIKATOR_VIVI',
      nama: 'Vivi',
      jabatan: 'Verifikator Produksi',
      unitKerja: 'Statistik Produksi',
      lingkupVerifikasi: 'Tim Produksi',
      allowedTabs: mapRoleToAllowedTabs('VERIFIKATOR_VIVI'),
      statusAktif: true,
    },
    {
      id: 'usr-verif-agus',
      username: 'agus',
      password: 'agus61000',
      nip: '198602142009011004',
      role: 'VERIFIKATOR_AGUS',
      nama: 'Agus',
      jabatan: 'Verifikator IPDS & Umum/Humas',
      unitKerja: 'IPDS dan Tim Umum',
      lingkupVerifikasi: 'Tim IPDS, Tim Umum dan Humas',
      allowedTabs: mapRoleToAllowedTabs('VERIFIKATOR_AGUS'),
      statusAktif: true,
    },
    {
      id: 'usr-viewer-1',
      username: 'viewer',
      password: 'viewer61000',
      nip: '199801012022011001',
      role: 'VIEWER',
      nama: 'Pengamat / Tamu Eksternal',
      jabatan: 'Auditor / Pengamat Monitoring',
      unitKerja: 'Pengawasan / Tamu',
      lingkupVerifikasi: 'Pemantauan Arsip & Register (Read-Only)',
      allowedTabs: mapRoleToAllowedTabs('VIEWER'),
      statusAktif: true,
    },
  ];
}
