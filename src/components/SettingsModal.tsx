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
  FolderTree,
} from 'lucide-react';
import { AppConfig, SuratKeluar } from '../types';

interface SettingsModalProps {
  config: AppConfig;
  onSaveConfig: (newConfig: AppConfig) => void;
  onClose: () => void;
  onOpenSetupDatabase?: () => void;
  suratList: SuratKeluar[];
  onRestoreData: (list: SuratKeluar[]) => void;
  onResetData: () => void;
  onToast: (msg: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  config,
  onSaveConfig,
  onClose,
  onOpenSetupDatabase,
  suratList,
  onRestoreData,
  onResetData,
  onToast,
}) => {
  const [spreadsheetId, setSpreadsheetId] = useState(config.spreadsheetId);
  const [sheetName, setSheetName] = useState(config.sheetName);
  const [nomorBaruMulaiDari, setNomorBaruMulaiDari] = useState(config.nomorBaruMulaiDari);
  const [kodeUnit, setKodeUnit] = useState(config.kodeUnit);
  const [whatsappAdmin, setWhatsappAdmin] = useState(config.whatsappAdmin);
  const [appsScriptUrl, setAppsScriptUrl] = useState(config.appsScriptUrl || '');
  const [enableMondayRule, setEnableMondayRule] = useState(config.enableMondayRule);
  const [googleDriveFolderId, setGoogleDriveFolderId] = useState(config.googleDriveFolderId || '1_Xsmp2dafHvoyhXuhS1x1_GkbWDy7i0S');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      spreadsheetId: spreadsheetId.trim(),
      sheetName: sheetName.trim(),
      nomorBaruMulaiDari: Number(nomorBaruMulaiDari) || 367,
      kodeUnit: kodeUnit.trim() || '6100',
      whatsappAdmin: whatsappAdmin.trim(),
      appsScriptUrl: appsScriptUrl.trim(),
      enableMondayRule,
      googleDriveFolderId: googleDriveFolderId.trim() || '1_Xsmp2dafHvoyhXuhS1x1_GkbWDy7i0S',
    });
    onToast('✔ Pengaturan sistem, spreadsheet, dan Google Drive berhasil disimpan!');
    onClose();
  };

  const exportBackupJSON = () => {
    const data = {
      config,
      suratList,
      exportedAt: new Date().toISOString(),
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
          alert('Format file JSON backup tidak valid.');
        }
      } catch {
        alert('Gagal membaca file JSON backup.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#0f4c82] flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Pengaturan Sistem & Google Sheets</h3>
              <p className="text-xs text-slate-500">Konfigurasi parameter penomoran dan integrasi Google Sheets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="mt-5 space-y-4 text-xs">
          
          {/* Link ke Google Sheets */}
          <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-5 h-5 text-emerald-700 shrink-0" />
              <div>
                <div className="font-bold text-emerald-900">Google Spreadsheet Resmi BPS</div>
                <div className="text-[11px] text-emerald-700">Sheet: {sheetName} (Unit: {kodeUnit})</div>
              </div>
            </div>
            <a
              href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs"
            >
              <span>Buka Sheet</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Spreadsheet ID */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                Spreadsheet ID
              </label>
              <input
                type="text"
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:border-[#1a6bb5] focus:ring-1 focus:ring-blue-100"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">
                ID unik dari URL Google Sheets (contoh: 1Pf0RmsY1zaJYds2kN969J01gmhMybkehcAyjwHo4byg)
              </p>
            </div>

            {/* Apps Script Web App URL */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                URL Google Apps Script Endpoint
              </label>
              <input
                type="text"
                value={appsScriptUrl}
                onChange={(e) => setAppsScriptUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:border-[#1a6bb5] focus:ring-1 focus:ring-blue-100"
              />
              <div className="flex items-center justify-between mt-1">
                <p className="text-[10px] text-slate-400">
                  URL Web App Google Apps Script untuk sinkronisasi database
                </p>
                {onOpenSetupDatabase && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenSetupDatabase();
                    }}
                    className="text-[11px] font-bold text-[#0f4c82] hover:underline cursor-pointer"
                  >
                    Buka Setup & Struktur Database ➔
                  </button>
                )}
              </div>
            </div>

            {/* Nama Sheet */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nama Tab Sheet
              </label>
              <input
                type="text"
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-xs focus:border-[#1a6bb5]"
              />
            </div>

            {/* Kode Unit */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Kode Unit Kerja BPS
              </label>
              <input
                type="text"
                value={kodeUnit}
                onChange={(e) => setKodeUnit(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-xs focus:border-[#1a6bb5]"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Kode resmi BPS Prov. Kalbar: 6100</p>
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
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:border-[#1a6bb5]"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Urutan minimum antrian permohonan baru</p>
            </div>

            {/* No WhatsApp Admin */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nomor WhatsApp Admin Bantuan
              </label>
              <input
                type="text"
                value={whatsappAdmin}
                onChange={(e) => setWhatsappAdmin(e.target.value)}
                placeholder="6281253817688"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:border-[#1a6bb5]"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Format internasional (diawali 62)</p>
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
                    <span>Buka Folder Drive</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <input
                type="text"
                value={googleDriveFolderId}
                onChange={(e) => setGoogleDriveFolderId(e.target.value)}
                placeholder="1_Xsmp2dafHvoyhXuhS1x1_GkbWDy7i0S"
                className="w-full px-3 py-2 rounded-lg border border-blue-200 bg-white font-mono text-xs focus:border-[#0f4c82] focus:ring-1 focus:ring-blue-200 outline-none"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Folder induk pusat penyimpanan arsip digital. Struktur hierarki folder otomatis:
              </p>
              <div className="mt-2 p-2 bg-white rounded-lg border border-blue-100 font-mono text-[11px] text-slate-700 leading-relaxed">
                <div>Folder Induk ({googleDriveFolderId || '1_Xsmp2daf...'})</div>
                <div className="pl-3 text-slate-500">├── Tahun (misal: 2026)</div>
                <div className="pl-6 text-slate-500">└── Tim Kerja (misal: Tim Sosial)</div>
                <div className="pl-9 text-slate-500">└── Bulan (misal: 11 - November)</div>
                <div className="pl-12 text-blue-700 font-bold">├── Draft (Draf naskah & revisi)</div>
                <div className="pl-12 text-emerald-700 font-bold">└── Arsip (Dokumen final sah bertanda tangan)</div>
              </div>
            </div>

          </div>

          {/* Aturan Senin Berkah Toggle */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
            <div>
              <div className="font-bold text-slate-800">Aturan "Senin Berkah" Otomatis</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Membuat 1 slot nomor kosong otomatis untuk pemohon pertama di hari Senin.
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

          {/* Backup & Restore Data */}
          <div className="pt-3 border-t border-slate-100">
            <div className="font-bold text-slate-800 mb-2">Cadangan & Pemulihan Arsip</div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={exportBackupJSON}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Backup JSON</span>
              </button>

              <label className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Pulihkan Backup</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Apakah Anda yakin ingin mengatur ulang data ke data default BPS? Perubahan yang belum dicadangkan akan terhapus.')) {
                    onResetData();
                    onToast('✔ Data sistem berhasil direset ke kondisi awal.');
                    onClose();
                  }
                }}
                className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-semibold flex items-center gap-1.5 cursor-pointer ml-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Awal</span>
              </button>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#0f4c82] hover:bg-[#1a6bb5] text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Pengaturan</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
