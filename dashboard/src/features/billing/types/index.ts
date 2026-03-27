export interface MonthlyData {
  m: string;
  az: number;
  gg: number;
  ms: number;
}

export interface ResourceData {
  n: string;
  t: string;
  c: number;
}

export interface ServiceData {
  name: string;
  t01?: number;
  t02?: number;
  t03?: number;
  total?: number;
}

export interface M365Item {
  name: string;
  cost: number;
  color: string;
}

export interface GoogleData {
  workspace: number;
  aiStudio: number;
  total: number;
}

export interface BillingData {
  monthly: MonthlyData[];
  daily: number[];
  resources: ResourceData[];
  services: ServiceData[];
  forecast: number | null;
  google: GoogleData;
  m365: { total: number; items: M365Item[] };
  buildTime?: string;
}
