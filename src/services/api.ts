// src/lib/api.ts

export const API_URL = "https://25382ca97f25.ngrok-free.app";

/**
 * Estrutura REAL retornada pelo backend
 * Ex: /vagaA01.json
 * Retorna uma LISTA de registros históricos
 */
export interface VagaHistoricoItem {
  data_hora: string;
  ocupada: string; // "True" | "False"
}

/**
 * Busca o histórico de uma vaga específica (ex: A01)
 */
export async function getVaga(sensor: string): Promise<VagaHistoricoItem[]> {
  const response = await fetch(`${API_URL}/vaga${sensor}.json`, {
    method: 'GET',
    headers: {
      'ngrok-skip-browser-warning': 'true',
      'User-Agent': 'ParkSense-Dashboard/1.0',
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Erro ao buscar vaga ${sensor}`);
  }

  return response.json();
}

/**
 * Busca o histórico de todas as vagas (A01 até A40)
 */
export async function getAllVagas(): Promise<Record<string, VagaHistoricoItem[]>> {
  const vagaIds = Array.from({ length: 40 }, (_, i) =>
    `A${String(i + 1).padStart(2, "0")}`
  );

  const result: Record<string, VagaHistoricoItem[]> = {};

  await Promise.all(
    vagaIds.map(async (id) => {
      try {
        result[id] = await getVaga(id);
      } catch {
        // Se alguma vaga não existir ou falhar, retorna histórico vazio
        result[id] = [];
      }
    })
  );

  return result;
}

/**
 * Converte o histórico em estado atual da vaga
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
    status:
      ultimo.ocupada?.toLowerCase() === "true" ? "occupied" : "free",
    lastUpdate: new Date(ultimo.data_hora),
  };
}

/**
 * Converte dados da API para o formato ParkingSpot do frontend
 */
export function mapApiToSpot(id: string, historico: VagaHistoricoItem[]) {
  const estado = getEstadoAtual(historico);
  
  return {
    id,
    name: `Vaga ${id}`,
    status: estado.status as 'free' | 'occupied' | 'inactive',
    sensorType: 'ultrasonic' as const,
    lastUpdate: estado.lastUpdate,
    isOnline: estado.status !== 'inactive',
    occupancyHistory: historico.map(item => ({
      timestamp: new Date(item.data_hora),
      status: item.ocupada?.toLowerCase() === 'true' ? 'occupied' as const : 'free' as const,
    })),
  };
}