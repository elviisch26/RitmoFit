# RitmoFit

App de seguimiento de entrenamientos (fitness) en React Native, construida con Expo SDK 57, TypeScript y una arquitectura local-first.

## Stack

- **Expo SDK 57** (React Native 0.86, React 19)
- **TypeScript 6** — modo estricto
- **expo-sqlite + Drizzle ORM** — base de datos local
- **TanStack Query** — capa de acceso a datos sobre SQLite
- **Zustand** — estado de dominio, ubicado por feature
- **React Navigation** (bottom tabs + native stack)
- **React Hook Form + Zod** — formularios y validación
- **expo-notifications** — recordatorios locales
- **react-native-gifted-charts** — gráficos de progreso
- **react-native-reanimated** — animaciones de UI
- **Jest + React Native Testing Library** — tests unitarios y de componentes

## Arquitectura

```
src/
  app/                 # Shell de la app: providers, navegación, entrada
    navigation/        #   RootNavigator (bottom tabs)
    providers/         #   AppProviders (QueryClient, gesture handler, safe area)
  database/            # schema, client, migrations, seed
  shared/              # components, hooks, constants, utils, theme
  features/            # features de dominio, cada una autocontenida:
    <feature>/
      components/
      screens/
      hooks/
      store/           # store de Zustand
      types/
      tests/
```

- **El estado de dominio vive con su feature** (`features/<feature>/store/`). No existe una carpeta global de stores; solo las preocupaciones de toda la app (tema/preferencias) pueden vivir a nivel de app.
- **La capa de datos es local-first**: SQLite vía expo-sqlite, con Drizzle como capa de esquema/consultas y TanStack Query encima para caching e invalidación estilo servidor.
- **No hay tabla `history`**: el progreso/historial se deriva consultando entrenamientos y series.

## Base de datos

El esquema se define en `src/database/schema.ts` (users, goals, workouts, workout_exercises, sets, exercise_templates, routines, routine_exercises, notifications).

- `src/database/migrations.ts` — bootstrap idempotente con `CREATE TABLE IF NOT EXISTS`, ejecutado al arrancar la app vía `bootstrapDatabase()` en `src/database/client.ts`.
- `src/database/seed.ts` — siembra el catálogo de templates de ejercicios (~45 ejercicios) de forma idempotente.
- Las rutinas tienen un campo `goal` (enum `strength` / `hypertrophy` / `cardio` / `endurance`, default `strength`).
- Rutinas de ejemplo bajo demanda (Full Body, Push, Pull), cargadas desde el botón "Usar rutinas de ejemplo" en el estado vacío de la lista de rutinas.

Para futuros cambios de esquema, generar migraciones de Drizzle con `drizzle-kit` (config `driver: "expo"`) y reemplazar el runner de migraciones por el enfoque de `.sql` embebido + Metro.

## Scripts

- `npm start` — inicia el servidor de desarrollo de Expo
- `npm run test` — ejecuta los tests de Jest
- `npm run typecheck` — ejecuta `tsc --noEmit`
- `npx expo install <pkg>` — instala paquetes en versiones compatibles con Expo

## Testing

Jest está configurado con el preset `jest-expo`. `jest.setup.ts` mockea `react-native-safe-area-context` y `react-native-reanimated` para el entorno de tests.

Nota: `render` de `@testing-library/react-native` v14 es asíncrono — siempre `await render(...)` antes de consultar `screen`.

## Convenciones

- El código se escribe con identificadores en inglés; los comentarios y la documentación van en español.
- Las pantallas de feature viven en `features/<feature>/screens/`; la UI compartida en `shared/components/`.
- Seguir los tokens de tema existentes en `src/shared/theme.ts` en lugar de hardcodear colores.
