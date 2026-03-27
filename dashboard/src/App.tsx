import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBillingData } from '@/features/billing';
import { useFilters } from '@/features/billing/hooks/useFilters';
import { KpiStrip } from '@/features/billing/components/KpiStrip';
import { FilterBar } from '@/features/billing/components/FilterBar';
import { BreakdownCards } from '@/features/billing/components/BreakdownCards';
import { Charts } from '@/features/billing/components/Charts';
import { ResourceBars } from '@/features/billing/components/ResourceBars';
import { ServiceTable } from '@/features/billing/components/ServiceTable';
import { Activity } from 'lucide-react';
import '@/styles/globals.css';

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 5 * 60 * 1000, retry: 1 } } });

function Dashboard() {
  const { data, isLoading, error } = useBillingData();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-on-surface-variant text-sm">Loading billing data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto">
            <Activity className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-lg font-bold">Unable to load data</h2>
          <p className="text-sm text-on-surface-variant">
            Make sure <code className="bg-surface-container-low px-2 py-0.5 rounded">data.json</code> exists.
            Run <code className="bg-surface-container-low px-2 py-0.5 rounded">npm run build</code> from the root.
          </p>
        </div>
      </div>
    );
  }

  return <DashboardContent data={data} />;
}

function DashboardContent({ data }: { data: import('@/features/billing/types').BillingData }) {
  const { filters, setMonth, setVendor, months, currentMonth } = useFilters(data);
  const latest = currentMonth;
  const showAzure = filters.vendor === 'all' || filters.vendor === 'azure';
  const showGoogle = filters.vendor === 'all' || filters.vendor === 'google';
  const showM365 = filters.vendor === 'all' || filters.vendor === 'm365';

  return (
    <div className="min-h-screen p-4 md:p-8 lg:p-10 w-[85%] mx-auto space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end gap-4 md:gap-8">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Cost Management Report</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Real-time infrastructure expenditure — Azure Cost API · {latest.m}/2026
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-on-surface-variant">
          <span className="w-2 h-2 rounded-full bg-green-400 pulse-dot" />
          <span>Last updated: {data.buildTime || 'N/A'}</span>
        </div>
      </header>

      {/* Filter Bar */}
      <FilterBar
        months={months}
        selectedMonth={filters.selectedMonth}
        vendor={filters.vendor}
        onMonthChange={setMonth}
        onVendorChange={setVendor}
      />

      {/* KPI Strip — reactive to selected month */}
      <KpiStrip data={data} selectedMonth={filters.selectedMonth} />

      {/* Breakdown Cards — show/hide by vendor */}
      <BreakdownCards data={data} selectedMonth={filters.selectedMonth} showAzure={showAzure} showGoogle={showGoogle} showM365={showM365} />

      {/* Charts — always show all for context, highlight selected */}
      <Charts data={data} selectedMonth={filters.selectedMonth} vendor={filters.vendor} />

      {/* Resources — only Azure */}
      {showAzure && <ResourceBars data={data} />}

      {/* Service Table — only Azure */}
      {showAzure && <ServiceTable data={data} selectedMonth={filters.selectedMonth} />}

      {/* Footer */}
      <footer className="text-center text-[11px] text-on-surface-variant py-6 border-t border-outline-variant/10">
        Wecare R&D — Infrastructure Cost Monitoring · Built with Vite + React
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <Dashboard />
    </QueryClientProvider>
  );
}
