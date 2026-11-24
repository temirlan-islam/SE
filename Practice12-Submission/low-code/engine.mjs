// Generic interpreter: project facts and form fields live in config.json.
export function evaluate(config, values) {
  const start = Number(values.start);
  const duration = Number(values.duration);
  const fail = (reasonCode, message) => ({ isAvailable: false, reasonCode, message });
  if (String(values.start).trim() === '' || !Number.isInteger(start) || start < 0 || start > config.dayEnd)
    return fail('INVALID_START', config.messages.invalidStart);
  if (start <= config.now) return fail('PAST_START', config.messages.past);
  if (String(values.duration).trim() === '' || !Number.isInteger(duration) || duration <= 0 || duration > config.maxDuration)
    return fail('INVALID_DURATION', config.messages.invalidDuration);
  const end = start + duration;
  if (end > config.dayEnd) return fail('DAY_END', config.messages.dayEnd);
  if (values.blocked === true) return fail('BLOCKED', config.messages.blocked);
  if (config.bookings.some(([a, b]) => start < b && a < end)) return fail('OVERLAP', config.messages.overlap);
  return { isAvailable: true, reasonCode: 'AVAILABLE', message: config.messages.available };
}
