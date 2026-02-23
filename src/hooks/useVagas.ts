// ===============================
// Hook personalizado para gerenciar dados das vagas
// ===============================

// Importações do React
import { useState, useEffect, useCallback, useRef } from "react";
import mqtt from "mqtt";

// Tipos do projeto
import { ParkingSpot, ParkingStats } from "@/types/parking";

// Serviço de API para buscar dados do backend
import { getAllVagas, mapApiToSpot, VagaHistoricoItem } from "@/services/api";

// ===============================
// Configuração MQTT
// ===============================
const MQTT_BROKER = "wss://test.mosquitto.org:8081";
const SUB_TOPIC = "pi5/estacionamento/vaga/#";
const TOPIC_PREFIX = "pi5/estacionamento/vaga";


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

  // Status de conexão MQTT
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
  // Effect para conexão MQTT
  // ===============================

  useEffect(() => {
    console.log("[MQTT] Conectando ao broker:", MQTT_BROKER);
    const client = mqtt.connect(MQTT_BROKER, {
      reconnectPeriod: 5000,
      connectTimeout: 10000,
    });

    client.on("connect", () => {
      console.log("[MQTT] Conectado! Inscrevendo em:", SUB_TOPIC);
      setIsMqttConnected(true);
      client.subscribe(SUB_TOPIC, (err) => {
        if (err) console.error("[MQTT] Erro ao inscrever:", err);
        else console.log("[MQTT] Inscrito com sucesso em", SUB_TOPIC);
      });
    });

    client.on("message", (topic, message) => {
      try {
        // Extrai o ID da vaga do tópico: pi5/estacionamento/vaga/A01 -> A01
        const vagaId = topic.replace(`${TOPIC_PREFIX}/`, "");
        const raw = message.toString();
        let ocupadaValue = "False";

        try {
          const payload = JSON.parse(raw);
          if (typeof payload === "object" && payload !== null) {
            // Formato objeto: { ocupada: "True" } ou { occupied: true }
            const val = payload.ocupada ?? payload.occupied ?? false;
            ocupadaValue = String(val).toLowerCase() === "true" ? "True" : "False";
          } else {
            // Formato simples: true / false / "True" / "False"
            ocupadaValue = String(payload).toLowerCase() === "true" ? "True" : "False";
          }
        } catch {
          // Não é JSON válido, trata como string direta
          ocupadaValue = raw.trim().toLowerCase() === "true" ? "True" : "False";
        }

        console.log(`[MQTT] Mensagem recebida - Vaga ${vagaId}: ocupada=${ocupadaValue}`);

        const novoItem: VagaHistoricoItem = {
          data_hora: new Date().toISOString(),
          ocupada: ocupadaValue,
        };

        // Atualiza rawData
        setRawData((prev) => {
          const updated = { ...prev };
          if (!updated[vagaId]) updated[vagaId] = [];
          updated[vagaId] = [...updated[vagaId], novoItem];
          return updated;
        });

        // Atualiza spots
        setSpots((prev) => {
          const updated = prev.map((spot) => {
            if (spot.id !== vagaId) return spot;
            return mapApiToSpot(vagaId, [...(spot.occupancyHistory.map(h => ({
              data_hora: h.timestamp.toISOString(),
              ocupada: h.status === "occupied" ? "True" : "False",
            }))), novoItem]);
          });

          // Se a vaga não existia, adiciona
          if (!prev.find((s) => s.id === vagaId)) {
            updated.push(mapApiToSpot(vagaId, [novoItem]));
            updated.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
          }

          // Recalcula stats
          setStats(calculateStats(updated));
          return updated;
        });
      } catch (err) {
        console.error("[MQTT] Erro ao processar mensagem:", err);
      }
    });

    client.on("error", (err) => {
      console.error("[MQTT] Erro:", err);
      setIsMqttConnected(false);
    });

    client.on("close", () => {
      console.log("[MQTT] Desconectado");
      setIsMqttConnected(false);
    });

    return () => {
      console.log("[MQTT] Desconectando...");
      client.end();
    };
  }, []);

  // ===============================
  // Effect para re-avaliar inatividade periodicamente
  // ===============================

  useEffect(() => {
    const interval = setInterval(() => {
      setSpots((prev) => {
        const updated = prev.map((spot) => {
          const diffSeconds = (Date.now() - spot.lastUpdate.getTime()) / 1000;
          if (diffSeconds > 30 && spot.status !== "inactive") {
            return { ...spot, status: "inactive" as const, isOnline: false };
          }
          return spot;
        });
        setStats(calculateStats(updated));
        return updated;
      });
    }, 5000); // checa a cada 5 segundos

    return () => clearInterval(interval);
  }, []);

  // ===============================
  // Função para refresh manual
  // ===============================

  const refresh = useCallback(() => {
    initialLoadDone.current = false;
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
    isMqttConnected,
    refresh,
  };
}
