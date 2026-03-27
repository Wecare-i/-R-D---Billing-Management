import { ChevronDown, Filter } from 'lucide-react';
import type { VendorFilter } from '../hooks/useFilters';

interface FilterBarProps {
  months: string[];
  selectedMonth: string;
  vendor: VendorFilter;
  onMonthChange: (m: string) => void;
  onVendorChange: (v: VendorFilter) => void;
}

const VENDORS: { key: VendorFilter; label: string; color: string }[] = [
  { key: 'all', label: 'All Vendors', color: 'bg-primary' },
  { key: 'azure', label: 'Azure', color: 'bg-primary' },
  { key: 'google', label: 'Google', color: 'bg-tertiary' },
  { key: 'm365', label: 'M365', color: 'bg-accent-purple' },
];

export function FilterBar({ months, selectedMonth, vendor, onMonthChange, onVendorChange }: FilterBarProps) {
  return (
    <section className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-surface-container/40 backdrop-blur-xl rounded-xl border border-outline-variant/10">
      <div className="flex items-center gap-2 text-on-surface-variant">
        <Filter className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-widest">Filters</span>
      </div>

      {/* Month Selector */}
      <div className="relative">
        <select
          value={selectedMonth}
          onChange={(e) => onMonthChange(e.target.value)}
          className="appearance-none bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-on-surface cursor-pointer hover:border-primary/40 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">All Months (Q1)</option>
          {months.map((m) => (
            <option key={m} value={m}>{m}/2026</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
      </div>

      {/* Vendor Toggle Pills */}
      <div className="flex gap-1 bg-surface-container-lowest rounded-lg p-1">
        {VENDORS.map((v) => (
          <button
            key={v.key}
            onClick={() => onVendorChange(v.key)}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-200 cursor-pointer ${
              vendor === v.key
                ? `${v.color} text-white shadow-md`
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>
    </section>
  );
}
