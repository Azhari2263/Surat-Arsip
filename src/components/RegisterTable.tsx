import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Eye,
  Edit3,
  Trash2,
  FileText,
  CheckCircle2,
  AlertCircle,
  Copy,
  ChevronRight,
  ArrowUpDown,
  X,
  Save,
  AlertTriangle,
} from 'lucide-react';
import { SuratKeluar, KodeSuratType } from '../types';
import { BULAN_LIST, TIM_KERJA_OPTIONS } from '../data/bpsClassifications';
import { formatTanggalIndo, formatTanggalWaktuIndo } from '../utils/storage';

interface RegisterTableProps {
  suratList: SuratKeluar[];
  onClaimKosong: (item: SuratKeluar) => void;
  onUpdateSurat?: (updated: SuratKeluar) => void;
  onDeleteSurat?: (item: SuratKeluar) => void;
  onToast: (msg: string) => void;
}

export const RegisterTable: React.FC<RegisterTableProps> = ({
  suratList,
  onClaimKosong,
  onUpdateSurat,
  onDeleteSurat,
  onToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKode, setFilterKode] = useState<string>('all');
  const [filterTim, setFilterTim] = useState<string>('all');
  const [filterBulan, setFilterBulan] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortAsc, setSortAsc] = useState<boolean>(false); // default newest (descending)
  
  // Modals state
  const [selectedDetail, setSelectedDetail] = useState<SuratKeluar | null>(null);
  const [editingSurat, setEditingSurat] = useState<SuratKeluar | null>(null);
  const [deletingSurat, setDeletingSurat] = useState<SuratKeluar | null>(null);

  // Edit form state
  const [editPerihal, setEditPerihal] = useState('');
  const [editTujuan, setEditTujuan] = useState('');
  const [editPegawai, setEditPegawai] = useState('');
  const [editTim, setEditTim] = useState('');
  const [editTanggal, setEditTanggal] = useState('');
  const [editKlasifikasi, setEditKlasifikasi] = useState('');
  const [editStatus, setEditStatus] = useState<'LENGKAP' | 'KOSONG'>('LENGKAP');

  const filteredData = useMemo(() => {
    return suratList
      .filter((item) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchNo = item.nomorSuratLengkap.toLowerCase().includes(q);
          const matchUrut = String(item.nomorUrut).includes(q);
          const matchPerihal = item.perihal.toLowerCase().includes(q);
          const matchTujuan = item.tujuan.toLowerCase().includes(q);
          const matchPegawai = item.namaPegawai.toLowerCase().includes(q);
          const matchKlasif = item.kodeKlasifikasi.toLowerCase().includes(q);
          if (!matchNo && !matchUrut && !matchPerihal && !matchTujuan && !matchPegawai && !matchKlasif) {
            return false;
          }
        }

        // Filters
        if (filterKode !== 'all' && item.kodeSurat !== filterKode) return false;
        if (filterTim !== 'all' && item.timKerja !== filterTim) return false;
        if (filterBulan !== 'all' && (item.bulan || '').toLowerCase() !== filterBulan.toLowerCase()) return false;
        if (filterStatus !== 'all' && item.status !== filterStatus) return false;

        return true;
      })
      .sort((a, b) => {
        return sortAsc ? a.nomorUrut - b.nomorUrut : b.nomorUrut - a.nomorUrut;
      });
  }, [suratList, searchQuery, filterKode, filterTim, filterBulan, filterStatus, sortAsc]);

  const exportCSV = () => {
    const headers = [
      'Nomor Surat Lengkap',
      'Kode Surat',
      'Nomor Urut',
      'Kode Klasifikasi',
      'Perihal',
      'Tujuan',
      'Tanggal Surat',
      'Bulan',
      'Nama Pegawai',
      'Tim Kerja',
      'Waktu Input',
      'Status',
    ];

    const rows = filteredData.map((item) => [
      `"${item.nomorSuratLengkap.replace(/"/g, '""')}"`,
      `"${item.kodeSurat}"`,
      item.nomorUrut,
      `"${item.kodeKlasifikasi}"`,
      `"${item.perihal.replace(/"/g, '""')}"`,
      `"${item.tujuan.replace(/"/g, '""')}"`,
      `"${item.tanggalSurat}"`,
      `"${item.bulan}"`,
      `"${item.namaPegawai.replace(/"/g, '""')}"`,
      `"${item.timKerja.replace(/"/g, '""')}"`,
      `"${item.waktuInput}"`,
      `"${item.status}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Arsip_Surat_Keluar_BPS_Kalbar_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onToast('✔ Arsip berhasil diekspor ke format CSV!');
  };

  const copyRow = (item: SuratKeluar) => {
    const text = `${item.nomorSuratLengkap} | ${item.perihal || '(Kosong)'} | Tujuan: ${item.tujuan || '-'} | Pemohon: ${item.namaPegawai || '-'}`;
    navigator.clipboard.writeText(text);
    onToast(`✔ Informasi surat #${item.nomorUrut} telah disalin`);
  };

  const handleOpenEdit = (item: SuratKeluar) => {
    setEditingSurat(item);
    setEditPerihal(item.perihal);
    setEditTujuan(item.tujuan);
    setEditPegawai(item.namaPegawai);
    setEditTim(item.timKerja);
    setEditTanggal(item.tanggalSurat);
    setEditKlasifikasi(item.kodeKlasifikasi);
    setEditStatus(item.status);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSurat || !onUpdateSurat) return;

    const updated: SuratKeluar = {
      ...editingSurat,
      perihal: editPerihal.trim(),
      tujuan: editTujuan.trim(),
      namaPegawai: editPegawai.trim(),
      timKerja: editTim.trim(),
      tanggalSurat: editTanggal.trim(),
      kodeKlasifikasi: editKlasifikasi.trim(),
      status: editStatus,
    };

    onUpdateSurat(updated);
    setEditingSurat(null);
    if (selectedDetail && selectedDetail.id === updated.id) {
      setSelectedDetail(updated);
    }
    onToast(`✔ Data surat #${updated.nomorUrut} berhasil diperbarui di database!`);
  };

  const handleConfirmDelete = () => {
    if (!deletingSurat || !onDeleteSurat) return;
    const urut = deletingSurat.nomorUrut;
    onDeleteSurat(deletingSurat);
    setDeletingSurat(null);
    if (selectedDetail && selectedDetail.id === deletingSurat.id) {
      setSelectedDetail(null);
    }
    onToast(`✔ Surat #${urut} telah berhasil dihapus dari database.`);
  };

  return (
    <div className="space-y-4">
      {/* Control Header & Filters */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3.5">
        
        {/* Top search & CSV Export */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nomor surat, perihal, tujuan, pemohon, klasifikasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:border-[#0f4c82] focus:ring-2 focus:ring-[#0f4c82]/20 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="h-10 px-3.5 text-xs font-semibold rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Ganti urutan nomor urut"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <span>{sortAsc ? 'Terlama (Asc)' : 'Terbaru (Desc)'}</span>
            </button>

            <button
              onClick={exportCSV}
              className="h-10 px-4 text-xs font-bold rounded-xl bg-[#1a7a4a] hover:bg-[#15633c] text-white flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              title="Unduh data tabel dalam format CSV (Excel compatible)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {/* Filter Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full h-10 px-3.5 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-700 outline-none focus:border-[#0f4c82] focus:ring-2 focus:ring-[#0f4c82]/20 transition-all cursor-pointer"
          >
            <option value="all">Status: Semua</option>
            <option value="LENGKAP">LENGKAP (Terisi)</option>
            <option value="KOSONG">KOSONG (Cadangan)</option>
          </select>

          {/* Filter Kode Surat */}
          <select
            value={filterKode}
            onChange={(e) => setFilterKode(e.target.value)}
            className="w-full h-10 px-3.5 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-700 outline-none focus:border-[#0f4c82] focus:ring-2 focus:ring-[#0f4c82]/20 transition-all cursor-pointer"
          >
            <option value="all">Kode Surat: Semua</option>
            <option value="B">B - Biasa</option>
            <option value="K">K - Khusus</option>
            <option value="R">R - Rahasia</option>
          </select>

          {/* Filter Tim Kerja */}
          <select
            value={filterTim}
            onChange={(e) => setFilterTim(e.target.value)}
            className="w-full h-10 px-3.5 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-700 outline-none focus:border-[#0f4c82] focus:ring-2 focus:ring-[#0f4c82]/20 transition-all cursor-pointer"
          >
            <option value="all">Tim Kerja: Semua</option>
            {TIM_KERJA_OPTIONS.map((tim) => (
              <option key={tim} value={tim}>
                {tim}
              </option>
            ))}
          </select>

          {/* Filter Bulan */}
          <select
            value={filterBulan}
            onChange={(e) => setFilterBulan(e.target.value)}
            className="w-full h-10 px-3.5 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-700 outline-none focus:border-[#0f4c82] focus:ring-2 focus:ring-[#0f4c82]/20 transition-all cursor-pointer"
          >
            <option value="all">Bulan: Semua</option>
            {BULAN_LIST.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Data View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <th className="py-3 px-3.5 whitespace-nowrap">No. Urut</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Nomor Surat Lengkap</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Kode</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Klasifikasi</th>
                <th className="py-3 px-4 min-w-[220px]">Perihal</th>
                <th className="py-3 px-4 min-w-[160px]">Tujuan</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Tanggal</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Tim Kerja</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Pemohon</th>
                <th className="py-3 px-3.5 text-center whitespace-nowrap">Status</th>
                <th className="py-3 px-3.5 text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500">
                    <div className="max-w-md mx-auto space-y-1">
                      <p className="font-semibold text-slate-700">
                        {suratList.length === 0
                          ? 'Belum ada data nomor surat keluar di sheet Keluar26'
                          : 'Tidak ada nomor surat yang sesuai dengan filter pencarian.'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {suratList.length === 0
                          ? 'Data murni bersumber dari database Google Spreadsheet BPS Kalbar (1Pf0RmsY1za...). Gunakan menu Ambil Nomor Baru atau lakukan sinkronisasi.'
                          : 'Coba ubah kata kunci pencarian atau sesuaikan opsi filter tim kerja/status.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((row, idx) => {
                  const isKosong = row.status === 'KOSONG';
                  return (
                    <tr
                      key={row.id}
                      className={`transition-colors hover:bg-blue-50/40 ${
                        isKosong ? 'bg-amber-50/40' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                      }`}
                    >
                      {/* Nomor Urut */}
                      <td className="py-3 px-3.5 font-mono font-bold text-slate-800 tabular-nums">
                        #{row.nomorUrut}
                      </td>

                      {/* Nomor Surat Lengkap */}
                      <td className="py-3 px-3.5 font-mono font-semibold text-slate-900 whitespace-nowrap tabular-nums">
                        {row.nomorSuratLengkap}
                      </td>

                      {/* Kode */}
                      <td className="py-3 px-3.5 font-semibold text-slate-700">
                        {row.kodeSurat}
                      </td>

                      {/* Klasifikasi */}
                      <td className="py-3 px-3.5 font-mono font-medium text-slate-600 tabular-nums">
                        {row.kodeKlasifikasi || '—'}
                      </td>

                      {/* Perihal */}
                      <td className="py-3 px-4 text-slate-800 line-clamp-2">
                        {row.perihal || <span className="text-amber-600 italic">Placeholder Kosong</span>}
                      </td>

                      {/* Tujuan */}
                      <td className="py-3 px-4 text-slate-700">
                        {row.tujuan || '—'}
                      </td>

                      {/* Tanggal */}
                      <td className="py-3 px-3.5 font-mono text-slate-600 whitespace-nowrap tabular-nums">
                        {row.tanggalSurat ? formatTanggalIndo(row.tanggalSurat) : '—'}
                      </td>

                      {/* Tim Kerja */}
                      <td className="py-3 px-3.5 text-slate-700 whitespace-nowrap">
                        {row.timKerja || '—'}
                      </td>

                      {/* Pemohon */}
                      <td className="py-3 px-3.5 text-slate-700 whitespace-nowrap">
                        {row.namaPegawai || '—'}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3.5 text-center">
                        {isKosong ? (
                          <span className="text-amber-700 font-semibold text-[11px]">
                            Kosong
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-semibold text-[11px]">
                            Lengkap
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {isKosong ? (
                            <button
                              onClick={() => onClaimKosong(row)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#1a7a4a] hover:bg-[#15633c] text-white transition-colors cursor-pointer"
                              title="Gunakan & Isi Nomor Kosong Ini"
                            >
                              Isi Nomor
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => setSelectedDetail(row)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Lihat detail lengkap"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => copyRow(row)}
                                className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Salin ringkasan"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              {onUpdateSurat && (
                                <button
                                  onClick={() => handleOpenEdit(row)}
                                  className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                  title="Ubah data surat ini"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {onDeleteSurat && (
                                <button
                                  onClick={() => setDeletingSurat(row)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Hapus surat ini dari database"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer info */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
          <div>
            Menampilkan <span className="font-semibold text-slate-800 font-mono tabular-nums">{filteredData.length}</span> dari{' '}
            <span className="font-semibold text-slate-800 font-mono tabular-nums">{suratList.length}</span> total surat
          </div>
          <div className="text-[11px] text-slate-400">
            Sheet: Keluar26 · Unit 6100
          </div>
        </div>
      </div>

      {/* Modal Detail Row */}
      {selectedDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#0f4c82]" />
                <h3 className="text-base font-bold text-slate-900">Detail Surat Keluar</h3>
              </div>
              <button
                onClick={() => setSelectedDetail(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100">
                <div className="text-[10px] uppercase font-bold text-[#0f4c82] tracking-wider">Nomor Surat Lengkap</div>
                <div className="text-base font-black font-mono text-slate-900 mt-0.5 select-all tabular-nums">
                  {selectedDetail.nomorSuratLengkap}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <div className="text-slate-500 font-medium">Nomor Urut</div>
                  <div className="text-sm font-bold text-slate-900 font-mono tabular-nums">#{selectedDetail.nomorUrut}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <div className="text-slate-500 font-medium">Kode Surat</div>
                  <div className="text-sm font-bold text-slate-900">{selectedDetail.kodeSurat}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <div className="text-slate-500 font-medium">Klasifikasi</div>
                  <div className="text-sm font-bold text-slate-900 font-mono tabular-nums">{selectedDetail.kodeKlasifikasi}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <div className="text-slate-500 font-medium">Tanggal Surat</div>
                  <div className="text-sm font-bold text-slate-900">{selectedDetail.tanggalSurat ? formatTanggalIndo(selectedDetail.tanggalSurat) : '—'}</div>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg">
                <div className="text-slate-500 font-medium">Perihal Surat</div>
                <div className="text-sm text-slate-900 mt-1 font-medium">{selectedDetail.perihal}</div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg">
                <div className="text-slate-500 font-medium">Tujuan Kepada</div>
                <div className="text-sm text-slate-900 mt-1 font-medium">{selectedDetail.tujuan}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <div className="text-slate-500 font-medium">Nama Pegawai</div>
                  <div className="text-sm font-bold text-slate-900">{selectedDetail.namaPegawai}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <div className="text-slate-500 font-medium">Tim Kerja</div>
                  <div className="text-sm font-bold text-slate-900">{selectedDetail.timKerja}</div>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg">
                <div className="text-slate-500 font-medium">Waktu Input Sistem</div>
                <div className="text-xs text-slate-700 font-mono mt-0.5 tabular-nums">{formatTanggalWaktuIndo(selectedDetail.waktuInput)}</div>
              </div>

              {selectedDetail.fileAttachment && (
                <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-700" />
                    <div>
                      <div className="font-bold text-slate-800">{selectedDetail.fileAttachment.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono tabular-nums">
                        {(selectedDetail.fileAttachment.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                  {selectedDetail.fileAttachment.dataUrl && (
                    <a
                      href={selectedDetail.fileAttachment.dataUrl}
                      download={selectedDetail.fileAttachment.name}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700"
                    >
                      Unduh Lampiran
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {onUpdateSurat && !selectedDetail.status.includes('KOSONG') && (
                  <button
                    onClick={() => {
                      const item = selectedDetail;
                      setSelectedDetail(null);
                      handleOpenEdit(item);
                    }}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Ubah Data</span>
                  </button>
                )}
                {onDeleteSurat && (
                  <button
                    onClick={() => {
                      const item = selectedDetail;
                      setSelectedDetail(null);
                      setDeletingSurat(item);
                    }}
                    className="px-3 py-2 rounded-xl border border-rose-200 text-xs font-semibold text-rose-700 hover:bg-rose-50 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Surat</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyRow(selectedDetail)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Salin Data
                </button>
                <button
                  onClick={() => setSelectedDetail(null)}
                  className="px-4 py-2 rounded-xl bg-[#0f4c82] hover:bg-[#1a6bb5] text-white text-xs font-semibold cursor-pointer transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ubah Surat */}
      {editingSurat && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Ubah Data Surat Keluar #{editingSurat.nomorUrut}
                </h3>
              </div>
              <button
                onClick={() => setEditingSurat(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nomor Surat Lengkap</label>
                <input
                  type="text"
                  disabled
                  value={editingSurat.nomorSuratLengkap}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-100 font-mono text-slate-600 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Perihal Surat *</label>
                <textarea
                  rows={2}
                  required
                  value={editPerihal}
                  onChange={(e) => setEditPerihal(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-[#0f4c82] focus:ring-1 focus:ring-blue-100 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tujuan Kepada *</label>
                <input
                  type="text"
                  required
                  value={editTujuan}
                  onChange={(e) => setEditTujuan(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-[#0f4c82] focus:ring-1 focus:ring-blue-100 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Pegawai / Pemohon</label>
                  <input
                    type="text"
                    value={editPegawai}
                    onChange={(e) => setEditPegawai(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-[#0f4c82] focus:ring-1 focus:ring-blue-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tim Kerja</label>
                  <select
                    value={editTim}
                    onChange={(e) => setEditTim(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-[#0f4c82] bg-white outline-none"
                  >
                    <option value="">Pilih Tim Kerja</option>
                    {TIM_KERJA_OPTIONS.map((tim) => (
                      <option key={tim} value={tim}>
                        {tim}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Surat (DD/MM/YYYY)</label>
                  <input
                    type="text"
                    value={editTanggal}
                    onChange={(e) => setEditTanggal(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:border-[#0f4c82] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Nomor</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as 'LENGKAP' | 'KOSONG')}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-[#0f4c82] bg-white outline-none"
                  >
                    <option value="LENGKAP">LENGKAP (Terisi)</option>
                    <option value="KOSONG">KOSONG (Cadangan)</option>
                  </select>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSurat(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#0f4c82] hover:bg-[#0b3860] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Hapus Surat */}
      {deletingSurat && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Hapus Surat #{deletingSurat.nomorUrut}?
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus nomor surat <strong>{deletingSurat.nomorSuratLengkap}</strong>? Data akan dihapus dari aplikasi dan database Google Spreadsheet.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div><strong className="text-slate-700">Perihal:</strong> {deletingSurat.perihal || '(Kosong)'}</div>
              <div><strong className="text-slate-700">Pemohon:</strong> {deletingSurat.namaPegawai || '-'}</div>
              <div><strong className="text-slate-700">Tujuan:</strong> {deletingSurat.tujuan || '-'}</div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingSurat(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
