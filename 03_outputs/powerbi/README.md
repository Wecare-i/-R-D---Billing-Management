# Power BI Setup Guide — Wecare Billing Dashboard

> **Data source**: Azure Cost Management API (live) + Microsoft Graph API + Google (manual)
> **Last updated**: 2026-03-24

## 📁 Files

| File | Nội dung |
|------|----------|
| `Monthly_Billing.csv` | Chi phí hàng tháng T01-T03/2026 (Azure, Google, M365) + Forecast |
| `Azure_Services.csv` | **[NEW]** Azure cost breakdown by service × month |
| `Azure_Resources.csv` | **[NEW]** Top 15 resources tốn nhất (T03) |
| `Licenses.csv` | 22 SKUs license với pricing + usage |
| `Services.csv` | Catalog 3 vendors + payment method + data source |
| `DAX_Measures.dax` | 20 measures cho KPIs, trends, service/resource drill-down |
| `Wecare_Billing.json` | **[NEW]** Power BI theme file (Wecare brand colors) |

## 🚀 Setup Steps

### Step 1: Import Data (5 CSV files)

1. Mở **Power BI Desktop**
2. **Get Data** → **Text/CSV** → import lần lượt:
   - `Monthly_Billing.csv`
   - `Azure_Services.csv`
   - `Azure_Resources.csv`
   - `Licenses.csv`
   - `Services.csv`
3. Kiểm tra data types trong **Transform Data**:
   - `Month` → **Date** (format `YYYY-MM`)
   - Các cột số tiền → **Decimal Number**

### Step 2: Apply Theme

1. **View** → **Themes** → **Browse for themes**
2. Chọn file `Wecare_Billing.json`
3. Tất cả visuals sẽ tự động dùng Wecare brand colors ✅

### Step 3: Create Measures

1. **Model View** → click table `Monthly_Billing`
2. **New Measure** → copy paste từng measure từ `DAX_Measures.dax`
3. Key measures cần tạo trước:
   - `Total Cost`, `Azure Cost`, `Google Cost`, `M365 Cost`
   - `MoM Change %`, `MoM Indicator`
   - `Fabric Cost`, `VM Cost`
   - `Total License Cost`, `Paid SKU Count`

### Step 4: Build Report — 3 Pages

#### Page 1: Overview

| Visual | Data | Size |
|--------|------|------|
| **KPI Card** × 4 | `Total Cost`, `Azure Cost`, `Google Cost`, `M365 Cost` | Top strip |
| **KPI Card** | `MoM Indicator` | Top strip |
| **Stacked Bar Chart** | Axis: `Month`, Values: `Azure + Google + M365_Licenses` | Half width |
| **Donut Chart** | Values: `Azure, Google, M365_Licenses` (latest month) | Half width |
| **Table** | `Month, Azure, Google, M365_Licenses, Total, PaymentCard, VoucherType` | Full width |

#### Page 2: Azure Drill-Down

| Visual | Data | Size |
|--------|------|------|
| **KPI Cards** | `Azure Cost`, `Fabric Cost`, `VM Cost`, `Azure Forecast` | Top strip |
| **Stacked Bar Chart** | Table: `Azure_Services`, Axis: `Month`, Legend: `Service`, Values: `Cost_USD` | Half width |
| **Treemap** | Table: `Azure_Resources`, Group: `ResourceType`, Values: `Cost_USD` | Half width |
| **Bar Chart** | Table: `Azure_Resources`, Axis: `Resource`, Values: `Cost_USD`, filter top 10 | Full width |

#### Page 3: Licenses

| Visual | Data | Size |
|--------|------|------|
| **KPI Cards** | `Total License Cost`, `Paid SKU Count`, `Over Provisioned Count` | Top strip |
| **Bar Chart** | Axis: `DisplayName`, Values: `MonthlyCost_USD` (filter `IsPaid=Yes`) | Half width |
| **Gauge** × nhiều | `UsagePercent` per SKU (filter `IsPaid=Yes`) | Half width |
| **Table** | All license columns | Full width |

### Step 5: Publish & Share

1. **File** → **Publish** → chọn Workspace
2. **Power BI Service** → **Share** → nhập email team
3. Team mở link → xem data, **không cần quyền API**

### Step 6: Auto-Refresh (Future)

Khi chuyển từ CSV sang **Azure Cost Management connector** (built-in Power BI):
1. **Get Data** → **Azure** → **Azure Cost Management**
2. Chọn Subscription `b230aef2-52a0-4800-8a8d-91a6880c86a2`
3. Configure **Scheduled Refresh** hàng ngày
4. Data tự động cập nhật ✅

