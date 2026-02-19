// src/hooks/useMetrics.ts
// Hook para gerenciamento de métricas de ocupação

import { useMemo } from 'react';
import { 
  calculateGlobalMetrics, 
  GlobalMetrics, 
  SpotMetrics,
  calculateSpotMetrics 
} from '@/services/metricsService';
import { VagaHistoricoItem } from '@/services/api';

interface UseMetricsOptions {
  rawData: Record<string, VagaHistoricoItem[]>;
  enabled?: boolean;
}

interface UseMetricsReturn {
  globalMetrics: GlobalMetrics | null;
  spotMetrics: SpotMetrics[];
  isCalculating: boolean;
  peakHoursFormatted: string[];
}

export function useMetrics({ rawData, enabled = true }: UseMetricsOptions): UseMetricsReturn {
  // isCalculating derivado diretamente — não usa setState dentro de useMemo
  const hasData = enabled && Object.keys(rawData).length > 0;

  const globalMetrics = useMemo(() => {
    if (!hasData) return null;
    return calculateGlobalMetrics(rawData);
  }, [rawData, hasData]);

  // isCalculating é sempre false pois o cálculo é síncrono
  const isCalculating = false;

  const spotMetrics = useMemo(() => {
    if (!hasData) return [];
    return Object.entries(rawData).map(([id, historico]) =>
      calculateSpotMetrics(id, `Vaga ${id}`, historico)
    );
  }, [rawData, hasData]);

  const peakHoursFormatted = useMemo(() => {
    if (!globalMetrics) return [];
    
    // Encontra as 3 horas com maior ocupação
    const sortedHours = [...globalMetrics.peakHours]
      .sort((a, b) => b.occupancyRate - a.occupancyRate)
      .slice(0, 3);
    
    return sortedHours.map(h => 
      `${h.hour.toString().padStart(2, '0')}:00 (${h.occupancyRate}%)`
    );
  }, [globalMetrics]);

  return {
    globalMetrics,
    spotMetrics,
    isCalculating,
    peakHoursFormatted,
  };
}
