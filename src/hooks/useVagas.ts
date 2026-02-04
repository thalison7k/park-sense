import { useState, useEffect, useCallback } from 'react';
import { ParkingSpot } from '@/types/parking';
import { getAllVagas, mapApiToSpot } from '@/services/api';
import { mockParkingSpots, calculateStats } from '@/data/mockParkingData';

interface UseVagasOptions {
  useMockData?: boolean;
  refreshInterval?: number;
}

export function useVagas(options: UseVagasOptions = {}) {
  const { useMockData = false, refreshInterval = 5000 } = options;
  
  const [spots, setSpots] = useState<ParkingSpot[]>(mockParkingSpots);
  const [stats, setStats] = useState(() => calculateStats(mockParkingSpots));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const fetchVagas = useCallback(async () => {
    if (useMockData) {
      setSpots(mockParkingSpots);
      setStats(calculateStats(mockParkingSpots));
      setIsLoading(false);
      setIsConnected(true);
      return;
    }

    try {
      const vagas = await getAllVagas();
      const mappedSpots = vagas.map(mapApiToSpot);
      
      setSpots(mappedSpots);
      setStats(calculateStats(mappedSpots));
      setError(null);
      setIsConnected(true);
    } catch (err) {
      console.error('Erro ao buscar vagas:', err);
      setError('Erro ao conectar com o backend. Usando dados simulados.');
      setIsConnected(false);
      // Mantém dados mock em caso de erro
    } finally {
      setIsLoading(false);
    }
  }, [useMockData]);

  useEffect(() => {
    fetchVagas();

    // Atualização periódica
    const interval = setInterval(fetchVagas, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchVagas, refreshInterval]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    fetchVagas();
  }, [fetchVagas]);

  return {
    spots,
    stats,
    isLoading,
    error,
    isConnected,
    refresh,
  };
}
