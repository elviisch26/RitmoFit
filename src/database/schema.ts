import { relations } from 'drizzle-orm';
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

export const users = sqliteTable(
  'users',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    email: text('email').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [uniqueIndex('users_email_unique').on(table.email)],
);

export const goals = sqliteTable(
  'goals',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type', { enum: ['weight_loss', 'muscle_gain', 'stay_active'] }).notNull(),
    title: text('title').notNull(),
    targetUnit: text('target_unit', {
      enum: ['kg', 'lb', 'sessions_per_week', 'minutes_per_week'],
    }).notNull(),
    targetValue: real('target_value').notNull(),
    startDate: integer('start_date', { mode: 'timestamp_ms' }).notNull(),
    targetDate: integer('target_date', { mode: 'timestamp_ms' }),
    completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index('goals_user_id_idx').on(table.userId)],
);

export const workoutSessions = sqliteTable(
  'workouts',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    notes: text('notes'),
    startedAt: integer('started_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index('workouts_user_id_idx').on(table.userId)],
);

export const workoutExercises = sqliteTable(
  'workout_exercises',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    workoutId: integer('workout_id')
      .notNull()
      .references(() => workoutSessions.id, { onDelete: 'cascade' }),
    exerciseTemplateId: integer('exercise_template_id')
      .notNull()
      .references(() => exerciseTemplates.id, { onDelete: 'restrict' }),
    orderIndex: integer('order_index').notNull().default(0),
    notes: text('notes'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index('workout_exercises_workout_id_idx').on(table.workoutId),
    index('workout_exercises_exercise_template_id_idx').on(table.exerciseTemplateId),
  ],
);

export const sets = sqliteTable(
  'sets',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    workoutExerciseId: integer('workout_exercise_id')
      .notNull()
      .references(() => workoutExercises.id, { onDelete: 'cascade' }),
    orderIndex: integer('order_index').notNull().default(0),
    weightKg: real('weight_kg').notNull(),
    reps: integer('reps').notNull(),
    restSeconds: integer('rest_seconds'),
    rpe: real('rpe'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index('sets_workout_exercise_id_idx').on(table.workoutExerciseId)],
);

export const exerciseTemplates = sqliteTable(
  'exercise_templates',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    muscleGroup: text('muscle_group', {
      enum: ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'],
    }).notNull(),
    equipment: text('equipment', {
      enum: ['barbell', 'dumbbell', 'machine', 'bodyweight', 'cable'],
    }).notNull(),
    isBodyweight: integer('is_bodyweight', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [uniqueIndex('exercise_templates_name_unique').on(table.name)],
);

export const routines = sqliteTable('routines', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  note: text('note'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const routineExercises = sqliteTable(
  'routine_exercises',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    routineId: integer('routine_id')
      .notNull()
      .references(() => routines.id, { onDelete: 'cascade' }),
    exerciseTemplateId: integer('exercise_template_id')
      .notNull()
      .references(() => exerciseTemplates.id, { onDelete: 'restrict' }),
    position: integer('position').notNull().default(0),
    targetSets: integer('target_sets').notNull().default(3),
    targetReps: integer('target_reps').notNull().default(10),
    restSeconds: integer('rest_seconds').notNull().default(60),
  },
  (table) => [
    index('routine_exercises_routine_id_idx').on(table.routineId),
    index('routine_exercises_exercise_template_id_idx').on(table.exerciseTemplateId),
  ],
);

export const notifications = sqliteTable(
  'notifications',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
    type: text('type', { enum: ['workout_reminder', 'hydration', 'rest'] }).notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    scheduledFor: integer('scheduled_for', { mode: 'timestamp_ms' }).notNull(),
    status: text('status', { enum: ['scheduled', 'sent', 'cancelled', 'dismissed'] })
      .notNull()
      .default('scheduled'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index('notifications_user_id_idx').on(table.userId)],
);