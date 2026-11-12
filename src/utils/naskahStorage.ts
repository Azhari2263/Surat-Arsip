import {
  CatatanVerifikasi,
  DokumenFinal,
  LogAktivitasNaskah,
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
  item: Omit<NaskahDinas, 'id' | 'nomorRegistrasi' | 'status' | 'riwayatVersi' | 'riwayatVerifikasi' | 'waktuUpdate'> & {
    initialStatus?: 'DRAFT' | 'MENUNGGU_VERIFIKASI';
  },
  currentList: NaskahDinas[]
): { updatedList: NaskahDinas[]; newNaskah: NaskahDinas } {
  const now = new Date();
  const waktuStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
  
  const nomorRegistrasi = generateNextNomorRegistrasi(currentList);
  const id = `nd-${Date.now()}`;
  const statusAwal: StatusNaskah = item.initialStatus || 'MENUNGGU_VERIFIKASI';

  const versiPertama: VersiDokumen = {
    versi: 1,
    waktuUnggah: waktuStr,
    namaFile: item.drafFile.name,
    ukuranFile: item.drafFile.size,
    dataUrl: item.drafFile.dataUrl,
    diunggahOleh: item.namaKonseptor,
  };

  const initialLog: LogAktivitasNaskah = {
    id: `act-${Date.now()}`,
    waktu: waktuStr,
    namaPengguna: item.namaKonseptor,
    rolePengguna: 'KONSEPTOR',
    statusSebelumnya: '-',
    statusTerbaru: statusAwal,
    keterangan:
      statusAwal === 'DRAFT'
        ? 'Draf naskah dinas disimpan dalam status Draft oleh konseptor'
        : `Draf naskah diajukan oleh konseptor dan diteruskan ke verifikator (${item.verifikatorDitunjuk})`,
  };

  const newNaskah: NaskahDinas = {
    ...item,
    id,
    nomorRegistrasi,
    status: statusAwal,
    riwayatVersi: [versiPertama],
    riwayatVerifikasi: [],
    riwayatAktivitas: [initialLog],
    waktuUpdate: waktuStr,
  };

  const updatedList = [newNaskah, ...currentList];
  saveStoredNaskahList(updatedList);
  return { updatedList, newNaskah };
}

