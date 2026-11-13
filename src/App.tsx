import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  AktivitasNotifikasi,
  AppConfig,
  ArsipDigitalRecord,
  ChecklistVerifikasi,
  DokumenFinal,
  DriveArchiveFile,
  JenisNaskahDinas,
  NaskahDinas,
  RiwayatPenghapusanAudit,
  SubmitResult,
  SubmitSuratPayload,
  SuratKeluar,
  TipeAktivitas,
  UserProfile,
} from './types';
import {
  computeStats,
  getNextNomorBaru,
  getStoredConfig,
  getStoredSuratList,
  processSubmitSurat,
  saveStoredConfig,
  saveStoredSuratList,
  updateSuratItem,
  deleteSuratItem,
} from './utils/storage';
import {
  addNaskahDinas,
  arsipkanNaskahFinal,
  getStoredNaskahList,
  saveStoredNaskahList,
  updateVerifikasiNaskah,
  uploadRevisiNaskah,
  deleteNaskahDinas,
  updateNaskahMetadata,
  updateArsipMetadata,
  deleteArsipItem,
  terbitkanNomorSuratNaskah,
  bukaKembaliNaskahAdmin,
} from './utils/naskahStorage';
import {
  getStoredUserList,
  saveStoredUserList,
  addUserItem,
  updateUserItem,
  deleteUserItem,
  getStandardInitialAccounts,
} from './utils/userStorage';
import { DEFAULT_CONFIG } from './data/bpsClassifications';
import { INITIAL_SURAT_LIST } from './data/initialData';
import { INITIAL_NASKAH_LIST } from './data/initialNaskahData';

// Components
import { Header, MainNavTab } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { NaskahDashboard } from './components/NaskahDashboard';
import { PengajuanDrafView } from './components/PengajuanDrafView';
import { VerifikasiView } from './components/VerifikasiView';
import { ArsipDigitalView } from './components/ArsipDigitalView';
import { PedomanReferensiView } from './components/PedomanReferensiView';
import { UserManagementView } from './components/UserManagementView';
import { RevisiModal } from './components/RevisiModal';
import { UnggahFinalModal } from './components/UnggahFinalModal';
import { SetupDatabaseModal } from './components/SetupDatabaseModal';

// Penomoran Surat Keluar Components
import { StatsBar } from './components/StatsBar';
import { LetterForm } from './components/LetterForm';
import { ResultCard } from './components/ResultCard';
import { RegisterTable } from './components/RegisterTable';
import { EmptyNumbersView } from './components/EmptyNumbersView';
import { StatsAnalyticsView } from './components/StatsAnalyticsView';
import { SettingsModal } from './components/SettingsModal';
import { PrintReceiptModal } from './components/PrintReceiptModal';
import { HelpFloatingButton } from './components/HelpFloatingButton';
import {
  sendAppsScriptAction,
  fetchSpreadsheetData,
  syncUpdateSurat,
  syncDeleteSurat,
  syncDeleteNaskah,
  syncUpdateArsip,
  syncDeleteArsip,
  syncSaveUser,
  syncDeleteUser,
  syncSaveSpreadsheetConfig,
  syncLogActivity,
} from './utils/apiSync';
import { ExternalLink, Layers, FileText, Table2, BarChart3, ShieldAlert } from 'lucide-react';
import { parseCurrentRoute, navigateTo, checkTabPermission } from './utils/router';
import {
  uploadDraftToDriveSync,
  archiveFinalToDriveSync,
  deleteDriveFilesSync,
  generateFinalArsipFileName,
  getDriveFileUrl,
  isRealDriveFileId,
  extractDriveFileId,
} from './utils/googleDriveSync';

const STORAGE_KEY_AUTH_USER = 'bps_kalbar_active_user_v1';
const STORAGE_KEY_NOTIFIKASI = 'bps_kalbar_notifikasi_v1';
const STORAGE_KEY_AUDIT_PENGHAPUSAN = 'bps_kalbar_audit_penghapusan_v1';

const ALL_VERIFIER_ROLES = [
  'VERIFIKATOR_YUN',
  'VERIFIKATOR_AMANDA',
  'VERIFIKATOR_RANIA',
  'VERIFIKATOR_VIVI',
  'VERIFIKATOR_AGUS',
];

const ALL_STANDARD_ROLES = ['ADMIN', 'ARSIPARIS', 'KONSEPTOR', ...ALL_VERIFIER_ROLES];

const VALID_TIPE_AKTIVITAS: TipeAktivitas[] = [
  'PENGAJUAN_DRAF',
  'VERIFIKASI_SETUJU',
  'VERIFIKASI_PERBAIKAN',
  'VERIFIKASI_TOLAK',
  'NOMOR_TERBIT',
  'UNGGAH_FINAL',
  'BUKA_KEMBALI',
  'HAPUS_NASKAH',
  'HAPUS_ARSIP',
  'PENGATURAN_UPDATE',
];

function resolveTipeAktivitas(rawTipe: any): TipeAktivitas {
  const upper = String(rawTipe || '').trim().toUpperCase();
  if ((VALID_TIPE_AKTIVITAS as string[]).includes(upper)) {
    return upper as TipeAktivitas;
  }
  if (upper.includes('PERBAIKAN') || upper.includes('REVISI')) return 'VERIFIKASI_PERBAIKAN';
  if (upper.includes('TOLAK')) return 'VERIFIKASI_TOLAK';
  if (upper.includes('SETUJU')) return 'VERIFIKASI_SETUJU';
  if (upper.includes('NOMOR')) return 'NOMOR_TERBIT';
  if (upper.includes('UNGGAH') || upper.includes('FINAL')) return 'UNGGAH_FINAL';
  if (upper.includes('BUKA')) return 'BUKA_KEMBALI';
  if (upper.includes('HAPUS') && upper.includes('ARSIP')) return 'HAPUS_ARSIP';
  if (upper.includes('HAPUS')) return 'HAPUS_NASKAH';
  if (upper.includes('DRAF') || upper.includes('PENGAJUAN')) return 'PENGAJUAN_DRAF';
  return 'PENGATURAN_UPDATE';
}

