import React, { useState } from 'react';
import {
  Settings,
  ExternalLink,
  Save,
  RotateCcw,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Folder,
  Users,
  ShieldCheck,
  History,
  Trash2,
  Plus,
  RefreshCw,
  Clock,
  Database,
} from 'lucide-react';
import { AppConfig, RiwayatPenghapusanAudit, SuratKeluar, UserProfile, UserRole } from '../types';
import { DAFTAR_TIM_KERJA, DEFAULT_PEMETAAN_VERIFIKATOR } from '../data/bpsClassifications';
import { syncSaveSpreadsheetConfig, fetchSpreadsheetConfig } from '../utils/apiSync';

interface SettingsModalProps {
  config: AppConfig;
  onSaveConfig: (newConfig: AppConfig) => void;
  onClose: () => void;
  onOpenSetupDatabase?: () => void;
  suratList: SuratKeluar[];
  onRestoreData: (list: SuratKeluar[]) => void;
  onResetData: () => void;
  onToast: (msg: string) => void;
  currentUser: UserProfile;
  riwayatPenghapusanAudit?: RiwayatPenghapusanAudit[];
  onReloadData?: () => void;
}

const VERIFIKATOR_OPTIONS: { nama: string; role: UserRole; deskripsi: string }[] = [
  { nama: 'M. Yun Imran, S.E.', role: 'VERIFIKATOR_YUN', deskripsi: 'Verifikator Tim SDM dan Tim Keuangan' },
  { nama: 'Amanda Putri, A.Md.', role: 'VERIFIKATOR_AMANDA', deskripsi: 'Verifikator Tim Perencanaan dan Tim Neraca' },
  { nama: 'Rania Naila Husna, A.Md.A.B', role: 'VERIFIKATOR_RANIA', deskripsi: 'Verifikator Tim Distribusi dan Tim Sosial' },
  { nama: 'Alfiana Ayuni, A.Md.', role: 'VERIFIKATOR_VIVI', deskripsi: 'Verifikator Tim Produksi' },
  { nama: 'Agustinus Supriadi, S.M.', role: 'VERIFIKATOR_AGUS', deskripsi: 'Verifikator Tim IPDS dan Tim Umum & Humas' },
  { nama: 'Arsiparis Ahli BPS Kalbar', role: 'ARSIPARIS', deskripsi: 'Verifikasi Aspek Kearsipan & Tata Naskah Formal' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  config,
  onSaveConfig,
  onClose,
  onOpenSetupDatabase,
  suratList,
  onRestoreData,
  onResetData,
  onToast,
  currentUser,
  riwayatPenghapusanAudit = [],
}) => {
  const [activeTab, setActiveTab] = useState<'umum' | 'tim' | 'audit' | 'backup'>('umum');
  const [isSavingSpreadsheet, setIsSavingSpreadsheet] = useState(false);
  const [isLoadingSpreadsheet, setIsLoadingSpreadsheet] = useState(false);

  // General Settings
  const [spreadsheetId, setSpreadsheetId] = useState(config.spreadsheetId);
  const [sheetName, setSheetName] = useState(config.sheetName);
  const [nomorBaruMulaiDari, setNomorBaruMulaiDari] = useState(config.nomorBaruMulaiDari);
  const [kodeUnit, setKodeUnit] = useState(config.kodeUnit);
  const [whatsappAdmin, setWhatsappAdmin] = useState(config.whatsappAdmin);
  const [appsScriptUrl, setAppsScriptUrl] = useState(config.appsScriptUrl || '');
  const [enableMondayRule, setEnableMondayRule] = useState(config.enableMondayRule);
  const [googleDriveFolderId, setGoogleDriveFolderId] = useState(
    config.googleDriveFolderId || '1_Xsmp2dafHvoyhXuhS1x1_GkbWDy7i0S'
  );
  const [syncIntervalSeconds, setSyncIntervalSeconds] = useState(config.syncIntervalSeconds || 10);

  // Tim Kerja & Verifikator Settings
  const [daftarTimKerja, setDaftarTimKerja] = useState<string[]>(() => {
    return Array.isArray(config.daftarTimKerja) && config.daftarTimKerja.length > 0
      ? config.daftarTimKerja
      : [...DAFTAR_TIM_KERJA];
  });
  const [pemetaanVerifikator, setPemetaanVerifikator] = useState<Record<string, { nama: string; role: UserRole; deskripsi?: string }>>(() => {
    return config.pemetaanVerifikator || DEFAULT_PEMETAAN_VERIFIKATOR;
  });
  const [newTimName, setNewTimName] = useState('');

  // Save handler for local state
  const handleSaveLocal = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanAppsScriptUrl = appsScriptUrl.trim()
      ? (appsScriptUrl.includes('/edit') || !appsScriptUrl.endsWith('/exec')
          ? appsScriptUrl.trim().replace(/\s+/g, '').replace(/\/edit.*$/, '/exec').replace(/\/+$/, '')
          : appsScriptUrl.trim())
      : '';

    const updated: AppConfig = {
      ...config,
      spreadsheetId: spreadsheetId.trim(),
      sheetName: sheetName.trim(),
      nomorBaruMulaiDari: Number(nomorBaruMulaiDari) || 367,
      kodeUnit: kodeUnit.trim() || '6100',
      whatsappAdmin: whatsappAdmin.trim(),
      appsScriptUrl: cleanAppsScriptUrl,
      enableMondayRule,
      googleDriveFolderId: googleDriveFolderId.trim() || '1_Xsmp2dafHvoyhXuhS1x1_GkbWDy7i0S',
      daftarTimKerja,
      pemetaanVerifikator,
      syncIntervalSeconds: Number(syncIntervalSeconds) || 10,
      lastConfigUpdate: new Date().toISOString(),
      updatedBy: `${currentUser.nama} (${currentUser.role})`,
    };
    onSaveConfig(updated);
    onToast('✔ Pengaturan sistem dan Google Drive berhasil disimpan!');
    return updated;
  };

  // Save directly to Google Spreadsheet Sheet "Pengaturan"
  const handleSaveToSpreadsheet = async () => {
    const updated = handleSaveLocal();
    if (!updated.appsScriptUrl) {
      onToast('⚠ URL Google Apps Script belum dikonfigurasi.');
      return;
    }
    setIsSavingSpreadsheet(true);
    try {
      const res = await syncSaveSpreadsheetConfig(updated, currentUser);
      if (res.success) {
        onToast('✔ Seluruh konfigurasi berhasil disimpan ke Database Spreadsheet (Sheet Pengaturan)!');
      } else {
        onToast(`✕ Gagal menyimpan ke Spreadsheet: ${res.error || 'Terjadi kesalahan'}`);
      }
    } catch (err: any) {
      onToast(`✕ Error koneksi spreadsheet: ${err.message || String(err)}`);
    } finally {
      setIsSavingSpreadsheet(false);
    }
  };

  // Load directly from Google Spreadsheet Sheet "Pengaturan"
  const handleLoadFromSpreadsheet = async () => {
    if (!appsScriptUrl) {
      onToast('⚠ URL Google Apps Script belum dikonfigurasi.');
      return;
    }
    setIsLoadingSpreadsheet(true);
    try {
      const res = await fetchSpreadsheetConfig({
        ...config,
        appsScriptUrl,
        spreadsheetId,
      });
      if (res.success && res.config) {
        const c = res.config;
        if (c.nomorBaruMulaiDari !== undefined) setNomorBaruMulaiDari(c.nomorBaruMulaiDari);
        if (c.kodeUnit) setKodeUnit(c.kodeUnit);
        if (c.whatsappAdmin) setWhatsappAdmin(c.whatsappAdmin);
        if (c.enableMondayRule !== undefined) setEnableMondayRule(c.enableMondayRule);
        if (c.googleDriveFolderId) setGoogleDriveFolderId(c.googleDriveFolderId);
        if (c.syncIntervalSeconds) setSyncIntervalSeconds(c.syncIntervalSeconds);
        if (Array.isArray(c.daftarTimKerja)) setDaftarTimKerja(c.daftarTimKerja);
        if (c.pemetaanVerifikator) setPemetaanVerifikator(c.pemetaanVerifikator);

        const merged: AppConfig = {
          ...config,
          ...c,
          lastConfigUpdate: new Date().toISOString(),
          updatedBy: 'Google Spreadsheet (Sheet Pengaturan)',
        };
        onSaveConfig(merged);
        onToast('✔ Berhasil memuat konfigurasi terbaru dari Database Sheet Pengaturan!');
      } else {
        onToast(`✕ Gagal memuat: ${res.error || 'Konfigurasi kosong'}`);
      }
    } catch (err: any) {
      onToast(`✕ Gagal terhubung: ${err.message || String(err)}`);
    } finally {
      setIsLoadingSpreadsheet(false);
    }
  };

  // Tim Kerja helper actions
  const handleAddTimKerja = () => {
    const clean = newTimName.trim();
    if (!clean) return;
    if (daftarTimKerja.includes(clean)) {
      onToast('⚠ Tim kerja dengan nama tersebut sudah ada.');
      return;
    }
    const next = [...daftarTimKerja, clean];
    setDaftarTimKerja(next);
    // Auto-assign default verifikator
    setPemetaanVerifikator((prev) => ({
      ...prev,
      [clean]: {
        nama: 'Arsiparis Ahli BPS Kalbar',
        role: 'ARSIPARIS',
        deskripsi: `Verifikator untuk ${clean}`,
      },
    }));
    setNewTimName('');
    onToast(`✔ Tim kerja "${clean}" ditambahkan ke daftar.`);
  };

  const handleRemoveTimKerja = (tim: string) => {
    if (daftarTimKerja.length <= 1) {
      onToast('⚠ Minimal harus ada 1 Tim Kerja.');
      return;
    }
    setDaftarTimKerja((prev) => prev.filter((t) => t !== tim));
    onToast(`✔ Tim kerja "${tim}" dihapus dari daftar.`);
  };

  const handleUpdateVerifikatorForTim = (tim: string, verifNama: string) => {
    const matched = VERIFIKATOR_OPTIONS.find((v) => v.nama === verifNama);
    if (!matched) return;
    setPemetaanVerifikator((prev) => ({
      ...prev,
      [tim]: {
        nama: matched.nama,
        role: matched.role,
        deskripsi: matched.deskripsi,
      },
    }));
  };

  const exportBackupJSON = () => {
    const data = {
      config: {
        ...config,
        daftarTimKerja,
        pemetaanVerifikator,
      },
      suratList,
      exportedAt: new Date().toISOString(),
      exportedBy: `${currentUser.nama} (${currentUser.role})`,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_surat_bps_kalbar_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    onToast('✔ Backup data sistem berhasil diunduh');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.suratList && Array.isArray(parsed.suratList)) {
          onRestoreData(parsed.suratList);
          if (parsed.config) onSaveConfig(parsed.config);
          onToast('✔ Data arsip berhasil dipulihkan dari backup!');
          onClose();
        } else {
          onToast('✕ Format file JSON backup tidak valid.');
        }
      } catch {
        onToast('✕ Gagal membaca file JSON backup.');
      }
    };
    reader.readAsText(file);
  };

  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0f4c82] flex items-center justify-center border border-blue-100">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Database Pengaturan & Konfigurasi</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                  Sheet Pengaturan
                </span>
              </div>
              <p className="text-xs text-slate-500">Kelola konfigurasi terpusat via Google Spreadsheet & Google Drive</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 py-3 border-b border-slate-100 overflow-x-auto no-scrollbar shrink-0 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('umum')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'umum'
                ? 'bg-[#0f4c82] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Pengaturan Utama & Drive</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tim')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'tim'
                ? 'bg-[#0f4c82] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Tim Kerja & Verifikator ({daftarTimKerja.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-[#0f4c82] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Penghapusan ({riwayatPenghapusanAudit.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'backup'
                ? 'bg-[#0f4c82] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Cadangan & Reset</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
          
          {/* TAB 1: PENGATURAN UMUM & SPREADSHEET */}
          {activeTab === 'umum' && (
            <div className="space-y-4">
              
              {/* Spreadsheet Information Banner */}
              <div className="p-3.5 bg-teal-50/80 rounded-xl border border-teal-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-5 h-5 text-teal-700 shrink-0" />
                  <div>
                    <div className="font-bold text-teal-900">Database Konfigurasi Google Spreadsheet</div>
                    <div className="text-[11px] text-teal-700">Sheet: <strong>Pengaturan</strong> · Tersimpan terpusat di Cloud</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-stretch sm:self-auto">
                  <button
                    type="button"
                    onClick={handleLoadFromSpreadsheet}
                    disabled={isLoadingSpreadsheet}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-teal-300 text-teal-800 font-bold text-[11px] hover:bg-teal-100 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    title="Tarik nilai pengaturan terbaru dari Sheet Pengaturan"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingSpreadsheet ? 'animate-spin' : ''}`} />
                    <span>Muat dari Sheet</span>
                  </button>

                  <a
                    href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                  >
                    <span>Buka Sheet</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* Spreadsheet ID */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Spreadsheet ID
                  </label>
                  <input
                    type="text"
                    value={spreadsheetId}
                    onChange={(e) => setSpreadsheetId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:border-[#0f4c82] outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    ID unik lembar kerja Google Sheets resmi BPS Kalbar
                  </p>
                </div>

                {/* Apps Script URL */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">
                      URL Google Apps Script Endpoint
                    </label>
                    {onOpenSetupDatabase && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenSetupDatabase();
                        }}
                        className="text-[11px] font-bold text-[#0f4c82] hover:underline cursor-pointer"
                      >
                        Buka Setup Lembar Spreadsheet ➔
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={appsScriptUrl}
                    onChange={(e) => setAppsScriptUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:border-[#0f4c82] outline-none"
                  />
                </div>

                {/* Kode Unit */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kode Unit Kerja
                  </label>
                  <input
                    type="text"
                    value={kodeUnit}
                    onChange={(e) => setKodeUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-xs focus:border-[#0f4c82] outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Standar unit BPS Prov. Kalbar: 6100</p>
                </div>

                {/* Nomor Baru Mulai Dari */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nomor Baru Mulai Dari
                  </label>
                  <input
                    type="number"
                    value={nomorBaruMulaiDari}
                    onChange={(e) => setNomorBaruMulaiDari(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:border-[#0f4c82] outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Urutan antrian minimum penomoran surat</p>
                </div>

                {/* No WhatsApp Admin */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nomor WhatsApp Admin Layanan
                  </label>
                  <input
                    type="text"
                    value={whatsappAdmin}
                    onChange={(e) => setWhatsappAdmin(e.target.value)}
                    placeholder="6281253817688"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:border-[#0f4c82] outline-none"
                  />
                </div>

                {/* Polling Interval */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Interval Sinkronisasi Otomatis (Detik)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={60}
                    value={syncIntervalSeconds}
                    onChange={(e) => setSyncIntervalSeconds(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:border-[#0f4c82] outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Waktu jeda polling aktivitas realtime (standar: 10s)</p>
                </div>

                {/* Google Drive Parent Folder ID */}
                <div className="sm:col-span-2 p-3.5 bg-blue-50/70 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-[#0f4c82] flex items-center gap-1.5 text-xs">
                      <Folder className="w-4 h-4 text-[#0f4c82]" />
                      <span>ID Folder Induk Google Drive (Penyimpanan Digital)</span>
                    </label>
                    {googleDriveFolderId && (
                      <a
                        href={`https://drive.google.com/drive/folders/${googleDriveFolderId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-[#0f4c82] hover:underline font-semibold"
                      >
                        <span>Buka Drive</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <input
                    type="text"
                    value={googleDriveFolderId}
                    onChange={(e) => setGoogleDriveFolderId(e.target.value)}
                    placeholder="1_Xsmp2dafHvoyhXuhS1x1_GkbWDy7i0S"
                    className="w-full px-3 py-2 rounded-lg border border-blue-200 bg-white font-mono text-xs focus:border-[#0f4c82] outline-none"
                  />
                  <div className="mt-2 p-2 bg-white rounded-lg border border-blue-100 font-mono text-[10.5px] text-slate-600 leading-relaxed">
                    <div>Folder Induk ({googleDriveFolderId || '1_Xsmp2daf...'})</div>
                    <div className="pl-3 text-slate-400">├── [Tahun] (misal: 2026)</div>
                    <div className="pl-6 text-slate-400">└── [Tim Kerja] (misal: Tim Sosial)</div>
                    <div className="pl-9 text-slate-400">└── [Bulan] (misal: 11 - November)</div>
                    <div className="pl-12 text-blue-700 font-bold">├── Draft/ (Berkas draf & revisi)</div>
                    <div className="pl-12 text-teal-700 font-bold">└── Arsip/ (Dokumen final sah bertandatangan)</div>
                  </div>
                </div>

              </div>

              {/* Aturan Senin Berkah Toggle */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-800">Aturan Slot Nomor Kosong Senin Otomatis</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Menyediakan slot nomor cadangan kosong untuk pemohon pertama di hari Senin.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={enableMondayRule}
                    onChange={(e) => setEnableMondayRule(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0f4c82]"></div>
                </label>
              </div>

            </div>
          )}

          {/* TAB 2: TIM KERJA & PEMETAAN VERIFIKATOR */}
          {activeTab === 'tim' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 text-slate-700">
                <div className="font-bold text-[#0f4c82] mb-0.5">Tata Kelola Master Tim Kerja & Verifikator</div>
                <div className="text-[11px] text-slate-600 leading-relaxed">
                  Pengaturan ini tersimpan di database Sheet <strong>Pengaturan</strong>. Seluruh opsi dropdown Tim Kerja pada formulir dan verifikator penerima pengajuan bersumber dari daftar ini.
                </div>
              </div>

              {/* Tambah Tim Kerja */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ketik nama Tim Kerja baru (misal: Tim Transformasi Digital)..."
                  value={newTimName}
                  onChange={(e) => setNewTimName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTimKerja())}
                  className="flex-1 h-9 px-3 rounded-xl border border-slate-300 text-xs focus:border-[#0f4c82] outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddTimKerja}
                  className="h-9 px-3 rounded-xl bg-[#0f4c82] hover:bg-[#1a6bb5] text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Tim</span>
                </button>
              </div>

              {/* Table of Tim Kerja & Assigned Verifier */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                    <tr>
                      <th className="py-2 px-3">Nama Tim Kerja</th>
                      <th className="py-2 px-3">Verifikator Ditunjuk</th>
                      <th className="py-2 px-3 text-center w-16">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {daftarTimKerja.map((tim) => {
                      const currentVerif = pemetaanVerifikator[tim]?.nama || 'Arsiparis Ahli BPS Kalbar';
                      return (
                        <tr key={tim} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {tim}
                          </td>
                          <td className="py-2.5 px-3">
                            <select
                              value={currentVerif}
                              onChange={(e) => handleUpdateVerifikatorForTim(tim, e.target.value)}
                              className="w-full h-8 px-2 rounded-lg border border-slate-300 bg-white text-xs font-medium focus:border-[#0f4c82] outline-none"
                            >
                              {VERIFIKATOR_OPTIONS.map((v) => (
                                <option key={v.nama} value={v.nama}>
                                  {v.nama} ({v.role})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveTimKerja(tim)}
                              className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer transition-colors"
                              title="Hapus tim kerja"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: RIWAYAT AUDIT PENGHAPUSAN DOKUMEN */}
          {activeTab === 'audit' && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-900">Catatan Audit Penghapusan Dokumen & Google Drive</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Merekam riwayat penghapusan naskah/arsip, waktu, aktor, serta status pembersihan file di Google Drive.
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-800 font-mono-tabular shrink-0">
                  {riwayatPenghapusanAudit.length} Catatan
                </span>
              </div>

              {riwayatPenghapusanAudit.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400">
                  <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <div className="font-bold text-slate-700 text-xs">Belum Ada Riwayat Penghapusan</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Seluruh dokumen yang dihapus oleh Administrator atau Konseptor akan tercatat di log audit ini.
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {riwayatPenghapusanAudit.map((log) => {
                    const isSuccess = log.statusDrive === 'BERHASIL' || log.statusDrive === 'TIDAK_ADA_FILE';
                    return (
                      <div
                        key={log.id}
                        className="p-3 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 transition-colors space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-800">
                              {log.nomorIdentifikasi}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                              {log.tipeData}
                            </span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                              isSuccess
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            Drive: {log.statusDrive}
                          </span>
                        </div>

                        <div className="text-[11px] font-medium text-slate-700 line-clamp-1">
                          {log.perihal}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                          <div>
                            Dihapus oleh: <strong>{log.pengguna}</strong> ({log.rolePengguna}) · Tim: {log.unitKerja}
                          </div>
                          <div className="font-mono text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{log.waktu}</span>
                          </div>
                        </div>

                        {log.fileIdsDrive && log.fileIdsDrive.length > 0 && (
                          <div className="text-[10px] text-slate-400 font-mono truncate">
                            ID Drive: {log.fileIdsDrive.join(', ')}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CADANGAN & RESET */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="font-bold text-slate-800">Cadangan Berkas JSON Sistem</div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Unduh seluruh konfigurasi dan data register nomor surat keluar dalam format file JSON untuk arsip cadangan lokal.
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={exportBackupJSON}
                    className="px-3.5 py-2 rounded-xl bg-[#0f4c82] hover:bg-[#1a6bb5] text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Cadangan JSON</span>
                  </button>

                  <label className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Pulihkan dari File JSON</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportJSON}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Reset Pabrik */}
              <div className="p-3.5 bg-red-50/70 rounded-xl border border-red-200 space-y-2">
                <div className="flex items-center gap-2 text-red-800 font-bold">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>Pengaturan Ulang (Reset ke Data Awal)</span>
                </div>
                <p className="text-[11px] text-red-700 leading-relaxed">
                  Tindakan ini akan mengembalikan seluruh pengaturan dan nomor ke kondisi awal bawaan BPS Kalbar.
                </p>
                {!confirmReset ? (
                  <button
                    type="button"
                    onClick={() => setConfirmReset(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset ke Kondisi Default</span>
                  </button>
                ) : (
                  <div className="p-3 bg-white rounded-lg border border-red-300 space-y-2">
                    <p className="text-[11px] font-bold text-red-800">
                      Konfirmasi Reset: Seluruh pengaturan & data lokal akan dikembalikan ke bawaan awal BPS Kalbar. Pastikan Anda sudah mengunduh cadangan JSON.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onResetData();
                          onToast('✔ Data sistem berhasil direset ke kondisi awal.');
                          setConfirmReset(false);
                          onClose();
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer"
                      >
                        Ya, Reset Sekarang
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmReset(false)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="text-[11px] text-slate-500 font-mono-tabular">
            Peran: <strong className="text-slate-800">{currentUser.jabatan}</strong> ({currentUser.role})
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Tutup
            </button>

            <button
              type="button"
              onClick={handleSaveToSpreadsheet}
              disabled={isSavingSpreadsheet}
              className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 active:scale-95 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all disabled:opacity-50"
              title="Simpan & rekam seluruh perubahan ke Sheet Pengaturan di Google Spreadsheet"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{isSavingSpreadsheet ? 'Menyimpan...' : 'Simpan ke Sheet Pengaturan'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                handleSaveLocal();
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-[#0f4c82] hover:bg-[#1a6bb5] active:scale-95 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Lokal</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
