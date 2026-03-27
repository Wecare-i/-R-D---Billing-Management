import type { BillingData } from '../types';
import { usd, usdShort } from '@/shared/utils/formatters';
import { Cloud, LayoutGrid } from 'lucide-react';

interface Props {
  data: BillingData;
  selectedMonth: string;
  showAzure: boolean;
  showGoogle: boolean;
  showM365: boolean;
}

export function BreakdownCards({ data, selectedMonth, showAzure, showGoogle, showM365 }: Props) {
  const current = selectedMonth === 'all'
    ? data.monthly.reduce((acc, m) => ({ az: acc.az + m.az, gg: acc.gg + m.gg, ms: acc.ms + m.ms }), { az: 0, gg: 0, ms: 0 })
    : data.monthly.find((m) => m.m === selectedMonth) || data.monthly[data.monthly.length - 1];

  const topServices = data.services.slice(0, 3);
  const cols = [showAzure, showGoogle, showM365].filter(Boolean).length;
  const gridClass = cols === 3 ? 'lg:grid-cols-3' : cols === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-1';

  return (
    <section className={`grid grid-cols-1 ${gridClass} gap-6`}>
      {/* Azure */}
      {showAzure && (
        <div className="card p-6 flex flex-col gap-5 group hover:border-primary/20 transition-all duration-300">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Cloud className="w-5 h-5 text-primary" fill="currentColor" />
              </div>
              <h3 className="font-bold text-lg">Azure Cloud</h3>
            </div>
            <span className="text-sm font-bold text-primary tabular-nums">{usd(current.az)}</span>
          </div>
          <div className="space-y-3">
            {topServices.map((s) => {
              const cost = selectedMonth === 'all' ? ((s.t01 || 0) + (s.t02 || 0) + (s.t03 || 0)) : (s[`t${selectedMonth.replace('T', '')}` as keyof typeof s] as number || 0);
              const pct = current.az > 0 ? Math.round((cost / current.az) * 100) : 0;
              return (
                <div key={s.name}>
                  <div className="flex justify-between items-end">
                    <span className="text-xs text-on-surface-variant font-medium">{s.name}</span>
                    <span className="text-sm font-bold tabular-nums">{usd(cost)}</span>
                  </div>
                  <div className="w-full bg-surface-container-lowest h-1.5 rounded-full overflow-hidden mt-1">
                    <div className="bg-primary h-full transition-all duration-700" style={{ width: `${pct}%`, opacity: Math.max(0.3, pct / 100) }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Google */}
      {showGoogle && (
      <div className="card p-6 flex flex-col gap-5 group hover:border-primary/20 transition-all duration-300">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-tertiary/10 flex items-center justify-center group-hover:bg-tertiary/20 transition-colors">
                <Cloud className="w-5 h-5 text-tertiary" fill="currentColor" />
              </div>
              <h3 className="font-bold text-lg">Google Cloud</h3>
            </div>
            <span className="text-sm font-bold text-tertiary tabular-nums">{usd(current.gg)}</span>
          </div>
          <div className="space-y-3">
            {[
              { name: 'Workspace', cost: data.google.workspace },
              { name: 'AI Studio', cost: data.google.aiStudio },
            ].map((item) => {
              const pct = current.gg > 0 ? Math.round((item.cost / current.gg) * 100) : 0;
              return (
                <div key={item.name}>
                  <div className="flex justify-between items-end">
                    <span className="text-xs text-on-surface-variant font-medium">{item.name}</span>
                    <span className="text-sm font-bold tabular-nums">{usd(item.cost)}</span>
                  </div>
                  <div className="w-full bg-surface-container-lowest h-1.5 rounded-full overflow-hidden mt-1">
                    <div className="bg-tertiary h-full transition-all duration-700" style={{ width: `${pct}%`, opacity: Math.max(0.3, pct / 100) }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* M365 */}
      {showM365 && (
      <div className="card p-6 flex flex-col gap-5 group hover:border-primary/20 transition-all duration-300">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent-purple/10 flex items-center justify-center group-hover:bg-accent-purple/20 transition-colors">
                <LayoutGrid className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="font-bold text-lg">M365 Licenses</h3>
            </div>
            <span className="text-sm font-bold text-purple-400 tabular-nums">{usd(current.ms)}</span>
          </div>
          <div className="space-y-3">
            {[...data.m365.items].sort((a, b) => b.cost - a.cost).slice(0, 3).map((item) => {
              const pct = current.ms > 0 ? Math.round((item.cost / current.ms) * 100) : 0;
              return (
                <div key={item.name}>
                  <div className="flex justify-between items-end">
                    <span className="text-xs text-on-surface-variant font-medium">{item.name}</span>
                    <span className="text-sm font-bold tabular-nums">${item.cost}</span>
                  </div>
                  <div className="w-full bg-surface-container-lowest h-1.5 rounded-full overflow-hidden mt-1">
                    <div className="bg-purple-400 h-full transition-all duration-700" style={{ width: `${pct}%`, opacity: Math.max(0.3, pct / 100) }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
