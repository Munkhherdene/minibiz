# Ashi — Phase 1: Requirements and Architecture

Status: **draft, awaiting confirmation** (2026-10-31).
This document is the reference for all later phases. Code, migrations and tests must stay consistent with it; when a decision changes, update this file in the same change.

---

## 0. Starting point (existing `minibiz` project)

Already in place and kept:

| Area | State |
| --- | --- |
| Expo SDK 58, React Native 0.88, React 19.3, strict TypeScript | Done |
| Expo Router, routes in `src/app/`, `@/` alias to `src/` | Done |
| Supabase client with persisted session (`src/lib/supabase.ts`) | Done |
| Env vars `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in git-ignored `.env.local` | Done |
| Login, signup, logout with auth guards (`Stack.Protected`) | Done (English UI) |
| Home and Profile tabs, icons via `expo-symbols` | Placeholder (English UI) |

To change in Phases 2–3: rename the app to Ashi, translate all UI to Mongolian, replace the two tabs with five, add password recovery, email verification by code, and onboarding.

---

## 1. Product requirements (concise PRD)

**Problem.** Small business owners in Mongolia track stock, sales and spending in notebooks, Excel or their heads. They cannot quickly answer "How much did I sell today?", "What is running out?" or "Am I making a profit?".

**Product.** Ashi is a mobile app (Android and iOS) that lets an owner record products, stock, sales and expenses in a few taps and shows sales, profit and cash in plain language.

**Users.** Owners of small shops, clothing and cosmetics sellers, social media sellers, home businesses, market stalls and small wholesalers. Assume limited accounting knowledge, Android-first, phones of all sizes, sometimes poor connectivity.

**Principles.**
1. "Manage your business in a few taps": every main task takes 3 screens or fewer from Home.
2. Only the minimum required fields; everything else is optional and editable later.
3. Numbers are trustworthy: stock and money change only through validated, atomic server operations, and history is never deleted.
4. Plain Mongolian labels, no accounting jargon. Every profit figure is labelled as an estimate.

**Defaults.** Mongolian UI, MNT (₮) with no decimals shown, time zone `Asia/Ulaanbaatar`, weeks start on Monday.

**Success criteria for the MVP.**
- A new user can sign up, create a business, add a product with opening stock and record a sale in under 5 minutes.
- Stock on hand always equals the sum of that product's inventory movements.
- The financial summary for any period can be reproduced by hand from the transaction lists.
- No user can read or change another business's data (verified by automated RLS tests).

**Out of scope for the MVP.** Offline sync, payroll, advanced accounting (double-entry ledger, tax returns), multiple warehouses, manufacturing, supplier accounts payable, customer accounts, team member invitations, AI features, payment integrations (QPay etc.), English UI.

---

## 2. MVP feature list

**Authentication**
- Sign up with email and password, with confirmation by a 6-digit email code
- Log in, log out, persistent session
- Password recovery by a 6-digit email code, then set a new password
- Profile: full name, phone, change password

**Business setup (onboarding)**
- Shown after first login when the user has no business
- Business name (required), business type (required, picked from a list), currency (default MNT), logo (optional)
- Creates the business, the owner membership and default categories in one step
- Edit business details later in Profile

**Home dashboard**
- Today: sales, expenses, estimated gross profit, estimated net operating profit
- Number of active products, low-stock count and list
- Last 5 sales
- Quick actions: Add product, Record sale, Add stock, Record expense
- Empty state for new businesses, guiding them to the first product and sale

**Product categories**
- Create, rename and delete (products fall back to "uncategorised")

**Products**
- List with search (name, SKU, barcode), category filter and infinite scroll
- Create with name (required), selling price (required), cost, opening stock, unit, category, optional image, SKU, barcode and low-stock threshold
- Detail: stock, prices, estimated margin, movement history
- Edit details and prices (not stock; stock changes only through movements)
- Archive and unarchive (no hard delete)

**Inventory movements**
- Stock received (with unit cost, optional supplier reference and optional cash payment)
- Damaged or lost goods
- Stock adjustment (stock count correction, up or down)
- Automatic: opening stock, sale, sale cancellation
- Per-product history: who, when, type, quantity, balance after

**Sales**
- Cart screen: search and tap products, adjust quantities, see the running total
- Checkout: sale-level discount, payment method (cash, bank transfer, other), amount paid (full by default, partial allowed), optional customer name and note
- Atomic, idempotent sale creation with clear "not enough stock" errors
- Receipt screen (shareable later)
- Sales history filtered by date range, with paid, partly paid and cancelled badges
- Record a later payment against an unpaid balance
- Cancel a sale: restores stock, records refunds, keeps the sale and marks it cancelled

**Income and expenses**
- Record an expense or other income: amount, category, date, payment method, description
- Default expense categories plus custom ones
- List by date range; void a mistaken entry (kept in history)

**Financial summary**
- Ranges: today, this week, this month, custom
- Sales revenue, cost of goods sold, gross profit, operating expenses, inventory losses, estimated net operating profit
- Cash received, cash paid, net cash flow
- Outstanding customer balances, current inventory value

**Profile and settings**
- Account details, business details, categories, log out

---

## 3. Navigation and screen map

Bottom tabs (Mongolian labels): **Нүүр** (Home) · **Бараа** (Products) · **Борлуулалт** (Sales) · **Санхүү** (Finance) · **Профайл** (Profile).

Root guards in `src/app/_layout.tsx`:
1. No session → `(auth)` group
2. Session but no business → `onboarding`
3. Session and business → `(tabs)`

```
src/app/
├── _layout.tsx                  Providers (Query, Auth, Business) + guards
├── (auth)/
│   ├── login.tsx
│   ├── signup.tsx
│   ├── verify-email.tsx         6-digit code after signup
│   └── forgot-password.tsx      email → code → new password
├── onboarding.tsx               Business setup
└── (tabs)/
    ├── _layout.tsx              5 tabs
    ├── index.tsx                Home dashboard + quick actions
    ├── products/
    │   ├── _layout.tsx          Stack
    │   ├── index.tsx            List, search, category filter
    │   ├── new.tsx              Create product
    │   ├── [id]/index.tsx       Detail + movement history
    │   ├── [id]/edit.tsx        Edit product
    │   ├── [id]/stock.tsx       Stock received / damaged / adjustment
    │   └── categories.tsx       Manage categories
    ├── sales/
    │   ├── _layout.tsx          Stack
    │   ├── index.tsx            Sales history
    │   ├── new.tsx              Cart → checkout sheet → confirm
    │   └── [id].tsx             Receipt, add payment, cancel
    ├── finance/
    │   ├── _layout.tsx          Stack
    │   ├── index.tsx            Summary with range picker
    │   ├── transactions.tsx     Income/expense list
    │   └── new.tsx              Record expense or income
    └── profile/
        ├── _layout.tsx          Stack
        ├── index.tsx            Menu
        ├── account.tsx          Name, phone, password
        ├── business.tsx         Business details, logo
        └── expense-categories.tsx
