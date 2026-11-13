import { AppConfig, DokumenFinal, NaskahDinas, RiwayatPenghapusanAudit } from '../types';
import { BULAN_LIST, DEFAULT_DRIVE_FOLDER_ID } from '../data/bpsClassifications';
import { normalizeAppsScriptUrl } from './apiSync';

export interface DriveFolderHierarchy {
  rootFolderId: string;
  tahun: string;
  timKerja: string;
  bulan: string;
  subfolder: 'Draft' | 'Arsip';
  fullPath: string;
}

export interface DriveFileResult {
  success: boolean;
  fileId?: string;
  fileUrl?: string;
  folderId?: string;
  folderUrl?: string;
  folderPath?: string;
  fileName?: string;
  actionTaken?: 'created' | 'updated' | 'moved';
  error?: string;
}

/**
 * Sanitasi string untuk nama berkas Google Drive agar aman dan rapi
 */
export function sanitizeForFilename(text: string): string {
  if (!text) return 'Naskah';
  return text
    .replace(/[\/\\?%*:|"<>]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 60);
}

/**
 * Ekstraksi tahun dari string tanggal (dd/MM/yyyy, yyyy-mm-dd, atau '12 November 2026')
 */
export function extractTahun(tglStr?: string): string {
  if (!tglStr) return String(new Date().getFullYear());
  const trimmed = tglStr.trim();
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/');
    if (parts.length === 3) {
      const yr = parts[2].slice(0, 4);
      if (/^\d{4}$/.test(yr)) return yr;
    }
  }
  if (trimmed.includes('-')) {
    const parts = trimmed.split('-');
    if (parts.length >= 3 && /^\d{4}$/.test(parts[0])) return parts[0];
  }
  const yearMatch = trimmed.match(/\b(20\d{2})\b/);
  if (yearMatch) return yearMatch[1];
  return String(new Date().getFullYear());
}

/**
 * Ekstraksi bulan berformat '01 - Januari' dari string tanggal
 */
export function extractBulanFolder(tglStr?: string): string {
  let monthIndex = new Date().getMonth(); // 0 - 11
  if (tglStr) {
    const trimmed = tglStr.trim();
    if (trimmed.includes('/')) {
      const parts = trimmed.split('/');
      if (parts.length >= 2) {
        const m = parseInt(parts[1], 10);
        if (!isNaN(m) && m >= 1 && m <= 12) monthIndex = m - 1;
      }
    } else if (trimmed.includes('-')) {
      const parts = trimmed.split('-');
      if (parts.length >= 2) {
        const m = parseInt(parts[1], 10);
        if (!isNaN(m) && m >= 1 && m <= 12) monthIndex = m - 1;
      }
    } else {
      const lower = trimmed.toLowerCase();
      const idx = BULAN_LIST.findIndex((b) => lower.includes(b.toLowerCase()));
      if (idx >= 0) monthIndex = idx;
    }
  }
  const monthNum = String(monthIndex + 1).padStart(2, '0');
  const monthName = BULAN_LIST[monthIndex] || 'Januari';
  return `${monthNum} - ${monthName}`;
}

/**
 * Menghasilkan struktur hierarki folder terpusat:
 * Folder Induk
 * └── {Tahun}
 *     └── {Tim Kerja}
 *         └── {Bulan}
 *             ├── Draft
 *             └── Arsip
 */
export function getDriveFolderHierarchy(
  config: AppConfig,
  timKerja: string,
  tanggal: string,
  subfolder: 'Draft' | 'Arsip'
): DriveFolderHierarchy {
  const rootFolderId = (config.googleDriveFolderId || DEFAULT_DRIVE_FOLDER_ID).trim();
  const tahun = extractTahun(tanggal);
  const cleanTimKerja = timKerja.trim() || 'Tim Umum';
  const bulan = extractBulanFolder(tanggal);

  const fullPath = `Drive BPS Kalbar (${rootFolderId}) > ${tahun} > ${cleanTimKerja} > ${bulan} > ${subfolder}`;

  return {
    rootFolderId,
    tahun,
    timKerja: cleanTimKerja,
    bulan,
    subfolder,
    fullPath,
  };
}

/**
 * Pembuatan nama file draf standar dan konsisten
 * Contoh: DRAF_ND-2026-001_Undangan_Rapat_Koordinasi_12_11_2026.docx
 */
export function generateDraftFileName(
  nomorRegistrasi: string,
  perihal: string,
  tanggal: string,
  extension: string = 'docx'
): string {
  const cleanReg = sanitizeForFilename(nomorRegistrasi);
  const cleanPerihal = sanitizeForFilename(perihal);
  const cleanTgl = sanitizeForFilename(tanggal);
  const ext = extension.replace(/^\./, '');
  return `DRAF_${cleanReg}_${cleanPerihal}_${cleanTgl}.${ext}`;
}

/**
 * Pembuatan nama file arsip final resmi standar dan konsisten
 * Contoh: B-368_6100_VS.100_2026_Undangan_Rapat_Koordinasi_12_11_2026.pdf
 */
export function generateFinalArsipFileName(
  nomorSuratResmi: string,
  perihal: string,
  tanggalPenetapan: string
): string {
  const cleanNomor = sanitizeForFilename(nomorSuratResmi);
  const cleanPerihal = sanitizeForFilename(perihal);
  const cleanTgl = sanitizeForFilename(tanggalPenetapan);
  return `${cleanNomor}_${cleanPerihal}_${cleanTgl}.pdf`;
}

export interface DirectFileInput {
  name: string;
  type?: string;
  size?: number;
  dataUrl?: string;
  driveFileId?: string;
  driveUrl?: string;
  downloadUrl?: string;
  htmlContent?: string;
}

export interface DirectFileAccess {
  fileId: string | null;
  viewUrl: string | null;
  previewUrl: string | null;
  downloadUrl: string | null;
  hasDataUrl: boolean;
  hasHtmlContent: boolean;
  hasAnyAccess: boolean;
}

/**
 * Mengecek apakah URL mengarah ke folder Google Drive atau halaman utama Google Drive
 */
export function isDriveFolderOrRootUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim().toLowerCase();
  if (!trimmed || trimmed === '#') return false;
  if (
    trimmed.includes('/drive/folders') ||
    trimmed.includes('/folders/') ||
    trimmed.includes('/drive/my-drive') ||
    trimmed.includes('/drive/shared-with-me') ||
    trimmed.includes('/drive/recent') ||
    trimmed.includes('/drive/home')
  ) {
    return true;
  }
  if (/^https?:\/\/drive\.google\.com(\/drive(\/u\/\d+)?)?\/?$/.test(trimmed)) {
    return true;
  }
  return false;
}

