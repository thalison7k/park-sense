// ===============================
// Configuração da URL base do backend Django
// ===============================

// URL do túnel ngrok que expõe o servidor Django local
const BASE_URL = "https://25382ca97f25.ngrok-free.app";

// ===============================
// Tipos de dados retornados pela API
// ===============================

/**
 * Interface que representa um item do histórico de uma vaga
 * Estrutura exata retornada pelo endpoint /vagaXXX.json
 */
export interface VagaHistoricoItem {
  // Data e hora do registro no formato ISO (ex: "2026-02-05T10:15:00")
  data_hora: string;
  // Status de ocupação: "True" = ocupada, "False" = livre
  ocupada: string;
}

// ===============================
// Funções de chamada HTTP à API
// ===============================

/**
 * Busca o histórico de uma vaga específica pelo ID do sensor
 * @param sensor - ID do sensor (ex: "A01", "B02", etc.)
 * @returns Array com o histórico de ocupação da vaga
 */
export async function getVaga(sensor: string): Promise<VagaHistoricoItem[]> {
  // Monta a URL completa: https://25382ca97f25.ngrok-free.app/vagaA01.json
  const url = `${BASE_URL}/vaga${sensor}.json`;
  
  // Faz a requisição GET para o endpoint
  const response = await fetch(url, {
    method: "GET",
    // Header necessário para bypass da tela de aviso do ngrok
    headers: {
      "ngrok-skip-browser-warning": "true",
    },
  });

  // Verifica se a resposta foi bem sucedida
  if (!response.ok) {
    throw new Error(`Erro ao buscar vaga ${sensor}: ${response.status}`);
  }

  // Retorna o JSON parseado
  return response.json();
}

/**
 * Busca os dados de todas as 40 vagas em paralelo
 * @returns Objeto com ID da vaga como chave e array de histórico como valor
 */
export async function getAllVagas(): Promise<Record<string, VagaHistoricoItem[]>> {
  // Lista de todos os IDs de vagas (A01-A10, B01-B10, C01-C10, D01-D10)
  const vagaIds: string[] = [];
  
  // Gera os IDs das vagas: A01-A10, B01-B10, C01-C10, D01-D10
  const rows = ["A", "B", "C", "D"];
  for (const row of rows) {
    for (let i = 1; i <= 10; i++) {
      // Formata o número com zero à esquerda (01, 02, ..., 10)
      vagaIds.push(`${row}${String(i).padStart(2, "0")}`);
    }
  }

  // Objeto para armazenar os resultados
  const results: Record<string, VagaHistoricoItem[]> = {};

  // Busca todas as vagas em paralelo usando Promise.allSettled
  // Isso permite que algumas falhem sem interromper as outras
  const promises = vagaIds.map(async (id) => {
    try {
      // Busca os dados da vaga
      const data = await getVaga(id);
      return { id, data };
    } catch (error) {
      // Em caso de erro, loga e retorna array vazio
      console.warn(`[API] Erro ao buscar vaga ${id}:`, error);
      return { id, data: [] };
    }
  });

  // Aguarda todas as promessas
  const responses = await Promise.all(promises);

  // Monta o objeto de resultados
  for (const { id, data } of responses) {
    results[id] = data;
  }

  // Retorna o objeto com todas as vagas
  return results;
}

// ===============================
// Funções de processamento de dados
// ===============================

/**
 * Extrai o estado atual de uma vaga a partir do seu histórico
 * @param historico - Array com o histórico de ocupação
 * @returns Objeto com status atual e data da última atualização
 */
export function getEstadoAtual(historico: VagaHistoricoItem[]) {
  // Se não há histórico, a vaga está inativa
  if (!historico || historico.length === 0) {
    return {
      status: "inactive" as const,
      lastUpdate: new Date(),
    };
  }

  // Pega o último registro do histórico (mais recente)
  const ultimo = historico[historico.length - 1];

  // Determina o status baseado no campo "ocupada"
  // "True" (case insensitive) = ocupada, qualquer outro valor = livre
  return {
    status: ultimo.ocupada?.toLowerCase() === "true" ? ("occupied" as const) : ("free" as const),
    lastUpdate: new Date(ultimo.data_hora),
  };
}

/**
 * Mapeia os dados da API para o modelo de ParkingSpot usado no frontend
 * @param id - ID da vaga (ex: "A01")
 * @param historico - Array com o histórico de ocupação
 * @returns Objeto ParkingSpot formatado para o frontend
 */
export function mapApiToSpot(id: string, historico: VagaHistoricoItem[]) {
  // Obtém o estado atual da vaga
  const estado = getEstadoAtual(historico);

  // Retorna o objeto formatado para o frontend
  return {
    // ID único da vaga
    id,
    // Nome amigável para exibição
    name: `Vaga ${id}`,
    // Status atual: "free", "occupied" ou "inactive"
    status: estado.status as "free" | "occupied" | "inactive",
    // Tipo de sensor (ultrassônico para este projeto)
    sensorType: "ultrasonic" as const,
    // Data/hora da última atualização
    lastUpdate: estado.lastUpdate,
    // Se a vaga está online (não inativa)
    isOnline: estado.status !== "inactive",
    // Histórico de ocupação convertido para o formato do frontend
    occupancyHistory: historico.map((item) => ({
      timestamp: new Date(item.data_hora),
      status: item.ocupada?.toLowerCase() === "true" ? ("occupied" as const) : ("free" as const),
    })),
  };
}

/**
 * Calcula a ocupação por hora baseado nos dados reais do histórico
 * @param rawData - Objeto com histórico de todas as vagas
 * @returns Array com ocupação por hora (00:00 até 23:00)
 */
export function calculateHourlyOccupancy(rawData: Record<string, VagaHistoricoItem[]>) {
  // Array para armazenar os dados por hora
  const hourlyData: { hour: string; occupied: number; free: number }[] = [];
  
  // Total de vagas no estacionamento
  const totalSpots = Object.keys(rawData).length || 40;

  // Itera por cada hora do dia (0 a 23)
  for (let h = 0; h < 24; h++) {
    // Formata a hora como "00:00", "01:00", etc.
    const hourStr = `${String(h).padStart(2, "0")}:00`;
    
    // Contador de vagas ocupadas nesta hora
    let occupiedCount = 0;

    // Para cada vaga, verifica o status nesta hora
    Object.values(rawData).forEach((historico) => {
      // Filtra registros até esta hora
      const relevantRecords = historico.filter((item) => {
        const itemHour = new Date(item.data_hora).getHours();
        return itemHour <= h;
      });

      // Se há registros, verifica o último status
      if (relevantRecords.length > 0) {
        const lastRecord = relevantRecords[relevantRecords.length - 1];
        // Se estava ocupada, incrementa o contador
        if (lastRecord.ocupada?.toLowerCase() === "true") {
          occupiedCount++;
        }
      }
    });

    // Adiciona os dados desta hora ao array
    hourlyData.push({
      hour: hourStr,
      occupied: occupiedCount,
      free: totalSpots - occupiedCount,
    });
  }

  // Retorna o array com dados de todas as horas
  return hourlyData;
}
