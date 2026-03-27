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

  const barDatasets = [
    showAz && { label: 'Azure', data: data.monthly.map((x) => x.az), backgroundColor: CLR.primary, borderRadius: 4, borderSkipped: false as const },
    showGg && { label: 'Google', data: data.monthly.map((x) => x.gg), backgroundColor: CLR.tertiary, borderRadius: 4, borderSkipped: false as const },
    showMs && { label: 'M365', data: data.monthly.map((x) => x.ms), backgroundColor: CLR.secondary, borderRadius: 4, borderSkipped: false as const },
  ].filter(Boolean) as any[];

  const donutData = [
    showAz ? latest.az : 0,
    showGg ? latest.gg : 0,
    showMs ? latest.ms : 0,
  ];
  const donutLabels = [
    `Azure $${Math.round(latest.az)}`,
    `Google $${Math.round(latest.gg)}`,
    `M365 $${Math.round(latest.ms)}`,
  ];
  const donutColors = [CLR.primary, CLR.tertiary, CLR.purple];

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Monthly Stacked Bar */}
      <div className="bg-surface-container/60 backdrop-blur-xl rounded-xl p-6 flex flex-col gap-4">
        <h4 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">Monthly Multi-Cloud Trend</h4>
        <div style={{ maxHeight: 260 }}>
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
      <div className="bg-surface-container/60 backdrop-blur-xl rounded-xl p-6 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">Vendor Distribution — {latest.m}</h4>
          <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">Active</span>
        </div>
        <div style={{ maxHeight: 260 }}>
          <Doughnut
            data={{
              labels: donutLabels,
              datasets: [{ data: donutData, backgroundColor: donutColors, borderWidth: 0, hoverOffset: 8 }],
            }}
            options={{ ...BASE, cutout: '65%', plugins: { legend: LEG } }}
          />
        </div>
      </div>

      {/* Azure Services H-Bar */}
      {(vendor === 'all' || vendor === 'azure') && (
        <div className="bg-surface-container/60 backdrop-blur-xl rounded-xl p-6 flex flex-col gap-4">
          <h4 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">Azure Services — {selectedMonth === 'all' ? 'Q1 Total' : selectedMonth}</h4>
          <div style={{ maxHeight: 260 }}>
            <Bar
              data={{
                labels: data.services.map((s) => s.name),
                datasets: [{
                  data: data.services.map((s) => {
                    if (selectedMonth === 'all') return (s.t01 || 0) + (s.t02 || 0) + (s.t03 || 0);
                    return (s[`t${selectedMonth.replace('T', '')}` as keyof typeof s] as number) || 0;
                  }),
                  backgroundColor: [CLR.primary, CLR.secondary, CLR.tertiary, CLR.purple, CLR.primary + '99', CLR.secondary + '99', CLR.tertiary + '99', CLR.purple + '99'],
                  borderRadius: 4, borderSkipped: false,
                }],
              }}
              options={{
                ...BASE, indexAxis: 'y' as const,
                plugins: { legend: { display: false } },
                scales: { x: { beginAtZero: true, ticks: { callback: (v) => '$' + v } }, y: { grid: { display: false } } },
              }}
            />
          </div>
        </div>
      )}

      {/* Daily Cost Line */}
      <div className="bg-surface-container/60 backdrop-blur-xl rounded-xl p-6 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">Daily Cost — {latest.m}/2026</h4>
          <div className="flex items-center gap-2 text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 pulse-dot" />
            <span>LIVE DATA</span>
          </div>
        </div>
        <div style={{ maxHeight: 260 }}>
          <Line
            data={{
              labels: data.daily.map((_, i) => String(i + 1).padStart(2, '0')),
              datasets: [{
                label: 'Daily Cost', data: data.daily,
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
        </div>
      </div>
    </section>
  );
}
