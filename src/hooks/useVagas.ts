// ===============================
// Hook personalizado para gerenciar dados das vagas
// ===============================

// Importações do React
import { useState, useEffect, useCallback, useRef } from "react";

// Tipos do projeto
import { ParkingSpot, ParkingStats } from "@/types/parking";

// Serviço de API para buscar dados do backend
import { getAllVagas, mapApiToSpot, VagaHistoricoItem } from "@/services/api";

// Serviço MQTT para atualizações em tempo real
import { mqttService, MqttMessage } from "@/services/mqttService";

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

  // Status de conexão com o MQTT
  const [isMqttConnected, setIsMqttConnected] = useState(false);

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
      const mappedSpots = Object.entries(vagasRecord).map(([id, historico]) => mapApiToSpot(id, historico));

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
  // Handler para mensagens MQTT
  // ===============================

  /**
   * Processa mensagens recebidas via MQTT
   * Atualiza o estado da vaga correspondente em tempo real
   */
  const handleMqttMessage = useCallback((message: MqttMessage) => {
    // Loga a mensagem recebida
    console.log("[MQTT] Atualizando vaga:", message.vagaId, "- Ocupada:", message.ocupada);

    // Atualiza o estado das vagas
    setSpots((prevSpots) => {
      // Define novo status baseado na mensagem
      const newStatus = message.ocupada ? "occupied" : "free";

      // Verifica se a vaga já existe no array
      const exists = prevSpots.some((spot) => spot.id === message.vagaId);

      let updatedSpots: ParkingSpot[];

      if (exists) {
        // Atualiza a vaga existente
        updatedSpots = prevSpots.map((spot) => {
          if (spot.id === message.vagaId) {
            return {
              ...spot,
              status: newStatus as "free" | "occupied" | "inactive",
              lastUpdate: message.timestamp,
              isOnline: true,
              occupancyHistory: [
                ...spot.occupancyHistory,
                { timestamp: message.timestamp, status: newStatus as "free" | "occupied" },
              ],
            };
          }
          return spot;
        });
      } else {
        // Vaga nova vinda do MQTT que não existia na API — cria ela
        updatedSpots = [
          ...prevSpots,
          {
            id: message.vagaId,
            name: `Vaga ${message.vagaId}`,
            status: newStatus as "free" | "occupied" | "inactive",
            sensorType: "ultrasonic" as const,
            lastUpdate: message.timestamp,
            isOnline: true,
            occupancyHistory: [{ timestamp: message.timestamp, status: newStatus as "free" | "occupied" }],
          },
        ];
      }

      // Recalcula estatísticas com os novos dados
      setStats(calculateStats(updatedSpots));

      // Retorna array atualizado
      return updatedSpots;
    });

    // Atualiza também os dados brutos (para o gráfico de histórico)
    setRawData((prev) => ({
      ...prev,
      [message.vagaId]: [
        // Mantém histórico anterior
        ...(prev[message.vagaId] || []),
        // Adiciona novo registro
        {
          data_hora: message.timestamp.toISOString(),
          ocupada: message.ocupada ? "True" : "False",
        },
      ],
    }));
  }, []);

  // ===============================
  // Effect para carga inicial e MQTT
  // ===============================

  useEffect(() => {
    // Evita múltiplas cargas iniciais
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    // Busca dados iniciais da API
    fetchInitialData();

    // Conecta ao broker MQTT para atualizações em tempo real
    mqttService
      .connect()
      .then(() => {
        // Marca como conectado ao MQTT
        setIsMqttConnected(true);
        console.log("[MQTT] Conectado e pronto para receber atualizações");
      })
      .catch((err) => {
        // Em caso de erro, loga mas continua funcionando
        console.error("[MQTT] Erro ao conectar:", err);
        setIsMqttConnected(false);
      });
  }, [fetchInitialData]);

  // ===============================
  // Effect para subscription MQTT
  // ===============================

  useEffect(() => {
    // Inscreve no serviço MQTT para receber mensagens
    const unsubscribe = mqttService.subscribe(handleMqttMessage);

    // Retorna função de cleanup para desinscrever
    return () => unsubscribe();
  }, [handleMqttMessage]);

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
    // Array de vagas formatadas
    spots,
    // Dados brutos para gráficos
    rawData,
    // Estatísticas do estacionamento
    stats,
    // Flag de carregamento
    isLoading,
    // Mensagem de erro
    error,
    // Status de conexão com API
    isConnected,
    // Status de conexão com MQTT
    isMqttConnected,
    // Função para forçar refresh
    refresh,
  };
}