export function updateVerifikasiNaskah(
  naskahId: string,
  keputusan: 'DISETUJUI' | 'PERLU_PERBAIKAN' | 'DITOLAK',
  catatanVerif: Omit<CatatanVerifikasi, 'id' | 'waktu' | 'statusKeputusan'>,
  currentList: NaskahDinas[]
): { updatedList: NaskahDinas[]; updatedNaskah?: NaskahDinas } {
  const now = new Date();
  const waktuStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;

  let newStatus: StatusNaskah;
  let logKeterangan: string;

  if (keputusan === 'DISETUJUI') {
    newStatus = 'MENUNGGU_PENOMORAN';
    logKeterangan = `Draf naskah lolos verifikasi oleh ${catatanVerif.namaVerifikator}. Diteruskan ke tahap Permintaan Nomor Surat Baru.`;
  } else if (keputusan === 'PERLU_PERBAIKAN') {
    newStatus = 'PERLU_PERBAIKAN';
    logKeterangan = `Draf naskah dikembalikan oleh ${catatanVerif.namaVerifikator} untuk perbaikan konseptor. Catatan: ${catatanVerif.catatan}`;
  } else {
    newStatus = 'DITOLAK';
    logKeterangan = `Pengajuan draf naskah ditolak oleh ${catatanVerif.namaVerifikator}. Alasan: ${catatanVerif.catatan}`;
  }

  const entryCatatan: CatatanVerifikasi = {
    ...catatanVerif,
    id: `verif-${Date.now()}`,
    waktu: waktuStr,
    statusKeputusan: keputusan,
    keputusan,
  };

  const updatedList = currentList.map((item) => {
    if (item.id === naskahId) {
      const prevStatus = item.status;
      const logEntry: LogAktivitasNaskah = {
        id: `act-${Date.now()}`,
        waktu: waktuStr,
        namaPengguna: catatanVerif.namaVerifikator,
        rolePengguna: catatanVerif.roleVerifikator,
        statusSebelumnya: prevStatus,
        statusTerbaru: newStatus,
        keterangan: logKeterangan,
        catatan: catatanVerif.catatan,
      };

      return {
        ...item,
        status: newStatus,
        alasanPenolakan: keputusan === 'DITOLAK' ? catatanVerif.catatan : undefined,
        riwayatVerifikasi: [...(item.riwayatVerifikasi || []), entryCatatan],
        riwayatAktivitas: [...(item.riwayatAktivitas || []), logEntry],
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
      const nextVersi = (item.riwayatVersi || []).length + 1;
      const versiBaru: VersiDokumen = {
        versi: nextVersi,
        waktuUnggah: waktuStr,
        namaFile: file.name,
        ukuranFile: file.size,
        dataUrl: file.dataUrl,
        diunggahOleh,
        catatanPerbaikan,
      };

      const logEntry: LogAktivitasNaskah = {
        id: `act-${Date.now()}`,
        waktu: waktuStr,
        namaPengguna: diunggahOleh,
        rolePengguna: 'KONSEPTOR',
        statusSebelumnya: item.status,
        statusTerbaru: 'MENUNGGU_VERIFIKASI',
        keterangan: `Konseptor mengunggah perbaikan draf Word (Versi ${nextVersi}). Status kembali menjadi Menunggu Verifikasi.`,
        catatan: catatanPerbaikan,
      };

      return {
        ...item,
        status: 'MENUNGGU_VERIFIKASI' as StatusNaskah,
        drafFile: file,
        riwayatVersi: [...(item.riwayatVersi || []), versiBaru],
        riwayatAktivitas: [...(item.riwayatAktivitas || []), logEntry],
        waktuUpdate: waktuStr,
      };
    }
    return item;
  });

  saveStoredNaskahList(updatedList);
  const updatedNaskah = updatedList.find((i) => i.id === naskahId);
  return { updatedList, updatedNaskah };
}

/**
 * Tahap Permintaan Nomor Surat Baru:
 * Menerbitkan nomor surat resmi untuk naskah yang telah berstatus MENUNGGU_PENOMORAN
 * Menghubungkan secara otomatis nomor surat dengan draf naskah dinas
 */
export function terbitkanNomorSuratNaskah(
  naskahId: string,
  nomorSuratLengkap: string,
  suratId: string,
  nomorUrut: number,
  petugasPenerbit: string,
  rolePetugas: UserRole | string,
  currentList: NaskahDinas[]
): { updatedList: NaskahDinas[]; updatedNaskah?: NaskahDinas } {
  const target = currentList.find((n) => n.id === naskahId);
  if (!target) {
    throw new Error('Data pengajuan draf naskah tidak ditemukan.');
  }

  // Cegah penerbitan ganda
  if (target.nomorSuratDipesan && target.status !== 'MENUNGGU_PENOMORAN') {
    throw new Error(`Pengajuan ini sudah memiliki nomor surat resmi (${target.nomorSuratDipesan}).`);
  }

  // Draf yang belum disetujui tidak boleh diterbitkan nomor
  if (
    target.status !== 'MENUNGGU_PENOMORAN' &&
    target.status !== 'TERVERIFIKASI'
  ) {
    throw new Error('Hanya draf naskah yang telah lolos verifikasi yang dapat diterbitkan nomor surat.');
  }

  const now = new Date();
  const waktuStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;

  const logEntry: LogAktivitasNaskah = {
    id: `act-${Date.now()}`,
    waktu: waktuStr,
    namaPengguna: petugasPenerbit,
    rolePengguna: rolePetugas,
    statusSebelumnya: target.status,
    statusTerbaru: 'NOMOR_DITERBITKAN',
    keterangan: `Nomor surat resmi #${nomorUrut} (${nomorSuratLengkap}) berhasil diterbitkan oleh ${petugasPenerbit}. Pengajuan diteruskan ke tahap Finalisasi & Unggah Dokumen Bertanda Tangan.`,
  };

  const updatedList = currentList.map((item) => {
    if (item.id === naskahId) {
      return {
        ...item,
        status: 'NOMOR_DITERBITKAN' as StatusNaskah,
        nomorSuratDipesan: nomorSuratLengkap,
        suratId,
        nomorUrutSurat: nomorUrut,
        riwayatAktivitas: [...(item.riwayatAktivitas || []), logEntry],
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
  currentList: NaskahDinas[],
  pelakuUnggah?: { nama: string; role: UserRole | string }
): { updatedList: NaskahDinas[]; updatedNaskah?: NaskahDinas } {
  const now = new Date();
  const waktuStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;

  const namaPelaku = pelakuUnggah?.nama || 'Petugas Arsip';
  const rolePelaku = pelakuUnggah?.role || 'KONSEPTOR';

  const updatedList = currentList.map((item) => {
    if (item.id === naskahId) {
      const logEntry: LogAktivitasNaskah = {
        id: `act-${Date.now()}`,
        waktu: waktuStr,
        namaPengguna: namaPelaku,
        rolePengguna: rolePelaku,
        statusSebelumnya: item.status,
        statusTerbaru: 'SELESAI_ARSIP',
        keterangan: `Dokumen final sah bertanda tangan (${dokumenFinal.tipeTandaTangan}) dengan nomor ${dokumenFinal.nomorSuratResmi} berhasil diunggah ke Penyimpanan Arsip Digital oleh ${namaPelaku}. Alur pengajuan selesai.`,
      };

      return {
        ...item,
        status: 'SELESAI_ARSIP' as StatusNaskah,
        dokumenFinal,
        nomorSuratDipesan: dokumenFinal.nomorSuratResmi,
        riwayatAktivitas: [...(item.riwayatAktivitas || []), logEntry],
        waktuUpdate: waktuStr,
      };
    }
    return item;
  });

  saveStoredNaskahList(updatedList);
  const updatedNaskah = updatedList.find((i) => i.id === naskahId);
  return { updatedList, updatedNaskah };
}

/**
 * Mekanisme Pembukaan Kembali Pengajuan yang Telah Diarsipkan atau Ditolak (Khusus Admin)
 */
export function bukaKembaliNaskahAdmin(
  naskahId: string,
  adminNama: string,
  alasanBukaKembali: string,
  currentList: NaskahDinas[]
): { updatedList: NaskahDinas[]; updatedNaskah?: NaskahDinas } {
  const now = new Date();
  const waktuStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;

  const updatedList = currentList.map((item) => {
    if (item.id === naskahId) {
      const prevStatus = item.status;
      const targetStatus: StatusNaskah = item.dokumenFinal ? 'NOMOR_DITERBITKAN' : 'MENUNGGU_VERIFIKASI';

      const logEntry: LogAktivitasNaskah = {
        id: `act-${Date.now()}`,
        waktu: waktuStr,
        namaPengguna: adminNama,
        rolePengguna: 'ADMIN',
        statusSebelumnya: prevStatus,
        statusTerbaru: targetStatus,
        keterangan: `Pengajuan dibuka kembali secara resmi oleh Administrator TU (${adminNama}). Alasan: ${alasanBukaKembali}`,
        catatan: alasanBukaKembali,
      };

      return {
        ...item,
        status: targetStatus,
        isReopenedByAdmin: true,
        riwayatAktivitas: [...(item.riwayatAktivitas || []), logEntry],
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

  // Verifikator spesifik berdasarkan 5 penugasan resmi
  if (role === 'VERIFIKATOR_YUN') {
    return list.filter(
      (i) =>
        i.roleVerifikatorDitunjuk === 'VERIFIKATOR_YUN' ||
        ['Tim SDM', 'Tim Keuangan', 'SDM dan Hukum', 'Keuangan'].includes(i.unitKerja)
    );
  }
  if (role === 'VERIFIKATOR_AMANDA') {
    return list.filter(
      (i) =>
        i.roleVerifikatorDitunjuk === 'VERIFIKATOR_AMANDA' ||
        ['Tim Perencanaan', 'Tim Neraca', 'Neraca'].includes(i.unitKerja)
    );
  }
  if (role === 'VERIFIKATOR_RANIA') {
    return list.filter(
      (i) =>
        i.roleVerifikatorDitunjuk === 'VERIFIKATOR_RANIA' ||
        ['Tim Distribusi', 'Tim Sosial', 'Distribusi', 'Sosial'].includes(i.unitKerja)
    );
  }
  if (role === 'VERIFIKATOR_VIVI') {
    return list.filter(
      (i) =>
        i.roleVerifikatorDitunjuk === 'VERIFIKATOR_VIVI' ||
        ['Tim Produksi', 'Produksi'].includes(i.unitKerja)
    );
  }
  if (role === 'VERIFIKATOR_AGUS') {
    return list.filter(
      (i) =>
        i.roleVerifikatorDitunjuk === 'VERIFIKATOR_AGUS' ||
        ['Tim IPDS', 'Tim Umum & Humas', 'Tim Umum', 'IPDS', 'Sekretaris'].includes(i.unitKerja)
    );
  }

  // Konseptor & Viewer
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
  // Reset dokumenFinal and return to NOMOR_DITERBITKAN
  const updatedList = currentList.map(item => {
    if (item.id === naskahId) {
      const { dokumenFinal, ...rest } = item;
      return {
        ...rest,
        status: 'NOMOR_DITERBITKAN' as StatusNaskah,
      };
    }
    return item;
  });
  saveStoredNaskahList(updatedList);
  return updatedList;
}
