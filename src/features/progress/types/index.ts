/**
 * Shared types for the Progress feature. `LoadPoint` mirrors the shape
 * produced by `statisticsRepository.getLoadSeries` so the thin wrapper stays
 * type-compatible with the aggregated queries (D1).
 */
export type LoadPoint = {
  date: string;
  weightKg: number;
};