/**
 * Mengekstrak Google Drive File ID yang valid dari raw ID atau tautan file Drive.
 * Selalu menolak folder URL, beranda Drive, ID folder induk, dan ID simulasi lokal.
 */
export function extractDriveFileId(fileIdOrUrl?: string, rootFolderId?: string): string | null {
  if (!fileIdOrUrl || typeof fileIdOrUrl !== 'string') return null;
  const trimmed = fileIdOrUrl.trim();
  if (!trimmed || trimmed === '#') return null;
  if (isDriveFolderOrRootUrl(trimmed)) return null;
  if (trimmed.includes('gdrive_draf_') || trimmed.startsWith('gdrive_draf_') || trimmed.includes('gdrive_arsip_') || trimmed.startsWith('gdrive_arsip_')) {
    return null;
  }

  let candidate: string | null = null;
  const filePathMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]{15,})/);
  if (filePathMatch) {
    candidate = filePathMatch[1];
  } else {
    const queryIdMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{15,})/);
    if (queryIdMatch && !trimmed.includes('/folders')) {
      candidate = queryIdMatch[1];
    } else if (/^[a-zA-Z0-9_-]{15,}$/.test(trimmed)) {
      candidate = trimmed;
    }
  }

  if (!candidate) return null;
  if (
    candidate === DEFAULT_DRIVE_FOLDER_ID ||
    (rootFolderId && candidate === rootFolderId.trim()) ||
    candidate.startsWith('gdrive_draf_') ||
    candidate.startsWith('gdrive_arsip_')
  ) {
    return null;
  }
  return candidate;
}

