import React from 'react';
import { FileCheck2, Clock, AlertCircle, Hash, Sparkles } from 'lucide-react';
import { StatsData } from '../types';

interface StatsBarProps {
  stats: StatsData;
  nextNomor: number;
  onFilterKosong?: () => void;
}

export const StatsBar: React.FC<StatsBarProps> = ({ stats, nextNomor, onFilterKosong }) => {
  return (
    <div className="bg-white border-b border-slate-200 shadow-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-3">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 items-center">
          
          {/* Total Surat */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="w-10 h-10 rounded-lg bg-blue-100/80 text-[#0f4c82] flex items-center justify-center shrink-0">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Surat</div>
              <div className="text-lg font-bold text-slate-900 font-mono-tabular leading-tight">{stats.total}</div>
            </div>
          </div>

          {/* Surat Terisi */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider">Surat Terisi</div>
              <div className="text-lg font-bold text-emerald-900 font-mono-tabular leading-tight">{stats.terisi}</div>
            </div>
          </div>

          {/* Nomor Kosong */}
          <div
            onClick={onFilterKosong}
            className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
              stats.kosong > 0
                ? 'bg-amber-50/70 border-amber-200 cursor-pointer hover:bg-amber-100/60 hover:shadow-xs'
                : 'bg-slate-50 border-slate-200'
            }`}
            title={stats.kosong > 0 ? 'Klik untuk melihat nomor kosong' : undefined}
          >
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-medium text-amber-800 uppercase tracking-wider flex items-center justify-between">
                <span>Nomor Kosong</span>
                {stats.kosong > 0 && <span className="text-[10px] text-amber-600 font-normal underline">Lihat</span>}
              </div>
              <div className="text-lg font-bold text-amber-900 font-mono-tabular leading-tight">{stats.kosong}</div>
            </div>
          </div>

          {/* Nomor Terakhir */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="w-10 h-10 rounded-lg bg-slate-200/80 text-slate-700 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Nomor Terakhir</div>
              <div className="text-lg font-bold text-slate-900 font-mono-tabular leading-tight">#{stats.terakhir}</div>
            </div>
          </div>

          {/* Antrian Nomor Berikutnya */}
          <div className="col-span-2 md:col-span-1 flex items-center gap-3 p-2.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
            <div className="w-10 h-10 rounded-lg bg-[#0f4c82] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-[#0f4c82] uppercase tracking-wider">Antrian Baru</div>
              <div className="text-lg font-black text-[#0f4c82] font-mono-tabular leading-tight">#{nextNomor}</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