> ⚠️ **Hiện tại**: Dùng CSV từ Azure Cost API (pull thủ công qua MCP).
> **Endpoint đã unlock**: `Cost Management Reader` role assigned cho `Admin_WECARE` (2026-03-24).

---

## 🔗 Data Source Links & API Reference

### Portal Links

| Vendor | Portal | Link |
|--------|--------|------|
| Azure | Cost Analysis | [portal.azure.com](https://portal.azure.com/#view/Microsoft_Azure_CostManagement/Menu/~/costanalysis) |
| Azure | Invoices & Exports | [portal.azure.com/exports](https://portal.azure.com/#view/Microsoft_Azure_CostManagement/Menu/~/exports) |
| Google | Billing Console | [console.cloud.google.com/billing](https://console.cloud.google.com/billing) |
| M365 | Admin Billing | [admin.microsoft.com](https://admin.microsoft.com/Adminportal/Home#/BillingAccounts) |

---

### 1️⃣ Azure Cost Management API

> **Base URL**: `https://management.azure.com`
> **Auth**: `Authorization: Bearer <access_token>` (OAuth2 — scope `https://management.azure.com/.default`)
> **API Version**: `2023-11-01` ([docs](https://learn.microsoft.com/en-us/rest/api/cost-management/))

#### 1.1 Query Cost by Service (theo tháng)

```http
POST /subscriptions/{subscriptionId}/providers/Microsoft.CostManagement/query?api-version=2023-11-01
```

**Request Body:**
```json
{
  "type": "ActualCost",
  "timeframe": "Custom",
  "timePeriod": {
    "from": "2026-01-01",
    "to": "2026-03-31"
  },
  "dataset": {
    "granularity": "Monthly",
    "aggregation": {
      "totalCost": { "name": "Cost", "function": "Sum" },
      "totalCostUSD": { "name": "CostUSD", "function": "Sum" }
    },
    "grouping": [
      { "type": "Dimension", "name": "ServiceName" }
    ]
  }
}
```

| Param | Giải thích |
|-------|-----------|
| `type` | `ActualCost` (thực tế) hoặc `AmortizedCost` (phân bổ RI/SP) |
| `timeframe` | `Custom`, `MonthToDate`, `BillingMonthToDate`, `TheLastMonth`, `TheLastBillingMonth` |
| `timePeriod.from/to` | Bắt buộc khi `timeframe=Custom` (format `YYYY-MM-DD`) |
| `granularity` | `Daily`, `Monthly`, hoặc `None` (tổng cộng) |
| `grouping[].name` | `ServiceName`, `ResourceGroup`, `ResourceId`, `MeterCategory`, `MeterSubCategory`, `Meter` |

#### 1.2 Query Cost by Resource (top N đắt nhất)

```http
POST /subscriptions/{subscriptionId}/providers/Microsoft.CostManagement/query?api-version=2023-11-01
```

```json
{
  "type": "ActualCost",
  "timeframe": "MonthToDate",
  "dataset": {
    "granularity": "None",
    "aggregation": {
      "totalCost": { "name": "CostUSD", "function": "Sum" }
    },
    "grouping": [
      { "type": "Dimension", "name": "ResourceId" },
      { "type": "Dimension", "name": "ResourceType" },
      { "type": "Dimension", "name": "ResourceGroupName" }
    ],
    "sorting": [
      { "direction": "descending", "name": "CostUSD" }
    ],
    "filter": null
  }
}
```

> Response trả về `properties.rows[]` — mỗi row = `[cost, resourceId, resourceType, resourceGroup, currency]`.

#### 1.3 Forecast (dự báo)

```http
POST /subscriptions/{subscriptionId}/providers/Microsoft.CostManagement/forecast?api-version=2023-11-01
```

```json
{
  "type": "ActualCost",
  "timeframe": "Custom",
  "timePeriod": {
    "from": "2026-03-01",
    "to": "2026-03-31"
  },
  "dataset": {
    "granularity": "Daily",
    "aggregation": {
      "totalCost": { "name": "CostUSD", "function": "Sum" }
    }
  },
  "includeActualCost": true,
  "includeFreshPartialCost": false
}
```

#### 1.4 List Invoices

```http
GET /subscriptions/{subscriptionId}/providers/Microsoft.Billing/invoices?api-version=2024-04-01&periodStartDate=2026-01-01&periodEndDate=2026-03-31
```

#### 1.5 Budgets

```http
GET /subscriptions/{subscriptionId}/providers/Microsoft.Consumption/budgets?api-version=2023-05-01
```

**Wecare Subscription ID**: `b230aef2-52a0-4800-8a8d-91a6880c86a2`

---

### 2️⃣ Google Cloud Billing API

> **Base URL**: `https://cloudbilling.googleapis.com`
> **Auth**: `Authorization: Bearer <access_token>` (OAuth2 — scope `https://www.googleapis.com/auth/cloud-billing.readonly`)
> **Docs**: [cloud.google.com/billing/docs/reference/rest](https://cloud.google.com/billing/docs/reference/rest)

#### 2.1 List Billing Accounts

```http
GET /v1/billingAccounts
```

**Response fields**: `name` (format `billingAccounts/XXXXXX-XXXXXX-XXXXXX`), `displayName`, `open`

#### 2.2 Get Billing Account Info

```http
GET /v1/billingAccounts/{billingAccountId}
```

#### 2.3 List Projects linked to Billing Account

```http
GET /v1/billingAccounts/{billingAccountId}/projects
```

#### 2.4 Export Cost to BigQuery (recommended cho auto-refresh)

Không có REST API trực tiếp để query cost — Google yêu cầu **export sang BigQuery** rồi query:

1. **Bật export**: Console → Billing → **Billing export** → chọn BigQuery dataset
2. **Query cost từ BigQuery**:

```sql
SELECT
  invoice.month AS month,
  service.description AS service,
  SUM(cost) AS cost_usd,
  SUM((SELECT SUM(c.amount) FROM UNNEST(credits) c)) AS credits_usd
FROM `project.dataset.gcp_billing_export_v1_XXXXXX`
WHERE invoice.month >= '202601'
GROUP BY month, service
ORDER BY month, cost_usd DESC
```

**BigQuery API endpoint**: 
```http
POST https://bigquery.googleapis.com/bigquery/v2/projects/{projectId}/queries
```

```json
{
  "query": "SELECT ... FROM `project.dataset.gcp_billing_export_v1_XXXXXX` ...",
  "useLegacySql": false
}
```

#### 2.5 Budgets API

```http
GET https://billingbudgets.googleapis.com/v1/billingAccounts/{billingAccountId}/budgets
```

> ⚠️ **Google Cloud KHÔNG có REST API trả cost trực tiếp** (khác Azure). Phải đi qua **BigQuery export** hoặc download CSV thủ công từ Console.

---

### 3️⃣ Microsoft 365 Licenses (Microsoft Graph API)

> **Base URL**: `https://graph.microsoft.com/v1.0`
> **Auth**: `Authorization: Bearer <access_token>` (scope `Organization.Read.All`, `Directory.Read.All`)

#### 3.1 List All Licensed SKUs

```http
GET /subscribedSkus
```

**Response fields quan trọng**:
| Field | Mô tả |
|-------|--------|
| `skuPartNumber` | Tên SKU (`POWER_BI_PRO`, `O365_BUSINESS_PREMIUM`...) |
| `prepaidUnits.enabled` | Số licenses đã mua |
| `consumedUnits` | Số licenses đang dùng |
| `appliesTo` | `User` hoặc `Company` |

#### 3.2 List Users với License Assignment

```http
GET /users?$select=displayName,mail,assignedLicenses&$filter=assignedLicenses/$count ne 0&$count=true
```
Header: `ConsistencyLevel: eventual`

#### 3.3 Get Organization Info (Tenant)

```http
GET /organization?$select=displayName,verifiedDomains,assignedPlans
```

---

### 🔐 Authentication Summary

| Vendor | Method | Scope / Permission |
|--------|--------|--------------------|
| **Azure** | OAuth2 Client Credentials hoặc `az login` | `https://management.azure.com/.default` + Role: `Cost Management Reader` |
| **Google** | OAuth2 Service Account hoặc `gcloud auth` | `https://www.googleapis.com/auth/cloud-billing.readonly`, `bigquery.readonly` |
| **M365** | OAuth2 App Registration (Entra ID) | `Organization.Read.All`, `Directory.Read.All` |

> 💡 **Power BI auto-refresh**: Dùng **Azure Cost Management connector** (built-in) cho Azure, **BigQuery connector** cho Google Cloud, **Microsoft Graph connector** cho M365 licenses.

---

## 📊 Data Summary (2026-03-24)

| Tháng | Azure | Google | M365 | Total |
|-------|-------|--------|------|-------|
| T01/2026 | $433.10 | $0 | $119.00 | $552.10 |
| T02/2026 | $1,055.25 | $0 | $119.00 | $1,174.25 |
| T03/2026 (MTD) | $975.88 | $471.26 | $119.00 | $1,566.14 |

**Azure Forecast T03**: ~$1,290.58 (MTD $975.88 + remaining ~$314.70)

**Top Azure Services** (T01-T03):
- Microsoft Fabric: $1,592.14 (65%)
- Virtual Machines: $709.87 (29%)
- Storage: $83.30 (3%)
- Virtual Network: $78.73 (3%)
