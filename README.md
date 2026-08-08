# RitmoFit

React Native fitness-tracking app built with Expo SDK 57, TypeScript, and a local-first architecture.

## Stack

- **Expo SDK 57** (React Native 0.86, React 19)
- **TypeScript 6** — strict mode
- **expo-sqlite + Drizzle ORM** — local database
- **TanStack Query** — data-access layer over SQLite
- **Zustand** — domain state, colocated per feature
- **React Navigation** (bottom tabs)
- **React Hook Form + Zod** — forms and validation
- **Jest + React Native Testing Library** — unit and component tests

## Architecture

```
src/
  app/                 # App shell: providers, navigation, entry
    navigation/        #   RootNavigator (bottom tabs)
    providers/         #   AppProviders (QueryClient, gesture handler, safe area)
  database/            # schema, client, migrations, seed
  shared/              # components, hooks, constants, utils, theme
  features/            # domain features, each self-contained:
    <feature>/
      components/
      screens/
      hooks/
      store/           # Zustand store
      types/
      tests/
```

- **Domain state lives with its feature** (`features/<feature>/store/`). There is no global store folder; only app-wide concerns (theme/preferences) may live at the app level.
- **Data layer is local-first**: SQLite via expo-sqlite, with Drizzle as the schema/query layer and TanStack Query on top for server-style caching and invalidation.
- **No `history` table**: progress/history is derived by querying workouts and sets.

## Database

Schema is defined in `src/database/schema.ts` (users, goals, workouts, workout_exercises, sets, exercise_templates, notifications).

- `src/database/migrations.ts` — idempotent bootstrap using `CREATE TABLE IF NOT EXISTS`, executed at app start via `bootstrapDatabase()` in `src/database/client.ts`.
- `src/database/seed.ts` — seeds the exercise template catalog (~45 exercises) idempotently.

For future schema changes, generate Drizzle migrations with `drizzle-kit` (`driver: "expo"` config) and swap the migration runner to the embedded `.sql` + Metro approach.

## Scripts

- `npm start` — start Expo dev server
- `npm run test` — run Jest tests
- `npm run typecheck` — run `tsc --noEmit`
- `npx expo install <pkg>` — install packages at Expo-compatible versions

## Testing

Jest is configured with the `jest-expo` preset. `jest.setup.ts` mocks `react-native-safe-area-context` and `react-native-reanimated` for the test environment.

Note: `render` from `@testing-library/react-native` v14 is async — always `await render(...)` before querying `screen`.

## Conventions

- All code, comments, and docs are in English.
- Feature screens live in `features/<feature>/screens/`; shared UI in `shared/components/`.
- Follow the existing theme tokens in `src/shared/theme.ts` instead of hardcoding colors.
