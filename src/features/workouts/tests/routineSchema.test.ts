import { routineSchema } from '../types';

const baseExercises = [
  { exerciseTemplateId: 1, targetSets: 3, targetReps: 10, restSeconds: 60 },
];

const validInput = {
  name: 'Push Day',
  note: null,
  exercises: baseExercises,
};

describe('routineSchema', () => {
  it('accepts a valid routine input', () => {
    const result = routineSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('accepts an empty note', () => {
    const result = routineSchema.safeParse({ ...validInput, note: '' });
    expect(result.success).toBe(true);
  });

  it('applies the default goal when none is provided', () => {
    const result = routineSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.goal).toBe('strength');
    }
  });

  it('accepts every valid goal value', () => {
    for (const goal of ['strength', 'hypertrophy', 'cardio', 'endurance'] as const) {
      const result = routineSchema.safeParse({ ...validInput, goal });
      expect(result.success).toBe(true);
    }
  });

  it('rejects an invalid goal value', () => {
    const result = routineSchema.safeParse({ ...validInput, goal: 'powerlifting' });
    expect(result.success).toBe(false);
  });

  it('rejects a name shorter than 3 characters', () => {
    expect(routineSchema.safeParse({ ...validInput, name: 'Ab' }).success).toBe(false);
    expect(routineSchema.safeParse({ ...validInput, name: '' }).success).toBe(false);
  });

  it('rejects a routine without exercises', () => {
    const result = routineSchema.safeParse({ ...validInput, exercises: [] });
    expect(result.success).toBe(false);
  });

  it.each([
    ['targetSets too high', { targetSets: 11 }],
    ['targetSets too low', { targetSets: 0 }],
    ['targetReps too high', { targetReps: 51 }],
    ['targetReps too low', { targetReps: 0 }],
    ['negative restSeconds', { restSeconds: -1 }],
  ])('rejects %s', (_label, override) => {
    const input = {
      ...validInput,
      exercises: [{ ...baseExercises[0], ...override }],
    };
    expect(routineSchema.safeParse(input).success).toBe(false);
  });

  it('rejects non-integer sets', () => {
    const input = {
      ...validInput,
      exercises: [{ ...baseExercises[0], targetSets: 2.5 }],
    };
    expect(routineSchema.safeParse(input).success).toBe(false);
  });
});