import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, PointElement, LineElement,
  ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import type { BillingData } from '../types';
import type { VendorFilter } from '../hooks/useFilters';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, PointElement, LineElement,
  ArcElement, Title, Tooltip, Legend, Filler
);

const CLR = {
  primary: '#118DFF', secondary: '#12239E', tertiary: '#E66C37',
  purple: '#6B007B', text: '#308299', border: 'rgba(30, 51, 80, 0.3)',
};

const BASE = { responsive: true, maintainAspectRatio: true };
const LEG = { position: 'bottom' as const, labels: { usePointStyle: true, pointStyle: 'circle' as const, padding: 12, font: { size: 10 } } };

ChartJS.defaults.color = CLR.text;
ChartJS.defaults.borderColor = CLR.border;
ChartJS.defaults.font.family = "'Inter', system-ui, sans-serif";
ChartJS.defaults.font.size = 11;

interface Props { data: BillingData; selectedMonth: string; vendor: VendorFilter; }

export function Charts({ data, selectedMonth, vendor }: Props) {
  const latest = data.monthly.find((m) => m.m === selectedMonth) || data.monthly[data.monthly.length - 1];
  const showAz = vendor === 'all' || vendor === 'azure';
  const showGg = vendor === 'all' || vendor === 'google';
  const showMs = vendor === 'all' || vendor === 'm365';

  const palette = [CLR.primary, CLR.tertiary, CLR.purple, '#4BC0C0', '#FF9F40', '#9966FF', '#FF6384'];
  const months = data.monthly.map((x) => x.m);

  // Bar chart: drill-down by vendor
  let barDatasets: any[] = [];
  let barTitle = 'Monthly Multi-Cloud Trend';

  if (vendor === 'all') {
    barDatasets = [
      showAz && { label: 'Azure', data: data.monthly.map((x) => x.az), backgroundColor: CLR.primary, borderRadius: 4, borderSkipped: false as const },
      // Google: monthly subscription — dùng google.total vì monthly.gg không có byMonth
      showGg && { label: 'Google', data: data.monthly.map(() => data.google.total), backgroundColor: CLR.tertiary, borderRadius: 4, borderSkipped: false as const },
      showMs && { label: 'M365', data: data.monthly.map((x) => x.ms), backgroundColor: CLR.secondary, borderRadius: 4, borderSkipped: false as const },
    ].filter(Boolean);
  } else if (vendor === 'azure') {
    barTitle = 'Azure — Monthly by Service';
    barDatasets = data.services.map((s, i) => ({
      label: s.name,
      data: ['01', '02', '03'].map((m) => (s as any)[`t${m}`] || 0),
      backgroundColor: palette[i % palette.length],
      borderRadius: 4, borderSkipped: false,
    }));
  } else if (vendor === 'google') {
    barTitle = 'Google — Monthly Breakdown';
    barDatasets = data.google.items.map((item, i) => ({
      label: item.name,
      data: data.monthly.map(() => item.cost),
      backgroundColor: palette[(i + 2) % palette.length],
      borderRadius: 4, borderSkipped: false,
    }));
  } else if (vendor === 'm365') {
    barTitle = 'M365 — License Costs';
    barDatasets = data.m365.items.map((item, i) => ({
      label: item.name,
      data: data.monthly.map(() => item.cost),
      backgroundColor: palette[i % palette.length],
      borderRadius: 4, borderSkipped: false,
    }));
  }

  // Donut: drill-down by vendor
  let donutEntries: { label: string; value: number; color: string }[] = [];

  if (vendor === 'all') {
    donutEntries = [
      { label: `Azure $${Math.round(latest.az)}`, value: latest.az, color: CLR.primary },
      // Dùng google.total vì latest.gg = 0 (không có GCP byMonth data)
      { label: `Google $${Math.round(data.google.total)}`, value: data.google.total, color: CLR.tertiary },
      { label: `M365 $${Math.round(latest.ms)}`, value: latest.ms, color: CLR.purple },
    ];
  } else if (vendor === 'azure') {
    donutEntries = data.services.map((s, i) => {
      const cost = selectedMonth === 'all' ? ((s.t01 || 0) + (s.t02 || 0) + (s.t03 || 0)) : ((s as any)[`t${selectedMonth.replace('T', '')}`] || 0);
      return { label: `${s.name} $${Math.round(cost)}`, value: cost, color: palette[i % palette.length] };
    }).filter((e) => e.value > 0);
  } else if (vendor === 'google') {
    donutEntries = data.google.items.map((item, i) => ({
      label: `${item.name} $${Math.round(item.cost)}`, 
      value: item.cost, 
      color: palette[(i + 2) % palette.length]
    }));
  } else if (vendor === 'm365') {
    donutEntries = data.m365.items.map((item, i) => ({
      label: `${item.name} $${item.cost}`, value: item.cost, color: palette[i % palette.length],
    }));
  }
  const donutData = donutEntries.map((e) => e.value);
  const donutLabels = donutEntries.map((e) => e.label);
  const donutColors = donutEntries.map((e) => e.color);
  const donutTitle = vendor === 'all' ? 'Vendor Distribution' : vendor === 'azure' ? 'Azure Services' : vendor === 'google' ? 'Google Breakdown' : 'M365 Licenses';

  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Monthly Stacked Bar */}
      <div className="card p-6 flex flex-col gap-4">
        <h4 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">{barTitle}</h4>
        <div className="flex-1 flex items-center">
          <Bar
            data={{ labels: data.monthly.map((x) => x.m), datasets: barDatasets }}
            options={{
              ...BASE,
              plugins: { legend: LEG },
              scales: {
                x: { stacked: true, grid: { display: false } },
                y: { stacked: true, beginAtZero: true, ticks: { callback: (v) => '$' + v } },
              },
            }}
          />
        </div>
      </div>

      {/* Vendor Donut */}
      <div className="card p-6 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">{donutTitle} — {latest.m}</h4>
          <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">Active</span>
        </div>
        <div className="flex items-center gap-4 flex-1">
          <div className="w-1/2">
            <Doughnut
              data={{
                labels: donutLabels,
                datasets: [{ data: donutData, backgroundColor: donutColors, borderWidth: 0, hoverOffset: 8 }],
              }}
              options={{ ...BASE, cutout: '65%', plugins: { legend: { display: false } } }}
            />
          </div>
          <div className="w-1/2 flex flex-col gap-2">
            {donutEntries.map((e) => {
              const total = donutData.reduce((a, b) => a + b, 0);
              const pct = total > 0 ? Math.round((e.value / total) * 100) : 0;
              return (
                <div key={e.label} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: e.color }} />
                  <span className="text-xs text-on-surface-variant truncate flex-1">{e.label}</span>
                  <span className="text-xs font-bold tabular-nums text-on-surface">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Daily Cost Line */}
      <div className="card p-6 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">
            Daily Cost — {selectedMonth === 'all' ? 'Q1' : selectedMonth}/2026
          </h4>
          <div className="flex items-center gap-2 text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 pulse-dot" />
            <span>LIVE DATA</span>
          </div>
        </div>
        <div className="flex-1 flex items-center">
          {vendor === 'google' || vendor === 'm365' ? (
            <div className="w-full flex flex-col items-center justify-center gap-2 py-8 text-on-surface-variant">
              <span className="text-2xl">⚡</span>
              <span className="text-sm font-medium">Phí trả theo chu kỳ cố định (Subscription)</span>
              <span className="text-xs opacity-60">Biểu đồ biểu diễn biến động theo ngày (Daily) chỉ dành cho Cloud Pay-As-You-Go (Azure).</span>
            </div>
          ) : selectedMonth !== 'all' && data.buildMonth && selectedMonth !== data.buildMonth ? (
            <div className="w-full flex flex-col items-center justify-center gap-2 py-8 text-on-surface-variant">
              <span className="text-2xl">📅</span>
              <span className="text-sm font-medium">Daily data chỉ có cho {data.buildMonth}</span>
              <span className="text-xs opacity-60">Chọn {data.buildMonth} hoặc "All" để xem</span>
            </div>
          ) : (
            <Line
              data={{
                labels: data.daily.map((_, i) => String(i + 1).padStart(2, '0')),
                datasets: [{
                  label: 'Azure Daily Cost', data: data.daily,
                  borderColor: CLR.primary, backgroundColor: CLR.primary + '18',
                  fill: true, tension: 0.3, pointRadius: 2.5,
                  pointBackgroundColor: CLR.primary, borderWidth: 2.5,
                }],
              }}
              options={{
                ...BASE,
                plugins: { legend: { display: false } },
                scales: {
                  x: { grid: { display: false }, ticks: { font: { size: 9 } } },
                  y: { beginAtZero: true, ticks: { callback: (v) => '$' + v } },
                },
              }}
            />
          )}
        </div>
      </div>
    </section>
  );
}
