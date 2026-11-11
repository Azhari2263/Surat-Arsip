import {
  CatatanVerifikasi,
  DokumenFinal,
  NaskahDinas,
  StatusNaskah,
  UserRole,
  VersiDokumen,
} from '../types';
import { INITIAL_NASKAH_LIST } from '../data/initialNaskahData';

const STORAGE_KEY_NASKAH = 'bps_kalbar_naskah_dinas_v1';

export function getStoredNaskahList(): NaskahDinas[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NASKAH);
    if (!raw) {
      return INITIAL_NASKAH_LIST;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return INITIAL_NASKAH_LIST;
    }
    return parsed;
  } catch {
    return INITIAL_NASKAH_LIST;
  }
}

export function saveStoredNaskahList(list: NaskahDinas[]): void {
  localStorage.setItem(STORAGE_KEY_NASKAH, JSON.stringify(list));
}

export function generateNextNomorRegistrasi(list: NaskahDinas[]): string {
  const year = new Date().getFullYear();
  const count = list.length + 1;
  const seq = String(count).padStart(3, '0');
  return `ND-${year}-${seq}`;
}

export function addNaskahDinas(
  item: Omit<NaskahDinas, 'id' | 'nomorRegistrasi' | 'status' | 'riwayatVersi' | 'riwayatVerifikasi' | 'waktuUpdate'>,
  currentList: NaskahDinas[]
): { updatedList: NaskahDinas[]; newNaskah: NaskahDinas } {
  const now = new Date();
  const waktuStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
  
  const nomorRegistrasi = generateNextNomorRegistrasi(currentList);
  const id = `nd-${Date.now()}`;

  const versiPertama: VersiDokumen = {
    versi: 1,
    waktuUnggah: waktuStr,
    namaFile: item.drafFile.name,
    ukuranFile: item.drafFile.size,
    dataUrl: item.drafFile.dataUrl,
    diunggahOleh: item.namaKonseptor,
  };

  const newNaskah: NaskahDinas = {
    ...item,
    id,
    nomorRegistrasi,
    status: 'DRAF_DIAJUKAN',
    riwayatVersi: [versiPertama],
    riwayatVerifikasi: [],
    waktuUpdate: waktuStr,
  };

  const updatedList = [newNaskah, ...currentList];
  saveStoredNaskahList(updatedList);
  return { updatedList, newNaskah };
}

export function updateVerifikasiNaskah(
  naskahId: string,
  keputusan: 'DISETUJUI' | 'PERLU_PERBAIKAN',
  catatanVerif: Omit<CatatanVerifikasi, 'id' | 'waktu' | 'statusKeputusan'>,
  currentList: NaskahDinas[]
): { updatedList: NaskahDinas[]; updatedNaskah?: NaskahDinas } {
  const now = new Date();
  const waktuStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;

  const newStatus: StatusNaskah = keputusan === 'DISETUJUI' ? 'TERVERIFIKASI' : 'PERLU_PERBAIKAN';

  const entryCatatan: CatatanVerifikasi = {
    ...catatanVerif,
    id: `verif-${Date.now()}`,
    waktu: waktuStr,
    statusKeputusan: keputusan,
  };

  const updatedList = currentList.map((item) => {
    if (item.id === naskahId) {
      return {
        ...item,
        status: newStatus,
        riwayatVerifikasi: [...item.riwayatVerifikasi, entryCatatan],
        waktuUpdate: waktuStr,
      };
    }
    return item;
  });

  saveStoredNaskahList(updatedList);
  const updatedNaskah = updatedList.find((i) => i.id === naskahId);
  return { updatedList, updatedNaskah };
}

export function uploadRevisiNaskah(
  naskahId: string,
  file: { name: string; size: number; type: string; dataUrl?: string },
  diunggahOleh: string,
  catatanPerbaikan: string,
  currentList: NaskahDinas[]
): { updatedList: NaskahDinas[]; updatedNaskah?: NaskahDinas } {
  const now = new Date();
  const waktuStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;

  const updatedList = currentList.map((item) => {
    if (item.id === naskahId) {
      const nextVersi = item.riwayatVersi.length + 1;
      const versiBaru: VersiDokumen = {
        versi: nextVersi,
        waktuUnggah: waktuStr,
        namaFile: file.name,
        ukuranFile: file.size,
        dataUrl: file.dataUrl,
        diunggahOleh,
        catatanPerbaikan,
      };

      return {
        ...item,
        status: 'DRAF_DIAJUKAN' as StatusNaskah, // Kembali ke antrian verifikasi setelah revisi
        drafFile: file,
        riwayatVersi: [...item.riwayatVersi, versiBaru],
        waktuUpdate: waktuStr,
      };
    }
    return item;
  });

  saveStoredNaskahList(updatedList);
  const updatedNaskah = updatedList.find((i) => i.id === naskahId);
  return { updatedList, updatedNaskah };
}

