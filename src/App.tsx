import React, { useState, useEffect, useMemo } from 'react';
import {
  AppConfig,
  ChecklistVerifikasi,
  DokumenFinal,
  NaskahDinas,
  SubmitResult,
  SubmitSuratPayload,
  SuratKeluar,
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
} from './utils/apiSync';
import { ExternalLink, Layers, FileText, Table2, BarChart3, ShieldAlert } from 'lucide-react';

const STORAGE_KEY_AUTH_USER = 'bps_kalbar_active_user_v1';

export default function App() {
  // Config & Data state
  const [config, setConfig] = useState<AppConfig>(getStoredConfig);
  const [suratList, setSuratList] = useState<SuratKeluar[]>(getStoredSuratList);
  const [naskahList, setNaskahList] = useState<NaskahDinas[]>(getStoredNaskahList);
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

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<MainNavTab>('dashboard');

  // Penomoran sub-tabs (Buku Register Keluar26, Nomor Kosong, Statistik)
  const [penomoranSubTab, setPenomoranSubTab] = useState<'register' | 'kosong' | 'stats'>('register');
  const [lastSubmittedSurat, setLastSubmittedSurat] = useState<SubmitResult | null>(null);
  const [preselectedKosong, setPreselectedKosong] = useState<SuratKeluar | null>(null);

  // Modals
  const [selectedForRevisi, setSelectedForRevisi] = useState<NaskahDinas | null>(null);
  const [selectedForFinal, setSelectedForFinal] = useState<NaskahDinas | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showSetupDatabase, setShowSetupDatabase] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Background fetch from Spreadsheet on startup
  useEffect(() => {
    let isMounted = true;
    if (config.appsScriptUrl && config.spreadsheetId) {
      setIsSyncing(true);
      fetchSpreadsheetData(config)
        .then((res) => {
          if (!isMounted) return;
          if (res.success) {
            if (Array.isArray(res.suratList)) {
              setSuratList(res.suratList);
              saveStoredSuratList(res.suratList);
            }
            if (Array.isArray(res.naskahList)) {
              setNaskahList(res.naskahList);
              saveStoredNaskahList(res.naskahList);
            }
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
          }
        })
        .catch(() => {
          // Fallback silently to local cache
        })
        .finally(() => {
          if (isMounted) setIsSyncing(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [config.appsScriptUrl, config.spreadsheetId]);

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

  // Handle Login & Logout
  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    try {
      localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(user));
    } catch {
      // ignore
    }
    setActiveTab('dashboard');
    showToast(`✔ Berhasil masuk sebagai ${user.nama} (${user.jabatan})`);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem(STORAGE_KEY_AUTH_USER);
    } catch {
      // ignore
    }
    setCurrentUser(null);
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

  const totalArsipCount = useMemo(() => {
    return naskahList.filter(
      (n) => n.status === 'SELESAI_ARSIP' || n.status === 'FINAL_DIARSIPKAN'
    ).length;
  }, [naskahList]);

  // ══════════════════════════════════════════════════════════════════
  // NASKAH DINAS HANDLERS
  // ══════════════════════════════════════════════════════════════════
  const handlePengajuanDraf = (
    data: Omit<NaskahDinas, 'id' | 'nomorRegistrasi' | 'status' | 'riwayatVersi' | 'riwayatVerifikasi' | 'waktuUpdate'>
  ) => {
    const { updatedList, newNaskah } = addNaskahDinas(data, naskahList);
    setNaskahList(updatedList);
    showToast(`✔ Draf ${newNaskah.nomorRegistrasi} berhasil diajukan dan diteruskan ke ${newNaskah.verifikatorDitunjuk}!`);
    if (currentUser?.allowedTabs.includes('verifikasi')) {
      setActiveTab('verifikasi');
    } else {
      setActiveTab('pengajuan');
    }

    // Sync to Google Spreadsheet in background
    if (config.appsScriptUrl) {
      sendAppsScriptAction('saveNaskah', newNaskah, config).catch(() => {});
    }
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
    if (changedItem && config.appsScriptUrl) {
      sendAppsScriptAction('saveNaskah', changedItem, config).catch(() => {});
    }
  };

  const handleSubmitFinal = (naskahId: string, dokumenFinal: DokumenFinal) => {
    const { updatedList } = arsipkanNaskahFinal(
      naskahId,
      dokumenFinal,
      naskahList,
      currentUser ? { nama: currentUser.nama, role: currentUser.role } : undefined
    );
    setNaskahList(updatedList);
    setActiveTab('arsip');

    const changedItem = updatedList.find((n) => n.id === naskahId);
    if (changedItem && config.appsScriptUrl) {
      sendAppsScriptAction('saveNaskah', changedItem, config).catch(() => {});
    }
    showToast(`✔ Naskah dinas ${dokumenFinal.nomorSuratResmi} berhasil diarsipkan ke Sheet ArsipDigital!`);
  };

  const handleUpdateNaskah = (updated: NaskahDinas) => {
    const { updatedList } = updateNaskahMetadata(updated.id, updated, naskahList);
    setNaskahList(updatedList);
    if (config.appsScriptUrl) {
      sendAppsScriptAction('saveNaskah', updated, config).catch(() => {});
    }
    showToast(`✔ Naskah ${updated.nomorRegistrasi} berhasil diperbarui.`);
  };

  const handleDeleteNaskah = (naskah: NaskahDinas) => {
    const nextList = deleteNaskahDinas(naskah.id, naskahList);
    setNaskahList(nextList);
    if (config.appsScriptUrl) {
      syncDeleteNaskah(naskah.nomorRegistrasi, naskah.id, config).catch(() => {});
    }
    showToast(`✔ Draf naskah ${naskah.nomorRegistrasi} berhasil dihapus.`);
  };

  const handleUpdateArsip = (naskahId: string, updatedDoc: DokumenFinal) => {
    const { updatedList } = updateArsipMetadata(naskahId, updatedDoc, naskahList);
    setNaskahList(updatedList);
    if (config.appsScriptUrl) {
      syncUpdateArsip(updatedDoc.nomorSuratResmi, updatedDoc, config).catch(() => {});
    }
  };

  const handleDeleteArsip = (naskah: NaskahDinas) => {
    const nextList = deleteArsipItem(naskah.id, naskahList);
    setNaskahList(nextList);
    if (config.appsScriptUrl) {
      const nomorResmi = naskah.dokumenFinal?.nomorSuratResmi || naskah.nomorRegistrasi;
      syncDeleteArsip(nomorResmi, config).catch(() => {});
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
          setNaskahList(res.naskahList);
          saveStoredNaskahList(res.naskahList);
        }
        if (Array.isArray(res.userList) && res.userList.length > 0) {
          setUserList(res.userList);
          saveStoredUserList(res.userList);
        }
        showToast(
          `✔ Sinkronisasi berhasil! ${res.suratList?.length ?? 0} surat, ${res.naskahList?.length ?? 0} naskah & ${res.userList?.length ?? 0} akun diperbarui.`
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

  const handleSaveConfig = (newConfig: AppConfig) => {
    setConfig(newConfig);
    saveStoredConfig(newConfig);
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
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50 bg-slate-950/90 text-white backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-2xl text-xs sm:text-sm font-semibold flex items-center gap-2.5 border border-white/10 animate-in fade-in slide-in-from-top-4 duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header with Role Indicator & Switcher */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
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
                onClick={() => setActiveTab('dashboard')}
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
            onNavigateTab={(tab) => {
              if (currentUser.allowedTabs.includes(tab)) {
                setActiveTab(tab);
              } else {
                showToast(`⚠ Menu ${tab} dibatasi untuk peran Anda saat ini.`);
              }
            }}
            onSelectNaskahDetail={(item) => {
              if (currentUser.allowedTabs.includes('verifikasi')) {
                setActiveTab('verifikasi');
              } else if (item.status === 'PERLU_PERBAIKAN' && (currentUser.role === 'KONSEPTOR' || currentUser.role === 'ADMIN')) {
                setSelectedForRevisi(item);
              } else if (currentUser.allowedTabs.includes('pengajuan')) {
                setActiveTab('pengajuan');
              } else {
                setActiveTab('dashboard');
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
            onClearPreselectedKosong={() => setPreselectedKosong(null)}
            onSubmitDraf={handlePengajuanDraf}
            onNavigateToPedoman={() => setActiveTab('pedoman')}
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
            onNavigateToPengajuan={currentUser.allowedTabs.includes('pengajuan') ? () => setActiveTab('pengajuan') : undefined}
            onOpenSetupDatabase={currentUser.role === 'ADMIN' ? () => setShowSetupDatabase(true) : undefined}
            onToast={showToast}
          />
        )}

        {/* TAB 4: ARSIP DIGITAL (All roles) */}
        {isTabPermitted && activeTab === 'arsip' && (
          <ArsipDigitalView
            naskahList={naskahList}
            currentUser={currentUser}
            onUpdateArsip={handleUpdateArsip}
            onDeleteArsip={handleDeleteArsip}
            onOpenUnggahFinalModal={(naskah) => setSelectedForFinal(naskah)}
            onBukaKembaliNaskah={handleBukaKembaliNaskah}
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
                  onClick={() => setPenomoranSubTab('register')}
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
                  onClick={() => setPenomoranSubTab('kosong')}
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
                  onClick={() => setPenomoranSubTab('stats')}
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
              onFilterKosong={() => setPenomoranSubTab('kosong')}
            />

            {/* Penomoran Sub-Views */}
            {penomoranSubTab === 'register' && (
              <RegisterTable
                suratList={suratList}
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
                  setActiveTab('pengajuan');
                }}
              />
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
