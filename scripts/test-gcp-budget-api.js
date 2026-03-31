/**
 * Quick test — Google Cloud Billing Budget API
 * GET https://billingbudgets.googleapis.com/v1/billingAccounts/{account}/budgets
 * 
 * Usage: node scripts/test-gcp-budget-api.js
 */

require('dotenv').config();
const { GoogleAuth } = require('google-auth-library');

const BILLING_ACCOUNT_ID = process.env.GCP_BILLING_ACCOUNT_ID; // 01E5FF-07AFF5-FD37C5

async function main() {
  console.log('🔑 Authenticating with Service Account...');
  console.log(`   Billing Account: ${BILLING_ACCOUNT_ID}`);

  // Load SA key từ .env (inline JSON)
  const saKey = JSON.parse(process.env.GCP_SA_KEY);

  const auth = new GoogleAuth({
    credentials: saKey,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });

  const client = await auth.getClient();
  const token = await client.getAccessToken();
  console.log('✅ Token acquired\n');

  // Call Budget API
  const url = `https://billingbudgets.googleapis.com/v1/billingAccounts/${BILLING_ACCOUNT_ID}/budgets`;
  console.log(`📡 Calling: GET ${url}\n`);

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token.token}` }
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`❌ HTTP ${res.status}: ${err}`);
    process.exit(1);
  }

  const data = await res.json();
  console.log('📦 Raw response:');
  console.log(JSON.stringify(data, null, 2));

  // Parse budgets
  if (data.budgets && data.budgets.length > 0) {
    console.log('\n💰 Budget Summary:');
    data.budgets.forEach(b => {
      const currentSpend = b.currentSpend?.units || '0';
      const currency = b.currentSpend?.currencyCode || 'USD';
      const displayName = b.displayName || b.name;
      const budgetAmount = b.amount?.specifiedAmount?.units || 'N/A';
      console.log(`  - ${displayName}`);
      console.log(`    Current spend: ${currentSpend} ${currency}`);
      console.log(`    Budget amount: ${budgetAmount} ${currency}`);
    });
  } else {
    console.log('\n⚠️  Không có budget nào được tạo trong billing account này.');
    console.log('→ Cần tạo Budget trên GCP Console trước: Billing → Budgets & alerts → Create budget');
  }
}

main().catch(err => {
  console.error('❌ Fatal:', err.message);
  process.exit(1);
});