/**
 * Menghasilkan direct URL untuk Google Drive folder atau file
 */
export function getDriveFolderUrl(folderId?: string): string {
  const id = folderId || DEFAULT_DRIVE_FOLDER_ID;
  return `https://drive.google.com/drive/folders/${id}`;
}

export function isRealDriveFileId(fileId?: string, rootFolderId?: string): boolean {
  return extractDriveFileId(fileId, rootFolderId) !== null;
}

export function getDriveFileUrl(fileIdOrUrl?: string, rootFolderId?: string): string {
  const id = extractDriveFileId(fileIdOrUrl, rootFolderId);
  if (!id) return '';
  return `https://drive.google.com/file/d/${id}/view`;
}

export function getDrivePreviewUrl(fileIdOrUrl?: string, rootFolderId?: string): string {
  const id = extractDriveFileId(fileIdOrUrl, rootFolderId);
  if (!id) return '';
  return `https://drive.google.com/file/d/${id}/preview`;
}

export function getDriveDownloadUrl(fileIdOrUrl?: string, rootFolderId?: string): string {
  const id = extractDriveFileId(fileIdOrUrl, rootFolderId);
  if (!id) return '';
  return `https://drive.google.com/uc?export=download&id=${id}`;
}

/**
 * Menyelesaikan tautan akses file langsung (view / preview / download) tanpa pernah mengarahkan ke folder.
 */
export function resolveDirectFileAccess(
  file?: DirectFileInput | null,
  rootFolderId?: string
): DirectFileAccess {
  if (!file) {
    return {
      fileId: null,
      viewUrl: null,
      previewUrl: null,
      downloadUrl: null,
      hasDataUrl: false,
      hasHtmlContent: false,
      hasAnyAccess: false,
    };
  }

  const fileId =
    extractDriveFileId(file.driveFileId, rootFolderId) ||
    extractDriveFileId(file.driveUrl, rootFolderId) ||
    extractDriveFileId(file.downloadUrl, rootFolderId);

  const viewUrl = fileId ? getDriveFileUrl(fileId, rootFolderId) : null;
  const previewUrl = fileId ? getDrivePreviewUrl(fileId, rootFolderId) : null;
  const downloadUrl = fileId ? getDriveDownloadUrl(fileId, rootFolderId) : null;

  const hasDataUrl = typeof file.dataUrl === 'string' && file.dataUrl.startsWith('data:') && file.dataUrl.includes(',');
  const hasHtmlContent = typeof file.htmlContent === 'string' && file.htmlContent.trim().length > 0;

  return {
    fileId,
    viewUrl: viewUrl || null,
    previewUrl: previewUrl || null,
    downloadUrl: downloadUrl || null,
    hasDataUrl,
    hasHtmlContent,
    hasAnyAccess: Boolean(hasDataUrl || hasHtmlContent || fileId),
  };
}

/**
 * Mengonversi dataUrl base64/plain menjadi Blob agar aman diunduh & ditampilkan di browser modern
 */
export function dataUrlToBlob(dataUrl: string, fallbackMime = 'application/octet-stream'): Blob | null {
  try {
    if (!dataUrl || !dataUrl.startsWith('data:')) return null;
    const commaIdx = dataUrl.indexOf(',');
    if (commaIdx === -1) return null;
    const header = dataUrl.slice(5, commaIdx);
    const body = dataUrl.slice(commaIdx + 1);
    const isBase64 = header.includes(';base64');
    const mimeType = header.split(';')[0] || fallbackMime;

    if (isBase64) {
      const binaryString = atob(body);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return new Blob([bytes], { type: mimeType });
    }
    const decoded = decodeURIComponent(body);
    return new Blob([decoded], { type: mimeType });
  } catch {
    return null;
  }
}

