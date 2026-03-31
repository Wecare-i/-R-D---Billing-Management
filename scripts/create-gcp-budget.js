/**
 * Tạo Google Cloud Billing Budget qua API
 * POST https://billingbudgets.googleapis.com/v1/billingAccounts/{account}/budgets
 * 
 * Usage: node scripts/create-gcp-budget.js
 */

require('dotenv').config();
const { GoogleAuth } = require('google-auth-library');

const BILLING_ACCOUNT_ID = process.env.GCP_BILLING_ACCOUNT_ID;

async function main() {
  console.log('🚀 Creating GCP Budget...');
  console.log(`   Billing Account: ${BILLING_ACCOUNT_ID}\n`);

  const saKey = JSON.parse(process.env.GCP_SA_KEY);
  const auth = new GoogleAuth({
    credentials: saKey,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });

  const client = await auth.getClient();
  const token = await client.getAccessToken();

  const url = `https://billingbudgets.googleapis.com/v1/billingAccounts/${BILLING_ACCOUNT_ID}/budgets`;

  const body = {
    displayName: 'Wecare Monthly Budget',
    budgetFilter: {
      calendarPeriod: 'MONTH'
    },
    amount: {
      specifiedAmount: {
        currencyCode: 'USD',
        units: '700',
        nanos: 0
      }
    },
    thresholdRules: [
      { spendBasis: 'CURRENT_SPEND', thresholdPercent: 0.9 }
    ]
  };

  console.log('📤 POST body:');
  console.log(JSON.stringify(body, null, 2));
  console.log();

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if (!res.ok) {
    console.error(`❌ HTTP ${res.status}:`);
    console.error(JSON.stringify(data, null, 2));
    process.exit(1);
  }

  console.log('✅ Budget created!\n');
  console.log('📦 Response:');
  console.log(JSON.stringify(data, null, 2));

  // Show key fields
  console.log('\n💰 Summary:');
  console.log(`   Name:          ${data.displayName}`);
  console.log(`   Budget amount: $${data.amount?.specifiedAmount?.units}`);
  console.log(`   Current spend: $${data.currentSpend?.units || '0'} (updates ~24h)`);
  console.log(`   Budget ID:     ${data.name}`);
}

main().catch(err => {
  console.error('❌ Fatal:', err.message);
  process.exit(1);
});
