import { useQuery } from '@tanstack/react-query';
import type { BillingData } from '../types';

export function useBillingData() {
  return useQuery<BillingData>({
    queryKey: ['billing-data'],
    queryFn: async () => {
      const res = await fetch('./data.json');
      if (!res.ok) throw new Error('Failed to load billing data');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
}