```

Quick-action routes from Home: Add product → `/products/new`; Record sale → `/sales/new`; Add stock → product picker → `/products/[id]/stock`; Record expense → `/finance/new`.

Main flow tap counts: record a sale = Home → Record sale → tap products → Checkout → Confirm (about 4 taps plus product taps).

---

## 4. Database schema

### 4.1 Conventions

- Primary keys: `uuid default gen_random_uuid()`.
- Every business-owned table has `business_id uuid not null references businesses`, including child tables such as `sale_items`. This keeps RLS policies simple and lets indexes start with `business_id`.
- Timestamps: `created_at timestamptz default now()`, plus `updated_at` maintained by a shared trigger on mutable tables.
- Money: `numeric(14,2)` (up to 999,999,999,999.99). Average cost: `numeric(14,4)`. Quantity: `numeric(12,3)`, which supports kg, litres and metres. Never `float`.
- One currency per business (`businesses.currency`); all amounts in that business are in that currency.
- Status and type fields: `text` with `check` constraints (easier to extend than Postgres enums).
- Financial and inventory history is append-only: no `delete` policies; corrections are new rows or status changes.
- Schema changes only through SQL migrations in `supabase/migrations/`.

### 4.2 Tables

**profiles**: one row per auth user, created by a trigger on `auth.users` insert.
`id` (PK, FK `auth.users` on delete cascade), `full_name`, `phone`, `locale` default `'mn'`, timestamps.

**businesses**: a business (shop).
`id`, `name` (1–100 chars), `business_type` (`retail`, `clothing_cosmetics`, `online_seller`, `home_business`, `market_stall`, `wholesale`, `other`), `currency` char(3) default `'MNT'`, `logo_path` (nullable), `timezone` default `'Asia/Ulaanbaatar'`, `allow_negative_stock` bool default false, `next_sale_number` int default 1, `created_by` (FK profiles), timestamps.

**business_members**: which users can access which business.
`id`, `business_id`, `user_id` (FK profiles), `role` (`owner`, `manager`, `staff`; the MVP only creates `owner`), timestamps. Unique `(business_id, user_id)`. Index `(user_id)`.

**product_categories**
`id`, `business_id`, `name`, `sort_order`, timestamps. Unique `(business_id, lower(name))`.

**products**
`id`, `business_id`, `category_id` (nullable, on delete set null), `name` (required), `sku` (nullable), `barcode` (nullable), `unit` (`pcs`, `kg`, `g`, `l`, `ml`, `m`, `box`, `pack`; default `pcs`), `image_path` (nullable), `cost_price` numeric(14,2) ≥ 0 (the user's default purchase cost, pre-filled when receiving stock), `avg_cost` numeric(14,4) ≥ 0 (**system-maintained**), `selling_price` numeric(14,2) ≥ 0, `current_stock` numeric(12,3) (**system-maintained**), `low_stock_threshold` numeric(12,3) nullable ≥ 0, `is_active` bool default true, timestamps.
Unique `(business_id, sku)` and `(business_id, barcode)` where not null. Indexes: `(business_id, is_active, name)`; trigram index on `name` (`pg_trgm`) for search.
The `authenticated` role has **no update privilege** on `current_stock` and `avg_cost` (column-level `revoke`); only database functions change them.

**inventory_transactions**: every stock movement (append-only).
`id`, `business_id`, `product_id`, `type` (`opening_stock`, `purchase_receipt`, `sale`, `sale_cancellation`, `customer_return`*, `damage`, `adjustment`), `quantity_change` numeric(12,3) ≠ 0 (signed), `unit_cost` numeric(14,4) (cost used for valuation), `stock_after` numeric(12,3), `sale_id` (nullable FK), `sale_item_id` (nullable FK), `reference` (e.g. supplier invoice number), `note`, `occurred_at` timestamptz, `created_by` (FK profiles), `created_at`.
Index `(business_id, product_id, occurred_at desc)`.
\* `customer_return` is reserved for partial returns after the MVP; in the MVP, returns are handled as sale cancellation.

**sales**: sale header.
`id`, `business_id`, `sale_number` int, `client_request_id` uuid (idempotency key), `status` (`completed`, `cancelled`), `sold_at`, `customer_name` (nullable), `subtotal`, `discount_amount` (0 ≤ discount ≤ subtotal), `total_amount` (= subtotal − discount), `total_cost` (COGS snapshot), `amount_paid` (maintained by functions), `balance_due` (generated: `total_amount − amount_paid`), `note`, `cancelled_at`, `cancelled_by`, `cancel_reason`, `created_by`, timestamps.
Unique `(business_id, sale_number)` and `(business_id, client_request_id)`. Index `(business_id, sold_at desc)`.

**sale_items**: lines with price and cost snapshots.
`id`, `business_id`, `sale_id`, `product_id`, `product_name` (snapshot), `unit` (snapshot), `quantity` > 0, `unit_price` ≥ 0 (snapshot), `unit_cost` ≥ 0 (avg cost snapshot), `line_total`, `line_cost`, `created_at`. Index `(sale_id)`.

**sale_payments**: money received for a sale (negative = refund).
`id`, `business_id`, `sale_id`, `amount` ≠ 0, `method` (`cash`, `bank_transfer`, `other`), `paid_at`, `created_by`, `created_at`. Index `(business_id, paid_at)`.

**cash_categories**: replaces the proposed `expense_categories`, because "other income" also needs categories.
`id`, `business_id`, `kind` (`expense`, `income`), `name`, `is_default` bool, `sort_order`, timestamps. Unique `(business_id, kind, lower(name))`.
Seeded on business creation. Expense categories: Түрээс (rent), Цахилгаан (electricity), Тээвэр (transport), Хүргэлт (delivery), Маркетинг (marketing), Бусад зардал (other expenses). Income category: Бусад орлого (other income).

**cash_transactions**: cash movements **not** linked to sales.
`id`, `business_id`, `kind` (`expense`, `income`, `inventory_purchase`), `category_id` (required for `expense` and `income`, null for `inventory_purchase`), `amount` > 0, `method`, `occurred_at`, `description`, `inventory_transaction_id` (nullable, set for `inventory_purchase`), `voided_at`, `voided_by`, `created_by`, timestamps. Index `(business_id, occurred_at desc)`.

Not created in the MVP: `customers`, `suppliers`, `purchase_orders`, `warehouses`, `audit_log`. The append-only transaction tables are the audit trail.

### 4.3 Relationships

```
auth.users 1─1 profiles 1─* business_members *─1 businesses
businesses 1─* product_categories 1─* products
businesses 1─* products 1─* inventory_transactions
businesses 1─* sales 1─* sale_items *─1 products
                sales 1─* sale_payments
                sales 1─* inventory_transactions (type sale / sale_cancellation)
