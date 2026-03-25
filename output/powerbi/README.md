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