/**
 * Memicu pengunduhan file secara langsung ke perangkat pengguna (Blob lokal atau direct download Google Drive).
 * Tidak pernah membuka folder Google Drive atau halaman beranda Drive.
 */
export function triggerDirectDownload(
  file?: DirectFileInput | null,
  rootFolderId?: string
): { ok: boolean; method: 'blob' | 'drive' | 'none'; reason?: string } {
  if (!file) {
    return { ok: false, method: 'none', reason: 'Data berkas tidak tersedia.' };
  }

  const access = resolveDirectFileAccess(file, rootFolderId);

  if (access.hasDataUrl && file.dataUrl) {
    const blob = dataUrlToBlob(file.dataUrl, file.type || 'application/octet-stream');
    if (blob) {
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = file.name || 'dokumen';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
      return { ok: true, method: 'blob' };
    }
  }

  if (access.hasHtmlContent && file.htmlContent) {
    const blob = new Blob([file.htmlContent], { type: file.type || 'application/msword;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = file.name || 'dokumen.doc';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
    return { ok: true, method: 'blob' };
  }

  if (access.downloadUrl) {
    const a = document.createElement('a');
    a.href = access.downloadUrl;
    a.target = '_blank';
    a.rel = 'noreferrer';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return { ok: true, method: 'drive' };
  }

  return {
    ok: false,
    method: 'none',
    reason: 'Berkas belum tersedia secara lokal maupun terhubung dengan File ID Google Drive.',
  };
}

/**
 * Sinkronisasi pembuatan file draf ke Google Drive via Google Apps Script
 */
export async function uploadDraftToDriveSync(
  naskah: NaskahDinas,
  config: AppConfig,
  fileData?: { name: string; size: number; type: string; dataUrl?: string }
): Promise<DriveFileResult> {
  const targetFile = fileData || naskah.drafFile;
  const ext = targetFile.name.split('.').pop() || 'docx';
  const hierarchy = getDriveFolderHierarchy(
    config,
    naskah.unitKerja,
    naskah.tanggalSurat || naskah.tanggalPengajuan,
    'Draft'
  );

  const standardizedName = generateDraftFileName(
    naskah.nomorRegistrasi,
    naskah.perihal,
    naskah.tanggalSurat || naskah.tanggalPengajuan,
    ext
  );

  const cleanScriptUrl = normalizeAppsScriptUrl(config.appsScriptUrl);
  if (!cleanScriptUrl) {
    return {
      success: false,
      folderId: hierarchy.rootFolderId,
      folderPath: hierarchy.fullPath,
      fileName: standardizedName,
      error: 'URL Google Apps Script belum dikonfigurasi.',
    };
  }

  try {
    const response = await fetch(cleanScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'uploadDraftToDrive',
        rootFolderId: hierarchy.rootFolderId,
        tahun: hierarchy.tahun,
        timKerja: hierarchy.timKerja,
        bulan: hierarchy.bulan,
        nomorRegistrasi: naskah.nomorRegistrasi,
        fileName: standardizedName,
        mimeType: targetFile.type,
        fileDataUrl: targetFile.dataUrl,
        existingFileId: isRealDriveFileId(naskah.driveDraftFileId, hierarchy.rootFolderId)
          ? naskah.driveDraftFileId
          : undefined,
      }),
    });
    const text = await response.text();
    const data = JSON.parse(text);
    const validFileId = extractDriveFileId(data?.fileId || data?.fileUrl, hierarchy.rootFolderId);
    if (data && data.success && validFileId) {
      return {
        success: true,
        fileId: validFileId,
        fileUrl: getDriveFileUrl(validFileId, hierarchy.rootFolderId),
        folderId: data.folderId,
        folderUrl: data.folderUrl || getDriveFolderUrl(data.folderId),
        folderPath: hierarchy.fullPath,
        fileName: standardizedName,
        actionTaken: data.actionTaken || 'created',
      };
    }
    return {
      success: false,
      folderId: hierarchy.rootFolderId,
      folderPath: hierarchy.fullPath,
      fileName: standardizedName,
      error: data?.error || 'Apps Script tidak mengembalikan File ID Google Drive yang valid.',
    };
  } catch (err: any) {
    return {
      success: false,
      folderId: hierarchy.rootFolderId,
      folderPath: hierarchy.fullPath,
      fileName: standardizedName,
      error: err?.message || 'Gagal mengunggah draf ke Google Drive.',
    };
  }
}

