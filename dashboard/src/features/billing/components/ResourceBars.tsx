import type { BillingData } from '../types';
import { usd } from '@/shared/utils/formatters';

const CLR: Record<string, string> = {
  Fabric: '#118DFF', fabric: '#118DFF', capacities: '#118DFF',
  VM: '#12239E', virtualMachines: '#12239E',
  Disk: '#E66C37', disks: '#E66C37', storageAccounts: '#E66C37',
};

export function ResourceBars({ data }: { data: BillingData }) {
  const resources = data.resources;
  if (!resources.length) return null;
  const mx = resources[0].c;

  return (
    <section className="bg-surface-container/60 backdrop-blur-xl rounded-xl p-6">
      <h4 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-4">
        Top Resources — {data.monthly[data.monthly.length - 1]?.m}/2026 (Azure)
      </h4>
      <div className="space-y-2">
        {resources.map((r) => {
          const pct = Math.round((r.c / mx) * 100);
          const col = CLR[r.t] || '#6B007B';
          return (
            <div key={r.n} className="flex items-center gap-3">
              <div className="text-xs text-on-surface-variant min-w-[100px] text-right truncate font-medium">{r.n}</div>
              <div className="flex-1 h-5 bg-surface-container-lowest rounded overflow-hidden">
                <div
                  className="h-full rounded flex items-center pl-2 text-[10px] text-white font-bold transition-all duration-700"
                  style={{ width: `${pct}%`, background: col }}
                >
                  {pct > 15 ? usd(r.c) : ''}
                </div>
              </div>
              <div className="text-xs text-on-surface-variant min-w-[60px] text-right tabular-nums font-bold">{usd(r.c)}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
