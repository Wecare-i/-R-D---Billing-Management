/**
 * Test — Google Cloud BigQuery Billing Export
 *
 * Chạy sau khi enable Billing Export trong GCP Console.
 * Verify SA có quyền query và dataset đã có data.
 *
 * Usage: node scripts/test-gcp-bigquery.js
 */

require('dotenv').config();
const crypto = require('crypto');

const PROJECT    = 'wecare-ai-studio';
const DATASET    = process.env.GCP_BQ_DATASET || 'billing_export';
const TABLE      = process.env.GCP_BQ_TABLE   || 'gcp_billing_export_v1_01E5FF_07AFF5_FD37C5';

async function getToken() {
  const creds = JSON.parse(process.env.GCP_SA_KEY);
  const header  = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const now     = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    iss: creds.client_email,
    scope: 'https://www.googleapis.com/auth/bigquery.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600
  })).toString('base64url');

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const jwt = `${header}.${payload}.${sign.sign(creds.private_key, 'base64url')}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`
  });
  const j = await res.json();
  if (j.error) throw new Error(`Token error: ${j.error} — ${j.error_description}`);
  return j.access_token;
}

async function runQuery(token, query) {
  const res = await fetch(
    `https://bigquery.googleapis.com/bigquery/v2/projects/${PROJECT}/queries`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, useLegacySql: false, timeoutMs: 30000 })
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(`BigQuery HTTP ${res.status}: ${data.error?.message || JSON.stringify(data).substring(0,200)}`);
  if (data.errors?.length) throw new Error(`BQ error: ${data.errors[0].message}`);
  return data;
}

async function main() {
  console.log('🔑 Authenticating Service Account...');
  const token = await getToken();
  console.log('✅ Token OK\n');

  // ── Step 1: List datasets ───────────────────────────────────
  console.log('📂 Checking datasets in project...');
  const dsRes = await fetch(
    `https://bigquery.googleapis.com/bigquery/v2/projects/${PROJECT}/datasets`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const dsData = await dsRes.json();
  if (dsData.datasets?.length) {
    dsData.datasets.forEach(d => console.log(`   ✅ Dataset: ${d.datasetReference.datasetId}`));
  } else {
    console.log('   ❌ No datasets found');
    console.log('\n⛔ BigQuery Billing Export chưa được enable.');
    console.log('   → Vào: https://console.cloud.google.com/billing/01E5FF-07AFF5-FD37C5/export');
    console.log('   → Tab: BigQuery export → Edit settings → Project: wecare-ai-studio → Dataset: billing_export → Save');
    return;
  }

  // ── Step 2: Check table exists ─────────────────────────────
  console.log(`\n📋 Checking table: ${DATASET}.${TABLE}...`);
  const tblRes = await fetch(
    `https://bigquery.googleapis.com/bigquery/v2/projects/${PROJECT}/datasets/${DATASET}/tables`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const tblData = await tblRes.json();
  if (tblData.tables?.length) {
    tblData.tables.forEach(t => console.log(`   ✅ Table: ${t.tableReference.tableId}`));
  } else {
    console.log('   ⚠️  No tables yet — Billing Export đã enable nhưng chưa có data (chờ 24-48h)');
    return;
  }

  // ── Step 3: Sample data ────────────────────────────────────
  console.log('\n📊 Querying latest billing data...');
  const year = new Date().getFullYear();
  const result = await runQuery(token, `
    SELECT
      service.description  AS service,
      FORMAT_TIMESTAMP('%Y-%m', usage_start_time) AS month,
      ROUND(SUM(cost), 2)  AS cost_usd
    FROM \`${PROJECT}.${DATASET}.${TABLE}\`
    WHERE invoice.month BETWEEN '${year}01' AND '${year}12'
    GROUP BY 1, 2
    HAVING cost_usd > 0
    ORDER BY 2 DESC, cost_usd DESC
    LIMIT 20
  `);

  if (!result.rows?.length) {
    console.log('   ⚠️  Table tồn tại nhưng query trả về 0 rows — chờ thêm để data populate');
    return;
  }

  console.log(`\n   ${result.rows.length} rows returned:`);
  console.log('   ─'.repeat(40));
  console.log('   Service                          Month     Cost USD');
  console.log('   ─'.repeat(40));
  result.rows.forEach(r => {
    const [svc, month, cost] = r.f.map(f => f.v);
    console.log(`   ${svc.padEnd(32)} ${month}   $${parseFloat(cost).toFixed(2)}`);
  });

  // ── Step 4: Monthly totals ──────────────────────────────────
  console.log('\n📅 Monthly totals:');
  const totals = await runQuery(token, `
    SELECT
      FORMAT_TIMESTAMP('%Y-%m', usage_start_time) AS month,
      ROUND(SUM(cost), 2)  AS total_usd
    FROM \`${PROJECT}.${DATASET}.${TABLE}\`
    WHERE invoice.month BETWEEN '${year}01' AND '${year}12'
    GROUP BY 1
    ORDER BY 1
  `);
  totals.rows?.forEach(r => {
    const [month, total] = r.f.map(f => f.v);
    console.log(`   ${month}: $${parseFloat(total).toFixed(2)}`);
  });

  console.log('\n✅ BigQuery Billing Export hoạt động! Chạy "npm run build" để update dashboard.');
}

main().catch(err => {
  console.error('\n❌', err.message);
  process.exit(1);
});
