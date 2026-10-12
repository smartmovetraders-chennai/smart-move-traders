# Smart Move Traders — Real-Time GST Billing Application

A complete, production-ready, real-time GST billing application designed specifically for **Smart Move Traders**, a second-hand smartphone wholesale trading business located in Chennai, India.

Built using **Node.js, Express, Supabase PostgreSQL, and React Native (Expo)** entirely in **pure JavaScript (no TypeScript)**.

---

## Business Identity & Address

The business name and address appear on every generated bill, preview, and PDF:

**Smart Move Traders**  
Plot 8, GF, Bharathiyar Street,  
Maruthi Nagar, Phase 1,  
Thundalam,  
Chennai - 600077.  

- State: Tamil Nadu (State Code: 33)
- Default HSN Code: `8517` (Mobile phones, subject to CA confirmation)
- No GSTIN, phone, or email is invented or hardcoded; fields are stored as optional/nullable until confirmed.

---

## Statutory GST Margin Scheme (CGST Rule 32(5))

Second-hand goods dealers who buy and sell without claiming Input Tax Credit (ITC) calculate GST **strictly on the positive profit margin**, never on the gross selling turnover:

$$\text{Profit Margin} = \text{Selling Amount} - \text{Purchase Amount}$$

1. **When Profit Margin > ₹0:**
   - $\text{Total GST} = \text{Round}(\text{Profit Margin} \times 18\%)$
   - $\text{CGST} = \text{Round}(\text{Total GST} \div 2)$ (9%)
   - $\text{SGST} = \text{Total GST} - \text{CGST}$ (9%)
   - $\text{Net Profit} = \text{Profit Margin} - \text{Total GST}$
2. **When Profit Margin $\le$ ₹0 (Break-even or Loss):**
   - $\text{GST} = \text{₹0}$
   - $\text{CGST} = \text{₹0}$
   - $\text{SGST} = \text{₹0}$
   - $\text{Net Profit} = \text{Profit Margin}$ (the loss itself, untaxed)

### Core Architectural Rules:
- All financial arithmetic is performed in integer **Paise** (₹1 = 100 paise) to prevent IEEE-754 floating-point inaccuracies.
- The mobile application displays live calculation previews, but the **backend authoritatively recalculates** all numbers before database persistence.
- Client-submitted financial totals are never trusted.
- The invoice number reference is optional (`invoice_number`), and official GST invoice numbering (`gst_invoice_number`) remains nullable until the business establishes its official sequence.

---

## Project Structure

```
smart-move-traders/
├── MANIFEST.md                       # Comprehensive delivery manifest
├── README.md                         # Setup and execution guide
├── supabase/
│   ├── migrations/
│   │   └── 0001_init.sql             # PostgreSQL schema, indexes, RLS policies
│   └── seed/
│       └── seed.sql                  # Optional dev seed data
├── backend/
│   ├── package.json                  # Express + Jest dependencies (no TypeScript)
│   ├── .env.example                  # Environment configuration template
│   ├── .env                          # Local development environment
│   └── src/
│       ├── server.js                 # Server startup banner & listener
│       ├── app.js                    # Express app with Helmet, CORS, Rate Limit
│       ├── config/
│       │   ├── constants.js          # Business details, GST rate, HSN, payment methods
│       │   └── supabase.js           # Supabase client + dev in-memory fallback
│       ├── services/
│       │   ├── gstService.js         # Rule 32(5) integer paise calculation engine
│       │   └── billTemplate.js       # Customer and internal HTML bill templates
│       ├── middleware/
│       │   ├── auth.js               # Supabase JWT auth + dev bypass
│       │   ├── validate.js           # Request validation
│       │   └── errorHandler.js       # Centralized error handler
│       ├── controllers/
│       │   ├── invoiceController.js  # CRUD with server-side recalculation
│       │   ├── reportController.js   # Aggregate summaries and monthly metrics
│       │   └── businessController.js # Profile management
│       ├── routes/
│       │   ├── healthRoutes.js       # GET /api/health
│       │   ├── invoiceRoutes.js      # GET, POST, PATCH, DELETE /api/invoices
│       │   ├── reportRoutes.js       # GET /api/reports/summary, monthly
│       │   └── businessRoutes.js     # GET, PATCH /api/business/profile
│       └── __tests__/
│           ├── gstService.test.js    # Rule 32(5) arithmetic tests
│           ├── invoices.test.js      # API, security, authorization, tamper tests
│           └── pdfTemplate.test.js   # Verification of business name & Chennai address
└── mobile/
    ├── package.json                  # Expo SDK 51 + React Navigation
    ├── app.json                      # Expo application configuration
    ├── babel.config.js               # Babel preset
    ├── App.js                        # App root
    ├── assets/                       # App icons and placeholders
    └── src/
        ├── theme/
        │   └── colors.js             # Stripe-inspired clean financial theme
        ├── utils/
        │   └── formatters.js         # Indian Rupee (₹) & date formatting
        ├── services/
        │   ├── api.js                # Axios client with configurable endpoint
        │   ├── gstCalculator.js      # Instant live client-side margin preview
        │   └── pdfService.js         # HTML bill generation, PDF export & sharing
        ├── components/
        │   ├── Header.js
        │   ├── Card.js
        │   ├── StatCard.js
        │   ├── Badge.js
        │   └── EmptyState.js
        ├── navigation/
        │   └── AppNavigator.js       # Tab Navigator + Stack Navigator
        └── screens/
            ├── DashboardScreen.js    # Sales, profit, tax totals, recent bills
            ├── InvoiceListScreen.js  # Filterable invoice list & search
            ├── CreateBillScreen.js   # Wholesale lot form with live GST preview
            ├── InvoiceDetailScreen.js# Bill view, PDF sharing, status management
            ├── ReportsScreen.js      # Monthly breakdown & tax analytics
            └── SettingsScreen.js     # Business profile, API config, Rule 32(5) info
```

