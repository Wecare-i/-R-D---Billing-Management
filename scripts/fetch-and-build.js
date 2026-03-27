/**
 * Wecare Billing Report — Live Data Fetcher
 * 
 * Fetch Azure Cost Management API using Service Principal,
 * then inject real data into Billing_Report.html.
 * 
 * Usage: npm run build
 */

require('dotenv').config();
const { ClientSecretCredential } = require('@azure/identity');
const fs = require('fs');
const path = require('path');

// ─── Config from .env ───────────────────────────────────────
const TENANT_ID = process.env.AZURE_TENANT_ID;
const CLIENT_ID = process.env.AZURE_SP_CLIENT_ID;
const CLIENT_SECRET = process.env.AZURE_SP_CLIENT_SECRET;
const SUBSCRIPTION_ID = process.env.AZURE_SUBSCRIPTION_ID;

const SCOPE = 'https://management.azure.com/.default';
const BASE_URL = 'https://management.azure.com';
const API_VERSION = '2023-11-01';

// Billing profiles — 2 accounts
const BILLING_PROFILES = [
  { // Account 1: Wecare Group Joint Stock Company (MACC/M365)
    account: process.env.AZURE_BILLING_ACCOUNT_1_ID,
    profile: process.env.AZURE_BILLING_PROFILE_1_ID
  },
  { // Account 2: Công ty cổ phần Wecare Group (Azure consumption)
    account: process.env.AZURE_BILLING_ACCOUNT_2_ID,
    profile: process.env.AZURE_BILLING_PROFILE_2_ID
  }
].filter(p => p.account && p.profile);

// M365 fallback data (khi billing API fail)
const M365_FALLBACK = {
  total: 119,
  items: [
    { name: 'Power Apps per app plan', cost: 60, color: '#118DFF' },
    { name: 'Microsoft 365 Business Premium', cost: 44, color: '#12239E' },
    { name: 'Power Automate per user plan', cost: 15, color: '#E66C37' }
  ],
  byMonth: { T01: 119, T02: 119, T03: 119 }
};

// ─── Auth ───────────────────────────────────────────────────
async function getToken() {
  const credential = new ClientSecretCredential(TENANT_ID, CLIENT_ID, CLIENT_SECRET);
  const tokenResponse = await credential.getToken(SCOPE);
  return tokenResponse.token;
}

