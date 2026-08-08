export type StreakResult = { current: number; best: number };

/** Local calendar-day key (YYYY-MM-DD). Never UTC: toISOString would shift days. */
function localDayKey(ms: number): string {
  const date = new Date(ms);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isConsecutiveDay(prevDay: string, nextDay: string): boolean {
  const [year, month, day] = prevDay.split('-').map(Number);
  const next = new Date(year, month - 1, day + 1);
  return localDayKey(next.getTime()) === nextDay;
}

/**
 * Pure streak computation. Uses local dates and an injected clock so the
 * "counts through yesterday" rule is testable without timezone dependence.
 */
export function computeStreak(completedAtMs: readonly number[], now: Date): StreakResult {
  const days = [...new Set(completedAtMs.map(localDayKey))].sort();

  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const day of days) {
    run = prev !== null && isConsecutiveDay(prev, day) ? run + 1 : 1;
    if (run > best) {
      best = run;
    }
    prev = day;
  }

  const todayKey = localDayKey(now.getTime());
  const yesterdayKey = localDayKey(
    new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime(),
  );

  const anchor = days.includes(todayKey)
    ? todayKey
    : days.includes(yesterdayKey)
      ? yesterdayKey
      : null;
  if (anchor === null) {
    return { current: 0, best };
  }

  let current = 1;
  let index = days.indexOf(anchor);
  while (index > 0 && isConsecutiveDay(days[index - 1], days[index])) {
    current += 1;
    index -= 1;
  }

  return { current, best };
}