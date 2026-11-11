import React, { useMemo } from 'react';
import { BarChart3, Users, FileText, CheckCircle2, AlertCircle, PieChart, TrendingUp } from 'lucide-react';
import { SuratKeluar } from '../types';
import { TIM_KERJA_OPTIONS, BULAN_LIST } from '../data/bpsClassifications';

interface StatsAnalyticsViewProps {
  suratList: SuratKeluar[];
}

export const StatsAnalyticsView: React.FC<StatsAnalyticsViewProps> = ({ suratList }) => {
  // Letters per Tim Kerja
  const timStats = useMemo(() => {
    const counts: { [key: string]: number } = {};
    TIM_KERJA_OPTIONS.forEach((t) => (counts[t] = 0));
    counts['Lainnya'] = 0;

    suratList.forEach((item) => {
      if (item.status === 'LENGKAP' && item.timKerja) {
        if (counts[item.timKerja] !== undefined) {
          counts[item.timKerja]++;
        } else {
          counts['Lainnya'] = (counts['Lainnya'] || 0) + 1;
        }
      }
    });

    const maxCount = Math.max(...Object.values(counts), 1);

    return Object.entries(counts)
      .filter(([_, count]) => count > 0 || TIM_KERJA_OPTIONS.slice(0, 6).includes(_))
      .map(([team, count]) => ({
        team,
        count,
        percent: Math.round((count / (suratList.filter(s => s.status === 'LENGKAP').length || 1)) * 100),
        barWidth: Math.round((count / maxCount) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [suratList]);

  // Letters per Kode Surat
  const kodeStats = useMemo(() => {
    const counts = { B: 0, K: 0, R: 0 };
    suratList.forEach((s) => {
      if (counts[s.kodeSurat] !== undefined) counts[s.kodeSurat]++;
    });
    const total = suratList.length || 1;
    return [
      { kode: 'B', name: 'Biasa', count: counts.B, percent: Math.round((counts.B / total) * 100), color: 'bg-blue-600' },
      { kode: 'K', name: 'Khusus', count: counts.K, percent: Math.round((counts.K / total) * 100), color: 'bg-emerald-600' },
      { kode: 'R', name: 'Rahasia', count: counts.R, percent: Math.round((counts.R / total) * 100), color: 'bg-rose-600' },
    ];
  }, [suratList]);

  // Monthly Trend
  const monthlyStats = useMemo(() => {
    const counts: { [key: string]: number } = {};
    BULAN_LIST.forEach((b) => (counts[b] = 0));
    suratList.forEach((s) => {
      if (s.bulan && counts[s.bulan] !== undefined) counts[s.bulan]++;
    });
    return BULAN_LIST.map((b) => ({ bulan: b, count: counts[b] })).filter((m) => m.count > 0);
  }, [suratList]);

  const totalTerisi = suratList.filter((s) => s.status === 'LENGKAP').length;
  const totalKosong = suratList.filter((s) => s.status === 'KOSONG').length;

  return (
    <div className="space-y-6">
      
      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#0f4c82] flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Surat Diterbitkan</div>
            <div className="text-2xl font-black text-slate-900 font-mono-tabular mt-0.5">{suratList.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Register Aktif Sheet Keluar26</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Surat Terisi (Lengkap)</div>
            <div className="text-2xl font-black text-emerald-900 font-mono-tabular mt-0.5">{totalTerisi}</div>
            <div className="text-[11px] text-emerald-600 mt-0.5">
              {Math.round((totalTerisi / (suratList.length || 1)) * 100)}% dari total arsip
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nomor Kosong Tersedia</div>
            <div className="text-2xl font-black text-amber-900 font-mono-tabular mt-0.5">{totalKosong}</div>
            <div className="text-[11px] text-amber-600 mt-0.5">Slot cadangan dapat diklaim</div>
          </div>
        </div>
      </div>

      {/* Grid Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Distribusi Tim Kerja */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#0f4c82]" />
              <h3 className="text-sm font-bold text-slate-900">Distribusi Surat per Tim Kerja</h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">Berdasarkan surat lengkap</span>
          </div>

          <div className="space-y-3.5 pt-1">
            {timStats.map((item) => (
              <div key={item.team} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{item.team}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 font-mono-tabular">{item.count} surat</span>
                    <span className="text-[11px] text-slate-400 font-mono-tabular">({item.percent}%)</span>
                  </div>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#0f4c82] to-[#1a6bb5] rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(item.barWidth, 4)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Klasifikasi Kode Surat & Bulan */}
        <div className="space-y-6">
          {/* Kode Surat */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-[#0f4c82]" />
                <h3 className="text-sm font-bold text-slate-900">Proporsi Kode Surat</h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">Biasa, Khusus, Rahasia</span>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1">
              {kodeStats.map((k) => (
                <div key={k.kode} className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 text-center">
                  <div className="text-2xl font-black font-heading text-slate-900">{k.kode}</div>
                  <div className="text-xs font-bold text-slate-700 mt-0.5">{k.name}</div>
                  <div className="text-sm font-black font-mono-tabular text-[#0f4c82] mt-1.5">{k.count}</div>
                  <div className="text-[10px] text-slate-400 font-mono-tabular">{k.percent}% dari total</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tren Bulanan */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#0f4c82]" />
                <h3 className="text-sm font-bold text-slate-900">Rekapitulasi Bulanan</h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">Tahun 2026</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
              {monthlyStats.length === 0 ? (
                <div className="col-span-3 text-center text-xs text-slate-400 py-4">
                  Belum ada data bulanan tercatat.
                </div>
              ) : (
                monthlyStats.map((m) => (
                  <div key={m.bulan} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{m.bulan}</span>
                    <span className="font-bold text-[#0f4c82] font-mono-tabular">{m.count} surat</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