---

## Setup & Running Instructions

### 1. Database Setup (Supabase)
1. Log in to your Supabase project dashboard at [supabase.com](https://supabase.com).
2. Open the **SQL Editor**.
3. Paste the contents of `supabase/migrations/0001_init.sql` and run it.
4. Obtain your **Project URL** and **service_role key** from *Project Settings > API*.

### 2. Backend API Setup
```bash
cd backend
npm install
```

Configure `.env`:
```env
PORT=4000
NODE_ENV=development
DEV_BYPASS_AUTH=true

# Optional: Link live Supabase instance
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Run automated test suite:
```bash
npm test
```
*All 19 test cases verify margin arithmetic, currency-safe decimal rounding, input validation, unauthorized access barriers, and presence of the Chennai address.*

Start backend server:
```bash
npm start
# or for live reloading:
npm run dev
```
The server will start on `http://localhost:4000`. Test the health endpoint:
```bash
curl http://localhost:4000/api/health
```

### 3. Mobile App Setup (Expo React Native)
```bash
cd mobile
npm install
npx expo start
```
- Press **w** to open in web browser.
- Press **a** to open in Android emulator (or scan QR code with Expo Go app on your physical phone).
- In the mobile app's **Settings** screen, you can test or adjust the API Base URL to match your development machine's local IP address (e.g. `http://192.168.1.100:4000/api`).

---

## Verified Test Cases

The test suite formally validates all 10 project specifications:

| # | Test Scenario | Input Data | Expected Result | Status |
|---|---|---|---|---|
| 1 | Positive Profit Margin | Purchase: ₹2,94,000, Selling: ₹3,20,000 | Profit: ₹26,000, GST: ₹4,680 (18% on profit), CGST: ₹2,340, SGST: ₹2,340, Net: ₹21,320 | **PASS** |
| 2 | Zero Profit Margin | Purchase: ₹1,00,000, Selling: ₹1,00,000 | Profit: ₹0, GST: ₹0, CGST: ₹0, SGST: ₹0, Net: ₹0 | **PASS** |
| 3 | Negative Profit (Loss) | Purchase: ₹1,20,000, Selling: ₹1,00,000 | Profit: −₹20,000, GST: ₹0, Net: −₹20,000 | **PASS** |
| 4 | Input Validation | Qty $\le 0$, negative amounts | Rejected with HTTP 400 `ValidationError` | **PASS** |
| 5 | Decimal Rounding | Purchase: ₹10,000.10, Selling: ₹11,000.35 | Profit: ₹1,000.25, GST: ₹180.05, CGST: ₹90.03, SGST: ₹90.02 | **PASS** |
| 6 | Unsupported Payments | Payment: "Crypto" | Rejected; only Bank Transfer, UPI, Cash, Cheque allowed | **PASS** |
| 7 | Invoice Reference | User enters "REF-LOT-2026-X" | Preserved faithfully without fabricated sequences | **PASS** |
| 8 | Nullable GST Number | No official GST number provided | Retains `null` until officially assigned | **PASS** |
| 9 | Cross-User Security | User B attempts to access User A's invoice | Blocked with HTTP 403 Forbidden | **PASS** |
| 10| Business Name & Address| HTML/PDF bill generation | Features "Smart Move Traders" and complete Bharathiyar Street, Chennai address | **PASS** |