businesses 1─* cash_categories 1─* cash_transactions
inventory_transactions 1─0..1 cash_transactions (kind inventory_purchase)
```

### 4.4 Security model (RLS)

- Helper `is_business_member(business_id uuid) returns boolean`: `security definer`, `stable`, `set search_path = ''`. Checks `business_members` for `auth.uid()`.
- RLS enabled on every table in `public`. Policies:

| Table | select | insert / update | delete |
| --- | --- | --- | --- |
| profiles | own row | update own row | — |
| businesses | member | update: owner; insert: via `create_business` only | — |
| business_members | member of that business | functions only | — |
| product_categories, cash_categories | member | member | member (categories only) |
| products | member | member (stock and cost columns revoked) | — (archive instead) |
| cash_transactions | member | member (void instead of delete) | — |
| inventory_transactions, sales, sale_items, sale_payments | member | **functions only** | — |

- Critical writes go through `security definer` functions that (1) check `is_business_member`, (2) validate input, (3) lock rows, (4) write all rows in one transaction. Functions set `search_path = ''` and use fully qualified names.
- Storage bucket `business-assets` with paths `{business_id}/products/{uuid}.jpg` and `{business_id}/logo.jpg`. Writes are allowed only when the first path segment is a business the user belongs to.
- The app only ever holds the publishable key. The service-role key is never in the repo, the app or `EXPO_PUBLIC_*` variables.

### 4.5 Database functions (RPC)

| Function | Purpose |
| --- | --- |
| `create_business(name, type, currency)` | Business + owner membership + default categories |
| `create_product(business_id, product fields, opening_stock, opening_unit_cost)` | Product + `opening_stock` movement |
| `record_stock_movement(product_id, type, quantity, unit_cost, reference, note, payment)` | `purchase_receipt`, `damage`, `adjustment`; optional cash payment for receipts |
| `create_sale(business_id, client_request_id, items, discount, payment, customer_name, note)` | Entire sale atomically; returns the existing sale for a repeated `client_request_id` |
| `add_sale_payment(sale_id, amount, method)` | Later payment against a balance |
| `cancel_sale(sale_id, reason)` | Restore stock, refund payments, mark cancelled |
| `get_financial_summary(business_id, from, to)` | All report figures for a range |
| `get_dashboard(business_id)` | Today's figures, low stock, recent sales |

Errors are raised with stable codes (for example `INSUFFICIENT_STOCK`, `PRODUCT_ARCHIVED`, `SALE_ALREADY_CANCELLED`) that the app maps to Mongolian messages.

---

## 5. Core inventory and financial rules

The database is the authority. `src/domain/` has pure TypeScript versions of the same formulas for live previews (cart totals) and for unit tests.

### 5.1 Inventory

1. **Balance invariant:** `products.current_stock = Σ inventory_transactions.quantity_change` for that product, and each row's `stock_after` equals the running sum. A test query verifies this.
2. **Signs:** opening +, purchase_receipt +, sale −, sale_cancellation +, damage −, adjustment ±.
3. **No negative stock:** if `current_stock + quantity_change < 0` and `allow_negative_stock` is false, the function raises `INSUFFICIENT_STOCK` with the available quantity. The UI shows e.g. "Үлдэгдэл хүрэлцэхгүй: 3 ширхэг байна" ("Not enough stock: 3 pieces left").
4. **Concurrency:** functions lock product rows with `select … for update`, in ascending `id` order to avoid deadlocks, before reading stock. A sale is one function call, which is one transaction.
5. **Costing: moving weighted average.**
   - Increase with a cost (opening, receipt):
     `new_avg = unit_cost` if `stock_before ≤ 0`, otherwise
     `new_avg = (stock_before × avg + qty × unit_cost) / (stock_before + qty)`.
   - Decreases (sale, damage, negative adjustment) use the current `avg_cost` as `unit_cost` and do not change it.
   - A positive adjustment without a cost uses the current `avg_cost`.
   - Cancellation returns stock at each line's original `unit_cost` snapshot, re-averaged in.
6. **Integer units:** `pcs`, `box` and `pack` require whole quantities (checked in Zod and in the functions).
7. **Archived products** cannot be sold or receive stock; their history stays visible.
8. **Inventory value** = Σ `current_stock × avg_cost` over products with stock.

### 5.2 Sales

1. `line_total = round(quantity × unit_price, 2)`; `subtotal = Σ line_total`.
2. `0 ≤ discount_amount ≤ subtotal`; `total_amount = subtotal − discount_amount`.
3. Cost snapshot: `unit_cost = products.avg_cost` read under the row lock; `line_cost = round(quantity × unit_cost, 2)`; `total_cost = Σ line_cost`.
4. Unit price comes from the product's current selling price. There is no per-line price editing in the MVP; the discount is sale-level.
5. `amount_paid = Σ sale_payments.amount`, with `0 ≤ amount_paid ≤ total_amount`. For cash, the UI may take the amount handed over and show change; only up to `total_amount` is stored.
6. `balance_due = total_amount − amount_paid`.
7. **Sale number:** per business, allocated inside `create_sale` by locking the `businesses` row and incrementing `next_sale_number`. Cancelled sales keep their number.
8. **Duplicate prevention:** the cart screen creates `client_request_id` (a UUID) once. Retries send the same id and get the same sale back. The confirm button is disabled while the request is pending.
9. **Cancellation:** only for `completed` sales. It adds a `sale_cancellation` movement per line, adds a negative `sale_payment` for each method that had a net payment, and sets `status = 'cancelled'` with who, when and why. Nothing is deleted.

### 5.3 Finance

For a range `[from, to)` computed in the business time zone:

| Figure | Formula |
| --- | --- |
| Sales revenue | Σ `total_amount` of `completed` sales with `sold_at` in range |
| Cost of goods sold (COGS) | Σ `total_cost` of the same sales |
| **Gross profit** | Revenue − COGS |
| Operating expenses | Σ `cash_transactions.amount` where `kind = 'expense'`, not voided, `occurred_at` in range |
| Inventory losses | −Σ `quantity_change × unit_cost` of `damage` and `adjustment` movements in range (a net gain lowers losses) |
| Other income | Σ `cash_transactions.amount` where `kind = 'income'`, not voided |
| **Estimated net operating profit** | Gross profit − Operating expenses − Inventory losses + Other income |
| Cash received | Σ positive `sale_payments` in range + Other income |
| Cash paid | Operating expenses + inventory purchases (`kind = 'inventory_purchase'`) + refunds (Σ negative `sale_payments`, as a positive amount) |
| Net cash flow | Cash received − Cash paid |
| Outstanding customer balances | Σ `balance_due` of all `completed` sales (as of now) |
| Inventory value | As in 5.1 (as of now) |

Rules that prevent double counting:
- **Inventory purchases are never operating expenses.** They are cash out (cash flow) and become cost only through COGS when sold.
- Sale money lives only in `sale_payments`, never in `cash_transactions`.
- Revenue is recognised on the sale date regardless of payment; cash is recognised on the payment date.
- A cancelled sale is excluded from revenue and COGS for its original date (the report for that day changes). Its refund appears in cash paid on the cancellation date.
- Profit labels always say "Тооцоолсон" (estimated) and the summary screen states that figures are not audited accounting.
- Display money as whole tugrik with thousands separators (e.g. `12,500₮`). Store with 2 decimals.

---

## 6. Folder structure

```
supabase/
├── config.toml
├── migrations/                 Timestamped SQL migrations (schema, RLS, functions)
├── tests/                      pgTAP tests (RLS, stock, sales, finance)
└── seed.sql                    Development-only demo data
src/
├── app/                        Routes only: thin screens that compose features
├── components/
│   └── ui/                     Design system: Screen, Button, TextField, Card,
│                               ListItem, EmptyState, MoneyText, Badge, Sheet, Icon
├── features/
│   ├── auth/                   api.ts, hooks.ts, schemas.ts
│   ├── business/
│   ├── products/               api.ts (Supabase queries), hooks.ts (TanStack Query),
│   ├── inventory/              schemas.ts (Zod), components/ (feature-specific UI)
│   ├── sales/
│   └── finance/
├── domain/                     Pure business rules + __tests__/
│   ├── money.ts                Rounding, MNT formatting
│   ├── inventory.ts            Average cost, stock checks
│   ├── sales.ts                Line totals, discounts, balance
│   └── finance.ts              Report formulas
├── lib/
│   ├── supabase.ts             Client (exists)
│   ├── auth.tsx                Session context (exists)
│   ├── business.tsx            Active business context
│   ├── query-client.ts         TanStack Query setup
│   └── errors.ts               Maps DB error codes to Mongolian messages
├── i18n/
│   ├── mn.ts                   All UI strings
│   └── format.ts               Mongolian dates and money
├── constants/theme.ts          Colors, spacing, radius, typography (exists)
└── types/
    └── database.ts             Generated by the Supabase CLI
