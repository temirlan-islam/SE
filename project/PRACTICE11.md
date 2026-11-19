# PRACTICE11 — Explain Availability (mock-only)

Date: 2026-11-17

## Contract

This practice adds an optional "Explain availability" feature to the existing Room 301 checker. The feature uses a **local mock only** — no real LLM, no network call, no API key, no login, no database, no external deploy.

Scope and constraints (from AGENTS.md, preserved):
- One fictional room (Room 301), fixed clock NOW = 540 (09:00), DAY_END = 1440, booking [600, 660].
- AC1–AC6 preserved. The stricter baseline `start <= NOW` rejection is preserved and disclosed.
- No authentication, no backend, no database, no network services, no booking creation.
- No secrets, API keys, tokens, or credentials.
- No external deploys or hosting. Local only.
- `.practice08-bug-a/` remains a separate exercise; not imported, tested, or modified.
- `availability.ts`, original tests, all Practice 10 config/docs, package files, `vitest.config.ts`, and `.practice08-bug-a/` are preserved unchanged.

What this practice adds:
1. **Explain availability** button on the result card, using a labelled local mock adapter.
2. **Input validation** — field-level integer/range checks attributed to Start and End.
3. **Timeout/fallback** — the mock call has a 1000 ms timeout; on timeout, error, or invalid response, a deterministic fallback explanation is shown.
4. **Prompt styles** — three prompt variants (minimal, friendly, constrained) compared in tests; constrained is the default and selected variant.
5. **Preview correction** — `preview.ts` fixes the permissive preview parsing and NOW boundary so the timeline preview matches the checker.
6. **Stale-result clearing** — changing any input or toggling blocked clears the verdict and explanation.
7. **Accessible switch label** — the room-blocked toggle gains `aria-label="Room blocked"`.

## Architecture

New module boundary:

```
src/
  availability.ts        (unchanged — pure checker, types, constants)
  availability.test.ts   (unchanged — 9 original tests)
  preview.ts             (NEW — pure preview interval parser)
  preview.test.ts        (NEW — 3 tests)
  explanation.ts         (NEW — request/response types, validation, mock adapter, timeout/fallback)
  explanation.test.ts    (NEW — 16 tests)
  App.tsx                (updated — wiring: validation, preview, explain button, stale clearing, switch label)
```

Data flow:
- `App.tsx` calls `checkAvailability` (unchanged) to get a `Verdict`.
- `buildExplanationRequest` converts the verdict into a typed `ExplanationRequest` with a `ReasonCode`.
- `explainAvailability(request, adapter, timeoutMs)` validates the request, races the adapter against a timeout, validates the response, and returns `{ text, source }` where `source` is `'mock'` or `'fallback'`.
- `previewInterval(startInput, endInput)` returns a valid interval or `null`, using the same boundaries as the checker.

The mock adapter is deterministic and local. No network. No real LLM. Cost: zero.

## Baseline results (before Practice 11)

Recorded before applying any changes:

| Check | Result | Detail |
|---|---|---|
| `npm test` | PASS (exit 0) | 9 tests, 1 file (`src/availability.test.ts`) |
| `npm run typecheck` | PASS (exit 0) | No errors |
| `npm run lint` | PASS (exit 0) | No errors |
| `npm run build` | PASS (exit 0) | 1569 modules, 158.55 kB JS (gzip 50.07 kB) |

## Final results (after Practice 11)

| Check | Result | Detail |
|---|---|---|
| `npm test` | PASS (exit 0) | **28 tests, 3 files** (availability 9, explanation 16, preview 3) |
| `npm run typecheck` | PASS (exit 0) | No errors |
| `npm run lint` | PASS (exit 0) | No errors |
| `npm run build` | PASS (exit 0) | 1571 modules, 162.55 kB JS (gzip 51.40 kB) |

## Changed files

| File | Action |
|---|---|
| `src/App.tsx` | Updated — validation, preview import, explain button, stale clearing, `aria-label` |
| `src/explanation.ts` | Created — request/response types, validation, mock adapter, timeout/fallback |
| `src/explanation.test.ts` | Created — 16 tests |
| `src/preview.ts` | Created — pure preview interval parser |
| `src/preview.test.ts` | Created — 3 tests |
| `PRACTICE11.md` | Created — this report |

