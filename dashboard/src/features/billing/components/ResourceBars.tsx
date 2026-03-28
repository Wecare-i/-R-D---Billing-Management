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

export function ResourceBars({ data, vendor, selectedMonth }: Props) {
  const buildMonth = data.buildMonth || data.monthly[data.monthly.length - 1]?.m;
  const isCurrentPeriod = selectedMonth === 'all' || selectedMonth === buildMonth;
  const numMonths = selectedMonth === 'all' ? data.monthly.length : 1;

  // M365 total cho tháng được chọn (để scale items)
  const m365Monthly = selectedMonth === 'all'
    ? data.monthly.reduce((s, m) => s + m.ms, 0)
    : data.monthly.find(m => m.m === selectedMonth)?.ms ?? data.m365.total;
  const m365Scale = data.m365.total > 0 ? m365Monthly / data.m365.total : 1;

  let items: { name: string; cost: number; color: string; vendor: string }[] = [];

  // Azure resources:
  // - selectedMonth === buildMonth hoặc 'all': dùng data.resources (chi tiết resource)
  // - selectedMonth là tháng khác: dùng data.services (có per-month breakdown)
  if (vendor === 'all' || vendor === 'azure') {
    if (isCurrentPeriod) {
      items.push(...data.resources.map((r) => ({
        name: r.n, cost: r.c, color: CLR[r.t] || '#118DFF', vendor: 'Azure',
      })));
    } else {
      // Dùng services data — có t01/t02/t03
      const mKey = selectedMonth.toLowerCase().replace('t', '').padStart(2, '0');
      const serviceItems = data.services
        .map((s) => ({ name: s.name, cost: (s as unknown as Record<string, number>)[`t${mKey}`] || 0, color: '#118DFF', vendor: 'Azure' }))
        .filter((s) => s.cost > 0);
      items.push(...serviceItems);
    }
  }

  // Google: scale dynamic items theo numMonths khi 'all'
  if (vendor === 'all' || vendor === 'google') {
    items.push(...data.google.items.map(item => ({
      name: item.name, 
      cost: Math.round(item.cost * numMonths * 100) / 100, 
      color: '#E66C37', 
      vendor: 'Google' 
    })));
  }

  // M365: scale items về selected month total
  if (vendor === 'all' || vendor === 'm365') {
    items.push(...data.m365.items.map((item) => ({
      name: item.name,
      cost: Math.round(item.cost * m365Scale * 100) / 100,
      color: '#6B007B',
      vendor: 'M365',
    })));
  }

  // Sort by cost desc, take top 10
  items = items.sort((a, b) => b.cost - a.cost).slice(0, 10);
  if (!items.length) return null;
  const mx = items[0].cost;

  const subtitle = !isCurrentPeriod && (vendor === 'all' || vendor === 'azure')
    ? `Azure theo service type (${selectedMonth}) · Google & M365 subscription`
    : vendor === 'google' || vendor === 'm365' ? 'Monthly subscription' : undefined;

  return (
    <section className="card p-6">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">
          Top Resources — Detail
        </h4>
        {subtitle && (
          <span className="text-[10px] text-on-surface-variant/60 uppercase tracking-wider">{subtitle}</span>
        )}
      </div>
      <div className="space-y-2">
        {items.map((r) => {
          const pct = Math.round((r.cost / mx) * 100);
          return (
            <div key={`${r.vendor}-${r.name}`} className="flex items-center gap-3">
              <div className="text-xs text-on-surface-variant min-w-[180px] w-48 text-left truncate font-medium" title={r.name}>{r.name}</div>
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
