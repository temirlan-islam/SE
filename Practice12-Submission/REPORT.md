# Software Engineering Practice Work #12

**Project:** Smart Campus Room Availability Checker, fictional Room 301  
**Date:** 24 November 2026  
Islam Temirlan  24B031046 

## Scope and baseline

The code-based baseline is the existing Smart Campus React/TypeScript project from Practice #11. Its rule engine uses a fixed `NOW = 540` (09:00), one fictional booking `[600, 660)` (10:00-11:00), a maximum duration of 120 minutes, and a day end of 1440. The original rule engine was copied without changes. Before Practice #12 work, 28 tests passed. The new eight-case acceptance suite raises the total to 36 passing tests; typecheck, lint and build pass. The previously published code-based demo is [here](https://smart-campus-room-av-dotd.bolt.host/), but this run did not verify that the live deployment matches the local copy. Existing Practice #11 UI screenshots are included only as baseline evidence.

## Shared story and contract

**Story:** As a student, I enter a future start minute and a duration for Room 301, optionally mark the room blocked, and immediately see whether the room is available and why, without making a booking.

Inputs: start (whole minutes after midnight), duration (whole minutes), blocked (boolean), fictional bookings `[[600,660]]`. Code-based UI accepts an end minute, from which duration is calculated; the low-code form accepts duration directly. Outputs: availability boolean, reason code and visible message. A validation failure is represented by `isAvailable=false` with an `INVALID_*`, `PAST_START` or `DAY_END` reason. No booking is written.

Acceptance criteria: AC1 start strictly after 09:00; AC2 duration 1-120 minutes; AC3 overlap unavailable; AC4 blocked unavailable; AC5 clear result without altering bookings; AC6 invalid input gets clear feedback. At 11:00 the existing 10:00-11:00 booking has ended, so adjacency is allowed.

## Implementations

**Code-based:** `code-based/src/availability.ts` is the unchanged deterministic rule engine. `code-based/src/App.tsx` handles validation and display. `code-based/src/practice12.test.ts` adds the eight shared cases. The app is responsive through the existing Tailwind layout.

**Low-code:** `low-code/index.html` is a local visual form/workflow editor. `low-code/config.json` defines the fields, labels, limits, booking and messages. The generic `low-code/engine.mjs` interprets that configuration; `low-code/test.mjs` runs the same cases. `low-code/standalone.html` embeds the same configuration and engine for direct browser use. The form and configuration controls render from JSON, and the user can change the booking and limits visually. This is a **custom local low-code prototype**, not an Appsmith/Budibase/Power Apps project. It has no hosted project link, platform account or connector. This distinction matters when comparing platform capabilities.

## Common eight-case test table

The table reports actual automated test assertions, not claimed manual browser observations. Both suites passed on this date.

| Case | Input: start, duration, blocked | Expected | Code-based observed | Low-code observed |
|---|---|---|---|---|
| T1 free | 660, 60, false | Available | Available | AVAILABLE |
| T2 overlap | 630, 60, false | Unavailable, overlap | Unavailable, overlap | OVERLAP |
| T3 blocked | 660, 60, true | Unavailable, blocked | Unavailable, blocked | BLOCKED |
| T4 zero duration | 660, 0, false | Validation error | End must follow start | INVALID_DURATION |
| T5 121 minutes | 660, 121, false | Validation error | Maximum duration exceeded | INVALID_DURATION |
| T6 start at now | 540, 60, false | Validation error | Start must be later than now | PAST_START |
| T7 adjacent | 660, 30, false | Available | Available | AVAILABLE |
| T8 all checks | booking data | Unchanged | Unchanged | Unchanged |

Code-based check log: 36/36 tests, typecheck passed, lint passed, Vite build passed (1571 transformed modules). Low-code check log: 8/8 cases passed with `node low-code/test.mjs`. These are reproducible by running `npm ci && npm test && npm run typecheck && npm run lint && npm run build` in `code-based`, and `node test.mjs` in `low-code`.

## Engineering comparison

| Criterion | Code-based | Local low-code prototype |
|---|---|---|
| Functional tests | 8/8 shared; 36/36 total | 8/8 shared |
| Setup / implementation / debugging / testing time | Not timed; no measured minutes claimed | Not timed; no measured minutes claimed |
| Customization | Full source and UI control; changes require code review | Limits, booking and fields are JSON-driven; workflow order requires interpreter changes |
| Security controls | React escapes displayed text; no login or server data | Uses `textContent` for results and editor output; no connectors or credentials |
| Versioning / portability | Source and tests export as a normal Vite project | HTML, JSON and JS files export directly; no third-party platform features demonstrated |
| Ongoing cost | No paid service required for local run; hosting terms not assessed | No paid service required locally; hosting not provided |
| Unresolved defects | No failing automated checks; published demo's available/Explain path verified | No failing automated checks; available path verified in Chrome, configuration editing not manually tested |

**Recommendation:** Keep the code-based project for this checker. It already exists, has stronger regression coverage, and its rules and changes are easy to review in version control. The custom low-code prototype is useful for changing demo facts in a form, but does not establish that a commercial low-code platform meets the course's hosting, export or collaboration needs. This recommendation is based on observed tests and artifact structure, not measured development speed.

## Security checklist

- Input: both implementations reject empty, fractional, past, zero and excessive duration values at the rule boundary; the low-code editor additionally validates configuration limits.
- XSS: React renders text safely; the local builder writes untrusted result and configuration text with `textContent`, not `innerHTML`.
- Booking data: static fictional intervals; checks do not mutate them. No real names, authentication, payment or production database.
- Permissions / secrets: no API keys or connectors were added. The local builder makes no external request except loading its local JSON and JS files. Hosting account permissions and public sharing settings were not accessible for verification.
- Dependencies: the code-based app has npm dependencies and needs regular SCA review; the low-code prototype uses browser APIs only. No dependency vulnerability scan was run, so no claim of zero vulnerabilities is made.
- Runtime: automated rule checks were run; no active scan of Bolt or other third-party services was performed. Browser checks confirmed the published code-based available/Explain path and the local low-code available path. Other paths were verified by automated tests.

## AI use and submission note

Codex (GPT-6 series) assisted with interpreting the slides, creating the local low-code prototype and test/report artifacts. The output was checked using actual commands; AI-generated prose was not treated as proof of test success. The PDF labels the work Practice #12 throughout, but its final email instruction says Practice #13; confirm the subject number with the instructor. The PDF also asks for a public repository and screenshots of both implementations, and says not to submit ZIP files. Screenshots of both interfaces are included. Repository destination: https://github.com/temirlan-islam/SE (verify the Practice12-Submission folder is visible after upload). A hosted low-code deployment and email have not been created.
