# Risk Register — Smart Campus Room Availability Checker

Date: 2026-11-19

Scope: main application in `src/`. The `.practice08-bug-a/` directory is a separate intentional exercise, not the main application.

Legend:
- Likelihood (L): 1 (low) – 3 (high)
- Impact (I): 1 (low) – 3 (high)
- Score = L × I
- Status: Confirmed / Plausible-unverified / Unsupported
- Owner for all risks: project author

| ID | Category | Cause / Event / Consequence | Affected component | Evidence | L | I | Score | Status | Mitigation | Owner | Verification method | Residual L×I=score |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| RR1 | Agent operations | Cause: Vitest had no config file and used global discovery. Event: `npm test` picked up `.practice08-bug-a/src/availability.test.ts`. Consequence: `npm test` always failed with exit code 1 even when the main app was correct. | Test runner / CI | Before: `npm test` = 18 tests, 17 passed, 1 failed in `.practice08-bug-a`. `vitest.config.ts` absent. | 3 | 2 | 6 | Confirmed | Added `vitest.config.ts` with `include: ['src/**/*.{test,spec}.?(c|m)[jt]s?(x)']` and `exclude: ['.practice08-bug-a/**']`. | Project author | Run `npm test` and confirm only `src/**` files are discovered. After: 3 files, 28 tests passed. | 1×2=2 |
| RR2 | Agent operations | Cause: `README.md` and `AGENTS.md` were missing from the repo. Event: a new agent or contributor had no access to project scope, acceptance criteria, or commands. Consequence: agent could violate scope — add auth, database, booking, or change the acceptance contract. | Documentation | Glob for `README*` and `AGENTS*` returned empty. Files absent from disk. | 3 | 2 | 6 | Confirmed | `AGENTS.md` added; `README.md` added in this documentation pass. | Project author | Confirm both files exist and contain scope, AC1–AC6, commands, and the NOW boundary note. | 1×2=2 |
| RR3 | Correctness | Cause: timeline preview used `previewStart >= NOW` while the checker rejects `start <= NOW`. Event: at `start === 540` the preview drew a green interval but the checker returned unavailable. Consequence: inconsistent UI feedback. | `src/preview.ts` (formerly inline in `App.tsx`) | Code reading: old `App.tsx` used `>= NOW`; `availability.ts:31` uses `<= NOW`. | 2 | 1 | 2 | Confirmed | `src/preview.ts` (`previewInterval`) requires `start > NOW`, matching the checker. | Project author | `src/preview.test.ts` line 16: `previewInterval('540', '600')` returns `null` — **covered by a test**. The mismatch was confirmed by code reading, not reproduced in the UI. | 1×1=1 |
| RR4 | Maintainability | Cause: minute formatting is duplicated in `App.tsx` (`toHHMM`/`pad2`) and `availability.ts` (`formatMinutes`). Event: a format change requires edits in two places. Consequence: formatting could drift between UI and error messages. | `src/App.tsx`, `src/availability.ts` | Both files define independent minute-to-HH:MM functions. | 1 | 2 | 2 | Confirmed | Still open. Accepted: extracting to a shared `src/time.ts` is possible but not done to keep the change minimal. | Project author | Code inspection. | 1×2=2 (open, accepted) |
| RR5 | Reliability | Cause: no CI pipeline and no automated quality gate. Event: a regression or vulnerability could go unnoticed without manual checks. Consequence: quality degradation. | CI / tooling | No `.github/` directory exists; no CI config. | 2 | 2 | 4 | Plausible-unverified | `npm run audit` script added to `package.json`. CI still absent. | Project author | Confirm `npm run audit` is in `package.json`. CI cannot be verified because no git repo exists. | 2×2=4 (open) |
| RR6 | Security | Cause: dependency audit reports vulnerabilities. Event: before mitigation `npm audit` reported 25 vulnerabilities (2 critical, 14 high), all dev-only except 1 high in production dependencies (`ws` via `@supabase/supabase-js`, which is not imported anywhere in `src`). After mitigation `npm run audit` still reports 1 high severity vulnerability. Consequence: potential exploitability in a production dependency. | `package.json` / dependency tree | `npm run audit` output: 1 high severity vulnerability (`ws`). `@supabase/supabase-js` is not imported in any `src/**` file. | 1 | 2 | 2 | Confirmed (finding); Plausible-unverified (real exploitability — static client app, no server code) | Suggested: remove the unused `@supabase/supabase-js` dependency. Not done in this pass. | Project author | Run `npm run audit`. Confirm `@supabase/supabase-js` is not imported in `src/**`. | 1×2=2 (open) |
| RR7 | Reliability | Cause: claim that "the build is not reproducible." Event: two consecutive builds were compared. Consequence: none — the claim was not substantiated. | Build | Two consecutive builds in the same environment produced identical file hashes. | — | — | — | Unsupported | No mitigation needed. | Project author | Compare build output hashes across two runs. | — |

## Top 2 for action

1. **RR1** (before 6, residual 2) — mitigated by `vitest.config.ts`. `npm test` now passes with 28 tests in 3 files.
2. **RR2** (before 6, residual 2) — mitigated by adding `AGENTS.md` and `README.md`. Project scope and acceptance criteria are now documented on disk.

## Residual risk

After mitigation, the top two risks are reduced from 6 to 2 each. RR3 is reduced from 2 to 1 and is covered by a test. RR4 remains open and accepted (minimal-impact duplication). RR5 remains at 4 because CI is still absent — the `npm run audit` script helps but does not provide an automated gate. RR6 remains at 2: the `ws` vulnerability is in an unused transitive production dependency; real exploitability is plausible but unverified in a static client app with no server code. Removing the unused `@supabase/supabase-js` dependency is the suggested next step. RR7 is unsupported and requires no action. No residual risk is rated above 4.