/**
 * Sinkronisasi perpindahan / penyimpanan dokumen final ke subfolder 'Arsip'
 */
export async function archiveFinalToDriveSync(
  naskah: NaskahDinas,
  dokumenFinal: DokumenFinal,
  config: AppConfig
): Promise<DriveFileResult> {
  const hierarchy = getDriveFolderHierarchy(
    config,
    naskah.unitKerja,
    dokumenFinal.tanggalPenetapan || naskah.tanggalPengajuan,
    'Arsip'
  );

  const standardizedName = generateFinalArsipFileName(
    dokumenFinal.nomorSuratResmi,
    naskah.perihal,
    dokumenFinal.tanggalPenetapan
  );

  const cleanScriptUrl = normalizeAppsScriptUrl(config.appsScriptUrl);
  if (!cleanScriptUrl) {
    return {
      success: false,
      folderId: hierarchy.rootFolderId,
      folderPath: hierarchy.fullPath,
      fileName: standardizedName,
      error: 'URL Google Apps Script belum dikonfigurasi.',
    };
  }

  try {
    const response = await fetch(cleanScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'archiveFinalToDrive',
        rootFolderId: hierarchy.rootFolderId,
        tahun: hierarchy.tahun,
        timKerja: hierarchy.timKerja,
        bulan: hierarchy.bulan,
        nomorRegistrasi: naskah.nomorRegistrasi,
        nomorSuratResmi: dokumenFinal.nomorSuratResmi,
        fileName: standardizedName,
        mimeType: 'application/pdf',
        fileDataUrl: dokumenFinal.dataUrl,
        draftFileId: isRealDriveFileId(naskah.driveDraftFileId, hierarchy.rootFolderId)
          ? naskah.driveDraftFileId
          : undefined,
      }),
    });
    const text = await response.text();
    const data = JSON.parse(text);
    const validFileId = extractDriveFileId(data?.fileId || data?.fileUrl, hierarchy.rootFolderId);
    if (data && data.success && validFileId) {
      return {
        success: true,
        fileId: validFileId,
        fileUrl: getDriveFileUrl(validFileId, hierarchy.rootFolderId),
        folderId: data.folderId,
        folderUrl: data.folderUrl || getDriveFolderUrl(data.folderId),
        folderPath: hierarchy.fullPath,
        fileName: standardizedName,
        actionTaken: 'moved',
      };
    }
    return {
      success: false,
      folderId: hierarchy.rootFolderId,
      folderPath: hierarchy.fullPath,
      fileName: standardizedName,
      error: data?.error || 'Apps Script tidak mengembalikan File ID Google Drive yang valid.',
    };
  } catch (err: any) {
    return {
      success: false,
      folderId: hierarchy.rootFolderId,
      folderPath: hierarchy.fullPath,
      fileName: standardizedName,
      error: err?.message || 'Gagal mengarsipkan dokumen ke Google Drive.',
    };
  }
}

/**
 * Sinkronisasi penghapusan seluruh berkas terkait pengajuan/arsip dari Google Drive
 * Mengidentifikasi berkas berdasarkan File ID unik Google Drive
 */
