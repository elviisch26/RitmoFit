/**
 * Tipos compartidos de la feature Progreso. `LoadPoint` refleja la forma que
 * produce `statisticsRepository.getLoadSeries` para que el wrapper fino siga
 * siendo compatible en tipos con las consultas agregadas (D1).
 */
export type LoadPoint = {
  date: string;
  weightKg: number;
};