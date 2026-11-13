# Handoff — Ewenesu Car Wash Register

Last updated: 13 Nov 2026. Read this before changing anything.

## Where things stand

- Live at https://natsongkiri2-wq.github.io/ewenesu-carwash/ (GitHub Pages, deploys from `main`).
- Owner: Frank (GitHub `natsongkiri2-wq`). Used daily on a phone at the wash bay, offline.
- `main` is the source of truth. Service worker cache is `ewenesu-carwash-v10`.
- Everything below is deployed. Nothing is half-built.

### Added on 13 Nov 2026

| Feature | Where | Entry points in `index.html` |
|---|---|---|
| This Week All Paid (locks a date range) | Reports → Check a Week | `handleMarkWeekPaid`, `isDateLocked`, `blockIfLocked` |
| Edit Week (special access: app PIN + reason) | same card | `openWeekUnlock`, `confirmWeekUnlock`, `window.lkVerifyPin` |
| Edit attendant name | Attendance row → Edit | `renameAttendant` |
| Hide / Unhide attendant | Attendance row → Hide; "Hidden attendants" chip | `hideAttendant`, `unhideAttendant`, `renderHiddenStaffList` |
| Activity Log | Reports, above the download buttons | `logActivity`, `logAmountChange`, `renderActivityLog` |

These were tested with jsdom scripts only. **Not yet confirmed by Frank on the phone** — if he reports something odd, start there.

## Files

- `index.html` — the whole app (~4,950 lines): CSS, HTML for five tabs, one login IIFE, then one main script.
- `sw.js` — offline cache. `CACHE_NAME` must be bumped on every deploy.
- `manifest.json`, icons — PWA shell.
- `ewenesu-carwash-pwa.zip` — old bundle, not used by the app.

## How the code is laid out

Main script order matters: **constants → state (`let …`) → init/boot calls → functions**.

- Any `let`/`const` that a boot-time render touches must sit in the constants/state block at the top. Putting it lower causes a silent crash that kills the rest of boot (blank tabs). This has happened more than once.
- `refreshAll()` is the central re-render hook for the Reports tab.
- Data has two layers: **pending** (`entries`, `expenses`, `attendance`) and **permanent history** (`historyEntries`, `historyExpenses`, `historyAttendance`). Every change writes both; reports read history. History older than about a year is pruned.
- The login/PIN screen is a self-contained IIFE at the top of the script. Its only export is `window.lkVerifyPin(pin)`.

## Storage (localStorage)

All app data uses the `ewenesu_` prefix, which is what Export/Import Full Backup copies. Any new key must use the prefix.

- Sales: `ewenesu_entries`, `ewenesu_history_entries`, `ewenesu_revenue_log`, `ewenesu_vehicle_profiles`
- Expenses: `ewenesu_expenses`, `ewenesu_history_expenses`, `ewenesu_expense_categories`, `ewenesu_expense_category_amounts`
- Attendance: `ewenesu_attendance`, `ewenesu_history_attendance`, `ewenesu_staff`, `ewenesu_hidden_staff`, `ewenesu_attendant_salaries`
- Paid weeks: `ewenesu_paid_weeks` (`[{id, from, to, lockedAt, commissionRate, totals}]`), `ewenesu_paid_week_log` (`[{from, to, lockedAt, unlockedAt, reason}]`)
- Activity log: `ewenesu_activity_log` (`[{t, cat, text, k?, from?}]`, capped at 3,000)
- Settings: `ewenesu_commission_rate_percent`, `ewenesu_layout_mode`, `ewenesu_sun_mode`, backup reminder timestamps
- Login (not in backups): `lk_auth`, `lk_auth_fail`

## Business rules

- Net = Gross Sales − Tithe (fixed 10%) − Commission (editable %, on sales after tithe) − Expenses − Salaries & Bonus.
- Bonus: VT100 per vehicle from the 15th vehicle of the day, per attendant present.
- One expense per category per day.
- One shared 4-digit PIN for the whole app; auto-locks after 5 minutes idle.

## Rules for the new features

**Paid-week lock**
- A date is locked if it falls inside any record in `ewenesu_paid_weeks`.
- Every function that adds, edits or deletes a sale, expense or attendance record checks the lock first. **Any new function that changes those records must call `blockIfLocked(date)` too.**
- Still allowed on locked dates: Add Payment (does not change sales or payout), renaming an attendant.
- Locking through today blocks further entries for today until reopened; the confirm dialog warns about it.
- Unlock uses the shared app PIN, so anyone with the PIN can unlock. Frank was offered a separate owner PIN and has not asked for it.

**Hide attendant**
- Hidden names stay in `ewenesu_staff`; they are only filtered out of the daily list. They still show on dates where they have a record.
- Remove is different: it deletes the person and their pending records (but never records inside a paid week).

**Activity log**
- Call `logActivity(category, text)` after any successful change. For inputs that save on every keystroke, use `logAmountChange` so a run of typing becomes one line.
- Read-only by design: no edit or clear in the UI.
- It cannot say who did something (one shared PIN).

## Known gotchas

1. **Timezone** — never use `toISOString()` for dates. Use `todayStr()` / `toLocalDateStr()`. Vanuatu is UTC+11, so UTC dates put morning entries on the previous day.
2. **Service worker** — forgetting to bump `CACHE_NAME` leaves phones on the old version. After a deploy the app must be closed and reopened, sometimes twice.
3. **Declaration order** — see "How the code is laid out".
4. **Names in `onclick`** — attendant and category names are injected into inline handlers through `escapeAttr`. Keep using it.

## Working with Frank

- Short, direct requests. Build exactly what was asked; he flags unrequested extras. Do not touch other parts of the app.
- If scope is truly unclear, ask one focused question first.
- He tests on the real phone and replies with screenshots.
- Deploy: he has asked for changes to be pushed straight to `main`. He can also upload files through GitHub's web editor.

## Change checklist

1. Start from current `main`, not an old copy.
2. Make the targeted edit.
3. Syntax-check the inline script (`new Function(...)` in Node).
4. Boot the page in jsdom and confirm no errors.
5. Run a test written for the feature, plus checks that existing features still work.
6. Bump `CACHE_NAME` in `sw.js`.
7. Commit, push to `main`, tell Frank to close and reopen the app.

The jsdom test scripts are not stored in this repo; they are rewritten per session.

## Open items

- Phone confirmation of the 13 Nov features (see top).
- Optional, only if Frank asks: separate owner PIN for week unlock and unhide; CSV export of the activity log; lock indicator on entry cards.
