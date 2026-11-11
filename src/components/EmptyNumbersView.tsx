import React, { useState } from 'react';
import { Layers, Calendar, CheckCircle2, ArrowRight, AlertCircle, Info, Sparkles } from 'lucide-react';
import { SuratKeluar } from '../types';
import { BULAN_LIST } from '../data/bpsClassifications';
import { formatTanggalIndo, formatTanggalWaktuIndo } from '../utils/storage';

interface EmptyNumbersViewProps {
  emptyList: SuratKeluar[];
  onClaim: (item: SuratKeluar) => void;
  onNavigateToForm: () => void;
}

export const EmptyNumbersView: React.FC<EmptyNumbersViewProps> = ({
  emptyList,
  onClaim,
  onNavigateToForm,
}) => {
  const [selectedBulan, setSelectedBulan] = useState<string>('Semua');

  const filtered = emptyList.filter((item) => {
    if (selectedBulan === 'Semua') return true;
    return (item.bulan || '').toLowerCase() === selectedBulan.toLowerCase();
  });

  return (
    <div className="space-y-6">
      {/* Banner Penjelasan */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 bg-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-heading">
                Monitoring Nomor Surat Kosong (Cadangan)
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 font-mono-tabular">
                {emptyList.length} Slot
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Nomor kosong merupakan nomor urut cadangan yang tercipta otomatis pada pengajuan pertama setiap hari Senin ("Aturan Senin Berkah") atau permohonan yang belum terisi lengkap. Anda dapat mengklaim nomor ini untuk keperluan surat dinas backdated atau urusan tata usaha khusus.
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToForm}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-[#0f4c82] hover:bg-[#1a6bb5] text-white flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer whitespace-nowrap self-stretch md:self-auto justify-center"
        >
          <span>Buat Permintaan Baru</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Month Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-xs font-bold text-slate-500 whitespace-nowrap mr-2">Filter Bulan:</span>
        <button
          onClick={() => setSelectedBulan('Semua')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
            selectedBulan === 'Semua'
              ? 'bg-[#0f4c82] text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Semua ({emptyList.length})
        </button>
        {BULAN_LIST.map((b) => {
          const countInMonth = emptyList.filter(
            (i) => (i.bulan || '').toLowerCase() === b.toLowerCase()
          ).length;
          return (
            <button
              key={b}
              onClick={() => setSelectedBulan(b)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                selectedBulan === b
                  ? 'bg-[#0f4c82] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{b}</span>
              {countInMonth > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  selectedBulan === b ? 'bg-white/30 text-white' : 'bg-amber-100 text-amber-800'
                }`}>
                  {countInMonth}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Grid of Empty Slots */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-7 h-7 text-emerald-500" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            Tidak ada nomor kosong pada periode ini
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Semua nomor surat telah terisi lengkap. Anda dapat mengajukan nomor baru secara langsung melalui Form Permintaan.
          </p>
          <button
            onClick={onNavigateToForm}
            className="mt-4 px-4 py-2 rounded-xl bg-[#0f4c82] text-white text-xs font-bold hover:bg-[#1a6bb5] cursor-pointer"
          >
            Buka Form Permintaan Baru
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-amber-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-400" />
              
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black font-heading text-[#0f4c82] font-mono-tabular">
                      #{item.nomorUrut}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      KOSONG
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
                    {item.bulan || 'Bulan Tidak Terdata'}
                  </span>
                </div>

                <div className="mt-3 p-2.5 bg-slate-50 rounded-lg border border-slate-100 font-mono-tabular text-xs text-slate-700 break-all select-all">
                  {item.nomorSuratLengkap}
                </div>

                <div className="mt-3 space-y-1 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Tanggal Terbit Awal: <strong className="text-slate-800">{item.tanggalSurat ? formatTanggalIndo(item.tanggalSurat) : 'Belum diisi'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Dibuat: {formatTanggalWaktuIndo(item.waktuInput)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <button
                  onClick={() => onClaim(item)}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Klaim & Isi Nomor Ini Sekarang</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
