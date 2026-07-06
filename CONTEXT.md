# BOH Master Context — CFA Vestavia Hills (#03339)

> **Purpose:** Drop this file into any Cursor project as `CONTEXT.md`. It contains all standing rules, constraints, and design language for building BOH tools for this store. Every app built against this doc should follow these rules without re-asking.

---

## 1. Store & Role Context

- **Store:** Chick-fil-A Vestavia Hills, #03339, 513 Montgomery Hwy, Birmingham, AL
- **Owner of this doc:** Josh — BOH Director. Owns food safety, labor, inventory, catering, training, drive-thru performance.
- **Key people:** Caleb (Operator), Rodney & Amanda (above-store), Cam (BOH Supervisor — being developed to hold BOH standards independently), Nikki (breakfast shift lead), Justin (SL, closer group), Maddie & Carson (SL breakfast/mid coverage).
- **Store is closed Sundays. Always. Never schedule Sunday.**

---

## 2. Design Language (non-negotiable for every app)

- **Dark mode only.** Background near-black (`#0d0d0f` or similar).
- **Accent:** Chick-fil-A red `#E51636`. Daypart accent shifting allowed (Command Hub "Daypart Pulse" pattern).
- **iPad-first.** Big touch targets, no hover-dependent UI, works in Safari.
- **Single-file HTML** for lightweight tools (no external deps, no CDN). For Cursor builds: Vite + React + TypeScript + Tailwind, static build, works offline.
- **localStorage** persistence for v1 tools. No backend unless the spec says so.
- **Role-based PIN access** where the tool has Director vs Trainer vs Team Member views.
- **Bilingual EN/ES** where training-facing.
- No chart libraries — hand-built SVG/div bars.

---

## 3. Scheduling & Shift Setup Rules (THE CORE)

### 3.1 Hour caps
| Role | Weekly cap |
|---|---|
| Shift Lead (SL) | 45 hrs |
| Team Member (TM) | 42 hrs |

- Two days off per week per person, rotated to avoid coverage gaps.
- Sunday off for everyone (store closed).

### 3.2 Standard shift blocks
**Closers (all end 11:00 PM):**
- `2:00 PM – 11:00 PM` = 9 hrs (full close)
- `4:00 PM – 11:00 PM` = 7 hrs (short close — use to manage hours under cap)

**Openers:**
- `5:00 AM – 1:00 PM` = 8 hrs (standard open)
- `5:00 AM – 2:00 PM` = 9 hrs (staggered — used on select days to cover the 1–2 PM window)

### 3.3 Coverage floors
- **Closers per night:** goal is **4 every night**. Hard rules from leadership planning: 3 closers acceptable Mon/Tue; **4 required Fri/Sat**. Wednesday is the busiest close night — target 4–5, all hands.
- **Openers, 1:00–2:00 PM window:** minimum **3 openers still on the clock** daily. This is why some openers stagger to 5a–2p.
- Saturday close is the historical weak spot (has dipped to 3). Any schedule builder should **flag Saturday closer count < 4 in red**.

