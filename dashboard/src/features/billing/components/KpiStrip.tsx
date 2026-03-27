import type { BillingData } from '../types';
import { usdShort } from '@/shared/utils/formatters';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface Props { data: BillingData; selectedMonth: string; }

export function KpiStrip({ data, selectedMonth }: Props) {
  const current = selectedMonth === 'all'
    ? data.monthly.reduce((acc, m) => ({ m: 'Q1', az: acc.az + m.az, gg: acc.gg + m.gg, ms: acc.ms + m.ms }), { m: 'Q1', az: 0, gg: 0, ms: 0 })
    : data.monthly.find((m) => m.m === selectedMonth) || data.monthly[data.monthly.length - 1];

  const currentIdx = data.monthly.findIndex((m) => m.m === selectedMonth);
  const prev = currentIdx > 0 ? data.monthly[currentIdx - 1] : null;
  const totalNow = current.az + current.gg + current.ms;
  const totalPrev = prev ? prev.az + prev.gg + prev.ms : 0;
  const momPct = totalPrev > 0 ? ((totalNow - totalPrev) / totalPrev) * 100 : 0;

  const kpis = [
    { label: `Total ${current.m}`, value: usdShort(totalNow), accent: 'border-primary/50 text-primary', highlight: true },
    { label: 'Azure', value: usdShort(current.az), accent: 'border-outline/40' },
    { label: 'Google', value: usdShort(current.gg), accent: 'border-outline/40' },
    { label: 'M365', value: usdShort(current.ms), accent: 'border-outline/40' },
  ];

  return (
    <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map((k) => (
        <div key={k.label} className={`bg-surface-container-low border ${k.accent} rounded-full px-5 py-3 flex flex-col items-center justify-center text-center transition-all duration-200 hover:-translate-y-1 hover:bg-surface-container-high hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] cursor-default`}>
          <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">{k.label}</span>
          <span className={`text-xl font-bold tabular-nums ${k.highlight ? 'text-primary' : ''}`}>{k.value}</span>
        </div>
      ))}
      {prev && (
        <div className="bg-surface-container-low border border-tertiary/40 rounded-full px-5 py-3 flex flex-col items-center justify-center text-center transition-all duration-200 hover:-translate-y-1 hover:bg-surface-container-high hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] cursor-default">
          <span className="text-[10px] uppercase tracking-widest font-bold text-tertiary">vs {prev.m}</span>
          <div className="flex items-center gap-1">
            {momPct >= 0 ? <TrendingUp className="w-4 h-4 text-tertiary" /> : <TrendingDown className="w-4 h-4 text-green-400" />}
            <span className={`text-xl font-bold tabular-nums ${momPct >= 0 ? 'text-tertiary' : 'text-green-400'}`}>
              {momPct >= 0 ? '↑' : '↓'}{Math.abs(momPct).toFixed(0)}%
            </span>
          </div>
        </div>
      )}
      <div className="bg-surface-container-low border border-accent-purple/50 rounded-full px-5 py-3 flex flex-col items-center justify-center text-center transition-all duration-200 hover:-translate-y-1 hover:bg-surface-container-high hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] cursor-default">
        <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Forecast</span>
        <span className="text-xl font-bold tabular-nums text-purple-400">~{usdShort(data.forecast || 0)}</span>
      </div>
    </section>
  );
}
