import { AppConfig, SubmitResult, SubmitSuratPayload, SuratKeluar } from '../types';
import { BULAN_LIST, DEFAULT_CONFIG } from '../data/bpsClassifications';
import { INITIAL_SURAT_LIST } from '../data/initialData';

const STORAGE_KEY_SURAT = 'bps_kalbar_surat_keluar_v1';
const STORAGE_KEY_CONFIG = 'bps_kalbar_app_config_v1';

export function getStoredConfig(): AppConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (!raw) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveStoredConfig(config: AppConfig): void {
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
}

export function getStoredSuratList(): SuratKeluar[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SURAT);
    if (!raw) {
      return INITIAL_SURAT_LIST;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return INITIAL_SURAT_LIST;
    }
    return parsed;
  } catch {
    return INITIAL_SURAT_LIST;
  }
}

export function saveStoredSuratList(list: SuratKeluar[]): void {
  localStorage.setItem(STORAGE_KEY_SURAT, JSON.stringify(list));
}

export function getNamaBulan(dateObj: Date): string {
  return BULAN_LIST[dateObj.getMonth()];
}

export function formatTanggalDMY(dateObj: Date): string {
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const yyyy = dateObj.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function formatWaktuFull(dateObj: Date): string {
  const tgl = formatTanggalDMY(dateObj);
  const hh = String(dateObj.getHours()).padStart(2, '0');
  const ii = String(dateObj.getMinutes()).padStart(2, '0');
  const ss = String(dateObj.getSeconds()).padStart(2, '0');
  return `${tgl} ${hh}:${ii}:${ss}`;
}

const BULAN_INDONESIA = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function formatTanggalIndo(dateInput?: string | Date | null): string {
  if (!dateInput) return '-';

  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (!trimmed) return '-';

    // Handle dd/MM/yyyy or dd-MM-yyyy
    const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const monthIdx = parseInt(dmyMatch[2], 10) - 1;
      const year = parseInt(dmyMatch[3], 10);
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${day} ${BULAN_INDONESIA[monthIdx]} ${year}`;
      }
    }

    // Handle yyyy-MM-dd
    const ymdMatch = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (ymdMatch) {
      const year = parseInt(ymdMatch[1], 10);
      const monthIdx = parseInt(ymdMatch[2], 10) - 1;
      const day = parseInt(ymdMatch[3], 10);
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${day} ${BULAN_INDONESIA[monthIdx]} ${year}`;
      }
    }
  }

  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    return String(dateInput);
  }

  const day = d.getDate();
  const month = BULAN_INDONESIA[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export function formatTanggalWaktuIndo(dateInput?: string | Date | null): string {
  if (!dateInput) return '-';

  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (!trimmed) return '-';

    // Handle dd/MM/yyyy HH:mm:ss or dd/MM/yyyy, HH:mm
    const dmyWithTimeMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})[,\s]+(\d{1,2})[:\.](\d{1,2})(?:[:\.](\d{1,2}))?/);
    if (dmyWithTimeMatch) {
      const day = parseInt(dmyWithTimeMatch[1], 10);
      const monthIdx = parseInt(dmyWithTimeMatch[2], 10) - 1;
      const year = parseInt(dmyWithTimeMatch[3], 10);
      const hh = String(dmyWithTimeMatch[4]).padStart(2, '0');
      const mm = String(dmyWithTimeMatch[5]).padStart(2, '0');
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${day} ${BULAN_INDONESIA[monthIdx]} ${year}, ${hh}:${mm} WIB`;
      }
    }

    // Handle dd/MM/yyyy without time
    const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const monthIdx = parseInt(dmyMatch[2], 10) - 1;
      const year = parseInt(dmyMatch[3], 10);
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${day} ${BULAN_INDONESIA[monthIdx]} ${year}`;
      }
    }
  }

  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    return String(dateInput);
  }

  const day = d.getDate();
  const month = BULAN_INDONESIA[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  if (hours !== '00' || minutes !== '00') {
    return `${day} ${month} ${year}, ${hours}:${minutes} WIB`;
  }
  return `${day} ${month} ${year}`;
}

