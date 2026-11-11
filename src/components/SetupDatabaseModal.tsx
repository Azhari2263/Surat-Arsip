import React, { useState } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  Server,
  Table2,
  Code2,
  FileSpreadsheet,
  X,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { AppConfig, NaskahDinas, SuratKeluar, UserProfile } from '../types';
import { GOOGLE_APPS_SCRIPT_CODE, setupDatabaseSpreadsheet, fetchSpreadsheetData } from '../utils/apiSync';

interface SetupDatabaseModalProps {
  config: AppConfig;
  onClose: () => void;
  onSyncComplete?: (suratList: SuratKeluar[], naskahList: NaskahDinas[], userList?: UserProfile[]) => void;
  onToast: (msg: string) => void;
}

export const SetupDatabaseModal: React.FC<SetupDatabaseModalProps> = ({
  config,
  onClose,
  onSyncComplete,
  onToast,
}) => {
  const [activeTab, setActiveTab] = useState<'setup' | 'schema' | 'code'>('setup');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleRunSetup = async () => {
    setIsLoading(true);
    setStatusMessage({ type: 'info', text: 'Menghubungi Google Apps Script untuk menyiapkan lembar Keluar26, NaskahDinas, ArsipDigital, dan Pengguna...' });
    try {
      const res = await setupDatabaseSpreadsheet(config);
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: '✔ Berhasil! Struktur database (Keluar26, NaskahDinas, ArsipDigital, dan Pengguna) telah aktif pada Spreadsheet Google.',
        });
        onToast('✔ Database spreadsheet berhasil diinisialisasi!');
      } else {
        setStatusMessage({
          type: 'error',
          text: `Gagal: ${res.error}. Pastikan kode Apps Script telah dideploy sebagai Web App dengan akses "Anyone".`,
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Terjadi error jaringan: ${err.message || String(err)}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestSync = async () => {
    setIsSyncing(true);
    setStatusMessage({ type: 'info', text: 'Mengambil data terbaru dari Google Spreadsheet...' });
    try {
      const res = await fetchSpreadsheetData(config);
      if (res.success && res.suratList && res.naskahList) {
        setStatusMessage({
          type: 'success',
          text: `✔ Koneksi aktif! Ditemukan ${res.suratList.length} surat keluar, ${res.naskahList.length} draf naskah, dan ${res.userList?.length || 0} akun pengguna di spreadsheet.`,
        });
        if (onSyncComplete) {
          onSyncComplete(res.suratList, res.naskahList, res.userList);
        }
        onToast(`✔ Sinkronisasi sukses! ${res.suratList.length} surat, ${res.naskahList.length} naskah & ${res.userList?.length || 0} akun dimuat.`);
      } else {
        setStatusMessage({
          type: 'error',
          text: `Gagal membaca data: ${res.error || 'Respon kosong'}`,
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Gagal terhubung: ${err.message || String(err)}`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const copyScriptCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedCode(true);
    onToast('✔ Kode Google Apps Script telah disalin ke clipboard');
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/edit`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-[#0a335a] to-[#0f4c82] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Database className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold font-heading">
                Pusat Pengaturan Database Google Spreadsheet
              </h3>
              <p className="text-xs text-blue-200">
                Integrasi Realtime BPS Kalbar · ID: {config.spreadsheetId.slice(0, 12)}...
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('setup')}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'setup'
                ? 'border-[#0f4c82] text-[#0f4c82]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Inisialisasi & Sinkronisasi</span>
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'schema'
                ? 'border-[#0f4c82] text-[#0f4c82]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Table2 className="w-4 h-4" />
            <span>Skema Struktur Tabel (3 Sheet)</span>
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'code'
                ? 'border-[#0f4c82] text-[#0f4c82]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Kode Apps Script Backend</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-700 text-xs sm:text-sm flex-1">
          
          {/* Status Message Alert */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-3 animate-in fade-in duration-200 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : statusMessage.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              ) : (
                <RefreshCw className="w-5 h-5 text-blue-600 shrink-0 mt-0.5 animate-spin" />
              )}
              <div className="text-xs leading-relaxed font-medium">
                {statusMessage.text}
              </div>
            </div>
          )}

          {activeTab === 'setup' && (
            <div className="space-y-4">
              
              {/* Target Database Info Card */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-900 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Database Google Spreadsheet Utama</span>
                  </div>
                  <a
                    href={spreadsheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0f4c82] hover:text-[#0b3860] hover:underline"
                  >
                    <span>Buka Spreadsheet</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Spreadsheet ID</span>
                    <span className="font-mono text-slate-800 break-all select-all font-semibold">{config.spreadsheetId}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Kode Satuan Kerja</span>
                    <span className="font-mono text-slate-800 font-semibold">{config.kodeUnit} (BPS Provinsi Kalimantan Barat)</span>
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 text-xs">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider mb-1">URL Google Apps Script Endpoint</span>
                  <div className="font-mono text-[11px] text-slate-700 bg-slate-100 p-2 rounded border border-slate-200 break-all select-all">
                    {config.appsScriptUrl}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
                      <Database className="w-4 h-4 text-[#0f4c82]" />
                      <span>1. Setup Otomatis Database</span>
                    </h4>
                    <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                      Membuat dan memformat otomatis 3 lembar kerja di spreadsheet Anda: <strong>Keluar26</strong>, <strong>NaskahDinas</strong>, dan <strong>ArsipDigital</strong> lengkap dengan header dan styling warna standar BPS.
                    </p>
                  </div>
                  <button
                    onClick={handleRunSetup}
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-[#0f4c82] hover:bg-[#0b3860] active:scale-[0.99] disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sedang Memproses...</span>
                      </>
                    ) : (
                      <>
                        <Server className="w-4 h-4" />
                        <span>Inisialisasi Database Sekarang</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-emerald-700" />
                      <span>2. Sinkronisasi Data Realtime</span>
                    </h4>
                    <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                      Menarik seluruh rekaman nomor surat keluar dan berkas naskah dinas langsung dari Google Spreadsheet untuk menyelaraskan aplikasi ini.
                    </p>
                  </div>
                  <button
                    onClick={handleTestSync}
                    disabled={isSyncing}
                    className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSyncing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Menyinkronkan...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        <span>Tarik Data dari Spreadsheet</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Info Note */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-xs text-amber-800 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Zero Dummy Data Enforced:</strong> Seluruh data di aplikasi ini terhubung ke Spreadsheet BPS Kalbar. Setiap penerbitan nomor surat dan pengajuan draf naskah dinas langsung tersimpan ke spreadsheet resmi.
                </p>
              </div>

            </div>
          )}

          {activeTab === 'schema' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Berikut adalah skema kolom yang dibuat secara otomatis oleh fungsi <code>setupDatabase</code> di Google Sheets:
              </p>

              {/* Sheet 1 */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-[#0f4c82] text-white px-4 py-2 text-xs font-bold flex items-center justify-between">
                  <span>Lembar 1: Keluar26 (Register Penomoran Surat Keluar)</span>
                  <span className="font-mono text-[11px] bg-white/20 px-2 py-0.5 rounded">12 Kolom</span>
                </div>
                <div className="p-3 text-xs bg-white space-y-1.5 font-mono text-slate-700">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <span className="bg-slate-100 p-1.5 rounded">A: Nomor Surat Lengkap</span>
                    <span className="bg-slate-100 p-1.5 rounded">B: Kode Surat (B/R)</span>
                    <span className="bg-slate-100 p-1.5 rounded">C: Nomor Urut (367+)</span>
                    <span className="bg-slate-100 p-1.5 rounded">D: Kode Klasifikasi</span>
                    <span className="bg-slate-100 p-1.5 rounded">E: Perihal</span>
                    <span className="bg-slate-100 p-1.5 rounded">F: Tujuan</span>
                    <span className="bg-slate-100 p-1.5 rounded">G: Tanggal Surat</span>
                    <span className="bg-slate-100 p-1.5 rounded">H: Bulan</span>
                    <span className="bg-slate-100 p-1.5 rounded">I: Nama Pegawai</span>
                    <span className="bg-slate-100 p-1.5 rounded">J: Tim Kerja</span>
                    <span className="bg-slate-100 p-1.5 rounded">K: Waktu Input</span>
                    <span className="bg-slate-100 p-1.5 rounded">L: Status (LENGKAP/KOSONG)</span>
                  </div>
                </div>
              </div>

              {/* Sheet 2 */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-[#1a7a4a] text-white px-4 py-2 text-xs font-bold flex items-center justify-between">
                  <span>Lembar 2: NaskahDinas (Alur Pengajuan & Verifikasi Draf)</span>
                  <span className="font-mono text-[11px] bg-white/20 px-2 py-0.5 rounded">12 Kolom</span>
                </div>
                <div className="p-3 text-xs bg-white space-y-1.5 font-mono text-slate-700">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <span className="bg-slate-100 p-1.5 rounded">A: Nomor Registrasi (ND-2026-...)</span>
                    <span className="bg-slate-100 p-1.5 rounded">B: Jenis Naskah</span>
                    <span className="bg-slate-100 p-1.5 rounded">C: Perihal</span>
                    <span className="bg-slate-100 p-1.5 rounded">D: Unit Kerja</span>
                    <span className="bg-slate-100 p-1.5 rounded">E: Nama Konseptor</span>
                    <span className="bg-slate-100 p-1.5 rounded">F: Tanggal Pengajuan</span>
                    <span className="bg-slate-100 p-1.5 rounded">G: Verifikator Ditunjuk</span>
                    <span className="bg-slate-100 p-1.5 rounded">H: Status Berkas</span>
                    <span className="bg-slate-100 p-1.5 rounded">I: Nomor Surat Dipesan</span>
                    <span className="bg-slate-100 p-1.5 rounded">J: Klasifikasi Arsip</span>
                    <span className="bg-slate-100 p-1.5 rounded">K: Waktu Update</span>
                    <span className="bg-slate-100 p-1.5 rounded">L: Detail JSON Riwayat</span>
                  </div>
                </div>
              </div>

              {/* Sheet 3 */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-[#e06c1a] text-white px-4 py-2 text-xs font-bold flex items-center justify-between">
                  <span>Lembar 3: ArsipDigital (Naskah Dinas Final Sah)</span>
                  <span className="font-mono text-[11px] bg-white/20 px-2 py-0.5 rounded">11 Kolom</span>
                </div>
                <div className="p-3 text-xs bg-white space-y-1.5 font-mono text-slate-700">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <span className="bg-slate-100 p-1.5 rounded">A: Nomor Surat Resmi</span>
                    <span className="bg-slate-100 p-1.5 rounded">B: Jenis Naskah</span>
                    <span className="bg-slate-100 p-1.5 rounded">C: Perihal</span>
                    <span className="bg-slate-100 p-1.5 rounded">D: Unit Kerja</span>
                    <span className="bg-slate-100 p-1.5 rounded">E: Tanggal Penetapan</span>
                    <span className="bg-slate-100 p-1.5 rounded">F: Metode TTD (TTE/Basah)</span>
                    <span className="bg-slate-100 p-1.5 rounded">G: Pejabat Penandatangan</span>
                    <span className="bg-slate-100 p-1.5 rounded">H: Nama Berkas PDF</span>
                    <span className="bg-slate-100 p-1.5 rounded">I: Tingkat Keamanan</span>
                    <span className="bg-slate-100 p-1.5 rounded">J: Lokasi Penyimpanan</span>
                    <span className="bg-slate-100 p-1.5 rounded">K: Waktu Unggah</span>
                  </div>
                </div>
              </div>

              {/* Sheet 4 */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-[#3b28cc] text-white px-4 py-2 text-xs font-bold flex items-center justify-between">
                  <span>Lembar 4: Pengguna (Akun Pengguna & Hak Akses Terintegrasi)</span>
                  <span className="font-mono text-[11px] bg-white/20 px-2 py-0.5 rounded">12 Kolom</span>
                </div>
                <div className="p-3 text-xs bg-white space-y-1.5 font-mono text-slate-700">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <span className="bg-slate-100 p-1.5 rounded">A: ID Pengguna</span>
                    <span className="bg-slate-100 p-1.5 rounded">B: Username</span>
                    <span className="bg-slate-100 p-1.5 rounded">C: Kata Sandi</span>
                    <span className="bg-slate-100 p-1.5 rounded">D: NIP Pegawai</span>
                    <span className="bg-slate-100 p-1.5 rounded">E: Nama Lengkap</span>
                    <span className="bg-slate-100 p-1.5 rounded">F: Jabatan</span>
                    <span className="bg-slate-100 p-1.5 rounded">G: Unit Kerja</span>
                    <span className="bg-slate-100 p-1.5 rounded">H: Role (RBAC)</span>
                    <span className="bg-slate-100 p-1.5 rounded">I: Lingkup Verifikasi</span>
                    <span className="bg-slate-100 p-1.5 rounded">J: Modul Diizinkan</span>
                    <span className="bg-slate-100 p-1.5 rounded">K: Status (AKTIF/NONAKTIF)</span>
                    <span className="bg-slate-100 p-1.5 rounded">L: Waktu Update</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'code' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Salin skrip ini dan tempelkan di Google Sheets Anda pada menu <strong>Extensions &gt; Apps Script</strong>, lalu deploy sebagai <strong>Web App</strong> (Execute as: <em>Me</em>, Who has access: <em>Anyone</em>).
                </p>
                <button
                  onClick={copyScriptCode}
                  className="px-3 py-1.5 rounded-lg bg-[#0f4c82] hover:bg-[#0b3860] text-white text-xs font-semibold flex items-center gap-1.5 shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedCode ? 'Tersalin!' : 'Salin Kode'}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-900 text-slate-200 text-xs font-mono rounded-xl max-h-72 overflow-y-auto leading-relaxed">
                  {GOOGLE_APPS_SCRIPT_CODE}
                </pre>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Terhubung ke Google Spreadsheet ID: <code className="font-mono font-bold text-slate-700">1Pf0RmsY1za...</code>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
