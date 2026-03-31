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

  // Google: dùng monthly[].gg (đã có per-month từ byMonth/invoice)
  const googleTotal = selectedMonth === 'all'
    ? data.monthly.reduce((s, m) => s + m.gg, 0)   // Q1 tổng
    : data.monthly.find(m => m.m === selectedMonth)?.gg ?? data.google.total;


  // M365: scale items từ T03 baseline về selected month total
  const m365Total = selectedMonth === 'all'
    ? data.monthly.reduce((s, m) => s + m.ms, 0)
    : current.ms;
  const m365Scale = data.m365.total > 0 ? m365Total / data.m365.total : 1;

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
              <div>
                <h3 className="font-bold text-lg">Google Cloud</h3>
                <span className="text-[10px] text-on-surface-variant/60 uppercase tracking-wider">
                  {selectedMonth === 'all' ? `Q1 (${data.monthly.length} tháng)` : 'Monthly subscription'}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-sm font-bold text-tertiary tabular-nums">{usd(googleTotal)}</span>
              {data.google.budget != null && selectedMonth !== 'all' && (
                <span className="text-[10px] text-on-surface-variant/50 tabular-nums">
                  Budget: {usd(data.google.budget)}
                </span>
              )}
            </div>
          </div>

          {/* Budget progress bar */}
          {data.google.budget != null && selectedMonth !== 'all' && (
            (() => {
              const spend = googleTotal;
              const budget = data.google.budget;
              const pct = Math.min(100, Math.round((spend / budget) * 100));
              const isWarning = pct >= 90;
              const isDanger = pct >= 100;
              return (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-medium text-on-surface-variant/70 uppercase tracking-wider">
                    <span>Budget usage</span>
                    <span className={isDanger ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-tertiary'}>
                      {pct}%
                    </span>
                  </div>
                  <div className="w-full bg-surface-container-lowest h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: isDanger
                          ? 'linear-gradient(90deg, #f87171, #ef4444)'
                          : isWarning
                          ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
                          : 'linear-gradient(90deg, #34d399, var(--color-tertiary))'
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-on-surface-variant/40 tabular-nums">
                    <span>$0</span>
                    <span>{usd(budget)}</span>
                  </div>
                </div>
              );
            })()
          )}

          {/* Item breakdown */}
          <div className="space-y-3">
            {googleTotal === 0 ? (
              <div className="w-full flex flex-col items-center justify-center gap-2 py-4 text-on-surface-variant bg-surface-container-lowest rounded-lg border border-dashed border-outline/30">
                <span className="text-xl">📭</span>
                <span className="text-xs font-medium text-center">Chưa có hóa đơn tháng này</span>
                <span className="text-[10px] opacity-60 text-center px-4">Hóa đơn Google được lưu theo tháng khi có invoice thực tế</span>
              </div>
            ) : data.google.items.length > 0 ? (
              data.google.items.map((item) => {
                const itemCost = selectedMonth === 'all' ? item.cost * data.monthly.length : item.cost;
                const pct = googleTotal > 0 ? Math.round((itemCost / googleTotal) * 100) : 0;
                return (
                  <div key={item.name}>
                    <div className="flex justify-between items-end">
                      <span className="text-xs text-on-surface-variant font-medium">{item.name}</span>
                      <span className="text-sm font-bold tabular-nums">{usd(itemCost)}</span>
                    </div>
                    <div className="w-full bg-surface-container-lowest h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="bg-tertiary h-full transition-all duration-700" style={{ width: `${pct}%`, opacity: Math.max(0.3, pct / 100) }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-xs text-on-surface-variant font-medium">Tổng chi phí từ invoice</span>
                  <span className="text-sm font-bold tabular-nums">{usd(googleTotal)}</span>
                </div>
                <div className="w-full bg-surface-container-lowest h-1.5 rounded-full overflow-hidden">
                  <div className="bg-tertiary h-full transition-all duration-700" style={{ width: '100%', opacity: 1 }} />
                </div>
                <p className="text-[10px] text-on-surface-variant/50 pt-1">
                  Breakdown theo dịch vụ sẽ có sau khi enable BigQuery Billing Export
                </p>
              </div>
            )}
          </div>


          {/* Source badge */}
          {data.google.source && (
            <div className="pt-1 border-t border-outline-variant/10">
              <span className={`text-[9px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                data.google.source === 'manual-invoice'
                  ? 'bg-amber-400/10 text-amber-400'
                  : data.google.source === 'budget-api'
                  ? 'bg-tertiary/10 text-tertiary'
                  : 'bg-surface-container text-on-surface-variant/50'
              }`}>
                {data.google.source === 'manual-invoice' ? '📄 Manual Invoice' : data.google.source === 'budget-api' ? '🔗 Budget API' : data.google.source}
              </span>
            </div>
          )}
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
              <div>
                <h3 className="font-bold text-lg">M365 Licenses</h3>
                {selectedMonth !== 'all' && selectedMonth !== data.buildMonth && (
                  <span className="text-[10px] text-on-surface-variant/60 uppercase tracking-wider">Tỉ lệ ước tính theo {selectedMonth}</span>
                )}
              </div>
            </div>
            <span className="text-sm font-bold text-purple-400 tabular-nums">{usd(m365Total)}</span>
          </div>
          <div className="space-y-3">
            {[...data.m365.items].sort((a, b) => b.cost - a.cost).slice(0, 3).map((item) => {
              // Scale cost về selected month total
              const scaledCost = Math.round(item.cost * m365Scale * 100) / 100;
              const pct = m365Total > 0 ? Math.round((scaledCost / m365Total) * 100) : 0;
              return (
                <div key={item.name}>
                  <div className="flex justify-between items-end">
                    <span className="text-xs text-on-surface-variant font-medium">{item.name}</span>
                    <span className="text-sm font-bold tabular-nums">{usd(scaledCost)}</span>
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
