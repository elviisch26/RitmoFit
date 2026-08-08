import {
  calculateProgression,
  isTargetHit,
  muscleGroupUpperBody,
  roundToNearestPlate,
  type CalculateProgressionInput,
  type ProgressionSet,
} from '../progression';

function makeSets(
  completedAt: number,
  weightKg: number,
  reps: number,
  setsPerSession = 3,
): ProgressionSet[] {
  return Array.from({ length: setsPerSession }, () => ({
    sessionCompletedAt: completedAt,
    weightKg,
    reps,
  }));
}

function buildInput(overrides: Partial<CalculateProgressionInput> = {}): CalculateProgressionInput {
  return {
    exerciseTemplateId: 1,
    muscleGroup: 'chest',
    targetReps: 10,
    targetSets: 3,
    recentSets: [],
    ...overrides,
  };
}

describe('muscleGroupUpperBody', () => {
  it.each([
    ['chest', true],
    ['back', true],
    ['shoulders', true],
    ['arms', true],
    ['legs', false],
    ['core', false],
  ] as const)('returns %p for %s', (group, expected) => {
    expect(muscleGroupUpperBody(group)).toBe(expected);
  });
});

describe('isTargetHit', () => {
  it('hits when reps are exactly the target', () => {
    expect(isTargetHit({ targetReps: 10, reps: 10 })).toBe(true);
  });

  it('hits when reps are within the +3 window', () => {
    expect(isTargetHit({ targetReps: 10, reps: 13 })).toBe(true);
  });

  it('misses when reps fall below the target', () => {
    expect(isTargetHit({ targetReps: 10, reps: 9 })).toBe(false);
  });

  it('misses when reps exceed the +3 window', () => {
    expect(isTargetHit({ targetReps: 10, reps: 14 })).toBe(false);
  });
});

describe('roundToNearestPlate', () => {
  it('rounds to the nearest 2.5kg', () => {
    expect(roundToNearestPlate(102.5)).toBe(102.5);
    expect(roundToNearestPlate(101)).toBe(100);
    expect(roundToNearestPlate(102.6)).toBe(102.5);
    expect(roundToNearestPlate(103.75)).toBe(105);
  });

  it('rounds down to 0 for tiny weights', () => {
    expect(roundToNearestPlate(1.2)).toBe(0);
  });
});

describe('calculateProgression', () => {
  it('returns keep with no suggestion when there are no sets', () => {
    const result = calculateProgression(buildInput());
    expect(result.action).toBe('keep');
    expect(result.suggestedWeightKg).toBe(0);
  });

  it('returns keep when only one session exists', () => {
    const recentSets = makeSets(100, 60, 10);
    const result = calculateProgression(buildInput({ recentSets }));
    expect(result.action).toBe('keep');
    expect(result.suggestedWeightKg).toBe(60);
  });

  it('increases +2.5% for upper-body groups', () => {
    const recentSets = [...makeSets(100, 100, 10), ...makeSets(200, 100, 10)];
    const result = calculateProgression(buildInput({ muscleGroup: 'shoulders', recentSets }));
    expect(result.action).toBe('increase');
    expect(result.suggestedWeightKg).toBe(102.5);
  });

  it('increases +5% for legs', () => {
    const recentSets = [...makeSets(100, 100, 10), ...makeSets(200, 100, 10)];
    const result = calculateProgression(buildInput({ muscleGroup: 'legs', recentSets }));
    expect(result.action).toBe('increase');
    expect(result.suggestedWeightKg).toBe(105);
  });

  it('rounds the increase to the nearest 2.5kg', () => {
    const recentSets = [...makeSets(100, 70, 10), ...makeSets(200, 70, 10)];
    const result = calculateProgression(buildInput({ muscleGroup: 'arms', recentSets }));
    expect(result.action).toBe('increase');
    expect(result.suggestedWeightKg).toBe(72.5);
  });

  it('deloads -10% after 2 consecutive failed sessions', () => {
    const recentSets = [...makeSets(100, 100, 5), ...makeSets(200, 100, 5)];
    const result = calculateProgression(buildInput({ muscleGroup: 'legs', recentSets }));
    expect(result.action).toBe('deload');
    expect(result.suggestedWeightKg).toBe(90);
  });

  it('rounds the deload to the nearest 2.5kg', () => {
    const recentSets = [...makeSets(100, 63, 5), ...makeSets(200, 63, 5)];
    const result = calculateProgression(buildInput({ recentSets }));
    expect(result.action).toBe('deload');
    expect(result.suggestedWeightKg).toBe(57.5);
  });

  it('never deloads below 0', () => {
    const recentSets = [...makeSets(100, 1, 5), ...makeSets(200, 1, 5)];
    const result = calculateProgression(buildInput({ recentSets }));
    expect(result.action).toBe('deload');
    expect(result.suggestedWeightKg).toBe(0);
  });

  it('keeps the weight on mixed sessions', () => {
    const recentSets = [
      ...makeSets(100, 60, 10),
      ...makeSets(200, 60, 7),
    ];
    const result = calculateProgression(buildInput({ recentSets }));
    expect(result.action).toBe('keep');
    expect(result.suggestedWeightKg).toBe(60);
  });

  it('keeps the weight when a single set missed in one of two sessions', () => {
    const sessionOne = [
      { sessionCompletedAt: 100, weightKg: 60, reps: 11 },
      { sessionCompletedAt: 100, weightKg: 60, reps: 9 },
      { sessionCompletedAt: 100, weightKg: 60, reps: 11 },
    ];
    const sessionTwo = makeSets(200, 60, 11);
    const result = calculateProgression(buildInput({ recentSets: [...sessionOne, ...sessionTwo] }));
    expect(result.action).toBe('keep');
  });

  it('provides a human-readable reasoning for each action', () => {
    const increase = calculateProgression(
      buildInput({ recentSets: [...makeSets(0, 60, 10), ...makeSets(1, 60, 10)] }),
    );
    expect(increase.reasoning.length).toBeGreaterThan(0);

    const deload = calculateProgression(
      buildInput({ recentSets: [...makeSets(0, 60, 4), ...makeSets(1, 60, 5)] }),
    );
    expect(deload.reasoning).toContain('deload');

    const keep = calculateProgression(
      buildInput({ recentSets: [...makeSets(0, 60, 10), ...makeSets(1, 60, 6)] }),
    );
    expect(keep.reasoning.length).toBeGreaterThan(0);
  });
});