// ─── API Helpers ────────────────────────────────────────────
async function costQuery(token, endpoint, body, scope) {
  const scopePath = scope || `subscriptions/${SUBSCRIPTION_ID}`;
  const url = `${BASE_URL}/${scopePath}/providers/Microsoft.CostManagement/${endpoint}?api-version=${API_VERSION}`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${endpoint} ${res.status}: ${text.substring(0, 200)}`);
  }
  return (await res.json()).properties?.rows || [];
}

// ─── Fetch Functions ────────────────────────────────────────
async function fetchMonthlyByService(token) {
  const year = new Date().getFullYear();
  return costQuery(token, 'query', {
    type: 'ActualCost',
    timeframe: 'Custom',
    timePeriod: { from: `${year}-01-01`, to: `${year}-12-31` },
    dataset: {
      granularity: 'Monthly',
      aggregation: { totalCost: { name: 'CostUSD', function: 'Sum' } },
      grouping: [{ type: 'Dimension', name: 'ServiceName' }]
    }
  });
}

async function fetchDailyCost(token) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
  return costQuery(token, 'query', {
    type: 'ActualCost',
    timeframe: 'Custom',
    timePeriod: { from: `${y}-${m}-01`, to: `${y}-${m}-${lastDay}` },
    dataset: {
      granularity: 'Daily',
      aggregation: { totalCost: { name: 'CostUSD', function: 'Sum' } }
    }
  });
}

async function fetchTopResources(token) {
  return costQuery(token, 'query', {
    type: 'ActualCost',
    timeframe: 'MonthToDate',
    dataset: {
      granularity: 'None',
      aggregation: { totalCost: { name: 'CostUSD', function: 'Sum' } },
      grouping: [
        { type: 'Dimension', name: 'ResourceId' },
        { type: 'Dimension', name: 'ResourceType' }
      ],
      sorting: [{ direction: 'descending', name: 'CostUSD' }]
    }
  });
}

async function fetchForecast(token) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
  try {
    const rows = await costQuery(token, 'forecast', {
      type: 'ActualCost',
      timeframe: 'Custom',
      timePeriod: { from: `${y}-${m}-01`, to: `${y}-${m}-${lastDay}` },
      dataset: {
        granularity: 'Daily',
        aggregation: { totalCost: { name: 'CostUSD', function: 'Sum' } }
      },
      includeActualCost: true,
      includeFreshPartialCost: false
    });
    return rows.reduce((sum, r) => sum + (r[0] || 0), 0);
  } catch {
    return null;
  }
}

async function fetchM365Costs(token) {
  const year = new Date().getFullYear();
  const allRows = [];

  for (const bp of BILLING_PROFILES) {
    const scope = `providers/Microsoft.Billing/billingAccounts/${bp.account}/billingProfiles/${bp.profile}`;
    try {
      const rows = await costQuery(token, 'query', {
        type: 'ActualCost',
        timeframe: 'Custom',
        timePeriod: { from: `${year}-01-01`, to: `${year}-12-31` },
        dataset: {
          granularity: 'Monthly',
          aggregation: { totalCost: { name: 'CostUSD', function: 'Sum' } },
          grouping: [{ type: 'Dimension', name: 'ProductOrderName' }]
        }
      }, scope);
      console.log(`   ✅ Billing profile ${bp.profile}: ${rows.length} rows`);
      allRows.push(...rows);
    } catch (err) {
      console.warn(`   ⚠️ Billing profile ${bp.profile}: ${err.message.substring(0, 80)}`);
    }
  }

  return allRows;
}

// ─── Data Processing ────────────────────────────────────────
function processMonthly(rows) {
  const byMonth = {};
  rows.forEach(r => {
    const cost = r[0];
    const date = new Date(typeof r[1] === 'number' ? r[1] : r[1]);
    const monthKey = `T${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!byMonth[monthKey]) byMonth[monthKey] = { total: 0, services: {} };
    byMonth[monthKey].total += cost;
    const svc = r[2] || 'Other';
    byMonth[monthKey].services[svc] = (byMonth[monthKey].services[svc] || 0) + cost;
  });
  return byMonth;
}

function processDaily(rows) {
  return rows
    .map(r => ({ cost: r[0], date: new Date(typeof r[1] === 'number' ? r[1] : r[1]) }))
    .sort((a, b) => a.date - b.date)
    .map(d => Math.round(d.cost * 100) / 100);
}

function processResources(rows) {
  return rows.slice(0, 10).map(r => {
    const parts = (r[1] || '').split('/');
    const name = parts[parts.length - 1] || 'unknown';
    const typeParts = (r[2] || '').split('/');
    const type = typeParts[typeParts.length - 1] || 'Other';
    return { n: name, t: type, c: Math.round(r[0] * 100) / 100 };
  });
}

function processM365(rows) {
  const colors = ['#118DFF', '#12239E', '#E66C37', '#6B007B'];
  const byMonth = {};
  const products = {};

  rows.forEach(r => {
    const cost = r[0];
    const date = new Date(typeof r[1] === 'number' ? r[1] : r[1]);
    const monthKey = `T${String(date.getMonth() + 1).padStart(2, '0')}`;
    byMonth[monthKey] = (byMonth[monthKey] || 0) + cost;
    const product = r[2] || 'Other';
    products[product] = (products[product] || 0) + cost;
  });

  const items = Object.entries(products)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, cost], i) => ({ name, cost: Math.round(cost * 100) / 100, color: colors[i % colors.length] }));

  const total = Math.max(...Object.values(byMonth), 0);
  return { total: Math.round(total * 100) / 100, items, byMonth };
}