docs/architecture.md            This document
```

Rule of thumb: `app/` screens hold layout and wiring only, `features/*/api.ts` is the only place that calls Supabase, and `domain/` has no React or Supabase imports.

---

## 7. Development setup checklist

Already done: Expo SDK 58 project, strict TypeScript, Expo Router, Supabase client, `.env.local`.

Phase 2:
- [ ] Rename the app: `name: "Ashi"`, `slug: "ashi"`, `scheme: "ashi"` in `app.json` (safe now, before any EAS build exists).
- [ ] `npx expo install @tanstack/react-query react-hook-form zod @hookform/resolvers expo-image-picker expo-crypto`
- [ ] Testing: `npx expo install jest-expo jest @types/jest @testing-library/react-native -- --save-dev`, plus a `test` script.
- [ ] ESLint: `npx expo lint` (creates the config on first run).
- [ ] Add `.env.example` with variable names only.
- [ ] Supabase CLI via `npx supabase`: `init`, `login` (personal access token), `link --project-ref vnbtkwhljqivnkdcyskd` (asks for the database password; never stored in the repo).
- [ ] Migrations applied with `npx supabase db push`; types with `npx supabase gen types typescript --linked > src/types/database.ts`.
- [ ] Supabase dashboard, Authentication → Email templates: put `{{ .Token }}` (6-digit code) in "Confirm signup" and "Reset password", so no deep links are needed and it works in Expo Go.
- [ ] Storage bucket `business-assets` (created by migration).
- [ ] Design system components and Mongolian strings file.
- [ ] Before real users: custom SMTP (e.g. Resend) in Supabase Auth, and a separate production Supabase project.

Running locally: `npx expo start` (or `npx expo start --tunnel` when the network or the ESET firewall blocks the phone), open in Expo Go. All planned libraries work in Expo Go; no development build is needed for the MVP.

---

## 8. Risks and decisions

### 8.1 Decisions (recommended defaults, to confirm)

| # | Decision | Recommendation | Why |
| --- | --- | --- | --- |
| D1 | UI library | **Own small design system, no React Native Paper** | Paper uses Material Design (looks foreign on iOS), depends on the deprecated `@expo/vector-icons` and declares no tested React Native range. About 10 components cover the MVP, and `expo-symbols` already provides native icons. |
| D2 | Inventory costing | **Moving weighted average** | Simple, accurate enough for small shops, one number per product. FIFO needs cost layers and adds complexity. |
| D3 | Unpaid and partly paid sales | **Include in the MVP**, with an optional customer name and no customer table | Selling on credit (зээл) is common. The schema supports it cheaply. |
| D4 | Paying suppliers later (accounts payable) | **Not in the MVP** | Stock received can optionally record the cash paid; unpaid purchases are only noted in the reference. |
| D5 | Customer returns | **Whole-sale cancellation only**; partial returns later | Partial returns need refund allocation and are rare at first. |
| D6 | Cancelled sales in reports | **Remove from the original day** | Simple and intuitive. The alternative (a reversal on the cancellation day) is more "accounting-correct" but confusing. |
| D7 | Email confirmation and password reset | **6-digit codes**, not links | Works in Expo Go without deep links. Needs a one-time template edit in Supabase. |
| D8 | Price editing at sale time | **Not allowed; sale-level discount only** | Fewer mistakes, simpler UI; the product price can be edited anytime. |
| D9 | Language | **Mongolian only**, all strings in `src/i18n/mn.ts`, no i18n library yet | Easy to add a library and English later. |
| D10 | Supabase environments | **Current project = development**; create a separate production project before launch | Tests and demo data never touch real data. |
| D11 | Database tests | **pgTAP tests run against the development project** | Docker (needed for local Supabase) isn't installed, and disk space is limited. |
| D12 | Product images | **Public-read bucket**, uploads restricted to members | Product photos aren't sensitive; avoids signed-URL complexity. Logos are the same. |
| D13 | Multiple businesses | **Schema supports it; the UI uses one active business** | Business switching and member invitations come later. |
| D14 | Product photos | **Gallery or camera through `expo-image-picker`, resized before upload** | Keeps uploads small on mobile data. |

### 8.2 Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Bugs in stock and sale SQL functions | Wrong stock or profit, loss of trust | Keep the logic in a few functions; pgTAP tests for every rule in section 5; an invariant check query |
| RLS mistakes | Data leak between businesses | RLS on every table, tests with two users and two businesses, Supabase security advisor before release |
| Supabase built-in email limits (a few emails per hour) | Signups fail when testing or launching | Turn off confirmation during development or use custom SMTP; custom SMTP is required before launch |
| Free-tier Supabase pauses after inactivity | App down for testers | Upgrade or keep it active before beta |
| Network or firewall blocks Expo Go on this PC (ESET) | Slow development | Use `--tunnel`, or allow Node.js in ESET |
| Disk space on the dev PC (about 11 GB free) | Failed installs and builds | Use EAS cloud builds, not local Android builds; clear caches periodically |
| Mongolian locale support in Hermes `Intl` is uncertain | Wrong number or date formatting | Custom formatters in `src/i18n/format.ts` |
| Scope creep (payments, customers, offline) | MVP never ships | Hold to section 2; record new ideas as "later" |
| Concurrent sales from two devices | Overselling | Row locks in `create_sale` (rule 5.1.4) |

### 8.3 Assumptions

- The MVP has one user per business (the owner); roles exist in the schema only.
- All amounts are in the business currency, with no conversions.
- No taxes (VAT/НӨАТ, e-barimt) in the MVP; e-barimt receipts are a likely post-MVP need in Mongolia.
- Android is the primary test platform; iOS is supported through the same codebase.
