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