// ─── Build HTML ─────────────────────────────────────────────
async function main() {
  console.log('🚀 Wecare Billing Report — Live Data Builder');
  console.log('─'.repeat(50));

  // Validate env
  if (!TENANT_ID || !CLIENT_ID || !CLIENT_SECRET || !SUBSCRIPTION_ID) {
    console.error('❌ Missing .env variables (AZURE_TENANT_ID, AZURE_SP_CLIENT_ID, AZURE_SP_CLIENT_SECRET, AZURE_SUBSCRIPTION_ID)');
    process.exit(1);
  }

  // 1. Auth
  console.log('🔑 Authenticating with Service Principal...');
  const token = await getToken();
  console.log('✅ Token acquired');

  // 2. Fetch all data in parallel
  console.log('📡 Fetching Azure Cost data...');
  const [monthlyRows, dailyRows, resourceRows, forecast, m365Rows] = await Promise.all([
    fetchMonthlyByService(token),
    fetchDailyCost(token),
    fetchTopResources(token),
    fetchForecast(token),
    fetchM365Costs(token)
  ]);

  console.log(`   Monthly rows: ${monthlyRows.length}`);
  console.log(`   Daily rows: ${dailyRows.length}`);
  console.log(`   Resource rows: ${resourceRows.length}`);
  console.log(`   Forecast: ${forecast ? '$' + Math.round(forecast) : 'N/A'}`);
  console.log(`   M365 rows: ${m365Rows.length}`);

  // 3. Process data
  const byMonth = processMonthly(monthlyRows);
  const daily = processDaily(dailyRows);
  const resources = processResources(resourceRows);
  const m365 = m365Rows.length > 0 ? processM365(m365Rows) : M365_FALLBACK;
  const m365Source = m365Rows.length > 0 ? 'API' : 'Fallback';
  console.log(`   M365 source: ${m365Source} (total: $${m365.total})`);

  // Build monthly array
  const months = Object.keys(byMonth).sort();
  const monthly = months.map(m => ({
    m,
    az: Math.round(byMonth[m].total * 100) / 100,
    gg: m === 'T03' ? 471.26 : 0, // Google: manual (no REST API)
    ms: m365.byMonth[m] ? Math.round(m365.byMonth[m] * 100) / 100 : 119
  }));

  // Build services array (Q1 breakdown)
  const allServices = {};
  Object.keys(byMonth).forEach(m => {
    const monthNum = parseInt(m.replace('T', ''));
    Object.entries(byMonth[m].services).forEach(([svc, cost]) => {
      if (!allServices[svc]) allServices[svc] = { name: svc };
      allServices[svc][`t${String(monthNum).padStart(2, '0')}`] = Math.round(cost * 100) / 100;
    });
  });
  const services = Object.values(allServices)
    .map(s => ({ ...s, total: (s.t01 || 0) + (s.t02 || 0) + (s.t03 || 0) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  // Build FALLBACK object
  const DATA = {
    monthly,
    daily,
    resources,
    services,
    forecast: forecast ? Math.round(forecast * 100) / 100 : null,
    google: { workspace: 420, aiStudio: 48, total: 471.26 }, // Manual — no GCP billing REST API
    m365: { total: m365.total, items: m365.items }
  };

  console.log('\n📊 Data Summary:');
  monthly.forEach(m => console.log(`   ${m.m}: Azure $${m.az} | Google $${m.gg} | M365 $${m.ms}`));

  // 4. Read HTML template, inject data
  const htmlPath = path.join(__dirname, '..', 'output', 'Billing_Report.html');
  let html = fs.readFileSync(htmlPath, 'utf-8');

  // Replace FALLBACK object
  const fallbackRegex = /const FALLBACK = \{[\s\S]*?\};/;
  const newFallback = `const FALLBACK = ${JSON.stringify(DATA, null, 2)};`;
  html = html.replace(fallbackRegex, newFallback);

  // Update build timestamp in subtitle
  const now = new Date();
  const ts = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} ICT`;
  const currentMonth = `T${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  html = html.replace(
    /Real-time infrastructure expenditure — Azure Cost API · T\d{2}\/\d{4}/,
    `Real-time infrastructure expenditure — Azure Cost API · ${currentMonth}`
  );

  // Write output
  fs.writeFileSync(htmlPath, html, 'utf-8');
  console.log(`\n✅ Report updated: ${htmlPath}`);
  console.log(`📅 Build time: ${ts}`);
  console.log('🔥 Done! Mở Billing_Report.html trong browser để xem.');
}

main().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
