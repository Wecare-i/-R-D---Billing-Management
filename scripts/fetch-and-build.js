/**
 * Wecare Billing Report — Live Data Fetcher
 *
 * Fetch Azure Cost Management API (Service Principal)
 * + Google Cloud Billing API (Service Account)
 * → generate dashboard/public/data.json cho React dashboard
 *
 * Usage: npm run build
 */

require('dotenv').config();
const { ClientSecretCredential } = require('@azure/identity');
const fs = require('fs');
const path = require('path');

// ─── Azure Config ────────────────────────────────────────────
const TENANT_ID = process.env.AZURE_TENANT_ID;
const CLIENT_ID = process.env.AZURE_SP_CLIENT_ID;
const CLIENT_SECRET = process.env.AZURE_SP_CLIENT_SECRET;
const SUBSCRIPTION_ID = process.env.AZURE_SUBSCRIPTION_ID;

const SCOPE = 'https://management.azure.com/.default';
const BASE_URL = 'https://management.azure.com';
const API_VERSION = '2023-11-01';

// Billing profiles — 2 accounts
const BILLING_PROFILES = [
  { account: process.env.AZURE_BILLING_ACCOUNT_1_ID, profile: process.env.AZURE_BILLING_PROFILE_1_ID },
  { account: process.env.AZURE_BILLING_ACCOUNT_2_ID, profile: process.env.AZURE_BILLING_PROFILE_2_ID }
].filter(p => p.account && p.profile);

// ─── GCP Config ──────────────────────────────────────────────
// Ưu tiên: GCP_SA_KEY env var (JSON string) → fallback file gcp-sa-key.json
function loadGcpCredentials() {
  if (process.env.GCP_SA_KEY) {
    try {
      return JSON.parse(process.env.GCP_SA_KEY);
    } catch (e) {
      console.warn('   ⚠️  GCP_SA_KEY parse failed:', e.message);
    }
  }
  const keyPath = path.join(__dirname, '..', 'gcp-sa-key.json');
  if (fs.existsSync(keyPath)) {
    return JSON.parse(fs.readFileSync(keyPath, 'utf-8'));
  }
  return null;
}

const GCP_BILLING_ACCOUNT = '01E5FF-07AFF5-FD37C5'; // Wecare billing account

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

// Google fallback (khi chưa setup budget)
const GOOGLE_FALLBACK = {
  workspace: 0, aiStudio: 0, total: 0,
  byMonth: {}, source: 'fallback'
};

// ─── Azure Auth ──────────────────────────────────────────────
async function getToken() {
  const credential = new ClientSecretCredential(TENANT_ID, CLIENT_ID, CLIENT_SECRET);
  const tokenResponse = await credential.getToken(SCOPE);
  return tokenResponse.token;
}

// ─── API Helpers ────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function costQuery(token, endpoint, body, scope, retries = 3) {
  const scopePath = scope || `subscriptions/${SUBSCRIPTION_ID}`;
  const url = `${BASE_URL}/${scopePath}/providers/Microsoft.CostManagement/${endpoint}?api-version=${API_VERSION}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (res.status === 429 || res.status === 503) {
      const retryAfter = parseInt(res.headers.get('Retry-After') || '30', 10);
      const waitMs = Math.max(retryAfter * 1000, attempt * 15000); // ít nhất 15s/30s/45s
      console.warn(`   ⏳ ${endpoint} rate-limited (${res.status}), đợi ${waitMs / 1000}s... (attempt ${attempt}/${retries})`);
      if (attempt === retries) throw new Error(`${endpoint} ${res.status}: rate limit sau ${retries} lần retry`);
      await sleep(waitMs);
      continue;
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${endpoint} ${res.status}: ${text.substring(0, 200)}`);
    }
    return (await res.json()).properties?.rows || [];
  }
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