function mapRemoteLogToNotifikasi(rawLog: any): AktivitasNotifikasi {
  const tipeAktivitas = resolveTipeAktivitas(rawLog?.tipeAktivitas || rawLog?.tipe || rawLog?.aktivitas);
  const nomorRegistrasi = rawLog?.nomorRegistrasi && rawLog.nomorRegistrasi !== '-' ? String(rawLog.nomorRegistrasi) : undefined;
  const nomorSurat = rawLog?.nomorSurat && rawLog.nomorSurat !== '-' ? String(rawLog.nomorSurat) : undefined;
  const regLabel = nomorRegistrasi ? `: ${nomorRegistrasi}` : '';
  const suratLabel = nomorSurat ? `: ${nomorSurat}` : regLabel;

  let defaultJudul = `Aktivitas Sistem${suratLabel}`;
  let defaultRoles: string[] = ['ADMIN', 'ARSIPARIS'];
  switch (tipeAktivitas) {
    case 'PENGAJUAN_DRAF':
      defaultJudul = `Draf Baru Diajukan${regLabel}`;
      defaultRoles = ['ADMIN', ...ALL_VERIFIER_ROLES];
      break;
    case 'VERIFIKASI_SETUJU':
      defaultJudul = `Draf Disetujui${regLabel}`;
      defaultRoles = ['ADMIN', 'ARSIPARIS', 'KONSEPTOR'];
      break;
    case 'VERIFIKASI_PERBAIKAN':
      defaultJudul = `Perlu Perbaikan${regLabel}`;
      defaultRoles = ['ADMIN', 'KONSEPTOR'];
      break;
    case 'VERIFIKASI_TOLAK':
      defaultJudul = `Draf Ditolak${regLabel}`;
      defaultRoles = ['ADMIN', 'KONSEPTOR'];
      break;
    case 'NOMOR_TERBIT':
      defaultJudul = `Nomor Surat Terbit${suratLabel}`;
      defaultRoles = ['ADMIN', 'ARSIPARIS', 'KONSEPTOR'];
      break;
    case 'UNGGAH_FINAL':
      defaultJudul = `Arsip Final Tersimpan${suratLabel}`;
      defaultRoles = ['ADMIN', 'ARSIPARIS', 'KONSEPTOR'];
      break;
    case 'BUKA_KEMBALI':
      defaultJudul = `Pengajuan Dibuka Kembali${regLabel}`;
      defaultRoles = ['ADMIN', 'KONSEPTOR', ...ALL_VERIFIER_ROLES];
      break;
    case 'HAPUS_NASKAH':
      defaultJudul = `Naskah Dihapus${regLabel}`;
      defaultRoles = ['ADMIN'];
      break;
    case 'HAPUS_ARSIP':
      defaultJudul = `Arsip Dihapus${suratLabel}`;
      defaultRoles = ['ADMIN', 'ARSIPARIS'];
      break;
    case 'PENGATURAN_UPDATE':
      defaultJudul = 'Konfigurasi Sistem Diperbarui';
      defaultRoles = ['ADMIN'];
      break;
  }

  const targetRoles =
    Array.isArray(rawLog?.targetRoles) && rawLog.targetRoles.filter(Boolean).length > 0
      ? rawLog.targetRoles.filter(Boolean)
      : defaultRoles;

  return {
    id: String(rawLog?.id || `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
    waktu: String(rawLog?.waktu || 'Baru saja'),
    judul: String(rawLog?.judul || defaultJudul),
    deskripsi: String(rawLog?.deskripsi || rawLog?.pesan || rawLog?.keterangan || 'Pembaruan aktivitas tata kelola naskah dinas.'),
    pelaku: String(rawLog?.pelaku || rawLog?.aktor || rawLog?.pengguna || 'Petugas BPS'),
    rolePelaku: String(rawLog?.rolePelaku || rawLog?.roleAktor || rawLog?.role || '-'),
    naskahId: rawLog?.naskahId ? String(rawLog.naskahId) : undefined,
    nomorRegistrasi,
    nomorSurat,
    tipeAktivitas,
    targetRoles,
    targetKonseptor: rawLog?.targetKonseptor ? String(rawLog.targetKonseptor) : undefined,
    dibaca: Boolean(rawLog?.dibaca),
  };
}

function normalizeMatchToken(val?: string): string {
  return String(val || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function mergeRemoteNaskahPreservingLocalFiles(
  remoteList: NaskahDinas[],
  localList: NaskahDinas[],
  rootFolderId?: string
): NaskahDinas[] {
  const localById = new Map<string, NaskahDinas>();
  const localByReg = new Map<string, NaskahDinas>();
  localList.forEach((item) => {
    localById.set(item.id, item);
    if (item.nomorRegistrasi) localByReg.set(item.nomorRegistrasi, item);
  });

  return remoteList.map((remote) => {
    const local = localById.get(remote.id) || localByReg.get(remote.nomorRegistrasi);
    const validRemoteDraftId = extractDriveFileId(
      remote.driveDraftFileId || remote.driveDraftUrl,
      rootFolderId
    );
    const validLocalDraftId = extractDriveFileId(
      local?.driveDraftFileId || local?.driveDraftUrl,
      rootFolderId
    );
    const resolvedDraftId = validRemoteDraftId || validLocalDraftId || undefined;

    const mergedDrafFile =
      remote.drafFile && !remote.drafFile.dataUrl && local?.drafFile?.dataUrl && local.drafFile.name === remote.drafFile.name
        ? { ...remote.drafFile, dataUrl: local.drafFile.dataUrl }
        : remote.drafFile;

    let mergedDokumenFinal = remote.dokumenFinal;
    if (remote.dokumenFinal) {
      const validRemoteFinalId = extractDriveFileId(
        remote.dokumenFinal.driveFileId || remote.dokumenFinal.driveUrl,
        rootFolderId
      );
      const validLocalFinalId = extractDriveFileId(
        local?.dokumenFinal?.driveFileId || local?.dokumenFinal?.driveUrl,
        rootFolderId
      );
      const resolvedFinalId = validRemoteFinalId || validLocalFinalId || undefined;
      mergedDokumenFinal = {
        ...remote.dokumenFinal,
        dataUrl:
          remote.dokumenFinal.dataUrl ||
          (local?.dokumenFinal?.dataUrl && local.dokumenFinal.namaFile === remote.dokumenFinal.namaFile
            ? local.dokumenFinal.dataUrl
            : remote.dokumenFinal.dataUrl),
        driveFileId: resolvedFinalId,
        driveUrl: resolvedFinalId ? getDriveFileUrl(resolvedFinalId, rootFolderId) : undefined,
      };
    }

    return {
      ...remote,
      drafFile: mergedDrafFile,
      dokumenFinal: mergedDokumenFinal,
      driveDraftFileId: resolvedDraftId,
      driveDraftUrl: resolvedDraftId ? getDriveFileUrl(resolvedDraftId, rootFolderId) : undefined,
    };
  });
}

export default function App() {
  // Config & Data state
  const [config, setConfig] = useState<AppConfig>(getStoredConfig);
  const [suratList, setSuratList] = useState<SuratKeluar[]>(getStoredSuratList);
  const [naskahList, setNaskahList] = useState<NaskahDinas[]>(getStoredNaskahList);
  const [arsipSheetList, setArsipSheetList] = useState<ArsipDigitalRecord[]>([]);
  const [driveFilesList, setDriveFilesList] = useState<DriveArchiveFile[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // User Management State (bersumber dari Google Spreadsheet sheet Pengguna)
  const [userList, setUserList] = useState<UserProfile[]>(() => {
    const stored = getStoredUserList();
    return stored.length > 0 ? stored : getStandardInitialAccounts();
  });
  const [isSyncingUsers, setIsSyncingUsers] = useState<boolean>(false);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_AUTH_USER);
      if (stored) {
        const parsed = JSON.parse(stored);
        const list = getStoredUserList();
        const activeList = list.length > 0 ? list : getStandardInitialAccounts();
        const matched = activeList.find((u) => u.id === parsed.id || u.username.toLowerCase() === parsed.username.toLowerCase());
        return matched || null;
      }
      return null; // Show Login Screen first if not logged in
    } catch {
      return null;
    }
  });

  // Active Navigation Tab with Route Sync
  const [activeTab, setActiveTab] = useState<MainNavTab>(() => {
    const route = parseCurrentRoute();
    return route.tab || 'dashboard';
  });

  // Penomoran sub-tabs (Buku Register Keluar26, Nomor Kosong, Form Input, Statistik)
  const [penomoranSubTab, setPenomoranSubTab] = useState<'register' | 'kosong' | 'stats' | 'form'>(() => {
    const route = parseCurrentRoute();
    if (route.tab === 'penomoran' && route.subTab && ['register', 'kosong', 'stats', 'form'].includes(route.subTab)) {
      return route.subTab as 'register' | 'kosong' | 'stats' | 'form';
    }
    return 'register';
  });
  const [lastSubmittedSurat, setLastSubmittedSurat] = useState<SubmitResult | null>(null);
  const [preselectedKosong, setPreselectedKosong] = useState<SuratKeluar | null>(null);

  // Modals
  const [selectedForRevisi, setSelectedForRevisi] = useState<NaskahDinas | null>(null);
  const [selectedForFinal, setSelectedForFinal] = useState<NaskahDinas | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showSetupDatabase, setShowSetupDatabase] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // In-App Real-Time Activity Notifications State
  const [notifications, setNotifications] = useState<AktivitasNotifikasi[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_NOTIFIKASI);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item) => mapRemoteLogToNotifikasi(item));
        }
      }
    } catch {}
    return [
      {
        id: 'notif-init-1',
        waktu: 'Hari ini',
        judul: 'Sistem Terhubung',
        deskripsi: 'Sistem Pengelolaan Naskah Dinas & Arsip Digital BPS Kalbar siap digunakan.',
        pelaku: 'Sistem BPS Kalbar',
        rolePelaku: 'ADMIN',
        tipeAktivitas: 'PENGATURAN_UPDATE',
        targetRoles: ALL_STANDARD_ROLES,
        dibaca: false,
      },
    ];
  });

  // Audit Log Penghapusan Data & Google Drive Files
  const [riwayatPenghapusanAudit, setRiwayatPenghapusanAudit] = useState<RiwayatPenghapusanAudit[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_AUDIT_PENGHAPUSAN);
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  });

  // Add Notification Helper (Local state + optional Google Spreadsheet LogAktivitas sync)
  const addActivityNotification = (
    notifData: Omit<AktivitasNotifikasi, 'id' | 'waktu' | 'dibaca'>,
    options?: { syncRemote?: boolean }
  ) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;
    const cleanTargetRoles = Array.from(new Set((notifData.targetRoles || []).filter(Boolean)));
    const newNotif: AktivitasNotifikasi = {
      ...notifData,
      targetRoles: cleanTargetRoles.length > 0 ? cleanTargetRoles : ['ADMIN'],
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      waktu: timeStr,
      dibaca: false,
    };

    setNotifications((prev) => {
      const updated = [newNotif, ...prev].slice(0, 100);
      try {
        localStorage.setItem(STORAGE_KEY_NOTIFIKASI, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (options?.syncRemote !== false && config.appsScriptUrl) {
      syncLogActivity(newNotif, config).catch(() => {});
    }
  };

  const handleMarkNotificationRead = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, dibaca: true } : n));
      try {
        localStorage.setItem(STORAGE_KEY_NOTIFIKASI, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, dibaca: true }));
      try {
        localStorage.setItem(STORAGE_KEY_NOTIFIKASI, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Ref to track last seen naskah list for diffing during polling
  const previousNaskahMapRef = useRef<Map<string, NaskahDinas>>(new Map());

  // Continuous background sync from Spreadsheet and periodic polling
  useEffect(() => {
    let isMounted = true;
    if (!config.appsScriptUrl || !config.spreadsheetId) return;

    const intervalSec = Math.max(5, config.syncIntervalSeconds || 10);

    const performSync = async (isInitial = false) => {
      if (isInitial) setIsSyncing(true);
      try {
        const res = await fetchSpreadsheetData(config);
        if (!isMounted || !res.success) return;

        // Remote Config Auto-Sync (hanya gabungkan kunci bernilai valid)
        if (res.remoteConfig && Object.keys(res.remoteConfig).length > 0) {
          setConfig((prev) => {
            const safeRemote: Partial<AppConfig> = {};
            const rc = res.remoteConfig!;
            if (rc.nomorBaruMulaiDari && rc.nomorBaruMulaiDari > 0) safeRemote.nomorBaruMulaiDari = rc.nomorBaruMulaiDari;
            if (rc.kodeUnit && rc.kodeUnit.trim()) safeRemote.kodeUnit = rc.kodeUnit.trim();
            if (rc.whatsappAdmin && rc.whatsappAdmin.trim()) safeRemote.whatsappAdmin = rc.whatsappAdmin.trim();
            if (rc.enableMondayRule !== undefined) safeRemote.enableMondayRule = rc.enableMondayRule;
            if (rc.googleDriveFolderId && rc.googleDriveFolderId.trim()) safeRemote.googleDriveFolderId = rc.googleDriveFolderId.trim();
            if (rc.syncIntervalSeconds && rc.syncIntervalSeconds >= 5) safeRemote.syncIntervalSeconds = rc.syncIntervalSeconds;
            if (Array.isArray(rc.daftarTimKerja) && rc.daftarTimKerja.length > 0) safeRemote.daftarTimKerja = rc.daftarTimKerja;
            if (rc.pemetaanVerifikator && Object.keys(rc.pemetaanVerifikator).length > 0) safeRemote.pemetaanVerifikator = rc.pemetaanVerifikator;
            if (rc.lastConfigUpdate) safeRemote.lastConfigUpdate = rc.lastConfigUpdate;
            if (rc.updatedBy) safeRemote.updatedBy = rc.updatedBy;
            const merged = { ...prev, ...safeRemote };
            saveStoredConfig(merged);
            return merged;
          });
        }

        // Surat Keluar Auto-Sync
        if (Array.isArray(res.suratList)) {
          setSuratList(res.suratList);
          saveStoredSuratList(res.suratList);
        }

        // Arsip Digital & Google Drive Archive Auto-Sync
        if (Array.isArray(res.arsipList)) {
          setArsipSheetList(res.arsipList);
        }
        if (Array.isArray(res.driveFiles)) {
          setDriveFilesList(res.driveFiles);
        }

        // Users Auto-Sync
        if (Array.isArray(res.userList) && res.userList.length > 0) {
          setUserList(res.userList);
          saveStoredUserList(res.userList);
          setCurrentUser((curr) => {
            if (!curr) return null;
            const fresh = res.userList!.find(
              (u) => u.id === curr.id || u.username.toLowerCase() === curr.username.toLowerCase()
            );
            return fresh || curr;
          });
        }

        // Naskah Dinas Auto-Sync with Real-Time Activity Notification Generator (local-only to prevent log spam)
        if (Array.isArray(res.naskahList)) {
          const freshList = res.naskahList;
          const prevMap = previousNaskahMapRef.current;

          if (prevMap.size > 0 && !isInitial) {
            freshList.forEach((freshItem) => {
              const prevItem = prevMap.get(freshItem.id);
              if (!prevItem) {
                addActivityNotification(
                  {
                    judul: `Draf Baru Diajukan: ${freshItem.nomorRegistrasi}`,
                    deskripsi: `${freshItem.namaKonseptor} (${freshItem.unitKerja}) mengajukan draf "${freshItem.perihal}".`,
                    pelaku: freshItem.namaKonseptor,
                    rolePelaku: 'KONSEPTOR',
                    naskahId: freshItem.id,
                    nomorRegistrasi: freshItem.nomorRegistrasi,
                    tipeAktivitas: 'PENGAJUAN_DRAF',
                    targetRoles: ['ADMIN', freshItem.roleVerifikatorDitunjuk],
                    targetKonseptor: freshItem.namaKonseptor,
                  },
                  { syncRemote: false }
                );
              } else if (prevItem.status !== freshItem.status) {
                let notifType: TipeAktivitas = 'VERIFIKASI_SETUJU';
                let title = `Status Naskah Berubah: ${freshItem.nomorRegistrasi}`;
                let desc = `Status naskah "${freshItem.perihal}" berubah menjadi ${freshItem.status}`;

                if (freshItem.status === 'DISETUJUI' || freshItem.status === 'MENUNGGU_PENOMORAN') {
                  notifType = 'VERIFIKASI_SETUJU';
                  title = `Draf Disetujui: ${freshItem.nomorRegistrasi}`;
                  desc = `Draf telah diverifikasi & disetujui oleh ${freshItem.verifikatorDitunjuk}.`;
                } else if (freshItem.status === 'PERLU_PERBAIKAN') {
                  notifType = 'VERIFIKASI_PERBAIKAN';
                  title = `Perlu Perbaikan: ${freshItem.nomorRegistrasi}`;
                  desc = `Draf dikembalikan oleh ${freshItem.verifikatorDitunjuk}. Periksa catatan verifikator.`;
                } else if (freshItem.status === 'DITOLAK') {
                  notifType = 'VERIFIKASI_TOLAK';
                  title = `Draf Ditolak: ${freshItem.nomorRegistrasi}`;
                  desc = `Draf naskah ditolak oleh ${freshItem.verifikatorDitunjuk}.`;
                } else if (freshItem.status === 'NOMOR_DITERBITKAN' || freshItem.status === 'MENUNGGU_DOKUMEN_FINAL') {
                  notifType = 'NOMOR_TERBIT';
                  title = `Nomor Surat Terbit: ${freshItem.nomorSuratDipesan || freshItem.nomorRegistrasi}`;
                  desc = `Nomor resmi ${freshItem.nomorSuratDipesan} telah terbit. Silakan selesaikan TTD dan arsip.`;
                } else if (freshItem.status === 'SELESAI_ARSIP' || freshItem.status === 'FINAL_DIARSIPKAN') {
                  notifType = 'UNGGAH_FINAL';
                  title = `Arsip Final Tersimpan: ${freshItem.dokumenFinal?.nomorSuratResmi || freshItem.nomorSuratDipesan || freshItem.nomorRegistrasi}`;
                  desc = `Dokumen final telah diarsipkan ke Google Drive & basis data BPS.`;
                }

                addActivityNotification(
                  {
                    judul: title,
                    deskripsi: desc,
                    pelaku: freshItem.verifikatorDitunjuk || 'Petugas BPS',
                    rolePelaku: freshItem.roleVerifikatorDitunjuk || 'VERIFIKATOR',
                    naskahId: freshItem.id,
                    nomorRegistrasi: freshItem.nomorRegistrasi,
                    nomorSurat: freshItem.nomorSuratDipesan,
                    tipeAktivitas: notifType,
                    targetRoles: ['ADMIN', 'ARSIPARIS', freshItem.roleVerifikatorDitunjuk],
                    targetKonseptor: freshItem.namaKonseptor,
                  },
                  { syncRemote: false }
                );
              }
            });
          }

          setNaskahList((prev) => {
            const merged = mergeRemoteNaskahPreservingLocalFiles(
              freshList,
              prev,
              config.googleDriveFolderId
            );
            const newMap = new Map<string, NaskahDinas>();
            merged.forEach((item) => newMap.set(item.id, item));
            previousNaskahMapRef.current = newMap;
            saveStoredNaskahList(merged);
            return merged;
          });
        }

        // Merge activity logs if available from Google Sheets (with proper field mapping & deduplication)
        if (Array.isArray(res.activityLogs) && res.activityLogs.length > 0) {
          setNotifications((prevNotifs) => {
            const existingIds = new Set(prevNotifs.map((n) => n.id));
            const existingSignatures = new Set(
              prevNotifs.map((n) => `${n.tipeAktivitas}|${n.nomorRegistrasi || ''}|${n.nomorSurat || ''}|${n.waktu}`)
            );
            const mappedNew = res.activityLogs!
              .map((raw) => mapRemoteLogToNotifikasi(raw))
              .filter((n) => {
                if (existingIds.has(n.id)) return false;
                const sig = `${n.tipeAktivitas}|${n.nomorRegistrasi || ''}|${n.nomorSurat || ''}|${n.waktu}`;
                if (existingSignatures.has(sig)) return false;
                existingIds.add(n.id);
                existingSignatures.add(sig);
                return true;
              });
            if (mappedNew.length > 0) {
              const combined = [...mappedNew, ...prevNotifs].slice(0, 100);
              try {
                localStorage.setItem(STORAGE_KEY_NOTIFIKASI, JSON.stringify(combined));
              } catch {}
              return combined;
            }
            return prevNotifs;
          });
        }
      } catch {
        // Fallback silently to cache
      } finally {
        if (isMounted && isInitial) setIsSyncing(false);
      }
    };

    performSync(true);

    const pollingTimer = setInterval(() => {
      performSync(false);
    }, intervalSec * 1000);

    return () => {
      isMounted = false;
      clearInterval(pollingTimer);
    };
  }, [config.appsScriptUrl, config.spreadsheetId, config.syncIntervalSeconds]);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 3800);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Unified route navigation with role authorization check
  const handleNavigateTab = (tab: MainNavTab, subTab?: string) => {
    if (!currentUser) {
      window.location.hash = '#/login';
      return;
    }
    if (!checkTabPermission(tab, currentUser)) {
      showToast(`⚠ Menu ${tab.toUpperCase()} tidak dapat diakses oleh peran ${currentUser.jabatan}.`);
      setActiveTab('dashboard');
      navigateTo('dashboard');
      return;
    }
    setActiveTab(tab);
    if (tab === 'penomoran' && subTab && ['register', 'kosong', 'stats', 'form'].includes(subTab)) {
      setPenomoranSubTab(subTab as 'register' | 'kosong' | 'stats' | 'form');
    }
    navigateTo(tab, subTab);
  };

  // URL Hash Synchronisation & Role Guard Listener
  useEffect(() => {
    const handleLocationChange = () => {
      const route = parseCurrentRoute();
      if (!currentUser) {
        if (!route.isLogin) {
          window.location.hash = '#/login';
        }
        return;
      }

      if (route.isLogin) {
        navigateTo('dashboard');
        setActiveTab('dashboard');
        return;
      }

      if (!checkTabPermission(route.tab, currentUser)) {
        showToast(`⚠ Akses ke halaman "${route.tab}" dibatasi untuk peran ${currentUser.jabatan}. Dialihkan ke Dashboard.`);
        navigateTo('dashboard');
        setActiveTab('dashboard');
        return;
      }

      setActiveTab(route.tab);
      if (route.tab === 'penomoran' && route.subTab && ['register', 'kosong', 'stats', 'form'].includes(route.subTab)) {
        setPenomoranSubTab(route.subTab as 'register' | 'kosong' | 'stats' | 'form');
      }
    };

    handleLocationChange();
    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, [currentUser]);

  // Handle Login & Logout
  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    try {
      localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(user));
    } catch {
      // ignore
    }
    const route = parseCurrentRoute();
    if (!route.isLogin && checkTabPermission(route.tab, user)) {
      setActiveTab(route.tab);
      navigateTo(route.tab, route.subTab);
    } else {
      setActiveTab('dashboard');
      navigateTo('dashboard');
    }
    showToast(`✔ Berhasil masuk sebagai ${user.nama} (${user.jabatan})`);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem(STORAGE_KEY_AUTH_USER);
    } catch {
      // ignore
    }
    setCurrentUser(null);
    window.location.hash = '#/login';
    showToast('✔ Anda telah keluar dari akun.');
  };

  const handleSelectUserRole = (user: UserProfile) => {
    setCurrentUser(user);
    try {
      localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(user));
    } catch {
      // ignore
    }
    // If the active tab is not allowed for the new role, redirect to dashboard
    if (!user.allowedTabs.includes(activeTab)) {
      setActiveTab('dashboard');
      navigateTo('dashboard');
    }
    showToast(`✔ Beralih peran ke ${user.nama} (${user.jabatan})`);
  };

  // Derived stats for Penomoran
  const stats = useMemo(() => computeStats(suratList, config), [suratList, config]);
  const nextNomorBaru = useMemo(() => getNextNomorBaru(suratList, config), [suratList, config]);
  const emptyList = useMemo(() => suratList.filter((s) => s.status === 'KOSONG'), [suratList]);

  // Pending count for active user role
  const pendingVerifCount = useMemo(() => {
    if (!currentUser) return 0;
    if (currentUser.role === 'ADMIN' || currentUser.role === 'ARSIPARIS') {
      return naskahList.filter(
        (n) =>
          n.status === 'MENUNGGU_VERIFIKASI' ||
          n.status === 'DRAF_DIAJUKAN' ||
          n.status === 'SEDANG_DIPERIKSA' ||
          n.status === 'MENUNGGU_PENOMORAN'
      ).length;
    }
    if (currentUser.role === 'KONSEPTOR') {
      return naskahList.filter(
        (n) =>
          n.namaKonseptor.toLowerCase() === currentUser.nama.toLowerCase() &&
          (n.status === 'PERLU_PERBAIKAN' ||
            n.status === 'NOMOR_DITERBITKAN' ||
            n.status === 'MENUNGGU_DOKUMEN_FINAL')
      ).length;
    }
    return naskahList.filter(
      (n) =>
        n.roleVerifikatorDitunjuk === currentUser.role &&
        (n.status === 'MENUNGGU_VERIFIKASI' || n.status === 'DRAF_DIAJUKAN')
    ).length;
  }, [naskahList, currentUser]);

  // Gabungkan NaskahDinas, Sheet ArsipDigital, dan Drive Archive Files agar Arsip Digital selalu sinkron dan lengkap
  const { mergedNaskahForArsipView, totalArsipCount } = useMemo(() => {
    const matchedArsipIndices = new Set<number>();
    const matchedDriveIndices = new Set<number>();

    const findMatchingDriveIndex = (
      driveFileId?: string,
      nomorSurat?: string,
      perihal?: string,
      unitKerja?: string
    ): number => {
      if (isRealDriveFileId(driveFileId)) {
        const idxById = driveFilesList.findIndex((f) => f.fileId === driveFileId);
        if (idxById >= 0) return idxById;
      }
      const normNomor = normalizeMatchToken(nomorSurat);
      const normPerihal = normalizeMatchToken(perihal);
      const normUnit = normalizeMatchToken(unitKerja);
      return driveFilesList.findIndex((f, idx) => {
        if (matchedDriveIndices.has(idx)) return false;
        const normFile = normalizeMatchToken(f.fileName);
        if (normNomor && normNomor.length >= 6 && normFile.includes(normNomor)) return true;
        if (normPerihal && normPerihal.length >= 6 && normFile.includes(normPerihal)) {
          const normFileUnit = normalizeMatchToken(f.timKerja || f.folderPath);
          if (!normUnit || !normFileUnit || normFileUnit.includes(normUnit)) return true;
        }
        return false;
      });
    };

    const enrichedList: NaskahDinas[] = naskahList.map((n) => {
      const isArchived =
        n.status === 'SELESAI_ARSIP' || n.status === 'FINAL_DIARSIPKAN' || Boolean(n.dokumenFinal);
      if (!isArchived) return n;

      const nomorCandidate = n.dokumenFinal?.nomorSuratResmi || n.nomorSuratDipesan || n.nomorRegistrasi;
      const arsipIdx = arsipSheetList.findIndex((a, idx) => {
        if (matchedArsipIndices.has(idx)) return false;
        if (
          isRealDriveFileId(n.dokumenFinal?.driveFileId) &&
          a.driveFileId === n.dokumenFinal?.driveFileId
        ) {
          return true;
        }
        const aNo = normalizeMatchToken(a.nomorSuratResmi);
        const nNo = normalizeMatchToken(nomorCandidate);
        if (aNo && nNo && aNo === nNo) return true;
        return (
          normalizeMatchToken(a.perihal) === normalizeMatchToken(n.perihal) &&
          normalizeMatchToken(a.unitKerja) === normalizeMatchToken(n.unitKerja)
        );
      });
      const arsipRec = arsipIdx >= 0 ? arsipSheetList[arsipIdx] : undefined;
      if (arsipIdx >= 0) matchedArsipIndices.add(arsipIdx);

      const driveIdx = findMatchingDriveIndex(
        n.dokumenFinal?.driveFileId || arsipRec?.driveFileId,
        nomorCandidate,
        n.perihal,
        n.unitKerja
      );
      const driveFile = driveIdx >= 0 ? driveFilesList[driveIdx] : undefined;
      if (driveIdx >= 0) matchedDriveIndices.add(driveIdx);

      const existingDoc = n.dokumenFinal;
      const realDriveId =
        extractDriveFileId(existingDoc?.driveFileId || existingDoc?.driveUrl, config.googleDriveFolderId) ||
        extractDriveFileId(arsipRec?.driveFileId || arsipRec?.driveUrl, config.googleDriveFolderId) ||
        extractDriveFileId(driveFile?.fileId || driveFile?.fileUrl, config.googleDriveFolderId) ||
        undefined;

      const resolvedDriveUrl = realDriveId
        ? getDriveFileUrl(realDriveId, config.googleDriveFolderId)
        : undefined;

      const tglPenetapan =
        existingDoc?.tanggalPenetapan ||
        arsipRec?.tanggalPenetapan ||
        n.tanggalSurat ||
        n.tanggalPengajuan ||
        '';

      const mergedDoc: DokumenFinal = {
        nomorSuratResmi:
          existingDoc?.nomorSuratResmi || arsipRec?.nomorSuratResmi || nomorCandidate,
        perihal: existingDoc?.perihal || arsipRec?.perihal || n.perihal,
        jenisNaskah: existingDoc?.jenisNaskah || arsipRec?.jenisNaskah || n.jenisNaskah,
        unitKerja: existingDoc?.unitKerja || arsipRec?.unitKerja || n.unitKerja,
        tanggalPenetapan: tglPenetapan,
        tipeTandaTangan: existingDoc?.tipeTandaTangan || arsipRec?.tipeTandaTangan || 'TTE',
        pejabatPenandatangan:
          existingDoc?.pejabatPenandatangan ||
          arsipRec?.pejabatPenandatangan ||
          'Kepala BPS Provinsi Kalimantan Barat',
        namaFile:
          existingDoc?.namaFile ||
          driveFile?.fileName ||
          arsipRec?.namaFile ||
          generateFinalArsipFileName(
            nomorCandidate,
            n.perihal,
            tglPenetapan || n.waktuUpdate || ''
          ),
        ukuranFile: existingDoc?.ukuranFile || driveFile?.size || 0,
        dataUrl: existingDoc?.dataUrl,
        waktuUnggah:
          existingDoc?.waktuUnggah ||
          arsipRec?.waktuUnggah ||
          n.waktuUpdate ||
          n.tanggalPengajuan ||
          '',
        klasifikasiArsip:
          existingDoc?.klasifikasiArsip || n.klasifikasiArsip || '-',
        kodeUnitArsip:
          existingDoc?.kodeUnitArsip || config.kodeUnit || '6100',
        tingkatKeamanan: existingDoc?.tingkatKeamanan || arsipRec?.tingkatKeamanan || 'Biasa',
        lokasiPenyimpanan:
          existingDoc?.lokasiPenyimpanan ||
          arsipRec?.lokasiPenyimpanan ||
          'Google Drive Arsip Digital',
        driveFileId: realDriveId,
        driveUrl: resolvedDriveUrl,
        driveFolderPath:
          existingDoc?.driveFolderPath || arsipRec?.driveFolderPath || driveFile?.folderPath,
      };

      return {
        ...n,
        dokumenFinal: mergedDoc,
      };
    });

    // Tambahkan entri Sheet ArsipDigital yang tidak memiliki pasangan langsung di NaskahDinas
    arsipSheetList.forEach((arsip, idx) => {
      if (matchedArsipIndices.has(idx)) return;
      const driveIdx = findMatchingDriveIndex(
        arsip.driveFileId,
        arsip.nomorSuratResmi,
        arsip.perihal,
        arsip.unitKerja
      );
      const driveFile = driveIdx >= 0 ? driveFilesList[driveIdx] : undefined;
      if (driveIdx >= 0) matchedDriveIndices.add(driveIdx);

      const realDriveId =
        extractDriveFileId(arsip.driveFileId || arsip.driveUrl, config.googleDriveFolderId) ||
        extractDriveFileId(driveFile?.fileId || driveFile?.fileUrl, config.googleDriveFolderId) ||
        undefined;

      const resolvedFileName = driveFile?.fileName || arsip.namaFile;

      enrichedList.push({
        id: `arsip-sheet-${idx}-${normalizeMatchToken(arsip.nomorSuratResmi) || 'item'}`,
        nomorRegistrasi: arsip.nomorRegistrasi || arsip.nomorSuratResmi,
        jenisNaskah: (arsip.jenisNaskah || 'Surat Dinas Biasa') as JenisNaskahDinas,
        perihal: arsip.perihal,
        unitKerja: arsip.unitKerja || driveFile?.timKerja || 'Tim Umum & Humas',
        namaKonseptor: 'Pegawai BPS Kalbar',
        tanggalPengajuan: arsip.tanggalPenetapan || arsip.waktuUnggah || '',
        tanggalSurat: arsip.tanggalPenetapan,
        verifikatorDitunjuk: 'Arsiparis BPS Kalbar',
        roleVerifikatorDitunjuk: 'ARSIPARIS',
        status: 'SELESAI_ARSIP',
        klasifikasiArsip: '-',
        nomorSuratDipesan: arsip.nomorSuratResmi,
        drafFile: {
          name: resolvedFileName,
          size: driveFile?.size || 0,
          type: 'application/pdf',
        },
        riwayatVersi: [],
        riwayatVerifikasi: [],
        waktuUpdate: arsip.waktuUnggah || arsip.tanggalPenetapan || '',
        dokumenFinal: {
          nomorSuratResmi: arsip.nomorSuratResmi,
          perihal: arsip.perihal,
          jenisNaskah: arsip.jenisNaskah || 'Surat Dinas Biasa',
          unitKerja: arsip.unitKerja || driveFile?.timKerja || 'Tim Umum & Humas',
          tanggalPenetapan: arsip.tanggalPenetapan,
          tipeTandaTangan: arsip.tipeTandaTangan || 'TTE',
          pejabatPenandatangan:
            arsip.pejabatPenandatangan || 'Kepala BPS Provinsi Kalimantan Barat',
          namaFile: resolvedFileName,
          ukuranFile: driveFile?.size || 0,
          waktuUnggah: arsip.waktuUnggah || arsip.tanggalPenetapan,
          klasifikasiArsip: '-',
          kodeUnitArsip: config.kodeUnit || '6100',
          tingkatKeamanan: arsip.tingkatKeamanan || 'Biasa',
          lokasiPenyimpanan: arsip.lokasiPenyimpanan || 'Google Drive Arsip Digital',
          driveFileId: realDriveId,
          driveUrl: realDriveId ? getDriveFileUrl(realDriveId, config.googleDriveFolderId) : undefined,
          driveFolderPath: arsip.driveFolderPath || driveFile?.folderPath,
        },
      });
    });

    // Tambahkan file Google Drive Arsip yang berdiri sendiri agar tetap tampil di Arsip Digital
    driveFilesList.forEach((file, idx) => {
      if (matchedDriveIndices.has(idx)) return;
      const cleanedTitle = file.fileName.replace(/\.[^.]+$/, '').replace(/_/g, ' ').trim();
      const dateDisplay = file.updatedAt || '';

      enrichedList.push({
        id: `drive-only-${file.fileId}`,
        nomorRegistrasi: file.fileName,
        jenisNaskah: 'Surat Dinas Biasa',
        perihal: cleanedTitle || file.fileName,
        unitKerja: file.timKerja || 'Tim Umum & Humas',
        namaKonseptor: 'Arsip Google Drive',
        tanggalPengajuan: dateDisplay,
        tanggalSurat: dateDisplay,
        verifikatorDitunjuk: 'Arsiparis BPS Kalbar',
        roleVerifikatorDitunjuk: 'ARSIPARIS',
        status: 'SELESAI_ARSIP',
        klasifikasiArsip: '-',
        nomorSuratDipesan: cleanedTitle || file.fileName,
        drafFile: {
          name: file.fileName,
          size: file.size || 0,
          type: file.mimeType || 'application/pdf',
        },
        riwayatVersi: [],
        riwayatVerifikasi: [],
        waktuUpdate: dateDisplay,
        dokumenFinal: {
          nomorSuratResmi: cleanedTitle || file.fileName,
          perihal: cleanedTitle || file.fileName,
          jenisNaskah: 'Surat Dinas Biasa',
          unitKerja: file.timKerja || 'Tim Umum & Humas',
          tanggalPenetapan: dateDisplay,
          tipeTandaTangan: 'TTE',
          pejabatPenandatangan: 'Kepala BPS Provinsi Kalimantan Barat',
          namaFile: file.fileName,
          ukuranFile: file.size || 0,
          waktuUnggah: dateDisplay,
          klasifikasiArsip: '-',
          kodeUnitArsip: config.kodeUnit || '6100',
          tingkatKeamanan: 'Biasa',
          lokasiPenyimpanan: file.folderPath || 'Google Drive Arsip Digital',
          driveFileId: file.fileId,
          driveUrl: getDriveFileUrl(file.fileId, config.googleDriveFolderId) || file.fileUrl,
          driveFolderPath: file.folderPath,
        },
      });
    });

    const archivedCount = enrichedList.filter(
      (n) => n.status === 'SELESAI_ARSIP' || n.status === 'FINAL_DIARSIPKAN' || Boolean(n.dokumenFinal)
    ).length;

    return {
      mergedNaskahForArsipView: enrichedList,
      totalArsipCount: archivedCount,
    };
  }, [naskahList, arsipSheetList, driveFilesList, config.kodeUnit]);

  // Saring notifikasi yang relevan dengan peran dan penugasan pengguna saat ini
  const userFilteredNotifications = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'ADMIN') return notifications;

    return notifications.filter((notif) => {
      // Ditujukan ke konseptor spesifik
      if (
        notif.targetKonseptor &&
        notif.targetKonseptor.toLowerCase() === currentUser.nama.toLowerCase()
      ) {
        return true;
      }
      // Dibuat oleh pengguna saat ini
      if (notif.pelaku && notif.pelaku.toLowerCase() === currentUser.nama.toLowerCase()) {
        return true;
      }
      // Peran sasaran eksplisit
      if (notif.targetRoles && notif.targetRoles.includes(currentUser.role)) {
        return true;
      }
      // Arsiparis memantau penomoran & arsip
      if (
        currentUser.role === 'ARSIPARIS' &&
        ['NOMOR_TERBIT', 'UNGGAH_FINAL', 'HAPUS_ARSIP'].includes(notif.tipeAktivitas)
      ) {
        return true;
      }
      return false;
    });
  }, [notifications, currentUser]);

  // ══════════════════════════════════════════════════════════════════
  // NASKAH DINAS HANDLERS
  // ══════════════════════════════════════════════════════════════════
  const handlePengajuanDraf = (
    data: Omit<NaskahDinas, 'id' | 'nomorRegistrasi' | 'status' | 'riwayatVersi' | 'riwayatVerifikasi' | 'waktuUpdate'>
  ) => {
    const { updatedList, newNaskah } = addNaskahDinas(data, naskahList);
    setNaskahList(updatedList);
    showToast(`✔ Draf ${newNaskah.nomorRegistrasi} berhasil diajukan dan diteruskan ke ${newNaskah.verifikatorDitunjuk}!`);

    // Catat notifikasi aktivitas real-time
    addActivityNotification({
      judul: `Draf Diajukan: ${newNaskah.nomorRegistrasi}`,
      deskripsi: `${newNaskah.namaKonseptor} (${newNaskah.unitKerja}) mengajukan draf "${newNaskah.perihal}" kepada ${newNaskah.verifikatorDitunjuk}.`,
      pelaku: newNaskah.namaKonseptor,
      rolePelaku: 'KONSEPTOR',
      naskahId: newNaskah.id,
      nomorRegistrasi: newNaskah.nomorRegistrasi,
      tipeAktivitas: 'PENGAJUAN_DRAF',
      targetRoles: ['ADMIN', newNaskah.roleVerifikatorDitunjuk],
      targetKonseptor: newNaskah.namaKonseptor,
    });

    if (currentUser?.allowedTabs.includes('verifikasi')) {
      handleNavigateTab('verifikasi');
    } else {
      handleNavigateTab('pengajuan');
    }

    // Upload draft to Google Drive structured hierarchy (Tahun > Tim Kerja > Bulan > Draft)
    uploadDraftToDriveSync(newNaskah, config, newNaskah.drafFile)
      .then((driveRes) => {
        if (driveRes.success && isRealDriveFileId(driveRes.fileId, config.googleDriveFolderId)) {
          const withDrive: NaskahDinas = {
            ...newNaskah,
            driveDraftFileId: driveRes.fileId,
            driveDraftUrl: driveRes.fileUrl,
            driveDraftFolderPath: driveRes.folderPath,
          };
          setNaskahList((prev) => {
            const next = prev.map((item) =>
              item.id === newNaskah.id
                ? {
                    ...item,
                    driveDraftFileId: driveRes.fileId,
                    driveDraftUrl: driveRes.fileUrl,
                    driveDraftFolderPath: driveRes.folderPath,
                  }
                : item
            );
            saveStoredNaskahList(next);
            return next;
          });
          if (config.appsScriptUrl) {
            sendAppsScriptAction('saveNaskah', withDrive, config).catch(() => {});
          }
        } else if (config.appsScriptUrl) {
          sendAppsScriptAction('saveNaskah', newNaskah, config).catch(() => {});
        }
      })
      .catch(() => {
        if (config.appsScriptUrl) {
          sendAppsScriptAction('saveNaskah', newNaskah, config).catch(() => {});
        }
      });
  };

  const handleVerifikasiKeputusan = (
    naskahId: string,
    keputusan: 'DISETUJUI' | 'PERLU_PERBAIKAN' | 'DITOLAK',
    catatan: string,
    checklist: ChecklistVerifikasi
  ) => {
    if (!currentUser) return;
    const { updatedList, updatedNaskah } = updateVerifikasiNaskah(
      naskahId,
      keputusan,
      {
        namaVerifikator: currentUser.nama,
        roleVerifikator: currentUser.role,
        catatan,
        checklist,
      },
      naskahList
    );
    setNaskahList(updatedList);

    const changedItem = updatedNaskah || updatedList.find((n) => n.id === naskahId);
    if (changedItem && config.appsScriptUrl) {
      sendAppsScriptAction('saveNaskah', changedItem, config).catch(() => {});
    }

    if (keputusan === 'DISETUJUI') {
      showToast(`✔ Draf ${changedItem?.nomorRegistrasi || ''} telah disetujui dan diteruskan ke permintaan nomor surat!`);
    } else if (keputusan === 'PERLU_PERBAIKAN') {
      showToast(`⚠ Draf ${changedItem?.nomorRegistrasi || ''} dikembalikan kepada konseptor untuk perbaikan.`);
    } else {
      showToast(`✕ Pengajuan draf ${changedItem?.nomorRegistrasi || ''} ditolak.`);
    }

    // Catat notifikasi aktivitas real-time
    let notifTipe: TipeAktivitas = 'VERIFIKASI_SETUJU';
    let notifJudul = `Draf Disetujui: ${changedItem?.nomorRegistrasi || ''}`;
    let notifDesc = `Draf "${changedItem?.perihal || ''}" disetujui oleh ${currentUser.nama}. Siap diterbitkan nomor surat.`;

    if (keputusan === 'PERLU_PERBAIKAN') {
      notifTipe = 'VERIFIKASI_PERBAIKAN';
      notifJudul = `Perlu Perbaikan: ${changedItem?.nomorRegistrasi || ''}`;
      notifDesc = `Draf "${changedItem?.perihal || ''}" dikembalikan oleh ${currentUser.nama}. Catatan: ${catatan || 'Perlu perbaikan tata naskah.'}`;
    } else if (keputusan === 'DITOLAK') {
      notifTipe = 'VERIFIKASI_TOLAK';
      notifJudul = `Draf Ditolak: ${changedItem?.nomorRegistrasi || ''}`;
      notifDesc = `Draf "${changedItem?.perihal || ''}" ditolak oleh ${currentUser.nama}. Alasan: ${catatan || 'Tidak memenuhi ketentuan dinas.'}`;
    }

    addActivityNotification({
      judul: notifJudul,
      deskripsi: notifDesc,
      pelaku: currentUser.nama,
      rolePelaku: currentUser.role,
      naskahId: changedItem?.id,
      nomorRegistrasi: changedItem?.nomorRegistrasi,
      tipeAktivitas: notifTipe,
      targetRoles: ['ADMIN', changedItem?.roleVerifikatorDitunjuk || ''].filter(Boolean),
      targetKonseptor: changedItem?.namaKonseptor,
    });
  };

  const handleTerbitkanNomorSurat = (naskah: NaskahDinas, customKodeSurat?: 'B' | 'K' | 'R') => {
    if (!currentUser) return;

    // Kewenangan penerbitan nomor: Admin dan Verifikator yang bertugas
    const isAssignedVerifier =
      currentUser.role === naskah.roleVerifikatorDitunjuk ||
      currentUser.nama.toLowerCase() === naskah.verifikatorDitunjuk.toLowerCase();

    if (currentUser.role !== 'ADMIN' && !isAssignedVerifier) {
      showToast('✕ Hanya Administrator dan Verifikator yang bertugas yang berwenang menerbitkan nomor surat.');
      return;
    }

    if (naskah.nomorSuratDipesan && naskah.status !== 'MENUNGGU_PENOMORAN') {
      showToast(`⚠ Naskah ini sudah memiliki nomor surat: ${naskah.nomorSuratDipesan}`);
      return;
    }

    const now = new Date();
    const tglHariIni = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

    // Gunakan pilihan nomor kosong jika konseptor memilih slot nomor kosong
    const isKosongMode = !!(naskah.nomorUrutKosongDipilih && naskah.nomorUrutKosongDipilih > 0);

    const payload: SubmitSuratPayload = {
      kodeSurat: customKodeSurat || naskah.kodeSurat || 'B',
      kodeKlasifikasi: naskah.klasifikasiArsip || 'VS.100',
      perihal: naskah.perihal,
      tujuan: naskah.tujuan || 'Kepala BPS Kabupaten/Kota se-Provinsi Kalimantan Barat',
      tanggalSurat: naskah.tanggalSurat || tglHariIni,
      namaPegawai: naskah.namaKonseptor,
      timKerja: naskah.unitKerja,
      isKosongMode: isKosongMode,
      nomorUrutKosong: isKosongMode ? naskah.nomorUrutKosongDipilih : null,
    };

    const { updatedList: newSuratList, result } = processSubmitSurat(
      payload,
      config,
      suratList,
      false
    );

    if (result.success && result.data) {
      setSuratList(newSuratList);
      saveStoredSuratList(newSuratList);

      try {
        const { updatedList: newNaskahList, updatedNaskah } = terbitkanNomorSuratNaskah(
          naskah.id,
          result.data.nomorSuratLengkap,
          result.data.id,
          result.data.nomorUrut,
          currentUser.nama,
          currentUser.role,
          naskahList
        );

        setNaskahList(newNaskahList);
        saveStoredNaskahList(newNaskahList);

        showToast(
          `✔ Nomor surat #${result.data.nomorUrut} (${result.data.nomorSuratLengkap}) berhasil diterbitkan dan terhubung dengan ${naskah.nomorRegistrasi}!`
        );

        // Catat notifikasi aktivitas real-time
        addActivityNotification({
          judul: `Nomor Surat Terbit: ${result.data.nomorSuratLengkap}`,
          deskripsi: `Nomor surat #${result.data.nomorUrut} (${result.data.nomorSuratLengkap}) resmi diterbitkan untuk ${naskah.namaKonseptor}. Silakan proses TTD & berkas final.`,
          pelaku: currentUser.nama,
          rolePelaku: currentUser.role,
          naskahId: naskah.id,
          nomorRegistrasi: naskah.nomorRegistrasi,
          nomorSurat: result.data.nomorSuratLengkap,
          tipeAktivitas: 'NOMOR_TERBIT',
          targetRoles: ['ADMIN', 'ARSIPARIS', naskah.roleVerifikatorDitunjuk],
          targetKonseptor: naskah.namaKonseptor,
        });

        // Background sync to Google Spreadsheet
        if (config.appsScriptUrl) {
          sendAppsScriptAction('submitSurat', result.data, config).catch(() => {});
          if (updatedNaskah) {
            sendAppsScriptAction('saveNaskah', updatedNaskah, config).catch(() => {});
          }
        }
      } catch (err: any) {
        showToast(`✕ Gagal menerbitkan nomor: ${err.message}`);
      }
    } else {
      showToast(`✕ Gagal membuat nomor surat: ${result.error || 'Terjadi kesalahan'}`);
    }
  };

  const handleBukaKembaliNaskah = (naskahId: string, alasan: string) => {
    if (!currentUser) return;
    if (currentUser.role !== 'ADMIN') {
      showToast('✕ Hanya Administrator yang berwenang membuka kembali pengajuan.');
      return;
    }

    try {
      const { updatedList, updatedNaskah } = bukaKembaliNaskahAdmin(
        naskahId,
        currentUser.nama,
        alasan,
        naskahList
      );
      setNaskahList(updatedList);
      saveStoredNaskahList(updatedList);
      showToast(`✔ Pengajuan ${updatedNaskah?.nomorRegistrasi || ''} berhasil dibuka kembali oleh Admin.`);

      addActivityNotification({
        judul: `Pengajuan Dibuka Kembali: ${updatedNaskah?.nomorRegistrasi || ''}`,
        deskripsi: `Pengajuan dibuka kembali oleh Administrator (${currentUser.nama}). Alasan: ${alasan}`,
        pelaku: currentUser.nama,
        rolePelaku: 'ADMIN',
        naskahId,
        nomorRegistrasi: updatedNaskah?.nomorRegistrasi,
        tipeAktivitas: 'BUKA_KEMBALI',
        targetRoles: ['ADMIN', updatedNaskah?.roleVerifikatorDitunjuk || ''].filter(Boolean),
        targetKonseptor: updatedNaskah?.namaKonseptor,
      });

      if (updatedNaskah && config.appsScriptUrl) {
        sendAppsScriptAction('saveNaskah', updatedNaskah, config).catch(() => {});
      }
    } catch (err: any) {
      showToast(`✕ Gagal membuka kembali: ${err.message}`);
    }
  };

  const handleSubmitRevisi = (
    naskahId: string,
    file: { name: string; size: number; type: string; dataUrl?: string },
    diunggahOleh: string,
    catatanPerbaikan: string
  ) => {
    const { updatedList } = uploadRevisiNaskah(
      naskahId,
      file,
      diunggahOleh,
      catatanPerbaikan,
      naskahList
    );
    setNaskahList(updatedList);

    const changedItem = updatedList.find((n) => n.id === naskahId);
    if (changedItem) {
      addActivityNotification({
        judul: `Draf Direvisi: ${changedItem.nomorRegistrasi}`,
        deskripsi: `${diunggahOleh} mengunggah berkas revisi draf. Catatan: ${catatanPerbaikan || 'Sesuai arahan verifikator.'}`,
        pelaku: diunggahOleh,
        rolePelaku: 'KONSEPTOR',
        naskahId,
        nomorRegistrasi: changedItem.nomorRegistrasi,
        tipeAktivitas: 'PENGAJUAN_DRAF',
        targetRoles: ['ADMIN', changedItem.roleVerifikatorDitunjuk],
        targetKonseptor: changedItem.namaKonseptor,
      });

      // Re-upload/update draft in Google Drive without duplicate files
      uploadDraftToDriveSync(changedItem, config, file)
        .then((driveRes) => {
          if (driveRes.success && isRealDriveFileId(driveRes.fileId, config.googleDriveFolderId)) {
            const withDrive: NaskahDinas = {
              ...changedItem,
              driveDraftFileId: driveRes.fileId,
              driveDraftUrl: driveRes.fileUrl,
              driveDraftFolderPath: driveRes.folderPath,
            };
            setNaskahList((prev) => {
              const next = prev.map((item) =>
                item.id === naskahId
                  ? {
                      ...item,
                      driveDraftFileId: driveRes.fileId,
                      driveDraftUrl: driveRes.fileUrl,
                      driveDraftFolderPath: driveRes.folderPath,
                    }
                  : item
              );
              saveStoredNaskahList(next);
              return next;
            });
            if (config.appsScriptUrl) {
              sendAppsScriptAction('saveNaskah', withDrive, config).catch(() => {});
            }
          } else if (config.appsScriptUrl) {
            sendAppsScriptAction('saveNaskah', changedItem, config).catch(() => {});
          }
        })
        .catch(() => {
          if (config.appsScriptUrl) {
            sendAppsScriptAction('saveNaskah', changedItem, config).catch(() => {});
          }
        });
    }
  };

  const handleSubmitFinal = (naskahId: string, dokumenFinal: DokumenFinal) => {
    const targetNaskah = naskahList.find((n) => n.id === naskahId);

    const { updatedList } = arsipkanNaskahFinal(
      naskahId,
      dokumenFinal,
      naskahList,
      currentUser ? { nama: currentUser.nama, role: currentUser.role } : undefined
    );
    setNaskahList(updatedList);
    saveStoredNaskahList(updatedList);
    handleNavigateTab('arsip');

    const changedItem = updatedList.find((n) => n.id === naskahId);
    if (changedItem && config.appsScriptUrl) {
      sendAppsScriptAction('saveNaskah', changedItem, config).catch(() => {});
    }
    showToast(`✔ Naskah dinas ${dokumenFinal.nomorSuratResmi} berhasil diarsipkan ke Arsip Digital BPS!`);

    addActivityNotification({
      judul: `Arsip Final Tersimpan: ${dokumenFinal.nomorSuratResmi}`,
      deskripsi: `Dokumen sah "${targetNaskah?.perihal || ''}" diarsipkan ke basis data & Google Drive.`,
      pelaku: currentUser?.nama || 'Petugas BPS',
      rolePelaku: currentUser?.role || 'KONSEPTOR',
      naskahId,
      nomorRegistrasi: targetNaskah?.nomorRegistrasi,
      nomorSurat: dokumenFinal.nomorSuratResmi,
      tipeAktivitas: 'UNGGAH_FINAL',
      targetRoles: ['ADMIN', 'ARSIPARIS', targetNaskah?.roleVerifikatorDitunjuk || ''].filter(Boolean),
      targetKonseptor: targetNaskah?.namaKonseptor,
    });

    // Upload & organize final document into Google Drive (Tahun > Tim Kerja > Bulan > Arsip)
    if (targetNaskah) {
      archiveFinalToDriveSync(targetNaskah, dokumenFinal, config)
        .then((driveRes) => {
          if (driveRes.success && isRealDriveFileId(driveRes.fileId, config.googleDriveFolderId)) {
            const driveUpdatedDoc: DokumenFinal = {
              ...dokumenFinal,
              driveFileId: driveRes.fileId,
              driveUrl: driveRes.fileUrl,
              driveFolderPath: driveRes.folderPath,
            };
            let syncedNaskah: NaskahDinas | undefined;
            setNaskahList((prev) => {
              const { updatedList: finalizedList, updatedNaskah } = arsipkanNaskahFinal(
                naskahId,
                driveUpdatedDoc,
                prev,
                currentUser ? { nama: currentUser.nama, role: currentUser.role } : undefined
              );
              syncedNaskah = updatedNaskah;
              saveStoredNaskahList(finalizedList);
              return finalizedList;
            });

            if (config.appsScriptUrl) {
              const updatedNaskah: NaskahDinas = syncedNaskah || {
                ...(changedItem || targetNaskah),
                status: 'SELESAI_ARSIP',
                dokumenFinal: driveUpdatedDoc,
              };
              sendAppsScriptAction('saveNaskah', updatedNaskah, config).catch(() => {});
            }
          } else if (config.appsScriptUrl && driveRes.error) {
            showToast(`⚠ Arsip tersimpan lokal, namun unggah Google Drive belum berhasil: ${driveRes.error}`);
          }
        })
        .catch(() => {});
    }
  };

  const handleUpdateNaskah = (updated: NaskahDinas) => {
    const { updatedList } = updateNaskahMetadata(updated.id, updated, naskahList);
    setNaskahList(updatedList);
    if (config.appsScriptUrl) {
      sendAppsScriptAction('saveNaskah', updated, config).catch(() => {});
    }
    showToast(`✔ Naskah ${updated.nomorRegistrasi} berhasil diperbarui.`);
  };

  const handleDeleteNaskah = async (naskah: NaskahDinas) => {
    if (!currentUser) return;

    // Validasi Hak Akses: Admin atau Konseptor pembuat draf (apabila belum sah/final)
    const isOwner = currentUser.nama.toLowerCase() === naskah.namaKonseptor.toLowerCase();
    const canDelete =
      currentUser.role === 'ADMIN' ||
      (isOwner && (naskah.status === 'DRAF_DIAJUKAN' || naskah.status === 'PERLU_PERBAIKAN'));

    if (!canDelete) {
      showToast('✕ Anda tidak memiliki kewenangan untuk menghapus naskah dinas ini.');
      return;
    }

    const nextList = deleteNaskahDinas(naskah.id, naskahList);
    setNaskahList(nextList);
    saveStoredNaskahList(nextList);

    // Kumpulkan seluruh file ID yang tersimpan di Google Drive (Folder Draft dan Arsip)
    const driveFileIds: (string | undefined)[] = [
      naskah.driveDraftFileId,
      ...(naskah.riwayatVersi || []).map((v) => v.driveFileId),
      naskah.dokumenFinal?.driveFileId,
    ].filter(Boolean);

    // Hapus di Google Spreadsheet Sheet NaskahDinas
    let sheetSuccess = false;
    if (config.appsScriptUrl) {
      try {
        const res = await syncDeleteNaskah(naskah.nomorRegistrasi, naskah.id, config);
        sheetSuccess = res.success;
      } catch {
        sheetSuccess = false;
      }
    } else {
      sheetSuccess = true;
    }

    // Hapus seluruh file terkait di Google Drive (Folder Draft & Arsip)
    const driveRes = await deleteDriveFilesSync(
      driveFileIds,
      {
        nomorIdentitas: naskah.nomorRegistrasi,
        tipe: 'DRAF',
        perihal: naskah.perihal,
      },
      config,
      {
        nama: currentUser.nama,
        role: currentUser.role,
      }
    );

    // Catat ke audit log penghapusan sistem
    setRiwayatPenghapusanAudit((prev) => {
      const next = [driveRes.auditRecord, ...prev].slice(0, 100);
      try {
        localStorage.setItem(STORAGE_KEY_AUDIT_PENGHAPUSAN, JSON.stringify(next));
      } catch {}
      return next;
    });

    // Catat notifikasi aktivitas penghapusan
    addActivityNotification({
      judul: `Naskah Dihapus: ${naskah.nomorRegistrasi}`,
      deskripsi: `Draf "${naskah.perihal}" dihapus oleh ${currentUser.nama}. ${driveRes.deletedCount} file Google Drive dibersihkan.`,
      pelaku: currentUser.nama,
      rolePelaku: currentUser.role,
      nomorRegistrasi: naskah.nomorRegistrasi,
      tipeAktivitas: 'HAPUS_NASKAH',
      targetRoles: ['ADMIN', naskah.roleVerifikatorDitunjuk],
    });

    if (!driveRes.success && driveFileIds.length > 0) {
      showToast(
        `⚠ Naskah dihapus dari spreadsheet, namun pembersihan file Google Drive terkendala: ${driveRes.error || 'Periksa izin folder Drive'}`
      );
    } else {
      showToast(
        `✔ Draf naskah ${naskah.nomorRegistrasi} & file Google Drive (${driveRes.deletedCount} berkas) berhasil dihapus.`
      );
    }
  };

  const handleUpdateArsip = (naskahId: string, updatedDoc: DokumenFinal) => {
    const { updatedList } = updateArsipMetadata(naskahId, updatedDoc, naskahList);
    setNaskahList(updatedList);
    saveStoredNaskahList(updatedList);
    const updatedItem = updatedList.find((n) => n.id === naskahId);
    if (config.appsScriptUrl) {
      syncUpdateArsip(updatedDoc.nomorSuratResmi, updatedDoc, config).catch(() => {});
      if (updatedItem) {
        sendAppsScriptAction('saveNaskah', updatedItem, config).catch(() => {});
      }
    }
  };

  const handleDeleteArsip = async (naskah: NaskahDinas) => {
    if (!currentUser) return;

    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'ARSIPARIS') {
      showToast('✕ Hanya Administrator dan Arsiparis yang berwenang menghapus dokumen arsip.');
      return;
    }

    const nomorResmi = naskah.dokumenFinal?.nomorSuratResmi || naskah.nomorRegistrasi;
    const nextList = deleteArsipItem(naskah.id, naskahList);
    setNaskahList(nextList);
    saveStoredNaskahList(nextList);

    const targetDriveId = naskah.dokumenFinal?.driveFileId;
    setArsipSheetList((prev) =>
      prev.filter(
        (a) =>
          a.nomorSuratResmi !== nomorResmi &&
          (!targetDriveId || a.driveFileId !== targetDriveId)
      )
    );
    if (targetDriveId) {
      setDriveFilesList((prev) => prev.filter((f) => f.fileId !== targetDriveId));
    }

    // Kumpulkan seluruh file ID yang tersimpan di Google Drive (Folder Arsip dan Draft)
    const driveFileIds: (string | undefined)[] = [
      naskah.dokumenFinal?.driveFileId,
      naskah.driveDraftFileId,
      ...(naskah.riwayatVersi || []).map((v) => v.driveFileId),
    ].filter(Boolean);

    // Hapus di Google Spreadsheet Sheet ArsipDigital & NaskahDinas
    if (config.appsScriptUrl) {
      try {
        await syncDeleteArsip(nomorResmi, config);
      } catch {}
    }

    // Hapus file terkait di Google Drive
    const driveRes = await deleteDriveFilesSync(
      driveFileIds,
      {
        nomorIdentitas: nomorResmi,
        tipe: 'ARSIP',
        perihal: naskah.dokumenFinal?.perihal || naskah.perihal,
      },
      config,
      {
        nama: currentUser.nama,
        role: currentUser.role,
      }
    );

    // Catat ke audit log
    setRiwayatPenghapusanAudit((prev) => {
      const next = [driveRes.auditRecord, ...prev].slice(0, 100);
      try {
        localStorage.setItem(STORAGE_KEY_AUDIT_PENGHAPUSAN, JSON.stringify(next));
      } catch {}
      return next;
    });

    // Catat notifikasi aktivitas
    addActivityNotification({
      judul: `Arsip Dihapus: ${nomorResmi}`,
      deskripsi: `Arsip "${naskah.dokumenFinal?.perihal || naskah.perihal}" dihapus oleh ${currentUser.nama}. ${driveRes.deletedCount} file Google Drive dibersihkan.`,
      pelaku: currentUser.nama,
      rolePelaku: currentUser.role,
      nomorSurat: nomorResmi,
      tipeAktivitas: 'HAPUS_ARSIP',
      targetRoles: ['ADMIN', 'ARSIPARIS'],
    });

    if (!driveRes.success && driveFileIds.length > 0) {
      showToast(
        `⚠ Arsip dihapus dari spreadsheet, namun pembersihan file Google Drive terkendala: ${driveRes.error || 'Periksa izin folder Drive'}`
      );
    } else {
      showToast(
        `✔ Arsip surat ${nomorResmi} & dokumen Google Drive (${driveRes.deletedCount} berkas) berhasil dihapus.`
      );
    }
  };

  const handleManualSync = async () => {
    if (!config.appsScriptUrl) {
      showToast('⚠ URL Google Apps Script belum dikonfigurasi.');
      return;
    }
    setIsSyncing(true);
    try {
      const res = await fetchSpreadsheetData(config);
      if (res.success) {
        if (Array.isArray(res.suratList)) {
          setSuratList(res.suratList);
          saveStoredSuratList(res.suratList);
        }
        if (Array.isArray(res.naskahList)) {
          setNaskahList((prev) => {
            const merged = mergeRemoteNaskahPreservingLocalFiles(
              res.naskahList!,
              prev,
              config.googleDriveFolderId
            );
            saveStoredNaskahList(merged);
            const newMap = new Map<string, NaskahDinas>();
            merged.forEach((item) => newMap.set(item.id, item));
            previousNaskahMapRef.current = newMap;
            return merged;
          });
        }
        if (Array.isArray(res.arsipList)) {
          setArsipSheetList(res.arsipList);
        }
        if (Array.isArray(res.driveFiles)) {
          setDriveFilesList(res.driveFiles);
        }
        if (Array.isArray(res.userList) && res.userList.length > 0) {
          setUserList(res.userList);
          saveStoredUserList(res.userList);
        }
        if (Array.isArray(res.activityLogs) && res.activityLogs.length > 0) {
          setNotifications((prevNotifs) => {
            const existingIds = new Set(prevNotifs.map((n) => n.id));
            const mappedNew = res.activityLogs!
              .map((raw) => mapRemoteLogToNotifikasi(raw))
              .filter((n) => !existingIds.has(n.id));
            if (mappedNew.length > 0) {
              const combined = [...mappedNew, ...prevNotifs].slice(0, 100);
              try {
                localStorage.setItem(STORAGE_KEY_NOTIFIKASI, JSON.stringify(combined));
              } catch {}
              return combined;
            }
            return prevNotifs;
          });
        }
        const archivedSyncedCount =
          (res.naskahList || []).filter(
            (n) => n.status === 'SELESAI_ARSIP' || n.status === 'FINAL_DIARSIPKAN' || Boolean(n.dokumenFinal)
          ).length || res.arsipList?.length || 0;
        showToast(
          `✔ Sinkronisasi berhasil! ${res.suratList?.length ?? 0} surat, ${res.naskahList?.length ?? 0} naskah (${archivedSyncedCount} arsip) & ${res.userList?.length ?? 0} akun diperbarui.`
        );
      } else {
        showToast(`✕ Sinkronisasi gagal: ${res.error || 'Respon spreadsheet tidak valid'}`);
      }
    } catch (err: any) {
      showToast(`✕ Kesalahan sinkronisasi: ${err.message || 'Gagal tersambung'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualSyncUsers = async () => {
    if (!config.appsScriptUrl) {
      showToast('⚠ URL Google Apps Script belum dikonfigurasi.');
      return;
    }
    setIsSyncingUsers(true);
    try {
      const res = await fetchSpreadsheetData(config);
      if (res.success && Array.isArray(res.userList) && res.userList.length > 0) {
        setUserList(res.userList);
        saveStoredUserList(res.userList);
        showToast(`✔ Berhasil menyinkronkan ${res.userList.length} akun pengguna dari spreadsheet.`);
      } else {
        showToast('ℹ Tidak ada pembaruan akun tambahan dari spreadsheet.');
      }
    } catch (err: any) {
      showToast(`✕ Gagal memuat pengguna: ${err.message || 'Error jaringan'}`);
    } finally {
      setIsSyncingUsers(false);
    }
  };

  const handleSaveUser = async (userToSave: UserProfile): Promise<boolean> => {
    const updated = addUserItem(userToSave, userList);
    setUserList(updated);
    saveStoredUserList(updated);

    if (
      currentUser &&
      (currentUser.id === userToSave.id || currentUser.username.toLowerCase() === userToSave.username.toLowerCase())
    ) {
      setCurrentUser(userToSave);
      try {
        localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(userToSave));
      } catch {}
    }

    try {
      if (config.appsScriptUrl) {
        const res = await syncSaveUser(userToSave, config);
        if (res.success) {
          showToast(`✔ Akun "${userToSave.nama}" berhasil disimpan ke Google Spreadsheet.`);
          return true;
        }
      }
      showToast(`✔ Akun "${userToSave.nama}" disimpan.`);
      return true;
    } catch {
      showToast(`✔ Akun "${userToSave.nama}" disimpan.`);
      return true;
    }
  };

  const handleDeleteUser = async (userId: string, username: string): Promise<boolean> => {
    const updated = deleteUserItem(userId, userList);
    setUserList(updated);
    saveStoredUserList(updated);

    try {
      if (config.appsScriptUrl) {
        const res = await syncDeleteUser(userId, username, config);
        if (res.success) {
          showToast(`✔ Akun "${username}" berhasil dihapus dari Google Spreadsheet.`);
          return true;
        }
      }
      showToast(`✔ Akun "${username}" telah dihapus.`);
      return true;
    } catch {
      showToast(`✔ Akun "${username}" telah dihapus.`);
      return true;
    }
  };

  // ══════════════════════════════════════════════════════════════════
  // PENOMORAN SURAT HANDLERS (CRUD)
  // ══════════════════════════════════════════════════════════════════
  const handleUpdateSurat = (updated: SuratKeluar) => {
    const nextList = updateSuratItem(updated, suratList);
    setSuratList(nextList);
    if (config.appsScriptUrl) {
      syncUpdateSurat(updated, config).catch(() => {});
    }
    showToast(`✔ Surat urut #${updated.nomorUrut} (${updated.nomorSuratLengkap}) berhasil diperbarui.`);
  };

  const handleDeleteSurat = (item: SuratKeluar) => {
    const nextList = deleteSuratItem(item.id, suratList);
    setSuratList(nextList);
    if (config.appsScriptUrl) {
      syncDeleteSurat(item.nomorUrut, item.nomorSuratLengkap, config).catch(() => {});
    }
    showToast(`✔ Nomor surat #${item.nomorUrut} (${item.nomorSuratLengkap}) berhasil dihapus.`);
  };
  const handleSubmitSurat = async (payload: SubmitSuratPayload, simulateMonday: boolean) => {
    await new Promise((res) => setTimeout(res, 500));
    const { updatedList, result } = processSubmitSurat(
      payload,
      config,
      suratList,
      simulateMonday
    );

    if (result.success && result.data) {
      setSuratList(updatedList);
      setLastSubmittedSurat(result);
      setPreselectedKosong(null);
      setPenomoranSubTab('register');
      showToast(`✔ Nomor surat ${result.data.nomorSuratLengkap} berhasil diterbitkan!`);

      // Sync to Google Spreadsheet Keluar26
      if (config.appsScriptUrl) {
        sendAppsScriptAction('submitSurat', result.data, config).catch(() => {});
      }
    } else {
      showToast(`✕ Gagal: ${result.error || 'Terjadi kesalahan sistem'}`);
    }
  };

  const handleResetPenomoran = () => {
    setLastSubmittedSurat(null);
    setPreselectedKosong(null);
  };

  const handleClaimKosong = (item: SuratKeluar) => {
    setPreselectedKosong(item);
    setLastSubmittedSurat(null);
    setActiveTab('pengajuan');
    showToast(`✔ Memilih slot nomor kosong #${item.nomorUrut} (${item.nomorSuratLengkap}) untuk draf pengajuan`);
  };

  const handleSaveConfig = async (newConfig: AppConfig) => {
    const updated: AppConfig = {
      ...newConfig,
      lastConfigUpdate: new Date().toISOString(),
      updatedBy: currentUser?.nama || 'Admin',
    };
    setConfig(updated);
    saveStoredConfig(updated);
    showToast('✔ Pengaturan aplikasi berhasil disimpan secara lokal.');

    // Simpan ke Google Spreadsheet Sheet Pengaturan
    if (updated.appsScriptUrl) {
      try {
        const res = await syncSaveSpreadsheetConfig(
          updated,
          currentUser ? { nama: currentUser.nama, role: currentUser.role } : undefined
        );
        if (res.success) {
          showToast('✔ Pengaturan berhasil disimpan ke Sheet Pengaturan Google Spreadsheet!');
        } else {
          showToast(`⚠ Pengaturan lokal tersimpan, namun sync ke Sheet gagal: ${res.error || 'Respon ditolak'}`);
        }
      } catch (err: any) {
        showToast(`⚠ Disimpan lokal (Spreadsheet offline: ${err.message || 'Gagal tersambung'})`);
      }
    }

    addActivityNotification({
      judul: 'Konfigurasi Sistem Diperbarui',
      deskripsi: `Pengaturan database & sistem diperbarui oleh ${currentUser?.nama || 'Admin'}.`,
      pelaku: currentUser?.nama || 'Admin',
      rolePelaku: currentUser?.role || 'ADMIN',
      tipeAktivitas: 'PENGATURAN_UPDATE',
      targetRoles: ['ADMIN'],
    });
  };

  const handleRestoreData = (newList: SuratKeluar[]) => {
    setSuratList(newList);
    saveStoredSuratList(newList);
  };

  const handleResetData = () => {
    setSuratList(INITIAL_SURAT_LIST);
    saveStoredSuratList(INITIAL_SURAT_LIST);
    setNaskahList(INITIAL_NASKAH_LIST);
    saveStoredNaskahList(INITIAL_NASKAH_LIST);
    setConfig(DEFAULT_CONFIG);
    saveStoredConfig(DEFAULT_CONFIG);
    setLastSubmittedSurat(null);
    setPreselectedKosong(null);
  };

  // If NOT logged in, show Login Screen
  if (!currentUser) {
    return (
      <LoginScreen
        userList={userList}
        onLoginSuccess={handleLoginSuccess}
        config={config}
        onSyncUsers={handleManualSyncUsers}
        isSyncingUsers={isSyncingUsers}
        onOpenSetupDatabase={() => setShowSetupDatabase(true)}
      />
    );
  }

  // Check if current user is permitted to view the activeTab
  const isTabPermitted = currentUser.allowedTabs.includes(activeTab);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900 font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50 max-w-[calc(100vw-2rem)] bg-slate-950/95 text-white backdrop-blur-md px-4 sm:px-5 py-2.5 rounded-2xl shadow-2xl text-xs sm:text-sm font-semibold flex items-center gap-2.5 border border-white/10 animate-in fade-in slide-in-from-top-4 duration-200">
          <span
            className={`w-2 h-2 rounded-full animate-pulse shrink-0 ${
              toastMessage.startsWith('✕')
                ? 'bg-rose-400'
                : toastMessage.startsWith('⚠')
                ? 'bg-amber-400'
                : toastMessage.startsWith('ℹ')
                ? 'bg-blue-400'
                : 'bg-emerald-400'
            }`}
          />
          <span className="leading-snug">{toastMessage}</span>
        </div>
      )}

      {/* Main Header with Role Indicator & Switcher */}
      <Header
        activeTab={activeTab}
        setActiveTab={handleNavigateTab}
        onOpenSettings={currentUser.role === 'ADMIN' ? () => setShowSettings(true) : () => {}}
        onOpenSetupDatabase={currentUser.role === 'ADMIN' ? () => setShowSetupDatabase(true) : undefined}
        currentUser={currentUser}
        userList={userList}
        onSelectUser={handleSelectUserRole}
        onLogout={handleLogout}
        pendingVerifCount={pendingVerifCount}
        totalArsipCount={totalArsipCount}
        onSyncDatabase={handleManualSync}
        isSyncing={isSyncing}
        notifications={userFilteredNotifications}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        onMarkNotificationRead={handleMarkNotificationRead}
        onSelectNotification={(notif) => {
          if (notif.tipeAktivitas === 'UNGGAH_FINAL' || notif.tipeAktivitas === 'HAPUS_ARSIP') {
            if (currentUser.allowedTabs.includes('arsip')) {
              handleNavigateTab('arsip');
            }
          } else if (
            notif.tipeAktivitas === 'PENGAJUAN_DRAF' ||
            notif.tipeAktivitas === 'VERIFIKASI_SETUJU' ||
            notif.tipeAktivitas === 'VERIFIKASI_PERBAIKAN' ||
            notif.tipeAktivitas === 'VERIFIKASI_TOLAK' ||
            notif.tipeAktivitas === 'HAPUS_NASKAH'
          ) {
            if (currentUser.allowedTabs.includes('verifikasi')) {
              handleNavigateTab('verifikasi');
            } else if (currentUser.allowedTabs.includes('pengajuan')) {
              handleNavigateTab('pengajuan');
            }
          } else if (notif.tipeAktivitas === 'NOMOR_TERBIT') {
            if (currentUser.allowedTabs.includes('penomoran')) {
              handleNavigateTab('penomoran', 'register');
            }
          }
        }}
        syncIntervalSeconds={config.syncIntervalSeconds || 10}
      />

      {/* Main Content Area with Permission Guards */}
      <main className="flex-1 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8">
        
        {/* Permission Guard Alert if User accesses unauthorized tab */}
        {!isTabPermitted && (
          <div className="bg-white p-8 rounded-2xl border border-red-200 shadow-sm text-center max-w-xl mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Akses Dibatasi untuk Peran Ini</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Akun Anda sebagai <strong>{currentUser.jabatan}</strong> ({currentUser.nama}) tidak memiliki kewenangan untuk mengakses menu ini. Fitur ini dikhususkan bagi peran lain sesuai tata kelola SOP persuratan BPS.
            </p>
            <div className="pt-2">
              <button
                onClick={() => handleNavigateTab('dashboard')}
                className="px-4 py-2 rounded-xl bg-[#0f4c82] hover:bg-[#1a6bb5] text-white text-xs font-bold cursor-pointer"
              >
                Kembali ke Dashboard
              </button>
            </div>
          </div>
        )}

        {/* TAB 1: DASHBOARD MONITORING (Accessible by all roles) */}
        {isTabPermitted && activeTab === 'dashboard' && (
          <NaskahDashboard
            naskahList={naskahList}
            currentUser={currentUser}
            onNavigateTab={(tab) => handleNavigateTab(tab)}
            onSelectNaskahDetail={(item) => {
              if (currentUser.allowedTabs.includes('verifikasi')) {
                handleNavigateTab('verifikasi');
              } else if (item.status === 'PERLU_PERBAIKAN' && (currentUser.role === 'KONSEPTOR' || currentUser.role === 'ADMIN')) {
                setSelectedForRevisi(item);
              } else if (currentUser.allowedTabs.includes('pengajuan')) {
                handleNavigateTab('pengajuan');
              } else {
                handleNavigateTab('dashboard');
              }
            }}
            onOpenSettings={currentUser.role === 'ADMIN' ? () => setShowSettings(true) : undefined}
            onOpenSetupDatabase={currentUser.role === 'ADMIN' ? () => setShowSetupDatabase(true) : undefined}
          />
        )}

        {/* TAB 2: PENGAJUAN DRAF NASKAH & TIMELINE PROGRES (Konseptor & Admin) */}
        {isTabPermitted && activeTab === 'pengajuan' && (
          <PengajuanDrafView
            currentUser={currentUser}
            suratList={suratList}
            naskahList={naskahList}
            preselectedKosong={preselectedKosong}
            config={config}
            onClearPreselectedKosong={() => setPreselectedKosong(null)}
            onSubmitDraf={handlePengajuanDraf}
            onNavigateToPedoman={() => handleNavigateTab('pedoman')}
            onOpenRevisiModal={(naskah) => setSelectedForRevisi(naskah)}
            onOpenUnggahFinalModal={(naskah) => setSelectedForFinal(naskah)}
            onTerbitkanNomorSurat={handleTerbitkanNomorSurat}
            onVerifikasiKeputusan={handleVerifikasiKeputusan}
            onBukaKembaliNaskah={handleBukaKembaliNaskah}
            onToast={showToast}
          />
        )}

        {/* TAB 3: MEJA VERIFIKASI (Verifikator Yun/Amanda/Rania/Vivi/Agus, Arsiparis, Admin) */}
        {isTabPermitted && activeTab === 'verifikasi' && (
          <VerifikasiView
            naskahList={naskahList}
            currentUser={currentUser}
            onVerifikasiKeputusan={handleVerifikasiKeputusan}
            onTerbitkanNomorSurat={handleTerbitkanNomorSurat}
            onBukaKembaliNaskah={handleBukaKembaliNaskah}
            onOpenRevisiModal={(naskah) => setSelectedForRevisi(naskah)}
            onOpenUnggahFinalModal={(naskah) => setSelectedForFinal(naskah)}
            onUpdateNaskah={handleUpdateNaskah}
            onDeleteNaskah={handleDeleteNaskah}
            onNavigateToPengajuan={currentUser.allowedTabs.includes('pengajuan') ? () => handleNavigateTab('pengajuan') : undefined}
            onOpenSetupDatabase={currentUser.role === 'ADMIN' ? () => setShowSetupDatabase(true) : undefined}
            onToast={showToast}
          />
        )}

        {/* TAB 4: ARSIP DIGITAL (All roles) */}
        {isTabPermitted && activeTab === 'arsip' && (
          <ArsipDigitalView
            naskahList={mergedNaskahForArsipView}
            arsipSheetRecords={arsipSheetList}
            driveFiles={driveFilesList}
            currentUser={currentUser}
            config={config}
            onUpdateArsip={handleUpdateArsip}
            onDeleteArsip={handleDeleteArsip}
            onOpenUnggahFinalModal={(naskah) => setSelectedForFinal(naskah)}
            onBukaKembaliNaskah={handleBukaKembaliNaskah}
            onSyncArchive={handleManualSync}
            isSyncing={isSyncing}
            onToast={showToast}
          />
        )}

        {/* TAB 5: REFERENSI & PEDOMAN (All roles) */}
        {isTabPermitted && activeTab === 'pedoman' && (
          <PedomanReferensiView onToast={showToast} />
        )}

        {/* TAB 6: PENOMORAN SURAT KELUAR (Konseptor, Arsiparis, Admin) */}
        {isTabPermitted && activeTab === 'penomoran' && (
          <div className="space-y-6">
            
            {/* Sub-Navigation for Penomoran Module */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => handleNavigateTab('penomoran', 'register')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    penomoranSubTab === 'register'
                      ? 'bg-[#0f4c82] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Table2 className="w-3.5 h-3.5" />
                  <span>Buku Register (Sheet Keluar26)</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-200 text-slate-700">
                    {suratList.length}
                  </span>
                </button>

                <button
                  onClick={() => handleNavigateTab('penomoran', 'kosong')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    penomoranSubTab === 'kosong'
                      ? 'bg-[#0f4c82] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Nomor Kosong</span>
                  {emptyList.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500 text-white font-bold">
                      {emptyList.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleNavigateTab('penomoran', 'form')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    penomoranSubTab === 'form'
                      ? 'bg-[#0f4c82] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Formulir Langsung</span>
                </button>

                <button
                  onClick={() => handleNavigateTab('penomoran', 'stats')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    penomoranSubTab === 'stats'
                      ? 'bg-[#0f4c82] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Statistik Nomor</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-500 font-mono-tabular">
                Spreadsheet: <strong>Keluar26</strong> · Unit: <strong>61000</strong>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <StatsBar
              stats={stats}
              nextNomor={nextNomorBaru}
              onFilterKosong={() => handleNavigateTab('penomoran', 'kosong')}
            />

            {/* Penomoran Sub-Views */}
            {penomoranSubTab === 'register' && (
              <RegisterTable
                suratList={suratList}
                config={config}
                onClaimKosong={handleClaimKosong}
                onUpdateSurat={handleUpdateSurat}
                onDeleteSurat={handleDeleteSurat}
                onToast={showToast}
              />
            )}

            {penomoranSubTab === 'kosong' && (
              <EmptyNumbersView
                emptyList={emptyList}
                onClaim={handleClaimKosong}
                onNavigateToForm={() => {
                  setLastSubmittedSurat(null);
                  setPreselectedKosong(null);
                  handleNavigateTab('penomoran', 'form');
                }}
              />
            )}

            {penomoranSubTab === 'form' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8">
                  <LetterForm
                    onSubmit={handleSubmitSurat}
                    emptyList={emptyList}
                    preselectedKosong={preselectedKosong}
                    onClearPreselectedKosong={() => setPreselectedKosong(null)}
                    nextNomorBaru={nextNomorBaru}
                    currentUser={currentUser}
                    config={config}
                  />
                </div>
                <div className="lg:col-span-4">
                  {lastSubmittedSurat?.data ? (
                    <ResultCard
                      surat={lastSubmittedSurat.data}
                      wasMondayPlaceholderCreated={lastSubmittedSurat.wasMondayPlaceholderCreated}
                      mondayPlaceholderNomor={lastSubmittedSurat.mondayPlaceholderNomor}
                      onReset={handleResetPenomoran}
                      onOpenPrint={() => setShowPrintModal(true)}
                      onToast={showToast}
                    />
                  ) : (
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0f4c82] flex items-center justify-center mx-auto">
                        <FileText className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">Formulir Nomor Surat Langsung</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Gunakan formulir ini untuk penomoran langsung surat keluar (Sheet Keluar26). Untuk alur telaah resmi, gunakan menu <strong>Pengajuan Draf</strong>.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {penomoranSubTab === 'stats' && (
              <StatsAnalyticsView suratList={suratList} />
            )}

          </div>
        )}

        {/* TAB 7: PENGELOLAAN PENGGUNA (Admin - Google Spreadsheet Sheet Pengguna) */}
        {isTabPermitted && activeTab === 'pengguna' && (
          <UserManagementView
            userList={userList}
            currentUser={currentUser}
            onSaveUser={handleSaveUser}
            onDeleteUser={handleDeleteUser}
            onSyncSpreadsheet={handleManualSyncUsers}
            isSyncing={isSyncingUsers}
          />
        )}

      </main>

      {/* Institutional Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Badan Pusat Statistik Provinsi Kalimantan Barat</span>
            <span className="text-slate-300">·</span>
            <span>Sekretariat TU Kepala</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Login: <strong>{currentUser.nama}</strong> ({currentUser.role})</span>
            <span className="text-slate-300">·</span>
            <span>Unit: {config.kodeUnit}</span>
            {currentUser.role === 'ADMIN' ? (
              <>
                <span className="text-slate-300">·</span>
                <a
                  href={`https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/edit`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#1a6bb5] hover:underline flex items-center gap-1 font-medium"
                >
                  <span>Buka Google Sheets</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </>
            ) : (
              <>
                <span className="text-slate-300">·</span>
                <span className="text-slate-500 font-medium">Tata Kelola Naskah Dinas Terpadu</span>
              </>
            )}
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Help */}
      <HelpFloatingButton whatsappPhone={config.whatsappAdmin} />

      {/* Modal Revisi Draf */}
      {selectedForRevisi && (
        <RevisiModal
          naskah={selectedForRevisi}
          onClose={() => setSelectedForRevisi(null)}
          onSubmitRevisi={handleSubmitRevisi}
          onToast={showToast}
        />
      )}

      {/* Modal Unggah Final PDF */}
      {selectedForFinal && (
        <UnggahFinalModal
          naskah={selectedForFinal}
          onClose={() => setSelectedForFinal(null)}
          onSubmitFinal={handleSubmitFinal}
          onToast={showToast}
        />
      )}

      {/* Settings Modal (Admin only) */}
      {showSettings && currentUser.role === 'ADMIN' && (
        <SettingsModal
          config={config}
          onSaveConfig={handleSaveConfig}
          onClose={() => setShowSettings(false)}
          onOpenSetupDatabase={() => {
            setShowSettings(false);
            setShowSetupDatabase(true);
          }}
          suratList={suratList}
          onRestoreData={handleRestoreData}
          onResetData={handleResetData}
          onToast={showToast}
          currentUser={currentUser}
          riwayatPenghapusanAudit={riwayatPenghapusanAudit}
        />
      )}

      {/* Setup Database Google Spreadsheet Modal (Admin only) */}
      {showSetupDatabase && currentUser.role === 'ADMIN' && (
        <SetupDatabaseModal
          config={config}
          onClose={() => setShowSetupDatabase(false)}
          onSyncComplete={(syncedSurat, syncedNaskah, syncedUsers) => {
            setSuratList(syncedSurat);
            saveStoredSuratList(syncedSurat);
            setNaskahList(syncedNaskah);
            saveStoredNaskahList(syncedNaskah);
            if (syncedUsers && syncedUsers.length > 0) {
              setUserList(syncedUsers);
              saveStoredUserList(syncedUsers);
            }
          }}
          onToast={showToast}
        />
      )}

      {/* Print Receipt Modal for Penomoran */}
      {showPrintModal && lastSubmittedSurat?.data && (
        <PrintReceiptModal
          surat={lastSubmittedSurat.data}
          config={config}
          onClose={() => setShowPrintModal(false)}
        />
      )}

    </div>
  );
}
