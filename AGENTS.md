# ShopLedger

## Stack

- Node.js with CommonJS, Express 4, and `body-parser` for JSON requests.
- Plain HTML, CSS, and browser JavaScript in `public/`. Express serves the UI and printable HTML invoices.
- `lib/store.js` reads and writes `data/db.json` synchronously.

## Module map

- `routes/customers.js` — Lists Khata customers and records settlements.
- `routes/orders.js` — Lists, retrieves, places, and cancels orders.
- `routes/products.js` — Serves the product catalog and active coupons.
- `routes/reports.js` — Serves dashboard and GST reports, cart pricing previews, and data export.
- `lib/coupons.js` — Normalizes and validates coupon codes, computes discounts, and lists active coupons.
- `lib/dates.js` — Formats today's date, normalizes date keys, and determines fiscal years.
- `lib/inventory.js` — Finds products, calculates sellable stock, checks quantities, deducts and releases stock, and summarizes inventory.
- `lib/invoice.js` — Calculates invoice figures and renders printable HTML.
- `lib/ledger.js` — Handles customer lookup, Khata charges and reversals, balances, and settlements.
- `lib/orders.js` — Adds, retrieves, cancels, and filters orders.
- `lib/pricing.js` — Calculates subtotals, discounts, GST, and order totals.
- `lib/reports.js` — Builds dashboard summaries and GST reconciliation.
- `lib/store.js` — Loads and saves the JSON store and manages its audit log.
- `lib/tax.js` — Resolves GST rates and splits tax into CGST and SGST.

## Commands

- Start the app with `npm start` or `node server.js`.
- Run tests with `node --test`. The `npm test` script is a placeholder that exits with code 1.

## Rules

1. Write characterization tests before changing behavior.
2. Change only the production modules the ticket covers.
3. Tests must never read or write `data/db.json`. Use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

- Reported behavior: the last sellable unit cannot be sold, and cancelling an order never restores stock.
- Allowed production files: `lib/inventory.js` and `lib/orders.js` (`cancel()` only).
- The working tree already contains a local patch in `lib/inventory.js` that accepts the last sellable unit and restores physical stock on cancellation.
