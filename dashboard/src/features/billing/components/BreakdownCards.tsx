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
        <div className="bg-surface-container/60 backdrop-blur-xl rounded-xl p-6 flex flex-col gap-5 hover:bg-surface-container-high transition-all duration-300 group">
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
        <div className="bg-surface-container/60 backdrop-blur-xl rounded-xl p-6 flex flex-col gap-5 hover:bg-surface-container-high transition-all duration-300 group">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-tertiary/10 flex items-center justify-center group-hover:bg-tertiary/20 transition-colors">
                <Cloud className="w-5 h-5 text-tertiary" fill="currentColor" />
              </div>
              <h3 className="font-bold text-lg">Google Cloud</h3>
            </div>
            <span className="text-sm font-bold text-tertiary tabular-nums">{usd(current.gg)}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-container-low p-4 rounded-lg flex flex-col gap-1 hover:bg-surface-container transition-colors">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase">Workspace</span>
              <span className="text-xl font-bold tabular-nums">{usdShort(data.google.workspace)}</span>
            </div>
            <div className="bg-surface-container-low p-4 rounded-lg flex flex-col gap-1 hover:bg-surface-container transition-colors">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase">AI Studio</span>
              <span className="text-xl font-bold tabular-nums">{usdShort(data.google.aiStudio)}</span>
            </div>
          </div>
        </div>
      )}

      {/* M365 */}
      {showM365 && (
        <div className="bg-surface-container/60 backdrop-blur-xl rounded-xl p-6 flex flex-col gap-5 hover:bg-surface-container-high transition-all duration-300 group">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent-purple/10 flex items-center justify-center group-hover:bg-accent-purple/20 transition-colors">
                <LayoutGrid className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="font-bold text-lg">M365 Licenses</h3>
            </div>
            <span className="text-sm font-bold text-purple-400 tabular-nums">{usd(current.ms)}</span>
          </div>
          <div className="space-y-2">
            {data.m365.items.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg hover:bg-surface-container transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                  <span className="text-xs font-medium">{item.name}</span>
                </div>
                <span className="text-xs font-bold tabular-nums">${item.cost}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
