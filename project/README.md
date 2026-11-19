# Smart Campus Room Availability Checker

A one-room availability checker for **Room 301**. The app checks whether a requested time interval is available against a single fictional booking. It does **not** create, modify, or confirm bookings.

## Purpose

- One fictional room: Room 301.
- One fixed existing booking: `[600, 660]` (10:00–11:00).
- Fixed clock: `NOW = 540` (09:00). Day end: `1440` (24:00). Max duration: `120` minutes.
- No login, no database, no network services, no booking creation.
- Local only — no external deploys or hosting.

### Note on the NOW boundary

The checker rejects `start <= NOW`, meaning `start === 540` (09:00 exactly) is rejected. This is **stricter than the wording of AC1**, which says "reject requests in the past." This stricter baseline is intentional and preserved.

## Folder layout

```
src/
  App.tsx              — React interface, input handling, timeline, feedback, explain button
  availability.ts      — pure availability calculation, types, fixed demo constants
  availability.test.ts — Vitest regression tests (9 tests)
  preview.ts           — pure timeline preview interval parser
  preview.test.ts      — preview tests (3 tests)
  explanation.ts       — explain-availability request/response types, validation, mock adapter, timeout/fallback
  explanation.test.ts  — explanation tests (16 tests)
vitest.config.ts       — Vitest config: include src/**, exclude .practice08-bug-a/**
AGENTS.md              — project instructions, scope, acceptance criteria, engineering rules
RISK_REGISTER.md       — risk register with 7 risks
PRACTICE10_REPORT.md   — Practice 10 documentation pass report
PRACTICE11.md          — Practice 11 explain-availability report
.practice08-bug-a/     — separate intentional exercise, not part of this application
```

## Setup

```bash
npm ci
```

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm test` | Run Vitest (scoped to `src/**` via `vitest.config.ts`) |
| `npm run typecheck` | Run `tsc --noEmit` |
| `npm run lint` | Run ESLint |
| `npm run build` | Build for production |
| `npm run audit` | Run `npm audit --omit=dev` |

## Acceptance criteria

- **AC1**: reject `start >= end` and requests in the past.
- **AC2**: allow durations up to 120 minutes; reject 121 minutes or longer.
- **AC3**: reject a blocked room.
- **AC4**: reject true overlaps; allow touching endpoints on both sides.
- **AC5**: return an availability verdict without modifying booking data.
- **AC6**: preserve clear feedback and responsive desktop/mobile UI.
