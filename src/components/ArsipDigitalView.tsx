import React, { useState, useMemo } from 'react';
import {
  Archive,
  Search,
  Filter,
  Download,
  FileText,
  Calendar,
  Building,
  ShieldCheck,
  Eye,
  CheckCircle2,
  ExternalLink,
  Layers,
  Sparkles,
  Edit3,
  Trash2,
  X,
  Save,
  AlertTriangle,
} from 'lucide-react';
import { DokumenFinal, NaskahDinas, UserProfile } from '../types';
import { TIM_KERJA_OPTIONS } from '../data/bpsClassifications';
import { formatTanggalIndo } from '../utils/storage';

interface ArsipDigitalViewProps {
  naskahList: NaskahDinas[];
  currentUser?: UserProfile | null;
  onUpdateArsip?: (naskahId: string, updatedDoc: DokumenFinal) => void;
  onDeleteArsip?: (naskah: NaskahDinas) => void;
  onToast: (msg: string) => void;
}

export const ArsipDigitalView: React.FC<ArsipDigitalViewProps> = ({
  naskahList,
  currentUser,
  onUpdateArsip,
  onDeleteArsip,
  onToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUnit, setFilterUnit] = useState('all');
  const [filterTipeTtd, setFilterTipeTtd] = useState('all');
  const [selectedDoc, setSelectedDoc] = useState<NaskahDinas | null>(null);

  // CRUD Modals State
  const [editingDoc, setEditingDoc] = useState<NaskahDinas | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<NaskahDinas | null>(null);

  // Edit form state
  const [editPejabat, setEditPejabat] = useState('');
  const [editTanggal, setEditTanggal] = useState('');
  const [editTipeTtd, setEditTipeTtd] = useState<'TTE' | 'KONVENSIONAL'>('TTE');
  const [editKeamanan, setEditKeamanan] = useState<'Biasa' | 'Terbatas' | 'Rahasia' | 'Sangat Rahasia'>('Biasa');
  const [editLokasi, setEditLokasi] = useState('');

  // Only documents with FINAL_DIARSIPKAN status
  const arsipList = useMemo(() => {
    return naskahList
      .filter((n) => n.status === 'FINAL_DIARSIPKAN' && n.dokumenFinal)
      .filter((n) => {
        if (filterUnit !== 'all' && n.unitKerja !== filterUnit) return false;
        if (filterTipeTtd !== 'all' && n.dokumenFinal?.tipeTandaTangan !== filterTipeTtd) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchNo = (n.dokumenFinal?.nomorSuratResmi || '').toLowerCase().includes(q);
          const matchPerihal = n.perihal.toLowerCase().includes(q);
          const matchPejabat = (n.dokumenFinal?.pejabatPenandatangan || '').toLowerCase().includes(q);
          const matchKonseptor = n.namaKonseptor.toLowerCase().includes(q);
          const matchKlasif = (n.klasifikasiArsip || '').toLowerCase().includes(q);
          return matchNo || matchPerihal || matchPejabat || matchKonseptor || matchKlasif;
        }

        return true;
      });
  }, [naskahList, filterUnit, filterTipeTtd, searchQuery]);

  const countTTE = arsipList.filter((a) => a.dokumenFinal?.tipeTandaTangan === 'TTE').length;
  const countManual = arsipList.filter((a) => a.dokumenFinal?.tipeTandaTangan === 'KONVENSIONAL').length;

  const canManage = (item: NaskahDinas): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'ADMIN' || currentUser.role === 'ARSIPARIS') return true;
    return currentUser.nama.toLowerCase() === item.namaKonseptor.toLowerCase();
  };

  const handleStartEdit = (item: NaskahDinas) => {
    if (!item.dokumenFinal) return;
    setEditingDoc(item);
    setEditPejabat(item.dokumenFinal.pejabatPenandatangan || '');
    setEditTanggal(item.dokumenFinal.tanggalPenetapan || '');
    setEditTipeTtd(item.dokumenFinal.tipeTandaTangan || 'TTE');
    setEditKeamanan(item.dokumenFinal.tingkatKeamanan || 'Biasa');
    setEditLokasi(item.dokumenFinal.lokasiPenyimpanan || 'Cloud Repository BPS');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc || !editingDoc.dokumenFinal) return;

    const updatedDoc: DokumenFinal = {
      ...editingDoc.dokumenFinal,
      pejabatPenandatangan: editPejabat.trim() || editingDoc.dokumenFinal.pejabatPenandatangan,
      tanggalPenetapan: editTanggal.trim() || editingDoc.dokumenFinal.tanggalPenetapan,
      tipeTandaTangan: editTipeTtd,
      tingkatKeamanan: editKeamanan,
      lokasiPenyimpanan: editLokasi.trim() || 'Cloud Repository BPS',
    };

    if (onUpdateArsip) {
      onUpdateArsip(editingDoc.id, updatedDoc);
    }

    if (selectedDoc?.id === editingDoc.id) {
      setSelectedDoc({
        ...editingDoc,
        dokumenFinal: updatedDoc,
      });
    }

    setEditingDoc(null);
    onToast(`✔ Metadata arsip ${updatedDoc.nomorSuratResmi} berhasil diperbarui!`);
  };

  const handleConfirmDelete = () => {
    if (!deletingDoc) return;
    if (onDeleteArsip) {
      onDeleteArsip(deletingDoc);
    }
    if (selectedDoc?.id === deletingDoc.id) {
      setSelectedDoc(null);
    }
    const noSurat = deletingDoc.dokumenFinal?.nomorSuratResmi || deletingDoc.nomorRegistrasi;
    setDeletingDoc(null);
    onToast(`✔ Arsip digital ${noSurat} berhasil dihapus dari sistem dan database.`);
  };

  const exportArsipCSV = () => {
    const headers = [
      'Nomor Surat Resmi',
      'Jenis Naskah',
      'Perihal',
      'Unit Kerja',
      'Tanggal Penetapan',
      'Metode TTD',
      'Pejabat Penandatangan',
      'Klasifikasi Arsip',
      'Nama Berkas PDF',
    ];

    const rows = arsipList.map((item) => [
      `"${item.dokumenFinal?.nomorSuratResmi || ''}"`,
      `"${item.jenisNaskah}"`,
      `"${item.perihal.replace(/"/g, '""')}"`,
      `"${item.unitKerja}"`,
      `"${item.dokumenFinal?.tanggalPenetapan || ''}"`,
      `"${item.dokumenFinal?.tipeTandaTangan || ''}"`,
      `"${item.dokumenFinal?.pejabatPenandatangan || ''}"`,
      `"${item.klasifikasiArsip}"`,
      `"${item.dokumenFinal?.namaFile || ''}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Daftar_Arsip_Digital_BPS_Kalbar_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    onToast('✔ Daftar arsip digital berhasil diekspor ke CSV!');
  };

  return (
    <div className="space-y-5">
      
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
            <Archive className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-heading">
                Pusat Penyimpanan Arsip Digital Naskah Dinas
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-900 text-emerald-400 font-mono-tabular">
                {arsipList.length} Dokumen Sah
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
              Repositori permanen naskah dinas resmi BPS Provinsi Kalimantan Barat yang telah sah ditandatangani secara elektronik (TTE BSrE) atau konvensional (Sheet ArsipDigital).
            </p>
          </div>
        </div>

        <button
          onClick={exportArsipCSV}
          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap self-stretch md:self-auto justify-center"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Ekspor Daftar Arsip</span>
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Arsip Digital</div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono-tabular mt-1">{arsipList.length} Berkas</div>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Tanda Tangan TTE</div>
          <div className="text-xl sm:text-2xl font-black text-emerald-900 font-mono-tabular mt-1">{countTTE} Dokumen</div>
        </div>
        <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 shadow-xs">
          <div className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Tanda Tangan Basah / Scan</div>
          <div className="text-xl sm:text-2xl font-black text-blue-900 font-mono-tabular mt-1">{countManual} Dokumen</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Format Standar</div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono-tabular mt-1">100% PDF Standar</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari nomor naskah, perihal, pejabat, konseptor, klasifikasi arsip..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:border-[#0f4c82] focus:ring-2 focus:ring-[#0f4c82]/20 outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterUnit}
            onChange={(e) => setFilterUnit(e.target.value)}
            className="h-10 px-3.5 text-xs font-medium rounded-xl border border-slate-300 bg-white text-slate-700 outline-none focus:border-[#0f4c82] focus:ring-2 focus:ring-[#0f4c82]/20 transition-all cursor-pointer"
          >
            <option value="all">Semua Unit Kerja</option>
            {TIM_KERJA_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            value={filterTipeTtd}
            onChange={(e) => setFilterTipeTtd(e.target.value)}
            className="h-10 px-3.5 text-xs font-medium rounded-xl border border-slate-300 bg-white text-slate-700 outline-none focus:border-[#0f4c82] focus:ring-2 focus:ring-[#0f4c82]/20 transition-all cursor-pointer"
          >
            <option value="all">Semua Jenis TTD</option>
            <option value="TTE">TTE Elektronik BSrE</option>
            <option value="KONVENSIONAL">Konvensional Basah</option>
          </select>
        </div>
      </div>

      {/* Grid of Archive Cards */}
      {arsipList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <Archive className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">Belum Ada Dokumen dalam Arsip Digital</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Naskah dinas yang telah disetujui verifikator dan ditandatangani pimpinan dapat diunggah softcopy PDF-nya untuk diarsipkan di sini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {arsipList.map((item) => {
            const doc = item.dokumenFinal!;
            const isTte = doc.tipeTandaTangan === 'TTE';
            const userCanManage = canManage(item);

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4 relative overflow-hidden"
              >
                <div className={`absolute top-0 left-0 right-0 h-1 ${
                  isTte ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                }`} />

                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono-tabular font-bold text-sm text-[#0f4c82] break-all">
                      {doc.nomorSuratResmi}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      isTte ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {isTte ? 'TTE BSrE' : 'TTD Basah'}
                    </span>
                  </div>

                  <div className="text-[11px] font-semibold text-slate-500 mt-1">
                    {item.jenisNaskah} · {item.unitKerja}
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 mt-2 line-clamp-2 leading-snug">
                    {item.perihal}
                  </h4>

                  <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-[11px] text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tanggal Penetapan:</span>
                      <strong className="text-slate-800 font-mono-tabular">{formatTanggalIndo(doc.tanggalPenetapan)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Penandatangan:</span>
                      <span className="text-slate-800 font-medium truncate max-w-[160px] text-right">{doc.pejabatPenandatangan}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Klasifikasi Arsip:</span>
                      <strong className="text-slate-800 font-mono-tabular">{item.klasifikasiArsip}</strong>
                    </div>
                    {doc.lokasiPenyimpanan && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Lokasi:</span>
                        <span className="text-slate-600 truncate max-w-[160px] text-right">{doc.lokasiPenyimpanan}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedDoc(item)}
                      className="flex-1 py-1.5 px-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1 cursor-pointer"
                      title="Lihat detail metadata arsip"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>Detail</span>
                    </button>

                    <a
                      href={doc.dataUrl || '#'}
                      download={doc.namaFile}
                      onClick={(e) => {
                        if (!doc.dataUrl) {
                          e.preventDefault();
                          onToast(`✔ Mengunduh berkas arsip: ${doc.namaFile}`);
                        }
                      }}
                      className="flex-1 py-1.5 px-2.5 rounded-lg bg-[#0f4c82] hover:bg-[#1a6bb5] text-white text-xs font-bold flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                      title="Unduh berkas PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh PDF</span>
                    </a>
                  </div>

                  {/* Actions: Edit & Delete for Admin / Konseptor */}
                  {userCanManage && (
                    <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-100">
                      <button
                        onClick={() => handleStartEdit(item)}
                        className="px-2 py-1 rounded-md text-[11px] font-semibold text-slate-600 hover:text-[#0f4c82] hover:bg-blue-50 flex items-center gap-1 transition-colors cursor-pointer"
                        title="Ubah metadata arsip"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Ubah Metadata</span>
                      </button>

                      <button
                        onClick={() => setDeletingDoc(item)}
                        className="px-2 py-1 rounded-md text-[11px] font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-1 transition-colors cursor-pointer"
                        title="Hapus arsip digital"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedDoc && selectedDoc.dokumenFinal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto text-slate-900 text-xs">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Archive className="w-5 h-5 text-emerald-700" />
                <h3 className="text-base font-bold text-slate-900">Metadata Arsip Digital</h3>
              </div>
              <button onClick={() => setSelectedDoc(null)} className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer">
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-800 uppercase">Nomor Surat Resmi</span>
                <div className="text-base font-black font-mono-tabular text-slate-900 mt-0.5 select-all">
                  {selectedDoc.dokumenFinal.nomorSuratResmi}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 font-medium">Jenis Naskah</span>
                  <div className="font-bold text-slate-900">{selectedDoc.jenisNaskah}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 font-medium">Unit Kerja</span>
                  <div className="font-bold text-slate-900">{selectedDoc.unitKerja}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 font-medium">Tanggal Penetapan</span>
                  <div className="font-bold text-slate-900 font-mono-tabular">{formatTanggalIndo(selectedDoc.dokumenFinal.tanggalPenetapan)}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 font-medium">Metode Tanda Tangan</span>
                  <div className="font-bold text-emerald-700">{selectedDoc.dokumenFinal.tipeTandaTangan === 'TTE' ? 'TTE Elektronik BSrE' : 'Tanda Tangan Basah / Scan'}</div>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-400 font-medium">Perihal Naskah Dinas</span>
                <div className="font-medium text-slate-900 mt-0.5">{selectedDoc.perihal}</div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-400 font-medium">Pejabat Penandatangan</span>
                <div className="font-bold text-slate-900 mt-0.5">{selectedDoc.dokumenFinal.pejabatPenandatangan}</div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 font-medium">Tingkat Keamanan</span>
                  <div className="font-bold text-slate-900">{selectedDoc.dokumenFinal.tingkatKeamanan}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 font-medium">Lokasi Penyimpanan</span>
                  <div className="font-medium text-slate-900">{selectedDoc.dokumenFinal.lokasiPenyimpanan || 'Cloud Repository BPS'}</div>
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-5 h-5 text-[#0f4c82] shrink-0" />
                  <div className="truncate">
                    <div className="font-bold text-slate-900 truncate">{selectedDoc.dokumenFinal.namaFile}</div>
                    <div className="text-[10px] text-slate-500 font-mono-tabular">
                      {(selectedDoc.dokumenFinal.ukuranFile / 1024).toFixed(1)} KB · Format PDF
                    </div>
                  </div>
                </div>
                <a
                  href={selectedDoc.dokumenFinal.dataUrl || '#'}
                  download={selectedDoc.dokumenFinal.namaFile}
                  className="px-3 py-1.5 rounded-lg bg-[#0f4c82] text-white font-bold text-xs shrink-0 hover:bg-[#1a6bb5]"
                >
                  Unduh PDF
                </a>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              {canManage(selectedDoc) && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const docToEdit = selectedDoc;
                      setSelectedDoc(null);
                      handleStartEdit(docToEdit);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 text-[#0f4c82] hover:bg-blue-100 font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Ubah Metadata</span>
                  </button>

                  <button
                    onClick={() => {
                      const docToDelete = selectedDoc;
                      setSelectedDoc(null);
                      setDeletingDoc(docToDelete);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Arsip</span>
                  </button>
                </div>
              )}

              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold cursor-pointer ml-auto"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Edit Metadata Modal */}
      {editingDoc && editingDoc.dokumenFinal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto text-slate-900 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#0f4c82]" />
                <h3 className="text-base font-bold text-slate-900">Ubah Metadata Arsip Digital</h3>
              </div>
              <button
                onClick={() => setEditingDoc(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Nomor Surat Resmi (Tetap)</span>
                <div className="text-sm font-black font-mono-tabular text-[#0f4c82] mt-0.5">
                  {editingDoc.dokumenFinal.nomorSuratResmi}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 truncate">
                  {editingDoc.perihal}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pejabat Penandatangan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editPejabat}
                  onChange={(e) => setEditPejabat(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-[#0f4c82] outline-none"
                  placeholder="Contoh: Kepala BPS Provinsi Kalimantan Barat"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Penetapan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editTanggal}
                    onChange={(e) => setEditTanggal(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-[#0f4c82] outline-none font-mono-tabular"
                    placeholder="Contoh: 10/11/2026"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Metode Tanda Tangan
                  </label>
                  <select
                    value={editTipeTtd}
                    onChange={(e) => setEditTipeTtd(e.target.value as 'TTE' | 'KONVENSIONAL')}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-[#0f4c82] outline-none bg-white"
                  >
                    <option value="TTE">TTE Elektronik (BSrE)</option>
                    <option value="KONVENSIONAL">Konvensional Basah / Cap</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tingkat Keamanan
                  </label>
                  <select
                    value={editKeamanan}
                    onChange={(e) => setEditKeamanan(e.target.value as 'Biasa' | 'Terbatas' | 'Rahasia' | 'Sangat Rahasia')}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-[#0f4c82] outline-none bg-white"
                  >
                    <option value="Biasa">Biasa / Terbuka</option>
                    <option value="Terbatas">Terbatas</option>
                    <option value="Rahasia">Rahasia</option>
                    <option value="Sangat Rahasia">Sangat Rahasia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lokasi Penyimpanan
                  </label>
                  <input
                    type="text"
                    value={editLokasi}
                    onChange={(e) => setEditLokasi(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-[#0f4c82] outline-none"
                    placeholder="Contoh: Lemari Arsip TU / Google Drive"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#0f4c82] hover:bg-[#1a6bb5] text-white font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-slate-900 text-xs">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Konfirmasi Hapus Arsip</h3>
                <p className="text-[11px] text-slate-500">Tindakan ini akan menghapus arsip digital dari spreadsheet.</p>
              </div>
            </div>

            <div className="p-3 bg-red-50/60 rounded-xl border border-red-200 text-slate-700 space-y-1 mb-4">
              <div className="text-[11px] font-bold text-slate-500 uppercase">Nomor Surat Resmi:</div>
              <div className="font-mono-tabular font-bold text-red-800 text-sm">
                {deletingDoc.dokumenFinal?.nomorSuratResmi || deletingDoc.nomorRegistrasi}
              </div>
              <div className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                {deletingDoc.perihal}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingDoc(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Arsip</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

