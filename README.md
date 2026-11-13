# ewenesu-carwash

Ewenesu Car Wash Register — an offline-first PWA for recording daily sales, expenses, attendance and pay at Ewenesu Carwash, Port Vila, Vanuatu.

Live app: https://natsongkiri2-wq.github.io/ewenesu-carwash/

## What it does

- **New Entry** — log each vehicle with service line items, plate auto-fill, payments and notes.
- **Attendance & Pay** — mark attendants present, salary defaults, automatic bonus (VT100 per vehicle from the 15th vehicle of the day). Attendants can be renamed (Edit), hidden when no longer working (Hide / Unhide), or removed.
- **Expenses** — one-tap recurring expenses, custom expenses, stats and category breakdown.
- **Revenue** — permanent history dashboard by date range, service and vehicle type.
- **Reports** — weekly payout check, monthly Excel and PDF reports, money owed, full backup export/import.

### Weekly payout lock

In Reports → Check a Week, **This Week All Paid** locks every sales entry, attendance/pay record and expense in the From–To dates. **Edit Week (special access)** reopens a locked week; it needs the app PIN and a written reason, which is kept on record.

### Activity Log

Reports → Activity Log records every change (sales, payments, expenses, attendance and pay, team changes, paid weeks, commission rate, backups) with the date and time. It is read-only and included in the full backup.

## Money logic

Gross Sales − Tithe (10%) − Commission (editable %, on sales after tithe) − Expenses − Salaries & Bonus = Net.

## Technical notes

- Two files: `index.html` (the whole app) and `sw.js` (offline cache).
- All data is stored in the device's `localStorage` under keys starting with `ewenesu_`; there is no server. Use **Export Full Backup** regularly.
- **Every deploy must bump `CACHE_NAME` in `sw.js`** (currently `ewenesu-carwash-v10`), otherwise devices keep the old version. After a deploy, close and reopen the app.
- Dates use the device's local calendar date (never `toISOString()`), so early-morning entries land on the right day in Vanuatu time.
