import type { BillingData } from '../types';
import { usdShort } from '@/shared/utils/formatters';

interface Props { data: BillingData; selectedMonth: string; }

export function ServiceTable({ data, selectedMonth }: Props) {
  const getVal = (s: typeof data.services[0], month: string) => {
    if (month === 'all') return (s.t01 || 0) + (s.t02 || 0) + (s.t03 || 0);
    return (s[`t${month.replace('T', '')}` as keyof typeof s] as number) || 0;
  };

  const sortedServices = [...data.services].sort((a, b) => getVal(b, selectedMonth) - getVal(a, selectedMonth));
  const totalQ1 = sortedServices.reduce((s, r) => s + getVal(r, selectedMonth), 0);

  const showAllMonths = selectedMonth === 'all';

  return (
    <section className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-container-low">
            <th className="text-left px-6 py-3 text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Service</th>
            {showAllMonths ? (
              <>
                <th className="text-right px-4 py-3 text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">T01</th>
                <th className="text-right px-4 py-3 text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">T02</th>
                <th className="text-right px-4 py-3 text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">T03</th>
              </>
            ) : null}
            <th className="text-right px-4 py-3 text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">{showAllMonths ? 'Q1 Total' : selectedMonth}</th>
            <th className="text-right px-6 py-3 text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">%</th>
          </tr>
        </thead>
        <tbody className="text-xs">
          {sortedServices.map((s) => {
            const val = getVal(s, selectedMonth);
            const pct = totalQ1 > 0 ? (val / totalQ1) * 100 : 0;
            return (
              <tr key={s.name} className="hover:bg-surface-container-highest transition-colors cursor-default">
                <td className="px-6 py-3">{s.name}</td>
                {showAllMonths ? (
                  <>
                    <td className="text-right px-4 py-3 tabular-nums">{usdShort(s.t01 || 0)}</td>
                    <td className="text-right px-4 py-3 tabular-nums">{usdShort(s.t02 || 0)}</td>
                    <td className="text-right px-4 py-3 tabular-nums">{usdShort(s.t03 || 0)}</td>
                  </>
                ) : null}
                <td className="text-right px-4 py-3 tabular-nums font-bold text-primary">{usdShort(val)}</td>
                <td className="text-right px-6 py-3">{pct < 1 ? '<1' : Math.round(pct)}%</td>
              </tr>
            );
          })}
          <tr className="bg-surface-container-low font-bold border-t-2 border-primary">
            <td className="px-6 py-3">TỔNG AZURE</td>
            {showAllMonths ? (
              <>
                <td className="text-right px-4 py-3 tabular-nums">{usdShort(data.services.reduce((s, r) => s + (r.t01 || 0), 0))}</td>
                <td className="text-right px-4 py-3 tabular-nums">{usdShort(data.services.reduce((s, r) => s + (r.t02 || 0), 0))}</td>
                <td className="text-right px-4 py-3 tabular-nums">{usdShort(data.services.reduce((s, r) => s + (r.t03 || 0), 0))}</td>
              </>
            ) : null}
            <td className="text-right px-4 py-3 tabular-nums text-primary">{usdShort(totalQ1)}</td>
            <td className="text-right px-6 py-3">100%</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
