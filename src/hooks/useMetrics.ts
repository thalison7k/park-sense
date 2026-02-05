// src/hooks/useMetrics.ts
// Hook para gerenciamento de métricas de ocupação

import { useState, useEffect, useMemo } from 'react';
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
  const [isCalculating, setIsCalculating] = useState(false);

  const globalMetrics = useMemo(() => {
    if (!enabled || Object.keys(rawData).length === 0) {
      return null;
    }
    
    setIsCalculating(true);
    const metrics = calculateGlobalMetrics(rawData);
    setIsCalculating(false);
    
    return metrics;
  }, [rawData, enabled]);

  const spotMetrics = useMemo(() => {
    if (!enabled || Object.keys(rawData).length === 0) {
      return [];
    }

    return Object.entries(rawData).map(([id, historico]) =>
      calculateSpotMetrics(id, `Vaga ${id}`, historico)
    );
  }, [rawData, enabled]);

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