export async function deleteDriveFilesSync(
  fileIds: (string | undefined)[],
  context: {
    nomorRegistrasi?: string;
    nomorSurat?: string;
    nomorIdentitas?: string;
    tipe?: 'DRAF' | 'ARSIP';
    perihal?: string;
  },
  config: AppConfig,
  actor: {
    nama: string;
    role: string;
  }
): Promise<{
  success: boolean;
  deletedCount: number;
  deletedIds: string[];
  failedIds: any[];
  error?: string;
  auditRecord: RiwayatPenghapusanAudit;
}> {
  // Filter file ID yang valid (bukan null/kosong dan bukan ID folder induk)
  const validFileIds: string[] = fileIds.filter(
    (id): id is string =>
      Boolean(id) &&
      typeof id === 'string' &&
      id.trim().length > 5 &&
      id !== DEFAULT_DRIVE_FOLDER_ID &&
      id !== config.googleDriveFolderId
  );

  const nomorId = context.nomorIdentitas || context.nomorRegistrasi || context.nomorSurat || '-';
  const now = new Date();
  const waktuStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

  if (validFileIds.length === 0) {
    const auditRecord: RiwayatPenghapusanAudit = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      waktu: waktuStr,
      pengguna: actor.nama,
      dihapusOleh: actor.nama,
      rolePengguna: actor.role,
      role: actor.role,
      tipe: context.tipe || 'DRAF',
      tipeData: context.tipe === 'ARSIP' ? 'ARSIP_DIGITAL' : 'NASKAH_DRAF',
      nomorIdentifikasi: nomorId,
      nomorIdentitas: nomorId,
      perihal: context.perihal || '-',
      unitKerja: 'BPS Kalbar',
      fileIdsDrive: [],
      statusDrive: 'TIDAK_ADA_FILE',
      jumlahFileDihapus: 0,
      keterangan: 'Tidak terdapat berkas Google Drive terdaftar untuk item ini.',
    };

    return {
      success: true,
      deletedCount: 0,
      deletedIds: [],
      failedIds: [],
      auditRecord,
    };
  }

  let success = true;
  let deletedCount = validFileIds.length;
  let deletedIds = validFileIds;
  let failedIds: any[] = [];
  let errorMsg: string | undefined = undefined;

  // Jika Apps Script terhubung, kirim perintah penghapusan berkas via DriveApp
  const cleanScriptUrl = normalizeAppsScriptUrl(config.appsScriptUrl);
  if (cleanScriptUrl) {
    try {
      const response = await fetch(cleanScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'deleteDriveFiles',
          fileIds: validFileIds,
          nomorRegistrasi: context.nomorRegistrasi || nomorId,
          nomorSurat: context.nomorSurat || nomorId,
          perihal: context.perihal || '-',
          actor: actor.nama,
          actorRole: actor.role,
          spreadsheetId: config.spreadsheetId,
        }),
      });
      const data = await response.json();
      if (data) {
        success = data.success !== false;
        deletedCount = typeof data.deletedCount === 'number' ? data.deletedCount : validFileIds.length;
        deletedIds = data.deletedIds || validFileIds;
        failedIds = data.failedIds || [];
        errorMsg = data.error;
      }
    } catch (err: any) {
      // Fallback lokal jika jaringan offline
      success = false;
      deletedCount = 0;
      deletedIds = [];
      failedIds = validFileIds.map((id) => ({ id, error: err.message || 'Gagal koneksi' }));
      errorMsg = err.message || 'Koneksi ke Apps Script gagal';
    }
  }

  const auditRecord: RiwayatPenghapusanAudit = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    waktu: waktuStr,
    pengguna: actor.nama,
    dihapusOleh: actor.nama,
    rolePengguna: actor.role,
    role: actor.role,
    tipe: context.tipe || 'DRAF',
    tipeData: context.tipe === 'ARSIP' ? 'ARSIP_DIGITAL' : 'NASKAH_DRAF',
    nomorIdentifikasi: nomorId,
    nomorIdentitas: nomorId,
    perihal: context.perihal || '-',
    unitKerja: 'BPS Kalbar',
    fileIdsDrive: validFileIds,
    statusDrive: success ? 'BERHASIL' : 'GAGAL',
    jumlahFileDihapus: deletedCount,
    keterangan: success
      ? `${deletedCount} file Google Drive berhasil dihapus.`
      : `Penghapusan Google Drive gagal: ${errorMsg || 'Izin ditolak'}.`,
  };

  return {
    success,
    deletedCount,
    deletedIds,
    failedIds,
    error: errorMsg,
    auditRecord,
  };
}
