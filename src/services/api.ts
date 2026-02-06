// ===============================
// Configuração base do backend
// ===============================

// URL base do backend exposto via ngrok
const BASE_URL = "https://25382ca97f25.ngrok-free.app";

// ===============================
// Tipos retornados pela API
// ===============================

/**
 * Estrutura REAL retornada pelo backend
 * Exemplo de cada item:
 * {
 *   data_hora: "2026-02-05T10:15:00",
 *   ocupada: "True" | "False"
 * }
 */
export interface VagaHistoricoItem {
  data_hora: string;
  ocupada: string;
}

// ===============================
// Chamadas HTTP
// ===============================

/**
 * Busca o histórico de uma vaga específica
 * Exemplo: sensor = "A01" → /vagaA01.json
 */
export async function getVaga(sensor: string): Promise<VagaHistoricoItem[]> {
  const response = await fetch(`${BASE_URL}/vaga${sensor}.json`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`Erro ao buscar vaga ${sensor}: ${response.status}`);
  }

  return response.json();
}

// ===============================
// Lógica de domínio
// ===============================

/**
 * Converte o histórico no estado atual da vaga
 */
export function getEstadoAtual(historico: VagaHistoricoItem[]) {
  if (!historico || historico.length === 0) {
    return {
      status: "inactive" as const,
      lastUpdate: new Date(),
    };
  }

  const ultimo = historico[historico.length - 1];

  return {
    status: ultimo.ocupada?.toLowerCase() === "true" ? ("occupied" as const) : ("free" as const),
    lastUpdate: new Date(ultimo.data_hora),
  };
}

/**
 * Mapeia dados da API para o modelo usado no frontend
 */
export function mapApiToSpot(id: string, historico: VagaHistoricoItem[]) {
  const estado = getEstadoAtual(historico);

  return {
    id,
    name: `Vaga ${id}`,
    status: estado.status as "free" | "occupied" | "inactive",
    sensorType: "ultrasonic" as const,
    lastUpdate: estado.lastUpdate,
    isOnline: estado.status !== "inactive",
    occupancyHistory: historico.map((item) => ({
      timestamp: new Date(item.data_hora),
      status: item.ocupada?.toLowerCase() === "true" ? ("occupied" as const) : ("free" as const),
    })),
  };
}
