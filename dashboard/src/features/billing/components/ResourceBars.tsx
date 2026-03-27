import type { BillingData } from '../types';
import type { VendorFilter } from '../hooks/useFilters';
import { usd } from '@/shared/utils/formatters';

const CLR: Record<string, string> = {
  Fabric: '#118DFF', fabric: '#118DFF', capacities: '#118DFF',
  VM: '#12239E', virtualMachines: '#12239E',
  Disk: '#E66C37', disks: '#E66C37', storageAccounts: '#E66C37',
  google: '#E66C37', m365: '#6B007B',
};

interface Props { data: BillingData; vendor: VendorFilter; selectedMonth: string; }

export function ResourceBars({ data, vendor }: Props) {
  // Build unified resource list
  let items: { name: string; cost: number; color: string; vendor: string }[] = [];

  // Azure resources
  if (vendor === 'all' || vendor === 'azure') {
    items.push(...data.resources.map((r) => ({
      name: r.n, cost: r.c, color: CLR[r.t] || '#118DFF', vendor: 'Azure',
    })));
  }

  // Google items
  if (vendor === 'all' || vendor === 'google') {
    items.push(
      { name: 'Workspace', cost: data.google.workspace, color: '#E66C37', vendor: 'Google' },
      { name: 'AI Studio', cost: data.google.aiStudio, color: '#FF9F40', vendor: 'Google' },
    );
  }

  // M365 items
  if (vendor === 'all' || vendor === 'm365') {
    items.push(...data.m365.items.map((item) => ({
      name: item.name, cost: item.cost, color: '#6B007B', vendor: 'M365',
    })));
  }

  // Sort by cost desc, take top 10
  items = items.sort((a, b) => b.cost - a.cost).slice(0, 10);
  if (!items.length) return null;
  const mx = items[0].cost;

  return (
    <section className="card p-6">
      <h4 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-4">
        Top Resources — Detail
      </h4>
      <div className="space-y-2">
        {items.map((r) => {
          const pct = Math.round((r.cost / mx) * 100);
          return (
            <div key={r.name} className="flex items-center gap-3">
              <div className="text-xs text-on-surface-variant min-w-[180px] text-right truncate font-medium">{r.name}</div>
              <div className="flex-1 h-5 bg-surface-container-lowest rounded overflow-hidden">
                <div
                  className="h-full rounded flex items-center pl-2 text-[10px] text-white font-bold transition-all duration-700"
                  style={{ width: `${pct}%`, background: r.color }}
                >
                  {pct > 15 ? usd(r.cost) : ''}
                </div>
              </div>
              <div className="text-xs text-on-surface-variant min-w-[60px] text-right tabular-nums font-bold">{usd(r.cost)}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
