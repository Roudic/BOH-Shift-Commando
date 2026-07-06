# BOH Shift Commando

ConnectTeam-style schedule builder and validator for Chick-fil-A Vestavia Hills BOH (#03339). Draft Mon–Sat schedules, auto-validate CFA rules, and export for HotSchedules entry.

## Features

- **Mon–Sat week grid** with tap-to-cycle shift pills and long-press picker
- **CFA-specific validation**: hour caps, closer floors, 1:30 PM opener coverage, daily/weekly budget
- **Suggest Week** auto-fill respecting roster constraints
- **Coverage panel** with hourly headcount bars
- **Director PIN** (default: `03339`) for edit access; read-only team view
- **Export** CSV and Slack-ready summary
- **Templates** and JSON backup/restore
- **Offline** after first load via localStorage

## Quick start

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

## Live demo (GitHub Pages)

After merging to `main` and enabling Pages, the app is at:

**https://roudic.github.io/BOH-Shift-Commando/**

### One-time GitHub setup

1. Open the repo on GitHub → **Settings** → **Pages**
2. Under **Build and deployment**, set **Source** to **GitHub Actions**
3. Merge [PR #1](https://github.com/Roudic/BOH-Shift-Commando/pull/1) into `main` (or push `main` with this code)
4. The deploy workflow runs automatically; refresh Pages after ~1–2 minutes

On iPad/iPhone: open the URL in Safari → **Share** → **Add to Home Screen** for an app-like shortcut.

## See it on your computer now

```bash
git clone https://github.com/Roudic/BOH-Shift-Commando.git
cd BOH-Shift-Commando
git checkout cursor/cfa-schedule-builder-e0d2
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

### Same Wi‑Fi as your phone

```bash
npm run dev -- --host
```

Then on your phone (same network), open **http://YOUR-COMPUTER-IP:5173** (e.g. `http://192.168.1.50:5173`).

## Workflow

1. Enter team availability in HotSchedules
2. Draft schedule here (or tap **Suggest Week**)
3. Fix validation flags
4. Export CSV / copy Slack summary
5. Enter approved schedule into HotSchedules

## Default PIN

Director PIN defaults to `03339` (store number). Change in Settings.

## Tech stack

Vite + React + TypeScript + Tailwind CSS. See [CONTEXT.md](./CONTEXT.md) for store rules and design language.