// ─── Google Cloud Billing ─────────────────────────────────────
async function getGcpAccessToken(credentials) {
  // Tạo JWT cho Service Account
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-billing.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  })).toString('base64url');

  const crypto = require('crypto');
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const sig = sign.sign(credentials.private_key, 'base64url');

  const jwt = `${header}.${payload}.${sig}`;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`
  });
  if (!res.ok) throw new Error(`GCP token error: ${res.status} ${await res.text()}`);
  return (await res.json()).access_token;
}

async function fetchGoogleBilling() {
  const creds = loadGcpCredentials();
  if (!creds) {
    console.warn('   ⚠️  GCP credentials not found — sử dụng Google fallback data');
    return GOOGLE_FALLBACK;
  }

  try {
    const gcpToken = await getGcpAccessToken(creds);
    const year = new Date().getFullYear();

    // Fetch monthly cost breakdown by project
    const url = `https://cloudbilling.googleapis.com/v1/billingAccounts/${GCP_BILLING_ACCOUNT}/skus`;

    // Dùng BigQuery export API không có ở đây — dùng Cloud Billing Budget API để lấy tổng cost
    const budgetRes = await fetch(
      `https://billingbudgets.googleapis.com/v1/billingAccounts/${GCP_BILLING_ACCOUNT}/budgets`,
      { headers: { Authorization: `Bearer ${gcpToken}` } }
    );

    // Cloud Billing API — lấy invoice list
    const invoiceRes = await fetch(
      `https://cloudbilling.googleapis.com/v1/billingAccounts/${GCP_BILLING_ACCOUNT}/:export` +
      `?datasetId=billing_export&startDate.year=${year}&startDate.month=1&endDate.year=${year}&endDate.month=12`,
      { headers: { Authorization: `Bearer ${gcpToken}` } }
    );

    // Google Cloud Billing không có simple REST API trả cost —
    // Cần BigQuery export hoặc Billing Reports API
    // → Dùng Budget API để lấy spend amount nếu có budget setup
    if (budgetRes.ok) {
      const budgets = await budgetRes.json();
      if (budgets.budgets?.length > 0) {
        console.log(`   ✅ GCP Budgets found: ${budgets.budgets.length}`);
        // Parse budget spend — nếu có setup budget
        const totalSpend = budgets.budgets.reduce((sum, b) => {
          return sum + parseFloat(b.amount?.specifiedAmount?.units || '0');
        }, 0);
        if (totalSpend > 0) {
          return { workspace: 0, aiStudio: 0, total: totalSpend, byMonth: {}, source: 'budget-api' };
        }
      }
    }

    // Fallback: đã authenticate thành công nhưng không có budget data
    console.log('   ⚠️  GCP authed but no budget data — dùng fallback');
    return { ...GOOGLE_FALLBACK, source: 'authenticated-fallback' };

  } catch (err) {
    console.warn(`   ⚠️  GCP Billing fetch failed: ${err.message.substring(0, 100)}`);
    return GOOGLE_FALLBACK;
  }
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
  const productsByMonth = {};

  rows.forEach(r => {
    const cost = r[0];
    const date = new Date(typeof r[1] === 'number' ? r[1] : r[1]);
    const monthKey = `T${String(date.getMonth() + 1).padStart(2, '0')}`;
    byMonth[monthKey] = (byMonth[monthKey] || 0) + cost;
    const product = r[2] || 'Other';
    if (!productsByMonth[monthKey]) productsByMonth[monthKey] = {};
    productsByMonth[monthKey][product] = (productsByMonth[monthKey][product] || 0) + cost;
  });

  // Dùng latest month để tính items (tránh Q1 aggregate vs monthly mismatch)
  const latestMonth = Object.keys(byMonth).sort().pop();
  const latestProducts = productsByMonth[latestMonth] || {};
  const items = Object.entries(latestProducts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, cost], i) => ({ name, cost: Math.round(cost * 100) / 100, color: colors[i % colors.length] }));

  const total = byMonth[latestMonth] || Math.max(...Object.values(byMonth), 0);
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

  // 2. Fetch all data in parallel (Azure + Google)
  console.log('📡 Fetching Azure Cost data...');
  const [monthlyRows, dailyRows, resourceRows, forecast, m365Rows, googleData] = await Promise.all([
    fetchMonthlyByService(token),
    fetchDailyCost(token),
    fetchTopResources(token),
    fetchForecast(token),
    fetchM365Costs(token),
    fetchGoogleBilling()
  ]);

  console.log(`   Monthly rows: ${monthlyRows.length}`);
  console.log(`   Daily rows: ${dailyRows.length}`);
  console.log(`   Resource rows: ${resourceRows.length}`);
  console.log(`   Forecast: ${forecast ? '$' + Math.round(forecast) : 'N/A'}`);
  console.log(`   M365 rows: ${m365Rows.length}`);
  console.log(`   Google total: $${googleData.total} (source: ${googleData.source || 'api'})`);

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
    gg: Math.round((googleData.byMonth?.[m] ?? googleData.total) * 100) / 100,
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

  // Build data object
  const now = new Date();
  const DATA = {
    monthly,
    daily,
    resources,
    services,
    // Forecast = Azure (từ API) + Google + M365 (cố định hàng tháng)
    forecast: forecast
      ? Math.round((forecast + googleData.total + m365.total) * 100) / 100
      : null,
    forecastBreakdown: forecast ? {
      azure: Math.round(forecast * 100) / 100,
      google: googleData.total,
      m365: m365.total
    } : null,
    google: {
      workspace: googleData.workspace ?? GOOGLE_FALLBACK.workspace,
      aiStudio: googleData.aiStudio ?? GOOGLE_FALLBACK.aiStudio,
      total: googleData.total,
      source: googleData.source || 'api'
    },
    m365: { total: m365.total, items: m365.items },
    buildMonth: `T${String(now.getMonth() + 1).padStart(2, '0')}`  // tháng của data.daily
  };

  // 3b. Write data.json for React dashboard
  const dataJsonPath = path.join(__dirname, '..', 'dashboard', 'public', 'data.json');
  const ts = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} ICT`;
  if (fs.existsSync(path.dirname(dataJsonPath))) {
    fs.writeFileSync(dataJsonPath, JSON.stringify({ ...DATA, buildTime: ts }, null, 2), 'utf-8');
    console.log(`   ✅ React data: ${dataJsonPath}`);
  }

  console.log('\n📊 Data Summary:');
  monthly.forEach(m => console.log(`   ${m.m}: Azure $${m.az} | Google $${m.gg} | M365 $${m.ms}`));

  console.log(`\n✅ data.json updated: ${dataJsonPath}`);
  console.log(`📅 Build time: ${ts}`);
  console.log('🔥 Done! React dashboard sẽ dùng data mới sau khi build.');
}

main().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
