# Smart Campus project instructions

## Purpose and scope
One-room availability checker for Room 301, with fictional bookings and a fixed clock. This application checks availability only. Do not add authentication, a backend, a database, network services, or booking creation.

## Structure
- src/App.tsx: React interface, input handling, timeline, feedback and explain button.
- src/availability.ts: pure availability calculation, types and fixed demo constants.
- src/availability.test.ts: Vitest regression tests with fresh booking fixtures.
- src/preview.ts: pure timeline preview interval parser.
- src/preview.test.ts: preview tests.
- src/explanation.ts: explain-availability request/response types, validation, mock adapter, timeout/fallback.
- src/explanation.test.ts: explanation tests.
- vitest.config.ts: Vitest config scoping test discovery to src/** and excluding .practice08-bug-a/**.

## Acceptance criteria
- AC1: reject start >= end and requests in the past.
- AC2: allow durations up to 120 minutes; reject 121 minutes or longer.
- AC3: reject a blocked room.
- AC4: reject true overlaps; allow touching endpoints on both sides.
- AC5: return an availability verdict without modifying booking data.
- AC6: preserve clear feedback and responsive desktop/mobile UI.

The existing implementation also rejects start === NOW (540). Preserve this baseline behavior during refactoring and disclose that it is stricter than the wording of AC1. Do not silently change the acceptance contract.

## Engineering rules
Prefer minimal changes and pure functions. Use at most two justified patterns; choosing none is valid. The existing module boundary is sufficient for separating the checker from React. Do not introduce Strategy for a single policy, Adapter for a single fixture format, Singleton, Factory, or class hierarchies without a concrete need.
Preserve fixed time 540, day end 1440 and booking [600, 660]. Never mutate input arrays or weaken/delete existing assertions. Preserve existing UI during this refactor. Report unrelated issues separately.

- Do not introduce secrets, API keys, tokens, or any credentials into source, config, or environment files.
- Do not add external deploys or publish to hosting platforms; this project runs locally only.
- Treat `.practice08-bug-a/` as a separate intentional exercise. Do not import, test, or modify it from the main application. Test discovery must be scoped to `src/**`.
- Add and maintain `npm audit` as part of dependency hygiene.

## Commands
- npm ci
- npm run dev
- npm test
- npm run typecheck
- npm run lint
- npm run build
- npm run audit

## Workflow and evidence
Read these instructions explicitly before proposing edits; summarize scope and actual commands. Identify one concrete problem, explain the smallest solution and list changed files. Run checks and report actual results, including failures and checks not run. Check desktop and mobile layouts and save screenshots. Do not invent execution output or before/after evidence. Do not assume Bolt automatically loads this file: explicitly provide it in the chat when needed.