export function isDuplicate(nomorUrut: number, list: SuratKeluar[]): boolean {
  return list.some(item => Number(item.nomorUrut) === Number(nomorUrut));
}

export function getNextNomorBaru(list: SuratKeluar[], config: AppConfig): number {
  const startFrom = config.nomorBaruMulaiDari;
  const numbers = list
    .map(item => Number(item.nomorUrut))
    .filter(n => !isNaN(n) && n >= startFrom);

  if (numbers.length === 0) return startFrom;
  return Math.max(...numbers) + 1;
}

export function isHariSenin(dateObj: Date = new Date()): boolean {
  return dateObj.getDay() === 1; // 1 = Senin
}

export function isOrangPertamaHariIni(list: SuratKeluar[], targetDate: Date = new Date()): boolean {
  const todayStr = formatTanggalDMY(targetDate);

  for (const item of list) {
    if (!item.waktuInput) continue;
    const itemDatePart = item.waktuInput.substring(0, 10);
    if (itemDatePart === todayStr && item.status === 'LENGKAP') {
      return false; // Ada surat terisi lain hari ini
    }
  }
  return true;
}

export function processSubmitSurat(
  payload: SubmitSuratPayload,
  config: AppConfig,
  currentList: SuratKeluar[],
  simulateMonday: boolean = false
): { updatedList: SuratKeluar[]; result: SubmitResult } {
  try {
    const listCopy = [...currentList];
    const now = new Date();
    const tahun = now.getFullYear();
    const waktuSekarang = formatWaktuFull(now);
    const namaBulanSekarang = getNamaBulan(now);
    const tglFormattedHariIni = formatTanggalDMY(now);

    const timKerjaFinal =
      payload.timKerja === 'Lainnya'
        ? payload.timKerjaLainnya?.trim() || 'Lainnya'
        : payload.timKerja;

    let nomorUrutFinal: number;
    let targetIndex = -1;
    let wasMondayPlaceholderCreated = false;
    let mondayPlaceholderNomor: number | undefined;

    // 1. MODE ISI NOMOR KOSONG
    if (payload.isKosongMode && payload.nomorUrutKosong) {
      nomorUrutFinal = Number(payload.nomorUrutKosong);
      targetIndex = listCopy.findIndex(item => Number(item.nomorUrut) === nomorUrutFinal);

      if (targetIndex === -1) {
        return {
          updatedList: currentList,
          result: {
            success: false,
            error: `Nomor kosong urut ${nomorUrutFinal} tidak ditemukan dalam arsip.`,
          },
        };
      }
    } else {
      // 2. MODE BARU (Pengajuan Normal / Senin Berkah)
      nomorUrutFinal = getNextNomorBaru(listCopy, config);

      // Cek Aturan: Hari Senin & Orang Pertama Hari Ini (atau Simulasi Aktif)
      const isMonday = simulateMonday || isHariSenin(now);
      const isFirstToday = isOrangPertamaHariIni(listCopy, now);

      if (config.enableMondayRule && isMonday && isFirstToday) {
        // Buat Placeholder Nomor Kosong (menggunakan nomorUrut saat ini)
        if (!isDuplicate(nomorUrutFinal, listCopy)) {
          const nomorSuratKosong = `-${nomorUrutFinal}/${config.kodeUnit}//${tahun}`;
          const emptyPlaceholder: SuratKeluar = {
            id: `surat-${nomorUrutFinal}-kosong-${Date.now()}`,
            nomorSuratLengkap: nomorSuratKosong,
            kodeSurat: 'B',
            nomorUrut: nomorUrutFinal,
            kodeKlasifikasi: '',
            perihal: '',
            tujuan: '',
            tanggalSurat: tglFormattedHariIni,
            bulan: namaBulanSekarang,
            namaPegawai: '',
            timKerja: '',
            waktuInput: waktuSekarang,
            status: 'KOSONG',
          };
          listCopy.push(emptyPlaceholder);
          wasMondayPlaceholderCreated = true;
          mondayPlaceholderNomor = nomorUrutFinal;
        }

        // Naikkan nomor urut untuk pemohon pertama
        nomorUrutFinal = nomorUrutFinal + 1;
      }

      // Proteksi anti duplikasi ganda
      while (isDuplicate(nomorUrutFinal, listCopy)) {
        nomorUrutFinal++;
      }
    }

    // Tanggal surat
    let tanggalSuratFinal: string;
    let bulanFinal: string;

    if (payload.isKosongMode && targetIndex !== -1 && listCopy[targetIndex].tanggalSurat) {
      tanggalSuratFinal = listCopy[targetIndex].tanggalSurat;
      bulanFinal = listCopy[targetIndex].bulan || namaBulanSekarang;
    } else {
      tanggalSuratFinal = tglFormattedHariIni;
      bulanFinal = namaBulanSekarang;
    }

    const nomorSuratLengkap = `${payload.kodeSurat}-${nomorUrutFinal}/${config.kodeUnit}/${payload.kodeKlasifikasi}/${tahun}`;

    const newSurat: SuratKeluar = {
      id: targetIndex !== -1 ? listCopy[targetIndex].id : `surat-${nomorUrutFinal}-${Date.now()}`,
      nomorSuratLengkap,
      kodeSurat: payload.kodeSurat,
      nomorUrut: nomorUrutFinal,
      kodeKlasifikasi: payload.kodeKlasifikasi,
      perihal: payload.perihal,
      tujuan: payload.tujuan,
      tanggalSurat: tanggalSuratFinal,
      bulan: bulanFinal,
      namaPegawai: payload.namaPegawai,
      timKerja: timKerjaFinal,
      waktuInput: waktuSekarang,
      status: 'LENGKAP',
      fileAttachment: payload.fileAttachment,
    };

    if (targetIndex !== -1) {
      listCopy[targetIndex] = newSurat;
    } else {
      listCopy.push(newSurat);
    }

    // Urutkan list berdasarkan nomorUrut ascending
    listCopy.sort((a, b) => a.nomorUrut - b.nomorUrut);

    saveStoredSuratList(listCopy);

    return {
      updatedList: listCopy,
      result: {
        success: true,
        data: newSurat,
        wasMondayPlaceholderCreated,
        mondayPlaceholderNomor,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      updatedList: currentList,
      result: {
        success: false,
        error: message,
      },
    };
  }
}

export function computeStats(list: SuratKeluar[], config: AppConfig): {
  total: number;
  terisi: number;
  kosong: number;
  terakhir: number;
} {
  const terisi = list.filter(item => item.status === 'LENGKAP').length;
  const kosong = list.filter(item => item.status === 'KOSONG').length;
  const total = list.length;
  const numbers = list.map(i => i.nomorUrut).filter(n => !isNaN(n));
  const terakhir = numbers.length > 0 ? Math.max(...numbers) : config.nomorBaruMulaiDari;

  return {
    total,
    terisi,
    kosong,
    terakhir,
  };
}

export function updateSuratItem(
  updatedSurat: SuratKeluar,
  currentList: SuratKeluar[]
): SuratKeluar[] {
  const listCopy = currentList.map(item =>
    item.id === updatedSurat.id || item.nomorUrut === updatedSurat.nomorUrut ? updatedSurat : item
  );
  listCopy.sort((a, b) => a.nomorUrut - b.nomorUrut);
  saveStoredSuratList(listCopy);
  return listCopy;
}

export function deleteSuratItem(
  nomorUrutOrId: number | string,
  currentList: SuratKeluar[]
): SuratKeluar[] {
  const listCopy = currentList.filter(item =>
    item.id !== nomorUrutOrId && item.nomorUrut !== nomorUrutOrId
  );
  saveStoredSuratList(listCopy);
  return listCopy;
}
