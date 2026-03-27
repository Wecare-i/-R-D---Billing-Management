import { useState } from 'react';
import type { BillingData } from '../types';

export type VendorFilter = 'all' | 'azure' | 'google' | 'm365';

export interface FilterState {
  selectedMonth: string;     // e.g. 'T03' or 'all'
  vendor: VendorFilter;
}

export function useFilters(data: BillingData) {
  const months = data.monthly.map((m) => m.m);
  const latestMonth = months[months.length - 1];
  const [filters, setFilters] = useState<FilterState>({
    selectedMonth: latestMonth,
    vendor: 'all',
  });

  const setMonth = (m: string) => setFilters((f) => ({ ...f, selectedMonth: m }));
  const setVendor = (v: VendorFilter) => setFilters((f) => ({ ...f, vendor: v }));

  // Filtered monthly data
  const filteredMonthly = filters.selectedMonth === 'all'
    ? data.monthly
    : data.monthly.filter((m) => m.m === filters.selectedMonth);

  // Current month data for cards
  const currentMonth = data.monthly.find((m) => m.m === filters.selectedMonth) || data.monthly[data.monthly.length - 1];

  return { filters, setMonth, setVendor, months, filteredMonthly, currentMonth };
}
