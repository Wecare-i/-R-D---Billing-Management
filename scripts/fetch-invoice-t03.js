/**
 * Fetch Azure Invoice T03/2026
 * Lấy invoice ID, số tiền, ngày hóa đơn từ Azure Billing API
 * Usage: node scripts/fetch-invoice-t03.js
 */

require('dotenv').config();
const { ClientSecretCredential } = require('@azure/identity');

const TENANT_ID    = process.env.AZURE_TENANT_ID;
const CLIENT_ID    = process.env.AZURE_SP_CLIENT_ID;
const CLIENT_SECRET= process.env.AZURE_SP_CLIENT_SECRET;

const BILLING_ACCOUNTS = [
  { id: process.env.AZURE_BILLING_ACCOUNT_1_ID, label: 'Account 1 (MACC/M365)' },
  { id: process.env.AZURE_BILLING_ACCOUNT_2_ID, label: 'Account 2 (Azure consumption)' },
];

const BASE_URL    = 'https://management.azure.com';
const API_VERSION = '2024-04-01';

async function getToken() {
  const cred = new ClientSecretCredential(TENANT_ID, CLIENT_ID, CLIENT_SECRET);
  return (await cred.getToken('https://management.azure.com/.default')).token;
}

async function fetchInvoices(token, billingAccountId, label) {
  // Lấy invoices từ 2026-03-01 đến 2026-03-31
  const url = `${BASE_URL}/providers/Microsoft.Billing/billingAccounts/${billingAccountId}/invoices` +
    `?api-version=${API_VERSION}&periodStartDate=2026-03-01&periodEndDate=2026-03-31`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const text = await res.text();
    console.warn(`  ⚠️  ${label}: ${res.status} — ${text.substring(0, 200)}`);
    return [];
  }

  const json = await res.json();
  return (json.value || []).map(inv => ({
    label,
    invoiceId   : inv.name,
    status      : inv.properties?.status,
    dueDate     : inv.properties?.dueDate,
    invoiceDate : inv.properties?.invoiceDate,
    amountDue   : inv.properties?.amountDue,
    totalAmount : inv.properties?.totalAmount,
    billedAmount: inv.properties?.billedAmount,
    currency    : inv.properties?.amountDue?.currency || inv.properties?.totalAmount?.currency,
    downloadUrl : inv.properties?.invoiceDocuments?.[0]?.url,
  }));
}

async function main() {
  console.log('🔍 Fetching Azure Invoices — T03/2026\n');

  if (!TENANT_ID || !CLIENT_ID || !CLIENT_SECRET) {
    console.error('❌ Missing .env: AZURE_TENANT_ID, AZURE_SP_CLIENT_ID, AZURE_SP_CLIENT_SECRET');
    process.exit(1);
  }

  const token = await getToken();
  console.log('✅ Token acquired\n');

  let allInvoices = [];

  for (const acct of BILLING_ACCOUNTS) {
    if (!acct.id) { console.warn(`  ⚠️  ${acct.label}: ID not set`); continue; }
    console.log(`📋 ${acct.label}`);
    const invoices = await fetchInvoices(token, acct.id, acct.label);
    allInvoices.push(...invoices);
  }

  console.log('\n═══ KẾT QUẢ ═══════════════════════════════════════');
  if (allInvoices.length === 0) {
    console.log('  Không tìm thấy invoice nào trong T03/2026');
  } else {
    allInvoices.forEach(inv => {
      const amt = inv.billedAmount || inv.totalAmount || inv.amountDue;
      console.log(`\n  📄 Invoice ID : ${inv.invoiceId}`);
      console.log(`     Nguồn       : ${inv.label}`);
      console.log(`     Trạng thái  : ${inv.status}`);
      console.log(`     Ngày HĐ     : ${inv.invoiceDate || '—'}`);
      console.log(`     Ngày ĐH     : ${inv.dueDate || '—'}`);
      console.log(`     Số tiền     : ${amt ? `${amt.amount} ${amt.currency}` : '—'}`);
      if (inv.downloadUrl) console.log(`     Download    : ${inv.downloadUrl}`);
    });
  }
  console.log('\n════════════════════════════════════════════════════');
}

main().catch(err => {
  console.error('❌ Fatal:', err.message);
  process.exit(1);
});