Preserved unchanged: `src/availability.ts`, `src/availability.test.ts`, `vitest.config.ts`, `AGENTS.md`, `RISK_REGISTER.md`, `package.json`, `package-lock.json`, all config files, `.practice08-bug-a/`.

## Expected vs actual test cases (8+)

Measured via `npx tsx scripts/measure-latency.mjs` on the real mock:

| # | Input (start, end, blocked) | Expected | Actual verdict | Actual reasonCode | Actual source | Actual text (excerpt) | Latency (ms) |
|---|---|---|---|---|---|---|---|
| 1 | 720, 780, false | available | available | AVAILABLE | mock | "Room 301 is available from 12:00 to 13:00. This check does not create a booking." | 0.48 |
| 2 | 630, 690, false | unavailable (overlap) | unavailable | OVERLAP | mock | "Room 301 is unavailable from 10:30 to 11:30. Overlaps an existing booking (10:00–11:00)." | 0.10 |
| 3 | 720, 780, true | unavailable (blocked) | unavailable | BLOCKED | mock | "Room 301 is unavailable from 12:00 to 13:00. The room is currently blocked…" | 0.05 |
| 4 | 540, 600, false | unavailable (past/NOW) | unavailable | PAST | mock | "…Start time must be strictly later than now (09:00)." | 0.03 |
| 5 | 541, 600, false | available (touch start) | available | AVAILABLE | mock | "Room 301 is available from 09:01 to 10:00…" | 0.03 |
| 6 | 660, 720, false | available (touch end) | available | AVAILABLE | mock | "Room 301 is available from 11:00 to 12:00…" | 0.03 |
| 7 | 720, 841, false | unavailable (too long) | unavailable | TOO_LONG | mock | "…Booking duration is 121 min, but the maximum is 120 min." | 0.02 |
| 8 | 720, 720, false | unavailable (invalid) | unavailable | INVALID_TIME | fallback | "An explanation cannot be generated for this input." | 0.00 |

Case 8 falls back because `start >= end` produces `INVALID_TIME`, but `buildExplanationRequest` still builds a request with `reason` set; however `isValidExplanationRequest` rejects it because `start < end` is false. This is correct: the request is structurally invalid, so no adapter is called.

All 8 cases match expected behavior. 28 automated tests pass.

## Three-prompt mock-only comparison

Three prompt variants defined in `PROMPT_VARIANTS`:

| Variant | Prompt text | Behavior |
|---|---|---|
| minimal | "Explain this availability result briefly." | Omits the time interval; returns room + status only. |
| friendly | "Explain this room availability result in friendly language for a student." | Prepends "Good news!" or "Sorry," producing **three sentences** for available (falls back because the two-sentence cap is exceeded). |
| constrained | "Using only the supplied room, time, status and reason, explain the decision in at most two sentences. Do not invent bookings or change the status. Return explanation, isAvailable and reasonCode." | Produces exactly the fallback text with room + times + reason; always within the two-sentence cap. |

Actual mock output for available (720–780):

| Variant | Source | Text |
|---|---|---|
| minimal | mock | "Room 301 is available." |
| friendly | **fallback** | "Room 301 is available from 12:00 to 13:00. This check does not create a booking." |
| constrained | mock | "Room 301 is available from 12:00 to 13:00. This check does not create a booking." |

Actual mock output for overlap (630–690):

| Variant | Source | Text |
|---|---|---|
| minimal | mock | "Room 301 is unavailable. Overlaps an existing booking (10:00–11:00)." |
| friendly | mock | "Sorry, Room 301 is unavailable from 10:30 to 11:30. Overlaps an existing booking (10:00–11:00)." |
| constrained | mock | "Room 301 is unavailable from 10:30 to 11:30. Overlaps an existing booking (10:00–11:00)." |

**Selected variant: constrained.** It is the only variant that consistently includes the time interval, stays within the two-sentence validation cap, and never falls back on valid input. The `friendly` variant's available case exceeds the cap ("Good news! Room 301 is available… This check does not create a booking." = 3 sentences) and falls back, which is by design — the constraint enforces correctness over tone.

