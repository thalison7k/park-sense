// src/services/metricsService.ts
// Serviço para cálculo de métricas de ocupação a partir do histórico

import { ParkingSpot, OccupancyRecord } from '@/types/parking';
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
 * Calcula a duração de ocupação entre dois eventos consecutivos
 */
function calculateOccupancyDuration(
  startTime: Date,
  endTime: Date
): number {
  const diffMs = endTime.getTime() - startTime.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60))); // minutos
}

/**
 * Converte histórico da API em períodos de ocupação
 */
export function parseOccupancyPeriods(
  historico: VagaHistoricoItem[]
): { start: Date; end: Date; durationMinutes: number }[] {
  const periods: { start: Date; end: Date; durationMinutes: number }[] = [];
  
  if (!historico || historico.length === 0) return periods;

  let occupancyStart: Date | null = null;

  for (let i = 0; i < historico.length; i++) {
    const item = historico[i];
    const isOccupied = item.ocupada?.toLowerCase() === 'true';
    const timestamp = new Date(item.data_hora);

    if (isOccupied && !occupancyStart) {
      // Início de ocupação
      occupancyStart = timestamp;
    } else if (!isOccupied && occupancyStart) {
      // Fim de ocupação
      const duration = calculateOccupancyDuration(occupancyStart, timestamp);
      periods.push({
        start: occupancyStart,
        end: timestamp,
        durationMinutes: duration,
      });
      occupancyStart = null;
    }
  }

  // Se ainda está ocupada, considera até agora
  if (occupancyStart) {
    const now = new Date();
    const duration = calculateOccupancyDuration(occupancyStart, now);
    periods.push({
      start: occupancyStart,
      end: now,
      durationMinutes: duration,
    });
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
  const periods = parseOccupancyPeriods(historico);
  
  const totalTime = periods.reduce((acc, p) => acc + p.durationMinutes, 0);
  const avgTime = periods.length > 0 ? totalTime / periods.length : 0;
  
  // Calcula taxa de utilização nas últimas 24h
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const recentPeriods = periods.filter(p => p.start >= yesterday);
  const recentTotalMinutes = recentPeriods.reduce((acc, p) => {
    const effectiveStart = p.start < yesterday ? yesterday : p.start;
    const effectiveEnd = p.end > now ? now : p.end;
    return acc + calculateOccupancyDuration(effectiveStart, effectiveEnd);
  }, 0);
  
  const utilizationRate = (recentTotalMinutes / (24 * 60)) * 100;
  const lastOccupancy = periods.length > 0 ? periods[periods.length - 1].end : null;

  return {
    spotId,
    spotName,
    averageOccupancyMinutes: Math.round(avgTime),
    totalOccupancyTime: totalTime,
    occupancyCount: periods.length,
    utilizationRate: Math.min(100, Math.round(utilizationRate * 10) / 10),
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
  
  // Calcula métricas para cada vaga
  Object.entries(spotsData).forEach(([id, historico]) => {
    const metrics = calculateSpotMetrics(id, `Vaga ${id}`, historico);
    spotMetrics.push(metrics);
  });

  // Ordena por utilização
  const sortedByUsage = [...spotMetrics].sort(
    (a, b) => b.utilizationRate - a.utilizationRate
  );

  // Vagas mais e menos utilizadas
  const mostUsedSpots = sortedByUsage.slice(0, 5);
  const leastUsedSpots = sortedByUsage
    .filter(s => s.occupancyCount > 0)
    .slice(-5)
    .reverse();

  // Média geral
  const avgOccupancy = spotMetrics.length > 0
    ? spotMetrics.reduce((acc, s) => acc + s.averageOccupancyMinutes, 0) / spotMetrics.length
    : 0;

  const avgUtilization = spotMetrics.length > 0
    ? spotMetrics.reduce((acc, s) => acc + s.utilizationRate, 0) / spotMetrics.length
    : 0;

  const totalEvents = spotMetrics.reduce((acc, s) => acc + s.occupancyCount, 0);

  // Calcula picos por hora (análise simplificada)
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
 * Calcula ocupação por hora do dia
 */
function calculateHourlyOccupancy(
  spotsData: Record<string, VagaHistoricoItem[]>
): { hour: number; occupancyRate: number }[] {
  const hourlyData: { [hour: number]: { occupied: number; total: number } } = {};
  
  // Inicializa todas as horas
  for (let h = 0; h < 24; h++) {
    hourlyData[h] = { occupied: 0, total: 0 };
  }

  // Conta eventos por hora
  Object.values(spotsData).forEach(historico => {
    historico.forEach(item => {
      const date = new Date(item.data_hora);
      const hour = date.getHours();
      const isOccupied = item.ocupada?.toLowerCase() === 'true';
      
      hourlyData[hour].total++;
      if (isOccupied) {
        hourlyData[hour].occupied++;
      }
    });
  });

  return Object.entries(hourlyData).map(([hour, data]) => ({
    hour: parseInt(hour),
    occupancyRate: data.total > 0 
      ? Math.round((data.occupied / data.total) * 100) 
      : 0,
  }));
}

/**
 * Formata tempo em minutos para exibição legível
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}
