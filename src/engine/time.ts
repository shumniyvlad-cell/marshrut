// Местное время рождения → UTC по часовому поясу IANA (исторические смещения берём из tzdata браузера).

function offsetMinutes(utcMs: number, tz: string): number {
  const f = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const p: Record<string, number> = {};
  for (const part of f.formatToParts(new Date(utcMs))) if (part.type !== 'literal') p[part.type] = Number(part.value);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - utcMs) / 60000);
}

export function localToUtc(y: number, m: number, d: number, h: number, min: number, tz: string): {utc: Date; offset: number} {
  const guess = Date.UTC(y, m - 1, d, h, min);
  let off = offsetMinutes(guess, tz);
  let utc = guess - off * 60000;
  const off2 = offsetMinutes(utc, tz);
  if (off2 !== off) { off = off2; utc = guess - off * 60000; }
  return {utc: new Date(utc), offset: off};
}

export function fmtOffset(min: number): string {
  const s = min >= 0 ? '+' : '−';
  const a = Math.abs(min);
  return `UTC${s}${Math.floor(a / 60)}${a % 60 ? ':' + String(a % 60).padStart(2, '0') : ''}`;
}

export function isValidTz(tz: string): boolean {
  try { new Intl.DateTimeFormat('en-US', {timeZone: tz}); return true; } catch { return false; }
}
