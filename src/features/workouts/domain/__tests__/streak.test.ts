import { computeStreak } from '../streak';

/** Millis for a local date (midday by default to avoid DST edges). */
function at(year: number, month: number, day: number, hour = 12): number {
  return new Date(year, month - 1, day, hour, 0, 0, 0).getTime();
}

const NOW = new Date(2026, 0, 15, 10, 0, 0); // Thursday January 15 2026 (local)

describe('computeStreak', () => {
  it('counts the streak through yesterday when today has no workout', () => {
    // Mon Jan 12, Tue Jan 13, Wed Jan 14 (input shuffled on purpose)
    const result = computeStreak([at(2026, 1, 14), at(2026, 1, 12), at(2026, 1, 13)], NOW);
    expect(result).toEqual({ current: 3, best: 3 });
  });

  it('resets current to 0 when yesterday also had no workout', () => {
    // Mon Jan 12 and Tue Jan 13 only; Wed Jan 14 empty; today Thu Jan 15 empty
    const result = computeStreak([at(2026, 1, 12), at(2026, 1, 13)], NOW);
    expect(result).toEqual({ current: 0, best: 2 });
  });

  it('reports the historical best across separated streaks', () => {
    // 5-day streak (Jan 5-9), 2-day streak (Jan 26-27), now = Feb 2
    const completions = [
      at(2026, 1, 9), at(2026, 1, 5), at(2026, 1, 6), at(2026, 1, 7), at(2026, 1, 8),
      at(2026, 1, 27), at(2026, 1, 26),
    ];
    const now = new Date(2026, 1, 2, 10, 0, 0);
    expect(computeStreak(completions, now)).toEqual({ current: 0, best: 5 });
  });

  it('counts two workouts on the same day as a single streak day', () => {
    const completions = [at(2026, 1, 14, 8), at(2026, 1, 14, 20)];
    const now = new Date(2026, 0, 14, 12, 0, 0);
    expect(computeStreak(completions, now)).toEqual({ current: 1, best: 1 });
  });

  it('returns 0/0 for no completions at all', () => {
    expect(computeStreak([], NOW)).toEqual({ current: 0, best: 0 });
  });

  it('handles the Sunday-to-Monday boundary using local dates', () => {
    // Sun Jan 11 23:30 + Mon Jan 12 01:00 (local); now = Mon Jan 12 noon
    const completions = [at(2026, 1, 11, 23), at(2026, 1, 12, 1)];
    const now = new Date(2026, 0, 12, 12, 0, 0);
    expect(computeStreak(completions, now)).toEqual({ current: 2, best: 2 });
  });

  it('counts up to today when today has a workout', () => {
    const completions = [at(2026, 1, 12), at(2026, 1, 13), at(2026, 1, 14)];
    const now = new Date(2026, 0, 14, 20, 0, 0);
    expect(computeStreak(completions, now)).toEqual({ current: 3, best: 3 });
  });

  it('keeps a single-day streak alive through yesterday', () => {
    const completions = [at(2026, 1, 14)];
    expect(computeStreak(completions, NOW)).toEqual({ current: 1, best: 1 });
  });

  it('keeps counting a long streak that ends yesterday', () => {
    const completions = [at(2026, 1, 5), at(2026, 1, 6), at(2026, 1, 7), at(2026, 1, 8), at(2026, 1, 9)];
    const now = new Date(2026, 0, 10, 12, 0, 0); // Sat Jan 10, no workout
    expect(computeStreak(completions, now)).toEqual({ current: 5, best: 5 });
  });

  it('separates best from current when an older streak is longer', () => {
    const completions = [
      at(2026, 1, 5), at(2026, 1, 6), at(2026, 1, 7), at(2026, 1, 8), at(2026, 1, 9),
      at(2026, 1, 12), at(2026, 1, 13), at(2026, 1, 14),
    ];
    const now = new Date(2026, 0, 14, 12, 0, 0);
    expect(computeStreak(completions, now)).toEqual({ current: 3, best: 5 });
  });
});