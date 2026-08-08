import type { MuscleGroup } from '@/features/exercises/types';

export type ProgressionAction = 'increase' | 'keep' | 'deload';

export type ProgressionSet = {
  sessionCompletedAt: number;
  weightKg: number;
  reps: number;
};

export type CalculateProgressionInput = {
  exerciseTemplateId: number;
  muscleGroup: MuscleGroup;
  targetReps: number;
  targetSets: number;
  recentSets: ProgressionSet[];
};

export type ProgressionResult = {
  action: ProgressionAction;
  suggestedWeightKg: number;
  reasoning: string;
};

export function roundToNearestPlate(weightKg: number): number {
  return Math.round(weightKg / 2.5) * 2.5;
}

export function isTargetHit({ reps, targetReps }: { reps: number; targetReps: number }): boolean {
  return reps >= targetReps && reps <= targetReps + 3;
}

export function muscleGroupUpperBody(muscleGroup: MuscleGroup): boolean {
  return (
    muscleGroup === 'chest' ||
    muscleGroup === 'back' ||
    muscleGroup === 'shoulders' ||
    muscleGroup === 'arms'
  );
}

type ProgressionSession = {
  completedAt: number;
  sets: ProgressionSet[];
};

function groupBySession(sets: ProgressionSet[]): ProgressionSession[] {
  const byCompletedAt = new Map<number, ProgressionSet[]>();
  for (const set of sets) {
    const sessionSets = byCompletedAt.get(set.sessionCompletedAt);
    if (sessionSets) {
      sessionSets.push(set);
    } else {
      byCompletedAt.set(set.sessionCompletedAt, [set]);
    }
  }

  return [...byCompletedAt.entries()]
    .map(([completedAt, sessionSets]) => ({ completedAt, sets: sessionSets }))
    .sort((a, b) => a.completedAt - b.completedAt);
}

function lastSessionWeight(sessions: ProgressionSession[]): number {
  const last = sessions[sessions.length - 1];
  const weights = last.sets.map((set) => set.weightKg);
  return Math.max(...weights);
}

export function calculateProgression({
  muscleGroup,
  targetReps,
  recentSets,
}: CalculateProgressionInput): ProgressionResult {
  if (recentSets.length === 0) {
    return {
      action: 'keep',
      suggestedWeightKg: 0,
      reasoning: 'No sets logged for this exercise yet.',
    };
  }

  const sessions = groupBySession(recentSets);

  if (sessions.length < 2) {
    return {
      action: 'keep',
      suggestedWeightKg: lastSessionWeight(sessions),
      reasoning: 'Not enough completed sessions to assess a progression pattern.',
    };
  }

  const evaluation = sessions.slice(-2);
  const currentWeight = lastSessionWeight(evaluation);
  const passed = (session: ProgressionSession) =>
    session.sets.every((set) => isTargetHit({ reps: set.reps, targetReps }));
  const bothPassed = evaluation.every(passed);
  const bothFailed = evaluation.every((session) => !passed(session));

  if (bothPassed) {
    const allowance = muscleGroupUpperBody(muscleGroup) ? 0.025 : 0.05;
    const suggestedWeightKg = roundToNearestPlate(currentWeight * (1 + allowance));
    const scopeLabel = muscleGroupUpperBody(muscleGroup) ? 'upper body (+2.5%)' : 'lower body (+5%)';
    return {
      action: 'increase',
      suggestedWeightKg,
      reasoning: `All sets hit the target reps in the last 2 sessions; increase for ${scopeLabel}.`,
    };
  }

  if (bothFailed) {
    const suggestedWeightKg = Math.max(0, roundToNearestPlate(currentWeight * 0.9));
    return {
      action: 'deload',
      suggestedWeightKg,
      reasoning: 'Missed the target reps in 2 consecutive sessions; deload 10%.',
    };
  }

  return {
    action: 'keep',
    suggestedWeightKg: roundToNearestPlate(currentWeight),
    reasoning: 'Mixed results across the last 2 sessions; hold the current weight.',
  };
}