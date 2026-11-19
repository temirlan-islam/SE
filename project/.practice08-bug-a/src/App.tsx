import { useMemo, useState } from 'react';
import {
  DoorOpen,
  Clock,
  CalendarRange,
  Ban,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Info,
} from 'lucide-react';
import {
  checkAvailability,
  DAY_END,
  EXISTING_BOOKINGS,
  MAX_DURATION,
  NOW,
  type Minutes,
  type Verdict,
} from '@/availability';

const ROOM_NAME = 'Room 301';

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

function toHHMM(min: Minutes): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${pad2(h)}:${pad2(m)}`;
}


export default function App() {
  const [startInput, setStartInput] = useState<string>('660'); // 11:00 default
  const [endInput, setEndInput] = useState<string>('720'); // 12:00 default
  const [blocked, setBlocked] = useState<boolean>(false);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [endError, setEndError] = useState<string | null>(null);

  const timelineHours = useMemo(() => {
    // Render a visual timeline from NOW (09:00) to 24:00.
    const hours: Minutes[] = [];
    for (let h = Math.ceil(NOW / 60); h <= 24; h++) hours.push(h * 60);
    return hours;
  }, []);

  const handleCheck = () => {
    setStartError(null);
    setEndError(null);

    const startRaw = startInput.trim();
    const endRaw = endInput.trim();

    // Field-level validation: integers and range, attributed to the right field.
    const startNum = Number(startRaw);
    const endNum = Number(endRaw);
    const startIsInt = startRaw !== '' && Number.isInteger(startNum);
    const endIsInt = endRaw !== '' && Number.isInteger(endNum);

    let hasFieldError = false;

    if (!startIsInt) {
      setStartError('Start must be a whole number of minutes.');
      hasFieldError = true;
    } else if (startNum < 0 || startNum > DAY_END) {
      setStartError(`Start must be between 0 and ${DAY_END}.`);
      hasFieldError = true;
    }

    if (!endIsInt) {
      setEndError('End must be a whole number of minutes.');
      hasFieldError = true;
    } else if (endNum < 0 || endNum > DAY_END) {
      setEndError(`End must be between 0 and ${DAY_END}.`);
      hasFieldError = true;
    }

    if (hasFieldError) {
      setVerdict(null);
      return;
    }

    const start = startNum as Minutes;
    const end = endNum as Minutes;

    // AC1 continuation: ordering and "after now" rules.
    if (start >= end) {
      setEndError('End must be greater than Start.');
      setVerdict(null);
      return;
    }
    if (start <= NOW) {
      setStartError(`Start must be later than now (${toHHMM(NOW)}).`);
      setVerdict(null);
      return;
    }

    setVerdict(checkAvailability(start, end, blocked));
  };

  const handleReset = () => {
    setStartInput('660');
    setEndInput('720');
    setBlocked(false);
    setVerdict(null);
    setStartError(null);
    setEndError(null);
  };

  // Preview the requested interval on the timeline (if valid numbers).
  const previewStart = parseInt(startInput, 10);
  const previewEnd = parseInt(endInput, 10);
  const previewValid =
    Number.isInteger(previewStart) &&
    Number.isInteger(previewEnd) &&
    previewStart >= NOW &&
    previewStart < previewEnd &&
    previewEnd <= DAY_END;

  const timelineMin = NOW;
  const timelineMax = DAY_END;
  const span = timelineMax - timelineMin;

  const pct = (min: Minutes) =>
    ((Math.min(Math.max(min, timelineMin), timelineMax) - timelineMin) / span) * 100;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <DoorOpen className="h-6 w-6" strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Smart Campus Room Availability Checker
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {ROOM_NAME} · Check only — no bookings are created.
              </p>
            </div>
          </div>
        </header>

        {/* Status card */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                <Clock className="h-4 w-4" /> Now
              </div>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {toHHMM(NOW)}
                <span className="ml-1 text-xs font-normal text-slate-400">
                  ({NOW} min)
                </span>
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                <CalendarRange className="h-4 w-4" /> Max duration
              </div>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {MAX_DURATION} min
              </p>
            </div>
            <div className="col-span-2 rounded-xl bg-slate-50 p-3 sm:col-span-1">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                <Ban className="h-4 w-4" /> Room status
              </div>
              <p
                className={`mt-1 text-lg font-semibold ${
                  blocked ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {blocked ? 'Blocked' : 'Open'}
              </p>
            </div>
          </div>

          {/* Existing bookings */}
          <div className="mt-4 rounded-xl border border-slate-200 p-3">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Existing bookings (fixed sample)
            </div>
            <ul className="mt-2 space-y-1.5">
              {EXISTING_BOOKINGS.map(([s, e], i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-amber-900">Booking #{i + 1}</span>
                  <span className="tabular-nums text-amber-800">
                    {toHHMM(s)} – {toHHMM(e)}
                    <span className="ml-1 text-xs text-amber-600">({s}–{e})</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Timeline */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
            <CalendarRange className="h-4 w-4 text-slate-400" />
            Today's timeline
          </div>
          <div className="relative h-16">
            {/* Track */}
            <div className="absolute inset-x-0 top-7 h-3 rounded-full bg-slate-100" />
            {/* "Now" marker */}
            <div
              className="absolute top-6 z-20 flex flex-col items-center"
              style={{ left: `calc(${pct(NOW)}% - 1px)` }}
            >
              <div className="h-5 w-0.5 bg-slate-400" />
              <span className="mt-0.5 text-[10px] font-medium text-slate-500">now</span>
            </div>
            {/* Existing bookings */}
            {EXISTING_BOOKINGS.map(([s, e], i) => (
              <div
                key={i}
                className="absolute top-7 z-10 h-3 rounded-full bg-amber-400"
                style={{ left: `${pct(s)}%`, width: `${pct(e) - pct(s)}%` }}
                title={`Booking ${i + 1}: ${toHHMM(s)}–${toHHMM(e)}`}
              />
            ))}
            {/* Preview interval */}
            {previewValid && (
              <div
                className="absolute top-7 z-10 h-3 rounded-full border-2 border-emerald-500 bg-emerald-200/60"
                style={{
                  left: `${pct(previewStart)}%`,
                  width: `${pct(previewEnd) - pct(previewStart)}%`,
                }}
                title={`Your request: ${toHHMM(previewStart)}–${toHHMM(previewEnd)}`}
              />
            )}
            {/* Hour ticks */}
            <div className="absolute inset-x-0 top-12">
              {timelineHours.map((h) => (
                <div
                  key={h}
                  className="absolute -translate-x-1/2 text-[10px] tabular-nums text-slate-400"
                  style={{ left: `${pct(h)}%` }}
                >
                  {toHHMM(h)}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Existing booking
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full border-2 border-emerald-500 bg-emerald-200/60" />
              Your request
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-0.5 bg-slate-400" /> Now
            </span>
          </div>
        </section>

        {/* Input form */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-800">
            Check a time range
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Start time <span className="text-slate-400">(minutes after midnight)</span>
              </span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={DAY_END}
                value={startInput}
                onChange={(e) => {
                  setStartInput(e.target.value);
                  setStartError(null);
                }}
                aria-invalid={startError !== null}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-base tabular-nums outline-none transition focus:ring-2 ${
                  startError
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-200'
                }`}
                placeholder="e.g. 660"
              />
              {startError ? (
                <span className="mt-1 block text-xs font-medium text-rose-600">
                  {startError}
                </span>
              ) : (
                <span className="mt-1 block text-xs text-slate-400">
                  Must be &gt; {NOW} ({toHHMM(NOW)}) and &lt;= {DAY_END}
                </span>
              )}
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                End time <span className="text-slate-400">(minutes after midnight)</span>
              </span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={DAY_END}
                value={endInput}
                onChange={(e) => {
                  setEndInput(e.target.value);
                  setEndError(null);
                }}
                aria-invalid={endError !== null}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-base tabular-nums outline-none transition focus:ring-2 ${
                  endError
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-200'
                }`}
                placeholder="e.g. 720"
              />
              {endError ? (
                <span className="mt-1 block text-xs font-medium text-rose-600">
                  {endError}
                </span>
              ) : (
                <span className="mt-1 block text-xs text-slate-400">
                  Must be between 0 and {DAY_END}, at most {MAX_DURATION} min after Start
                </span>
              )}
            </label>
          </div>

          {/* Room blocked toggle */}
          <div className="mt-5 flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-800">Room blocked</p>
              <p className="text-xs text-slate-500">
                When blocked, every request is rejected.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={blocked}
              onClick={() => setBlocked((b) => !b)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-200 ${
                blocked ? 'bg-rose-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  blocked ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleCheck}
              className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 active:scale-[0.99]"
            >
              Check availability
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-base font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 active:scale-[0.99]"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </section>

        {/* Result */}
        {verdict && (
          <section
            className={`rounded-2xl border p-5 shadow-sm transition ${
              verdict.kind === 'available'
                ? 'border-emerald-200 bg-emerald-50'
                : 'border-rose-200 bg-rose-50'
            }`}
          >
            <div className="flex items-start gap-3">
              {verdict.kind === 'available' ? (
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
              ) : (
                <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-rose-600" />
              )}
              <div>
                <p
                  className={`text-lg font-bold ${
                    verdict.kind === 'available' ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {verdict.kind === 'available' ? 'Available' : 'Unavailable'}
                </p>
                {verdict.kind === 'unavailable' && (
                  <p className="mt-1 text-sm text-rose-700/90">{verdict.reason}</p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Help / rules */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Info className="h-4 w-4 text-slate-400" />
            How the check works
          </div>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>• Times are whole minutes (0–1440). Start must be after now ({toHHMM(NOW)}), and before end.</li>
            <li>• The requested duration may be up to {MAX_DURATION} minutes (exactly {MAX_DURATION} is allowed).</li>
            <li>• If the room is blocked, every request is rejected.</li>
            <li>• Overlap with an existing booking is rejected; intervals that only touch at an endpoint are fine.</li>
            <li>• This tool only checks availability — it never creates or confirms a booking.</li>
          </ul>
        </section>

        <footer className="mt-8 text-center text-xs text-slate-400">
          Fictional data · {ROOM_NAME} · demo only
        </footer>
      </div>
    </div>
  );
}
