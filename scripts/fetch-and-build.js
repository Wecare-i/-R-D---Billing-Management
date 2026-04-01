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
      // Strip surrounding single or double quotes (common when set via .env or GitHub Secrets)
      let raw = process.env.GCP_SA_KEY.trim();
      if ((raw.startsWith("'") && raw.endsWith("'")) || (raw.startsWith('"') && raw.endsWith('"'))) {
        raw = raw.slice(1, -1);
      }
      return JSON.parse(raw);
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
  items: [], total: 0,
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
async function getGcpAccessToken(credentials, scope) {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    iss: credentials.client_email,
    scope,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600
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
  if (!res.ok) throw new Error(`GCP token error: ${res.status}`);
  return (await res.json()).access_token;
}

// Query BigQuery Billing Export — lấy cost breakdown thực tế
async function fetchGoogleBigQuery(creds) {
  const project = creds.project_id; // wecare-ai-studio
  const dataset = process.env.GCP_BQ_DATASET || 'billing_export'; // tên dataset trong .env (optional)
  const table   = process.env.GCP_BQ_TABLE   || 'gcp_billing_export_v1_01E5FF_07AFF5_FD37C5';

  const token = await getGcpAccessToken(creds,
    'https://www.googleapis.com/auth/bigquery.readonly'
  );

  const year = new Date().getFullYear();

  // Detailed cost query: group by service + month (YTD)
  const query = `
    SELECT
      service.description                                  AS service_name,
      FORMAT_TIMESTAMP('%Y-%m', usage_start_time)         AS month,
      ROUND(SUM(cost + IFNULL((
        SELECT SUM(c.amount) FROM UNNEST(credits) c
      ), 0)), 2)                                           AS net_cost
    FROM \`${project}.${dataset}.${table}\`
    WHERE
      invoice.month BETWEEN '${year}01' AND '${year}12'
      AND project.id IS NOT NULL
    GROUP BY 1, 2
    HAVING net_cost > 0
    ORDER BY 2, net_cost DESC
  `;

  const res = await fetch(
    `https://bigquery.googleapis.com/bigquery/v2/projects/${project}/queries`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, useLegacySql: false, timeoutMs: 30000 })
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`BigQuery query failed ${res.status}: ${err.substring(0, 150)}`);
  }

  const bqData = await res.json();

  if (bqData.jobComplete === false) {
    throw new Error('BigQuery query timed out (>30s) — dataset có thể chưa có data');
  }

  if (bqData.errors?.length) {
    throw new Error(`BigQuery error: ${bqData.errors[0].message}`);
  }

  // Parse rows → { byMonth, items, total }
  const rows = bqData.rows || [];
  if (!rows.length) {
    throw new Error('BigQuery returned 0 rows — Billing Export chưa có data (cần 24-48h sau khi enable)');
  }

  // Aggregate by month + service
  const byMonth = {};        // { 'T01': 374.5, 'T02': 418.92 }
  const serviceByMonth = {}; // { 'T03': { 'Google Workspace': 312, ... } }

  rows.forEach(row => {
    const [svcName, monthStr, costStr] = row.f.map(f => f.v);
    const cost  = parseFloat(costStr) || 0;
    const [yr, mo] = monthStr.split('-');
    const mKey  = `T${mo}`;

    byMonth[mKey]      = (byMonth[mKey] || 0) + cost;
    if (!serviceByMonth[mKey]) serviceByMonth[mKey] = {};
    serviceByMonth[mKey][svcName] = (serviceByMonth[mKey][svcName] || 0) + cost;
  });

  // Latest month → items breakdown
  const latestMonth = Object.keys(byMonth).sort().pop();
  const svcMap = serviceByMonth[latestMonth] || {};
  const colors = ['#34d399', '#059669', '#10b981', '#6ee7b7', '#a7f3d0'];
  const items = Object.entries(svcMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, cost], i) => ({ name, cost: Math.round(cost * 100) / 100, color: colors[i % colors.length] }));

  const total = Math.round((byMonth[latestMonth] || 0) * 100) / 100;

  console.log(`   ✅ BigQuery: ${rows.length} rows | ${Object.keys(byMonth).join(', ')} | latest=${latestMonth} $${total}`);
  return { items, total, byMonth, source: 'bigquery' };
}

// Budget API — fallback khi BQ chưa có data  
async function fetchGoogleBudgetApi(creds) {
  const token = await getGcpAccessToken(creds,
    'https://www.googleapis.com/auth/cloud-platform'
  );
  const res = await fetch(
    `https://billingbudgets.googleapis.com/v1/billingAccounts/${GCP_BILLING_ACCOUNT}/budgets`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Budget API ${res.status}`);

  const { budgets } = await res.json();
  if (!budgets?.length) throw new Error('No budgets found');

  const b = budgets[0];
  // Budget API v1 không có currentSpend — chỉ lấy budget cap
  const budgetCap = parseFloat(b.amount?.specifiedAmount?.units || '0') || null;
  console.log(`   ℹ️  Budget API: cap=$${budgetCap} (currentSpend không available ở v1)`);
  return { budgetCap };
}

async function fetchGoogleBilling() {
  const creds = loadGcpCredentials();
  if (!creds) {
    console.warn('   ⚠️  GCP credentials not found — dùng data.json (manual-invoice)');
    return GOOGLE_FALLBACK;
  }

  // ── Strategy 1: BigQuery Billing Export (primary) ───────────
  try {
    console.log('   📊 Trying BigQuery Billing Export...');
    const bqData = await fetchGoogleBigQuery(creds);

    // Lấy thêm budget cap từ Budget API (optional, không fail nếu lỗi)
    let budgetCap = null;
    try {
      const { budgetCap: cap } = await fetchGoogleBudgetApi(creds);
      budgetCap = cap;
    } catch { /* ignore */ }

    return { ...bqData, ...(budgetCap && { budget: budgetCap }) };

  } catch (bqErr) {
    console.warn(`   ⚠️  BigQuery: ${bqErr.message.substring(0, 120)}`);
  }

  // ── Strategy 2: Budget API (biết budget cap, không có spend) ─
  try {
    console.log('   📊 Trying Budget API fallback...');
    const { budgetCap } = await fetchGoogleBudgetApi(creds);
    console.log('   ⚠️  Chưa có BigQuery export → dùng data.json (manual-invoice)');
    return { ...GOOGLE_FALLBACK, ...(budgetCap && { budget: budgetCap }), source: 'manual-invoice' };
  } catch (budgetErr) {
    console.warn(`   ⚠️  Budget API: ${budgetErr.message.substring(0, 80)}`);
  }

  // ── Strategy 3: manual-invoice (data.json giữ nguyên) ────────
  console.warn('   ⚠️  GCP fully offline — dùng data.json (manual-invoice)');
  return GOOGLE_FALLBACK;
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
      items: googleData.items || [],
      total: googleData.total,
      ...(googleData.budget != null && { budget: googleData.budget }),
      ...(googleData.currentSpend != null && { currentSpend: googleData.currentSpend }),
      byMonth: googleData.byMonth || {},
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
