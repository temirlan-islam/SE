import { DAY_END, type Verdict } from './availability';

const REASON_CODES = [
  'AVAILABLE',
  'INVALID_TIME',
  'OUT_OF_RANGE',
  'PAST',
  'TOO_LONG',
  'BLOCKED',
  'OVERLAP',
  'UNAVAILABLE',
] as const;

export type ReasonCode = typeof REASON_CODES[number];

export type ExplanationRequest = {
  roomLabel: string;
  start: number;
  end: number;
  isAvailable: boolean;
  reasonCode: ReasonCode;
  reason: string;
};

export type ExplanationResponse = {
  explanation: string;
  isAvailable: boolean;
  reasonCode: ReasonCode;
};

export type ExplanationResult = { text: string; source: 'mock' | 'fallback' };
export type ExplanationAdapter = (request: ExplanationRequest) => Promise<unknown>;

export const PROMPT_VARIANTS = {
  minimal: 'Explain this availability result briefly.',
  friendly: 'Explain this room availability result in friendly language for a student.',
  constrained: 'Using only the supplied room, time, status and reason, explain the decision in at most two sentences. Do not invent bookings or change the status. Return explanation, isAvailable and reasonCode.',
} as const;

export type PromptVariant = keyof typeof PROMPT_VARIANTS;

export function reasonCodeFor(verdict: Verdict): ReasonCode {
  if (verdict.kind === 'available') return 'AVAILABLE';
  const reason = verdict.reason;
  if (reason.startsWith('Start and end times') || reason.startsWith('End time must be')) return 'INVALID_TIME';
  if (reason.startsWith('Times must be between')) return 'OUT_OF_RANGE';
  if (reason.startsWith('Start time must be')) return 'PAST';
  if (reason.startsWith('Booking duration is')) return 'TOO_LONG';
  if (reason.startsWith('The room is currently blocked')) return 'BLOCKED';
  if (reason.startsWith('Overlaps an existing booking')) return 'OVERLAP';
  return 'UNAVAILABLE';
}

export function buildExplanationRequest(
  roomLabel: string,
  start: number,
  end: number,
  verdict: Verdict,
): ExplanationRequest {
  return {
    roomLabel,
    start,
    end,
    isAvailable: verdict.kind === 'available',
    reasonCode: reasonCodeFor(verdict),
    reason: verdict.kind === 'unavailable' ? verdict.reason : '',
  };
}

export function isValidExplanationRequest(input: unknown): input is ExplanationRequest {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return false;
  const value = input as Record<string, unknown>;
  return (
    typeof value.roomLabel === 'string' &&
    value.roomLabel.trim().length > 0 &&
    /^[A-Za-z0-9 -]{1,40}$/.test(value.roomLabel) &&
    typeof value.start === 'number' &&
    typeof value.end === 'number' &&
    Number.isInteger(value.start) &&
    Number.isInteger(value.end) &&
    value.start >= 0 &&
    value.end <= DAY_END &&
    value.start < value.end &&
    typeof value.isAvailable === 'boolean' &&
    REASON_CODES.some((code) => code === value.reasonCode) &&
    (value.isAvailable
      ? value.reasonCode === 'AVAILABLE' && value.reason === ''
      : value.reasonCode !== 'AVAILABLE' &&
        typeof value.reason === 'string' &&
        value.reason.length > 0 &&
        value.reason.length <= 160 &&
        !hasUnsafeChars(value.reason))
  );
}

function hasUnsafeChars(value: string): boolean {
  return /[<>]/.test(value) || [...value].some((char) => char.charCodeAt(0) < 32);
}

function time(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

export function fallbackExplanation(request: ExplanationRequest): string {
  if (request.isAvailable) {
    return `${request.roomLabel} is available from ${time(request.start)} to ${time(request.end)}. This check does not create a booking.`;
  }
  return `${request.roomLabel} is unavailable from ${time(request.start)} to ${time(request.end)}. ${request.reason}`;
}

export function createMockAdapter(variant: PromptVariant = 'constrained'): ExplanationAdapter {
  return async (request) => {
    const base = fallbackExplanation(request);
    const explanation = variant === 'friendly'
      ? (request.isAvailable ? `Good news! ${base}` : `Sorry, ${base}`)
      : variant === 'minimal'
        ? (request.isAvailable ? `${request.roomLabel} is available.` : `${request.roomLabel} is unavailable. ${request.reason}`)
        : base;
    return { explanation, isAvailable: request.isAvailable, reasonCode: request.reasonCode };
  };
}

function isValidResponse(value: unknown, request: ExplanationRequest): value is ExplanationResponse {
  if (typeof value !== 'object' || value === null) return false;
  const response = value as Partial<ExplanationResponse>;
  return (
    typeof response.explanation === 'string' &&
    response.explanation.trim() === response.explanation &&
    response.explanation.length > 0 &&
    response.explanation.length <= 240 &&
    !hasUnsafeChars(response.explanation) &&
    (response.explanation.match(/[.!?](?:\s|$)/g)?.length ?? 0) <= 2 &&
    response.isAvailable === request.isAvailable &&
    response.reasonCode === request.reasonCode
  );
}

export async function explainAvailability(
  request: unknown,
  adapter: ExplanationAdapter = createMockAdapter(),
  timeoutMs = 1000,
): Promise<ExplanationResult> {
  if (!isValidExplanationRequest(request)) {
    return { text: 'An explanation cannot be generated for this input.', source: 'fallback' };
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error('Invalid timeout');
    const response = await Promise.race([
      adapter(request),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Explanation timed out')), timeoutMs);
      }),
    ]);
    if (!isValidResponse(response, request)) throw new Error('Invalid explanation response');
    return { text: response.explanation, source: 'mock' };
  } catch {
    return { text: fallbackExplanation(request), source: 'fallback' };
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}
