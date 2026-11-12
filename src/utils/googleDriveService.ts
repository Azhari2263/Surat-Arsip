import { AppConfig, DokumenFinal, GoogleDriveMetadata, NaskahDinas } from '../types';

/**
 * ID Folder Induk Google Drive Resmi
 * Direktori utama repositori dokumen digital BPS Provinsi Kalimantan Barat
 */
export const DEFAULT_GOOGLE_DRIVE_PARENT_FOLDER_ID = '1_Xsmp2dafHvoyhXuhS1x1_GkbWDy7i0S';

/**
 * Daftar nama bulan standar dalam bahasa Indonesia
 */
const BULAN_NAMES = [
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

/**
 * Mendapatkan ID Folder Induk dari konfigurasi atau default
 */
export function getDriveParentFolderId(config?: Partial<AppConfig>): string {
  if (config?.googleDriveParentFolderId && config.googleDriveParentFolderId.trim()) {
    return config.googleDriveParentFolderId.trim();
  }
  return DEFAULT_GOOGLE_DRIVE_PARENT_FOLDER_ID;
}

/**
 * Ekstraksi tahun dari string tanggal (format dd/MM/yyyy atau yyyy-MM-dd)
 */
export function getTahunFromDate(dateStr?: string): string {
  if (!dateStr) return String(new Date().getFullYear());

  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3 && parts[2].length === 4) {
      return parts[2];
    }
  }

  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts[0].length === 4) {
      return parts[0];
    }
  }

  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return String(d.getFullYear());
  }

  return String(new Date().getFullYear());
}

/**
 * Ekstraksi nama bulan dengan format angka + nama (e.g. "02 - Februari")
 */
export function getBulanFolderLabel(dateStr?: string): string {
  let monthIndex = new Date().getMonth();

  if (dateStr) {
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length >= 2) {
        const m = parseInt(parts[1], 10);
        if (m >= 1 && m <= 12) monthIndex = m - 1;
      }
    } else if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length >= 2) {
        const m = parseInt(parts[1], 10);
        if (m >= 1 && m <= 12) monthIndex = m - 1;
      }
    } else {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) monthIndex = d.getMonth();
    }
  }

  const paddedNum = String(monthIndex + 1).padStart(2, '0');
  const name = BULAN_NAMES[monthIndex] || 'Januari';
  return `${paddedNum} - ${name}`;
}

/**
 * Membersihkan karakter khusus untuk penamaan file yang aman di filesystem & Google Drive
 */
export function sanitizeFileName(name: string): string {
  return name
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, '_')
    .replace(/-+/g, '-')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
}

/**
 * Membangun nama file standar untuk berkas Draft
 * Format: DRAF_{nomorRegistrasi}_{perihalSingkat}.docx (atau versi jika ada revisi)
 */
export function buildDraftFileName(
  nomorRegistrasi: string,
  perihal: string,
  versi?: number
): string {
  const safeReg = sanitizeFileName(nomorRegistrasi);
  const safePerihal = sanitizeFileName(perihal);
  const versionSuffix = versi && versi > 1 ? `_Rev${versi}` : '';
  return `DRAF_${safeReg}_${safePerihal}${versionSuffix}.docx`;
}

/**
 * Membangun nama file standar untuk berkas Arsip Digital
 * Format: ARSIP_{nomorSuratResmi}_{perihalSingkat}.pdf
 */
export function buildArsipFileName(nomorSuratResmi: string, perihal: string): string {
  const safeNomor = sanitizeFileName(nomorSuratResmi);
  const safePerihal = sanitizeFileName(perihal);
  return `ARSIP_${safeNomor}_${safePerihal}.pdf`;
}

/**
 * Membangun teks representasi path hierarki Google Drive
 * Hierarki resmi: Folder Induk > Tahun > Tim Kerja > Bulan > Draft / Arsip
 */