export function arsipkanNaskahFinal(
  naskahId: string,
  dokumenFinal: DokumenFinal,
  currentList: NaskahDinas[]
): { updatedList: NaskahDinas[]; updatedNaskah?: NaskahDinas } {
  const now = new Date();
  const waktuStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;

  const updatedList = currentList.map((item) => {
    if (item.id === naskahId) {
      return {
        ...item,
        status: 'FINAL_DIARSIPKAN' as StatusNaskah,
        dokumenFinal,
        nomorSuratDipesan: dokumenFinal.nomorSuratResmi,
        waktuUpdate: waktuStr,
      };
    }
    return item;
  });

  saveStoredNaskahList(updatedList);
  const updatedNaskah = updatedList.find((i) => i.id === naskahId);
  return { updatedList, updatedNaskah };
}

export function filterNaskahByRole(list: NaskahDinas[], role: UserRole): NaskahDinas[] {
  if (role === 'ADMIN' || role === 'ARSIPARIS') return list;

  // Jika Verifikator spesifik, tampilkan yang ditugaskan kepadanya atau unit kerja bidangnya
  if (role === 'VERIFIKATOR_YUN') {
    return list.filter((i) => i.roleVerifikatorDitunjuk === 'VERIFIKATOR_YUN' || ['SDM dan Hukum', 'Keuangan'].includes(i.unitKerja));
  }
  if (role === 'VERIFIKATOR_AMANDA') {
    return list.filter((i) => i.roleVerifikatorDitunjuk === 'VERIFIKATOR_AMANDA' || i.unitKerja === 'Neraca');
  }
  if (role === 'VERIFIKATOR_RANIA') {
    return list.filter((i) => i.roleVerifikatorDitunjuk === 'VERIFIKATOR_RANIA' || ['Distribusi', 'Sosial'].includes(i.unitKerja));
  }
  if (role === 'VERIFIKATOR_VIVI') {
    return list.filter((i) => i.roleVerifikatorDitunjuk === 'VERIFIKATOR_VIVI' || i.unitKerja === 'Produksi');
  }
  if (role === 'VERIFIKATOR_AGUS') {
    return list.filter((i) => i.roleVerifikatorDitunjuk === 'VERIFIKATOR_AGUS' || ['IPDS', 'Tim Umum', 'Sekretaris'].includes(i.unitKerja));
  }

  // Konseptor melihat semuanya tapi disortir relevan
  return list;
}

export function deleteNaskahDinas(
  naskahId: string,
  currentList: NaskahDinas[]
): NaskahDinas[] {
  const updatedList = currentList.filter(item => item.id !== naskahId);
  saveStoredNaskahList(updatedList);
  return updatedList;
}

export function updateNaskahMetadata(
  naskahId: string,
  updatedData: Partial<NaskahDinas>,
  currentList: NaskahDinas[]
): { updatedList: NaskahDinas[]; updatedNaskah?: NaskahDinas } {
  const now = new Date();
  const waktuStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
  const updatedList = currentList.map(item => {
    if (item.id === naskahId) {
      return { ...item, ...updatedData, waktuUpdate: waktuStr };
    }
    return item;
  });
  saveStoredNaskahList(updatedList);
  const updatedNaskah = updatedList.find(i => i.id === naskahId);
  return { updatedList, updatedNaskah };
}

export function updateArsipMetadata(
  naskahId: string,
  updatedDoc: Partial<DokumenFinal>,
  currentList: NaskahDinas[]
): { updatedList: NaskahDinas[]; updatedNaskah?: NaskahDinas } {
  const now = new Date();
  const waktuStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
  const updatedList = currentList.map(item => {
    if (item.id === naskahId && item.dokumenFinal) {
      return {
        ...item,
        dokumenFinal: {
          ...item.dokumenFinal,
          ...updatedDoc,
        },
        waktuUpdate: waktuStr,
      };
    }
    return item;
  });
  saveStoredNaskahList(updatedList);
  const updatedNaskah = updatedList.find(i => i.id === naskahId);
  return { updatedList, updatedNaskah };
}

export function deleteArsipItem(
  naskahId: string,
  currentList: NaskahDinas[]
): NaskahDinas[] {
  // Reset dokumenFinal and return to TERVERIFIKASI
  const updatedList = currentList.map(item => {
    if (item.id === naskahId) {
      const { dokumenFinal, ...rest } = item;
      return {
        ...rest,
        status: 'TERVERIFIKASI' as StatusNaskah,
      };
    }
    return item;
  });
  saveStoredNaskahList(updatedList);
  return updatedList;
}
