import { computeStreak } from '../streak';

/** Millis para una fecha local (mediodía por defecto para evitar bordes de DST). */
function at(year: number, month: number, day: number, hour = 12): number {
  return new Date(year, month - 1, day, hour, 0, 0, 0).getTime();
}

const NOW = new Date(2026, 0, 15, 10, 0, 0); // Jueves 15 de enero de 2026 (local)

describe('computeStreak', () => {
  it('counts the streak through yesterday when today has no workout', () => {
    // Lun 12 ene, Mar 13 ene, Mié 14 ene (entrada desordenada a propósito)
    const result = computeStreak([at(2026, 1, 14), at(2026, 1, 12), at(2026, 1, 13)], NOW);
    expect(result).toEqual({ current: 3, best: 3 });
  });

  it('resets current to 0 when yesterday also had no workout', () => {
    // Solo Lun 12 ene y Mar 13 ene; Mié 14 ene vacío; hoy Jue 15 ene vacío
    const result = computeStreak([at(2026, 1, 12), at(2026, 1, 13)], NOW);
    expect(result).toEqual({ current: 0, best: 2 });
  });

  it('reports the historical best across separated streaks', () => {
    // Racha de 5 días (5-9 ene), racha de 2 días (26-27 ene), now = 2 feb
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
    // Dom 11 ene 23:30 + Lun 12 ene 01:00 (local); now = Lun 12 ene mediodía
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
    const now = new Date(2026, 0, 10, 12, 0, 0); // Sáb 10 ene, sin entrenamiento
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