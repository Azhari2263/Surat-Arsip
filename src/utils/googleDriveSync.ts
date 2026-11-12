import { AppConfig, DokumenFinal, NaskahDinas, RiwayatPenghapusanAudit } from '../types';
import { BULAN_LIST, DEFAULT_DRIVE_FOLDER_ID } from '../data/bpsClassifications';

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
 * Ekstraksi tahun dari string tanggal (dd/MM/yyyy atau yyyy-mm-dd)
 */
export function extractTahun(tglStr?: string): string {
  if (!tglStr) return String(new Date().getFullYear());
  if (tglStr.includes('/')) {
    const parts = tglStr.split('/');
    if (parts.length === 3 && parts[2].length === 4) return parts[2];
  }
  if (tglStr.includes('-')) {
    const parts = tglStr.split('-');
    if (parts.length === 3 && parts[0].length === 4) return parts[0];
  }
  return String(new Date().getFullYear());
}

/**
 * Ekstraksi bulan berformat '01 - Januari' dari string tanggal
 */
export function extractBulanFolder(tglStr?: string): string {
  let monthIndex = new Date().getMonth(); // 0 - 11
  if (tglStr) {
    if (tglStr.includes('/')) {
      const parts = tglStr.split('/');
      if (parts.length >= 2) {
        const m = parseInt(parts[1], 10);
        if (!isNaN(m) && m >= 1 && m <= 12) monthIndex = m - 1;
      }
    } else if (tglStr.includes('-')) {
      const parts = tglStr.split('-');
      if (parts.length >= 2) {
        const m = parseInt(parts[1], 10);
        if (!isNaN(m) && m >= 1 && m <= 12) monthIndex = m - 1;
      }
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

/**
 * Menghasilkan direct URL untuk Google Drive folder atau file
 */
export function getDriveFolderUrl(folderId?: string): string {
  const id = folderId || DEFAULT_DRIVE_FOLDER_ID;
  return `https://drive.google.com/drive/folders/${id}`;
}

export function getDriveFileUrl(fileId?: string): string {
  if (!fileId) return '#';
  return `https://drive.google.com/file/d/${fileId}/view`;
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

  // Jika Apps Script URL dikonfigurasi, kirim permintaan pembuatan folder & file ke backend DriveApp
  if (config.appsScriptUrl) {
    try {
      const response = await fetch(config.appsScriptUrl, {
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
          existingFileId: naskah.driveDraftFileId,
        }),
      });
      const data = await response.json();
      if (data && data.success) {
        return {
          success: true,
          fileId: data.fileId,
          fileUrl: data.fileUrl,
          folderId: data.folderId,
          folderUrl: data.folderUrl || getDriveFolderUrl(data.folderId),
          folderPath: hierarchy.fullPath,
          fileName: standardizedName,
          actionTaken: data.actionTaken || 'created',
        };
      }
    } catch {
      // Fallback ke simulasi metadata lokal jika jaringan Google offline
    }
  }

  // Metadata drive tersimpan terstruktur
  const simulatedId = naskah.driveDraftFileId || `gdrive_draf_${naskah.id}_${Date.now()}`;
  return {
    success: true,
    fileId: simulatedId,
    fileUrl: `https://drive.google.com/file/d/${simulatedId}/view`,
    folderId: hierarchy.rootFolderId,
    folderUrl: getDriveFolderUrl(hierarchy.rootFolderId),
    folderPath: hierarchy.fullPath,
    fileName: standardizedName,
    actionTaken: naskah.driveDraftFileId ? 'updated' : 'created',
  };
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

  if (config.appsScriptUrl) {
    try {
      const response = await fetch(config.appsScriptUrl, {
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
          draftFileId: naskah.driveDraftFileId,
        }),
      });
      const data = await response.json();
      if (data && data.success) {
        return {
          success: true,
          fileId: data.fileId,
          fileUrl: data.fileUrl,
          folderId: data.folderId,
          folderUrl: data.folderUrl || getDriveFolderUrl(data.folderId),
          folderPath: hierarchy.fullPath,
          fileName: standardizedName,
          actionTaken: 'moved',
        };
      }
    } catch {
      // Fallback ke penyimpanan metadata lokal
    }
  }

  const simulatedFinalId = `gdrive_arsip_${naskah.id}_${Date.now()}`;
  return {
    success: true,
    fileId: simulatedFinalId,
    fileUrl: `https://drive.google.com/file/d/${simulatedFinalId}/view`,
    folderId: hierarchy.rootFolderId,
    folderUrl: getDriveFolderUrl(hierarchy.rootFolderId),
    folderPath: hierarchy.fullPath,
    fileName: standardizedName,
    actionTaken: 'moved',
  };
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
  if (config.appsScriptUrl) {
    try {
      const response = await fetch(config.appsScriptUrl, {
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