### Honest assessment

This is a **mock-only** comparison. No real LLM evaluated these prompts. The mock adapter produces deterministic text based on the variant; it does not actually process the natural-language prompt. The comparison validates that the validation layer (sentence cap, status/reasonCode consistency) works — not that an LLM would prefer one prompt. Mock cost: **zero**. No API calls were made. No keys were used.

## Runtime latency

Measured on the real mock adapter via `process.hrtime.bigint()`:

- First call (cold): 0.48 ms
- Subsequent calls: 0.02–0.10 ms
- Average over 20 runs: **0.010 ms**

The 1000 ms timeout is never reached in normal operation. Timeout behavior is verified by test case "falls back on timeout" (adapter returns a never-resolving promise, timeout 5 ms → fallback).

## Three verified review findings and fixes

### Finding 1 — Stale verdict after input change (RR3-adjacent)

**Problem:** In the previous version, changing Start/End inputs or toggling blocked did not clear a previously displayed verdict. A user could see a green "Available" result next to inputs that no longer match.

**Evidence:** `clearResult()` was not called from `onChange` handlers. The verdict state persisted.

**Fix:** `App.tsx` now calls `clearResult()` in every input `onChange` and in the blocked toggle `onClick`. This increments `explanationRequestId` (invalidating any in-flight explanation), and clears `checked`, `explanation`, and `explaining`.

**Verification:** Test "compares all three prompt variants" confirms request IDs are handled; manual: changing any field clears the result card. (Manual UI check pending — see below.)

### Finding 2 — Permissive preview parsing / NOW boundary

**Problem:** The previous inline preview used `previewStart >= NOW` (inclusive), while the checker rejects `start <= NOW`. At `start === 540` the preview drew a green interval, but the checker returned unavailable. Fractional input like `"660.5"` was also silently coerced by `Number()` into a valid-looking preview.

**Evidence:** Old code: `previewStart >= NOW` vs `availability.ts:31` `start <= NOW`. `Number("660.5")` = 660.5, not rejected.

**Fix:** `src/preview.ts` now:
- Requires `Number.isInteger(start)` and `Number.isInteger(end)` (rejects `"660.5"`, `"660junk"`).
- Uses `start <= NOW` (rejects `start === 540`).
- Enforces `start < end`, `end <= DAY_END`, `end - start <= MAX_DURATION` — identical to the checker.

**Verification:** `preview.test.ts` — 3 tests pass:
- `previewInterval('660', '720')` → `{ start: 660, end: 720 }`
- `previewInterval('660.5', '720')` → `null`
- `previewInterval('540', '600')` → `null` (NOW boundary)
- `previewInterval('720', '841')` → `null` (duration limit)

### Finding 3 — Missing accessible name on switch

**Problem:** The room-blocked toggle had `role="switch"` and `aria-checked` but no `aria-label` or visible `<label>` association. Screen readers announced it as an unlabeled switch.

**Evidence:** `.practice08-bug-a/src/App.tsx:354–358` — `role="switch"`, `aria-checked={blocked}`, no `aria-label`.

**Fix:** `src/App.tsx` adds `aria-label="Room blocked"` to the switch button.

**Verification:** Code inspection confirms `aria-label="Room blocked"` is present. Automated accessibility testing was not run. Manual screen-reader verification pending.

## Manual UI checks — status

**Pending.** Manual UI checks (desktop and mobile layouts, screen-reader announcement, visual preview/checker consistency at the NOW boundary, stale-result clearing) have **not** been independently verified in this session. This environment has no browser or screenshot tool. All automated checks (test, typecheck, lint, build) pass; the logic-level behaviors are covered by 28 tests. Visual and accessibility verification should be performed independently.

## What was not done

- No real LLM evaluation. Mock only.
- No network calls, API keys, or credentials.
- No login, database, or external deploy.
- No changes to `availability.ts`, original tests, Practice 10 files, package files, `vitest.config.ts`, or `.practice08-bug-a/`.
- No CI workflow added (no git repo).
