# PRACTICE10_REPORT — Documentation Pass

Date: 2026-11-19

## Baseline (2026-11-10, before mitigations)

- `npm test`: **failed**. 18 tests discovered, 17 passed, 1 failed. The failure was in `.practice08-bug-a/src/availability.test.ts`, picked up because no `vitest.config.ts` scoped test discovery. The main app's own tests were 9/9.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- Missing commands: no format script, no audit script.
- `README.md` and `AGENTS.md` were missing from the repo.

## After mitigations (verified 2026-11-19 outside Bolt)

- `npm test`: **passed**. 3 test files, 28 tests (availability 9, explanation 16, preview 3).
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- `npm run audit`: reports 1 high severity vulnerability.

## Not run

The following were not run and have no recorded results:
- Manual UI check on desktop and mobile.
- Screenshots.
- CI (no git repository, no CI configuration).
- `npm audit fix`.

## Agent-readiness audit

**Level 2 — with gaps.**

- **Level 1 (met with one gap):** linter (`npm run lint`), type check (`npm run typecheck`), unit tests (`npm test`), lockfile (`package-lock.json`) are all present. **Gap:** no formatter (no format script).
- **Level 2 (met):** `AGENTS.md` and `README.md` are present. Architecture notes are in `README.md` and `PRACTICE11.md`. A `.env.example` is not needed because the app uses no environment variables.
- **Level 3 (not met):** no CI, no hooks, no integration checks.

Missing evidence: formatter, CI, UI test, screenshots, resolved audit finding.

## AGENTS.md review

Present and correct: scope (one room, fictional data, no login/database/booking), AC1–AC6, safe commands (`npm ci`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run audit`), no secrets, no deploys, BUG-A excluded, and review gates.

The **Structure section was stale** — it did not list `src/preview.ts`, `src/explanation.ts`, `src/preview.test.ts`, `src/explanation.test.ts`, or `vitest.config.ts`. It was updated in this pass.

Gaps (listed, not added in this pass):
- No explicit forbidden-actions list for destructive commands.
- No branch/worktree rule for background agents.

## Background agent thought experiment

An agent works asynchronously on a separate branch/worktree.

- **May edit:** `src/**`, documentation files, and `vitest.config.ts`.
- **Allowed commands:** `npm ci`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run audit`.
- **Prohibited:** deploys, secrets, new dependencies, changing acceptance criteria, deleting assertions, touching `.practice08-bug-a/`.
- **Required evidence:** diff, real test output, build result, review note.
- **Before merge:** a human reviews the diff and reruns all checks.

## Release decision

**CONDITIONAL.**

Reasons to release: 28/28 tests pass, typecheck passes, lint passes, build passes, and the two top risks (RR1, RR2) are mitigated.

Conditions (owner: project author):
1. Complete the manual desktop/mobile UI check.
2. Decide on the RR6 audit finding — remove the unused `@supabase/supabase-js` dependency or document acceptance.
3. Add CI later.

Remaining uncertainty:
- RR3 was confirmed by code reading, not reproduced in the UI.
- RR6 exploitability is unverified (static client app, no server code).

## Files created or changed in this pass

- `README.md` — created.
- `AGENTS.md` — Structure section updated only.
- `RISK_REGISTER.md` — rewritten as a full register with 7 risks.
- `PRACTICE10_REPORT.md` — created.