export function buildDriveHierarchyPath(
  parentOrDate: string,
  tahunOrTim: string,
  timOrTipe: string,
  bulan?: string,
  tipeFolder?: 'Draft' | 'Arsip',
  fileName?: string
): string {
  // Overload: if called with (dateStr, timKerja, 'Draft' | 'Arsip')
  if (tipeFolder === undefined && (timOrTipe === 'Draft' || timOrTipe === 'Arsip')) {
    const dateStr = parentOrDate;
    const timKerja = tahunOrTim;
    const targetTipe = timOrTipe;
    const t = getTahunFromDate(dateStr);
    const b = getBulanFolderLabel(dateStr);
    return `[Folder Induk: ${DEFAULT_GOOGLE_DRIVE_PARENT_FOLDER_ID.slice(0, 8)}...] / ${t} / ${timKerja || 'Umum'} / ${b} / ${targetTipe}`;
  }

  const parentFolderId = parentOrDate || DEFAULT_GOOGLE_DRIVE_PARENT_FOLDER_ID;
  const tahun = tahunOrTim || String(new Date().getFullYear());
  const cleanTim = timOrTipe || 'Umum';
  const cleanBulan = bulan || getBulanFolderLabel();
  const folderType = tipeFolder || 'Arsip';
  const folderPath = `[Folder Induk: ${parentFolderId.slice(0, 8)}...] / ${tahun} / ${cleanTim} / ${cleanBulan} / ${folderType}`;
  return fileName ? `${folderPath} / ${fileName}` : folderPath;
}

/**
 * Mendapatkan tautan langsung ke folder Google Drive
 */
export function getDriveFolderWebLink(folderId?: string): string {
  const targetId = folderId || DEFAULT_GOOGLE_DRIVE_PARENT_FOLDER_ID;
  return `https://drive.google.com/drive/folders/${targetId}`;
}

/**
 * Membuat objek GoogleDriveMetadata untuk Draf Naskah Dinas
 */
export function createDraftDriveMetadata(
  naskah: Partial<NaskahDinas>,
  config?: Partial<AppConfig>,
  versi?: number
): GoogleDriveMetadata {
  const parentId = getDriveParentFolderId(config);
  const tahun = getTahunFromDate(naskah.tanggalPengajuan);
  const timKerja = naskah.unitKerja || 'Sosial';
  const bulan = getBulanFolderLabel(naskah.tanggalPengajuan);
  const fileName = buildDraftFileName(
    naskah.nomorRegistrasi || 'ND-DRAF',
    naskah.perihal || 'Naskah_Dinas',
    versi
  );
  const hierarchyPath = buildDriveHierarchyPath(parentId, tahun, timKerja, bulan, 'Draft', fileName);

  return {
    parentFolderId: parentId,
    tahun,
    timKerja,
    bulan,
    tipeFolder: 'Draft',
    hierarchyPath,
    fileName,
    webViewLink: getDriveFolderWebLink(parentId),
    waktuSinkronisasi: new Date().toISOString(),
    status: 'TERORGANISIR',
  };
}

/**
 * Membuat objek GoogleDriveMetadata untuk Dokumen Final / Arsip Digital
 */
export function createArsipDriveMetadata(
  naskah: Partial<NaskahDinas>,
  dokumenFinal: DokumenFinal,
  config?: Partial<AppConfig>
): GoogleDriveMetadata {
  const parentId = getDriveParentFolderId(config);
  const tahun = getTahunFromDate(dokumenFinal.tanggalPenetapan || naskah.tanggalPengajuan);
  const timKerja = naskah.unitKerja || 'Sosial';
  const bulan = getBulanFolderLabel(dokumenFinal.tanggalPenetapan || naskah.tanggalPengajuan);
  const fileName = buildArsipFileName(
    dokumenFinal.nomorSuratResmi || naskah.nomorSuratDipesan || 'SURAT-FINAL',
    naskah.perihal || 'Arsip_Digital'
  );
  const hierarchyPath = buildDriveHierarchyPath(parentId, tahun, timKerja, bulan, 'Arsip', fileName);

  return {
    parentFolderId: parentId,
    tahun,
    timKerja,
    bulan,
    tipeFolder: 'Arsip',
    hierarchyPath,
    fileName,
    webViewLink: getDriveFolderWebLink(parentId),
    waktuSinkronisasi: new Date().toISOString(),
    status: 'TERORGANISIR',
  };
}
