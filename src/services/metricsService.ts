// src/services/metricsService.ts
// Serviço para cálculo de métricas de ocupação a partir do histórico

import { VagaHistoricoItem } from './api';

/**
 * Representa métricas de uma vaga individual
 */
export interface SpotMetrics {
  spotId: string;
  spotName: string;
  averageOccupancyMinutes: number;
  totalOccupancyTime: number;
  occupancyCount: number;
  utilizationRate: number; // 0-100%
  lastOccupancy: Date | null;
}

/**
 * Representa métricas globais do estacionamento
 */
export interface GlobalMetrics {
  averageOccupancyMinutes: number;
  mostUsedSpots: SpotMetrics[];
  leastUsedSpots: SpotMetrics[];
  peakHours: { hour: number; occupancyRate: number }[];
  totalOccupancyEvents: number;
  averageUtilization: number;
}

/**
 * Calcula a duração de ocupação entre dois momentos (em minutos)
 */
function calculateOccupancyDuration(startTime: Date, endTime: Date): number {
  const diffMs = endTime.getTime() - startTime.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60)));
}

/**
 * Converte histórico da API em períodos de ocupação
 */
export function parseOccupancyPeriods(
  historico: VagaHistoricoItem[]
): { start: Date; end: Date; durationMinutes: number }[] {
  const periods: { start: Date; end: Date; durationMinutes: number }[] = [];

  if (!Array.isArray(historico) || historico.length === 0) return periods;

  let occupancyStart: Date | null = null;

  for (let i = 0; i < historico.length; i++) {
    const item = historico[i];
    const isOccupied = item.ocupada?.toLowerCase() === 'true';
    const timestamp = new Date(item.data_hora);

    if (isOccupied && !occupancyStart) {
      occupancyStart = timestamp;
    } else if (!isOccupied && occupancyStart) {
      const duration = calculateOccupancyDuration(occupancyStart, timestamp);
      periods.push({ start: occupancyStart, end: timestamp, durationMinutes: duration });
      occupancyStart = null;
    }
  }

  // Se ainda está ocupada, considera até agora
  if (occupancyStart) {
    const now = new Date();
    const duration = calculateOccupancyDuration(occupancyStart, now);
    periods.push({ start: occupancyStart, end: now, durationMinutes: duration });
  }

  return periods;
}

/**
 * Calcula métricas de uma vaga específica
 */
export function calculateSpotMetrics(
  spotId: string,
  spotName: string,
  historico: VagaHistoricoItem[]
): SpotMetrics {
  // Guard: garante que historico é array válido
  const safeHistorico = Array.isArray(historico) ? historico : [];
  const periods = parseOccupancyPeriods(safeHistorico);

  const totalTime = periods.reduce((acc, p) => acc + p.durationMinutes, 0);
  const avgTime = periods.length > 0 ? totalTime / periods.length : 0;

  // Taxa de utilização: tempo ocupada nas últimas 24h / 1440 min
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentTime = periods
    .filter(p => p.end > yesterday)
    .reduce((acc, p) => {
      const effectiveStart = p.start < yesterday ? yesterday : p.start;
      return acc + calculateOccupancyDuration(effectiveStart, p.end);
    }, 0);

  const utilizationRate = Math.min(100, Math.round((recentTime / 1440) * 100));
  const lastOccupancy = periods.length > 0 ? periods[periods.length - 1].start : null;

  return {
    spotId,
    spotName,
    averageOccupancyMinutes: Math.round(avgTime),
    totalOccupancyTime: totalTime,
    occupancyCount: periods.length,
    utilizationRate,
    lastOccupancy,
  };
}

/**
 * Calcula métricas globais a partir de todas as vagas
 */
export function calculateGlobalMetrics(
  spotsData: Record<string, VagaHistoricoItem[]>
): GlobalMetrics {
  const spotMetrics: SpotMetrics[] = [];

  // Filtra apenas vagas com dados reais (Array não vazio)
  Object.entries(spotsData).forEach(([id, historico]) => {
    if (!Array.isArray(historico) || historico.length === 0) return;
    const metrics = calculateSpotMetrics(id, `Vaga ${id}`, historico);
    spotMetrics.push(metrics);
  });

  const sortedByUsage = [...spotMetrics].sort((a, b) => b.utilizationRate - a.utilizationRate);
  const mostUsedSpots = sortedByUsage.slice(0, 5);
  const leastUsedSpots = sortedByUsage.filter(s => s.occupancyCount > 0).slice(-5).reverse();

  const avgOccupancy = spotMetrics.length > 0
    ? spotMetrics.reduce((acc, s) => acc + s.averageOccupancyMinutes, 0) / spotMetrics.length
    : 0;

  const avgUtilization = spotMetrics.length > 0
    ? spotMetrics.reduce((acc, s) => acc + s.utilizationRate, 0) / spotMetrics.length
    : 0;

  const totalEvents = spotMetrics.reduce((acc, s) => acc + s.occupancyCount, 0);
  const hourlyOccupancy = calculateHourlyOccupancy(spotsData);

  return {
    averageOccupancyMinutes: Math.round(avgOccupancy),
    mostUsedSpots,
    leastUsedSpots,
    peakHours: hourlyOccupancy,
    totalOccupancyEvents: totalEvents,
    averageUtilization: Math.round(avgUtilization * 10) / 10,
  };
}

/**
 * Calcula ocupação por hora do dia (com guard para historico inválido)
 */
function calculateHourlyOccupancy(
  spotsData: Record<string, VagaHistoricoItem[]>
): { hour: number; occupancyRate: number }[] {
  const hourlyData: { [hour: number]: { occupied: number; total: number } } = {};

  for (let h = 0; h < 24; h++) {
    hourlyData[h] = { occupied: 0, total: 0 };
  }

  Object.values(spotsData).forEach(historico => {
    // Guard: ignora entradas undefined/null/não-array (vagas que deram 404)
    if (!Array.isArray(historico)) return;

    historico.forEach(item => {
      const date = new Date(item.data_hora);
      const hour = date.getHours();
      const isOccupied = item.ocupada?.toLowerCase() === 'true';

      hourlyData[hour].total++;
      if (isOccupied) hourlyData[hour].occupied++;
    });
  });

  return Object.entries(hourlyData).map(([hour, data]) => ({
    hour: parseInt(hour),
    occupancyRate: data.total > 0 ? Math.round((data.occupied / data.total) * 100) : 0,
  }));
}

/**
 * Formata tempo em minutos para exibição legível
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}
