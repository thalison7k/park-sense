import { useState, useEffect, useCallback, useRef } from 'react';
import { ParkingSpot } from '@/types/parking';
import { getAllVagas, mapApiToSpot, VagaHistoricoItem } from '@/services/api';
import { mockParkingSpots, calculateStats } from '@/data/mockParkingData';
import { mqttService, MqttMessage } from '@/services/mqttService';

interface UseVagasOptions {
  useMockData?: boolean;
}

export function useVagas(options: UseVagasOptions = {}) {
  const { useMockData = false } = options;
  
  const [spots, setSpots] = useState<ParkingSpot[]>(mockParkingSpots);
  const [rawData, setRawData] = useState<Record<string, VagaHistoricoItem[]>>({});
  const [stats, setStats] = useState(() => calculateStats(mockParkingSpots));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMqttConnected, setIsMqttConnected] = useState(false);
  const initialLoadDone = useRef(false);

  // Busca inicial dos dados (apenas uma vez)
  const fetchInitialData = useCallback(async () => {
    if (useMockData) {
      setSpots(mockParkingSpots);
      setStats(calculateStats(mockParkingSpots));
      setRawData({});
      setIsLoading(false);
      setIsConnected(true);
      return;
    }

    try {
      console.log('[API] Buscando dados iniciais...');
      const vagasRecord = await getAllVagas();
      setRawData(vagasRecord);
      
      const mappedSpots = Object.entries(vagasRecord).map(([id, historico]) => 
        mapApiToSpot(id, historico)
      );
      
      setSpots(mappedSpots);
      setStats(calculateStats(mappedSpots));
      setError(null);
      setIsConnected(true);
      console.log('[API] Dados iniciais carregados:', mappedSpots.length, 'vagas');
    } catch (err) {
      console.error('Erro ao buscar vagas:', err);
      setError('Erro ao conectar com o backend. Usando dados simulados.');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [useMockData]);

  // Handler para mensagens MQTT
  const handleMqttMessage = useCallback((message: MqttMessage) => {
    console.log('[MQTT] Atualizando vaga:', message.vagaId, '- Ocupada:', message.ocupada);
    
    setSpots(prevSpots => {
      const updatedSpots = prevSpots.map(spot => {
        if (spot.id === message.vagaId) {
          const newStatus = message.ocupada ? 'occupied' : 'free';
          return {
            ...spot,
            status: newStatus as 'free' | 'occupied' | 'inactive',
            lastUpdate: message.timestamp,
            isOnline: true,
            occupancyHistory: [
              ...spot.occupancyHistory,
              { timestamp: message.timestamp, status: newStatus as 'free' | 'occupied' }
            ]
          };
        }
        return spot;
      });
      
      // Recalcula estatísticas
      setStats(calculateStats(updatedSpots));
      return updatedSpots;
    });

    // Atualiza rawData também
    setRawData(prev => ({
      ...prev,
      [message.vagaId]: [
        ...(prev[message.vagaId] || []),
        {
          data_hora: message.timestamp.toISOString(),
          ocupada: message.ocupada ? 'True' : 'False'
        }
      ]
    }));
  }, []);

  // Carrega dados iniciais e conecta ao MQTT
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    fetchInitialData();

    if (!useMockData) {
      // Conecta ao MQTT para atualizações em tempo real
      mqttService.connect()
        .then(() => {
          setIsMqttConnected(true);
          console.log('[MQTT] Pronto para receber atualizações');
        })
        .catch((err) => {
          console.error('[MQTT] Erro ao conectar:', err);
          setIsMqttConnected(false);
        });
    }
  }, [fetchInitialData, useMockData]);

  // Subscribe às mensagens MQTT
  useEffect(() => {
    if (useMockData) return;

    const unsubscribe = mqttService.subscribe(handleMqttMessage);
    
    return () => {
      unsubscribe();
    };
  }, [handleMqttMessage, useMockData]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    initialLoadDone.current = false;
    fetchInitialData();
  }, [fetchInitialData]);

  return {
    spots,
    rawData,
    stats,
    isLoading,
    error,
    isConnected,
    isMqttConnected,
    refresh,
  };
}
