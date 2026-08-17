export const MUSCLE_GROUPS = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'] as const;

export const EQUIPMENT = ['barbell', 'dumbbell', 'machine', 'bodyweight', 'cable'] as const;

export const GOALS = ['strength', 'hypertrophy', 'cardio', 'endurance'] as const;

export type Goal = (typeof GOALS)[number];

export const MUSCLE_GROUP_LABELS: Record<(typeof MUSCLE_GROUPS)[number], string> = {
  chest: 'Pecho',
  back: 'Espalda',
  legs: 'Piernas',
  shoulders: 'Hombros',
  arms: 'Brazos',
  core: 'Core',
};

export const EQUIPMENT_LABELS: Record<(typeof EQUIPMENT)[number], string> = {
  barbell: 'Barra',
  dumbbell: 'Mancuernas',
  machine: 'Máquina',
  bodyweight: 'Peso corporal',
  cable: 'Polea',
};

export const GOAL_LABELS: Record<Goal, string> = {
  strength: 'Fuerza',
  hypertrophy: 'Hipertrofia',
  cardio: 'Cardio',
  endurance: 'Resistencia',
};
