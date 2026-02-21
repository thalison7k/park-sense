// ===============================
// Hook personalizado para gerenciar dados das vagas
// ===============================

// Importações do React
import { useState, useEffect, useCallback, useRef } from "react";

// Tipos do projeto
import { ParkingSpot, ParkingStats } from "@/types/parking";

// Serviço de API para buscar dados do backend
import { getAllVagas, mapApiToSpot, VagaHistoricoItem } from "@/services/api";


// ===============================
// Funções auxiliares
// ===============================

/**
 * Calcula as estatísticas do estacionamento baseado nas vagas
 * @param spots - Array de vagas
 * @returns Objeto com estatísticas calculadas
 */
const calculateStats = (spots: ParkingSpot[]): ParkingStats => {
  // Total de vagas no estacionamento
  const totalSpots = spots.length;

  // Conta vagas por status
  const freeSpots = spots.filter((s) => s.status === "free").length;
  const occupiedSpots = spots.filter((s) => s.status === "occupied").length;
  const inactiveSpots = spots.filter((s) => s.status === "inactive").length;

  // Vagas ativas (não inativas)
  const activeSpots = totalSpots - inactiveSpots;

  // Calcula percentual de ocupação (apenas vagas ativas)
  const averageOccupancy = activeSpots > 0 ? Math.round((occupiedSpots / activeSpots) * 100) : 0;

  // Retorna objeto com todas as estatísticas
  return {
    totalSpots,
    freeSpots,
    occupiedSpots,
    inactiveSpots,
    averageOccupancy,
    // Horários de pico (hardcoded por enquanto, pode vir do backend)
    peakHours: ["08:00-10:00", "17:00-19:00"],
  };
};

// Estatísticas vazias para estado inicial
const emptyStats: ParkingStats = {
  totalSpots: 0,
  freeSpots: 0,
  occupiedSpots: 0,
  inactiveSpots: 0,
  averageOccupancy: 0,
  peakHours: [],
};

// ===============================
// Hook principal
// ===============================

/**
 * Hook que gerencia o estado das vagas do estacionamento
 * Busca dados iniciais da API e recebe atualizações via MQTT
 */
export function useVagas() {
  // Estado das vagas formatadas para o frontend
  const [spots, setSpots] = useState<ParkingSpot[]>([]);

  // Dados brutos da API (histórico de cada vaga)
  const [rawData, setRawData] = useState<Record<string, VagaHistoricoItem[]>>({});

  // Estatísticas calculadas
  const [stats, setStats] = useState<ParkingStats>(emptyStats);

  // Flag de carregamento
  const [isLoading, setIsLoading] = useState(true);

  // Mensagem de erro, se houver
  const [error, setError] = useState<string | null>(null);

  // Status de conexão com a API
  const [isConnected, setIsConnected] = useState(false);

  // Ref para evitar múltiplas cargas iniciais
  const initialLoadDone = useRef(false);

  // ===============================
  // Função para buscar dados iniciais
  // ===============================

  /**
   * Busca todos os dados das vagas da API
   * Chamada apenas uma vez no carregamento
   */
  const fetchInitialData = useCallback(async () => {
    try {
      // Loga início da requisição
      console.log("[API] Buscando dados iniciais do backend...");

      // Ativa estado de carregamento
      setIsLoading(true);

      // Busca todas as vagas em paralelo
      const vagasRecord = await getAllVagas();

      // Armazena dados brutos para o gráfico de histórico
      setRawData(vagasRecord);

      // Converte dados da API para o formato do frontend
      const mappedSpots = Object.entries(vagasRecord)
        .map(([id, historico]) => mapApiToSpot(id, historico))
        // Ordena vagas por ID (A01, A02, ..., A40)
        .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

      // Atualiza estado das vagas
      setSpots(mappedSpots);

      // Calcula e atualiza estatísticas
      setStats(calculateStats(mappedSpots));

      // Limpa erro anterior se houver
      setError(null);

      // Marca como conectado
      setIsConnected(true);

      // Loga sucesso
      console.log("[API] Dados carregados com sucesso:", mappedSpots.length, "vagas");
    } catch (err) {
      // Em caso de erro, loga e atualiza estado
      console.error("[API] Erro ao buscar vagas:", err);

      // Define mensagem de erro amigável
      setError("Erro ao conectar com o backend. Verifique se o servidor está online.");

      // Marca como desconectado
      setIsConnected(false);

      // Limpa dados
      setSpots([]);
      setStats(emptyStats);
    } finally {
      // Desativa loading independente do resultado
      setIsLoading(false);
    }
  }, []);

  // ===============================
  // Effect para carga inicial
  // ===============================

  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;
    fetchInitialData();
  }, [fetchInitialData]);

  // ===============================
  // Função para refresh manual
  // ===============================

  /**
   * Força recarregamento dos dados da API
   */
  const refresh = useCallback(() => {
    // Reseta flag para permitir nova carga
    initialLoadDone.current = false;
    // Busca dados novamente
    fetchInitialData();
  }, [fetchInitialData]);

  // ===============================
  // Retorno do hook
  // ===============================

  return {
    spots,
    rawData,
    stats,
    isLoading,
    error,
    isConnected,
    refresh,
  };
}