### 3.4 Current roster constraints (example data — make editable, don't hardcode)
**Close crew:**
- **Cam (SL):** closes every night, off Thursday. Hours tracked on a separate SL schedule.
- **Justin (SL/TM hybrid):** TM most nights, acts as SL Thursdays (Cam's off day), off Saturday, ~43 hrs.
- **Axel (TM):** off Tuesday, ~41 hrs.
- **DM (TM):** off Monday, ~43 hrs.
- **Gill (TM):** off Friday + Saturday, ~34 hrs. Does not work Friday nights.

**Open crew:** Darius, Ale, Michael, Fletcher, Cordell.
- Cordell always ends at 1 PM; off Sat.
- Michael works Mon–Fri only (Sat is a firm off day).
- Fletcher off Mon + Fri.
- Darius can take a short 5a–11a (6 hr) day to shave hours.

**SL breakfast/mid grid:** Nikki (breakfast only, 3 days, no Saturday), Maddie (breakfast + mid, off Monday), Carson (breakfast + mid, off Wed + Sat). Split roles so there are zero SL coverage gaps across all six days.

### 3.5 Scheduling workflow (how tools should fit in)
1. Schedule starts in **HotSchedules** from availability. Tools do NOT replace HotSchedules.
2. Tools **validate** the draft: total hours vs budget, closer counts per night, opener coverage 1–2 PM, per-person cap check.
3. Output flags problems BEFORE publish: over-cap people, under-covered nights, over-budget days.
4. Team members **float between stations** (Truck, Breading, Centerline, Prep, Expo, Dishes) — so coverage logic = **total bodies clocked in per hour**, not per-position assignment. Any coverage chart should be an hourly headcount bar vs a peak target, not a station grid.

---

## 4. Labor Math (bake into every calculator)

| Metric | Value |
|---|---|
| Weekly sales forecast | ~$140,000 |
| Productivity / SPLH goal | **$81.50 per labor hour** |
| Weekly hour budget | ~**1,850 hrs** (includes ~110-hr break/early-send buffer) |
| Daily hour target | **< 400 hrs/day** |
| Historical overage | ~250 hrs/week over budget (the problem being fixed) |
| Close-shift productivity goal | **$80 SPLH on close shifts** |
| Current monthly productivity | ~$71 (without catering) |

**Formulas:**
- `Weekly hour budget = weekly forecast ÷ SPLH goal + buffer`
- `Target sales per day (close) = close labor hours × $80`
- `Actual SPLH = actual sales ÷ labor hours` → green if ≥ goal, red if below
- Daypart split: directors divide the 1,850 weekly hours across breakfast/lunch/dinner with **realistic** numbers; front half of week runs strong, Thursday/weekend lighter.
- SPLH goal must be **editable in one place** and cascade everywhere.

---

## 5. Drive-Thru Throughput (standing goal)

- **Goal:** 150 → **160 cars per hour (CPH)** sustained.
- **The math:** 160 CPH = 40 cars per 15-min block = **one departure every 22.5 seconds**. Current window departure ≈ **28 seconds**.
- **Root cause:** window departure *decision lag* — the gap between recognizing a car should pull forward and actually calling it. Not staffing, not equipment.
- **Fixes in play:** make pull-forward a rule not a judgment call, window person empowered to call it solo, visual cue instead of verbal confirm over headset.
- **Data tool:** "Drive-Thru Pulse" tap-timer app (separate spec exists: three screens — Home/Session Start, Live Session, Session Report; localStorage; FLAG button for lag causes; CSV export; Slack-ready summary for #vestaviaboh; breakfast rush window 6:30a–10:30a; 15-min blocks anchored to clock time).

---

## 6. Tool Suite — Built & Planned

### Built (single-file HTML, iPad, localStorage)
1. **BOH Command Hub v2** — merged app: Opening Setup, Training Tracker, Speed Test, Closing Leader Eval, Labor Calculator. "Daypart Pulse" live header shifts accent color by daypart.
2. **BOH Elite Training Tracker** — bilingual EN/ES, 8 stations, 4 certification days, PIN-gated roles (Director/Trainer/Trainee).
3. **Opening Kitchen Setup** — time blocks × five zones: Truck, Biscuit, Centerline, Prep, Breading.
4. **Closing Director Checklist.**
5. **Labor/SPLH Calculator + Shift Builder** — weekly budget calc, daily 400-hr flag, daypart split slider, shift entry (name/start/end) with running hours tally and hourly headcount coverage bars.
6. **Catering production tools** — batch-block organizers, checklists.
7. **Weekly close schedule + productivity tracker** (Excel) — color-coded schedule sheet + $80 SPLH close tracker with per-person sales contribution needed.

### Planned / next builds (Cursor targets)
1. **Drive-Thru Pulse** — the tap-timer (spec already written; ship first).
2. **Command Hub v3** — real backend (SQLite + tiny Node server, or Supabase free tier) so training data, temp logs, and PIN access **sync across all store iPads** instead of one-device localStorage.
3. **HotSchedules Labor Auditor** — paste the weekly schedule export; it auto-checks against the $81.50 SPLH budget, flags over-budget dayparts, closer-count gaps by night, over-cap individuals, and Saturday close risk — before it ever goes to leadership.
4. **Schedule Builder/Validator** — takes roster + constraints from §3, generates or validates a Mon–Sat grid: shift pills (SL/TM/OFF), per-person weekly hour totals vs caps, closer-count row per night with red flag under floor, 1–2 PM opener coverage check.

---

## 7. Quality Bar for Any Build

- Zero perceptible lag on primary interactions (taps, edits).
- Fully offline after first load.
- Survives long sessions (3+ hrs, 400+ data points) without crashes.
- Undo flows must keep counts correct.
- All goals/targets editable — never hardcode $81.50, $80, 400, or roster names as constants the user can't change.
- Every export should have two flavors where relevant: **CSV** (data) and **Slack-ready plain text** (summary for #vestaviaboh).

---

*Last updated: July 2026. Owner: Josh, BOH Director. If a spec in a project conflicts with this doc, the project spec wins — this is the default context layer.*
