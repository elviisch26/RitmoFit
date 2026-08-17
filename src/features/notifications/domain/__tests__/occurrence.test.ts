import { resolveNextOccurrence } from '../occurrence';

describe('resolveNextOccurrence', () => {
  // Martes 17-03-2026, hora local.
  const TUE_14 = new Date(2026, 2, 17, 14, 0, 0);
  const TUE_10 = new Date(2026, 2, 17, 10, 0, 0);
  const TUE_12_EXACT = new Date(2026, 2, 17, 12, 0, 0);

  it('returns today when the reminder time has not passed yet (REMINDERS-6)', () => {
    const next = resolveNextOccurrence('workout_reminder', 12, 0, TUE_10);
    expect(next).toEqual(new Date(2026, 2, 17, 12, 0, 0));
  });

  it('returns tomorrow when the reminder time already passed (REMINDERS-6)', () => {
    const next = resolveNextOccurrence('workout_reminder', 12, 0, TUE_14);
    expect(next).toEqual(new Date(2026, 2, 18, 12, 0, 0));
  });

  it('returns tomorrow when now equals the reminder time exactly (boundary)', () => {
    const next = resolveNextOccurrence('hydration', 12, 0, TUE_12_EXACT);
    expect(next).toEqual(new Date(2026, 2, 18, 12, 0, 0));
  });

  it('keeps minutes from the config and rolls over month boundaries', () => {
    const next = resolveNextOccurrence('rest', 1, 45, new Date(2026, 0, 31, 23, 0, 0));
    expect(next).toEqual(new Date(2026, 1, 1, 1, 45, 0));
  });
});