# Class Planner

A Next.js web app for building a term-long class schedule in a few guided steps: pick a date range, add/import holidays, define your class sections, assign a weekly period pattern, apply one-off edits (add/override/cancel), preview the full schedule, and export everything to Excel (timetable + attendance sheets).

> The UI supports **English** and **Japanese** via `next-intl`.

---

## What it does

### Step-based schedule builder

1. **Select dates** (start/end)
   - End date is clamped to **start + 183 days** (about 6 months).
2. **Select holidays**
   - Manually select closure days (school events, exams, etc.)
   - Optionally **import national holidays** for **US / JP / CA** via `/api/holidays`
3. **Add sections** (your classes)
   - Up to **10** sections
   - Add one at a time or comma-separated
4. **Select weekly periods**
   - Assign which section meets on which weekday + period (Mon–Sat)
5. **Manual edit**
   - Add/override a class on a specific date/period (one-off)
   - Cancel a scheduled class for a specific date/period
6. **Show schedule**
   - Preview weekly timetables
   - View per-section lesson counts + dates
   - Export Excel files

### Excel exports

- **Timetable export** (`schedule.xlsx`)
  - Weekly blocks, color-coded by section
  - Holidays shaded
  - Lesson numbers auto-increment per section in chronological order
- **Attendance export** (`Attendance.xlsx`)
  - One sheet per section
  - Date/period columns are generated from that section’s actual lesson slots
  - Dropdown validation for attendance codes (e.g. 忌 / 停 / 公 / 欠)
  - Convenience totals + conditional formatting

### Auth + persistence (optional)

- Uses **Clerk** for authentication.
- Users can generate/export schedules without signing in, but **saving** is gated behind auth.
- A Clerk webhook (`user.created`) can insert new users into Postgres automatically.

---

## Tech stack

- **Next.js** (App Router) + **TypeScript**
- **Clerk** authentication (`@clerk/nextjs`) + Svix webhook verification (`svix`)
- **Zustand** for client state (`useTimePeriodStore`, `useNavigationStore`)
- **next-intl** for i18n (`en`, `ja`) + locale-prefixed routes (`/en`, `/ja`)
- **Drizzle ORM** + **Neon Postgres** (`drizzle-orm`, `@neondatabase/serverless`)
- **ExcelJS** for client-side spreadsheet generation
- **date-fns** for date handling

---

## Project structure (high level)

- `app/[locale]/page.tsx` — main step wizard UI
- `stores/`
  - `timePeriodStore.ts` — schedule builder state (dates, holidays, sections, weekly schedule, overrides)
  - `navigationStore.ts` — current step (1–6)
- `app/api/holidays/route.ts` — proxy to Nager.Date public holidays API
- `middleware.ts` (shown as `proxy.ts` in this snippet) — Clerk route protection + locale redirects
- `app/db/`
  - `schema.ts` — Drizzle table definitions
  - `index.ts` — Drizzle + Neon connection

---

## Database schema (Drizzle)

Tables defined in `app/db/schema.ts`:

- `users`
  - keyed by Clerk `user_id`
- `time_period`
  - a saved date range per user
- `courses`
  - course/section names per time period
- `lessons`
  - generated/assigned lessons (date + time slot + lesson number)
- `holidays`
  - holiday dates per time period (`manual` or `api`)

---

## Environment variables

Create a `.env.local` and add (at minimum):

```bash
# Neon / Postgres
DATABASE_URL="postgres://..."

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."

# Clerk webhook signature verification (Svix)
CLERK_WEBHOOK_SIGNING_SECRET="whsec_..."
```
