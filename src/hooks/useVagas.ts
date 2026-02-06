import { useState, useEffect, useCallback, useRef } from 'react';
import { ParkingSpot, ParkingStats } from '@/types/parking';
import { getAllVagas, mapApiToSpot, VagaHistoricoItem } from '@/services/api';
import { mqttService, MqttMessage } from '@/services/mqttService';

const calculateStats = (spots: ParkingSpot[]): ParkingStats => {
  const totalSpots = spots.length;
  const freeSpots = spots.filter(s => s.status === 'free').length;
  const occupiedSpots = spots.filter(s => s.status === 'occupied').length;
  const inactiveSpots = spots.filter(s => s.status === 'inactive').length;
  
  const activeSpots = totalSpots - inactiveSpots;
  const averageOccupancy = activeSpots > 0 
    ? Math.round((occupiedSpots / activeSpots) * 100) 
    : 0;
  
  return {
    totalSpots,
    freeSpots,
    occupiedSpots,
    inactiveSpots,
    averageOccupancy,
    peakHours: ['08:00-10:00', '17:00-19:00'],
  };
};

const emptyStats: ParkingStats = {
  totalSpots: 0,
  freeSpots: 0,
  occupiedSpots: 0,
  inactiveSpots: 0,
  averageOccupancy: 0,
  peakHours: [],
};

export function useVagas() {
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [rawData, setRawData] = useState<Record<string, VagaHistoricoItem[]>>({});
  const [stats, setStats] = useState<ParkingStats>(emptyStats);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMqttConnected, setIsMqttConnected] = useState(false);
  const initialLoadDone = useRef(false);

  // Busca inicial dos dados da API
  const fetchInitialData = useCallback(async () => {
    try {
      console.log('[API] Buscando dados iniciais...');
      setIsLoading(true);
      
      const vagasRecord = await getAllVagas();
      setRawData(vagasRecord);
      
      const mappedSpots = Object.entries(vagasRecord).map(([id, historico]) => 
        mapApiToSpot(id, historico)
      );
      
      setSpots(mappedSpots);
      setStats(calculateStats(mappedSpots));
      setError(null);
      setIsConnected(true);
      console.log('[API] Dados carregados:', mappedSpots.length, 'vagas');
    } catch (err) {
      console.error('Erro ao buscar vagas:', err);
      setError('Erro ao conectar com o backend. Verifique se o servidor está online.');
      setIsConnected(false);
      setSpots([]);
      setStats(emptyStats);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
  }, [fetchInitialData]);

  // Subscribe às mensagens MQTT
  useEffect(() => {
    const unsubscribe = mqttService.subscribe(handleMqttMessage);
    return () => unsubscribe();
  }, [handleMqttMessage]);

  const refresh = useCallback(() => {
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
