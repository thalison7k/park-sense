// src/services/api.ts

// URL do proxy edge function no Lovable Cloud
const BASE_URL = "https://25382ca97f25.ngrok-free.app";

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
 * Busca TODAS as vagas de uma vez (endpoint otimizado)
 * Retorna Record<vagaId, historico[]>
 */
export async function getAllVagas(): Promise<Record<string, VagaHistoricoItem[]>> {
  const response = await fetch(`${BASE_URL}/all`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`Erro ao buscar todas as vagas: ${response.status}`);
  }

  return response.json();
}

/**
 * Busca o histórico de uma vaga específica (ex: A01)
 * Usa proxy edge function para contornar CORS
 */
export async function getVaga(sensor: string): Promise<VagaHistoricoItem[]> {
  const response = await fetch(`${PROXY_URL}/${sensor}`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`Erro ao buscar vaga ${sensor}`);
  }

  return response.json();
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
    status: ultimo.ocupada?.toLowerCase() === "true" ? "occupied" : "free",
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

/**
 * Calcula dados para o gráfico de ocupação por hora
 * Baseado nos dados reais do histórico
 */
export function calculateHourlyOccupancy(rawData: Record<string, VagaHistoricoItem[]>) {
  const hours = Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, "0")}:00`,
    occupied: 0,
    free: 0,
    total: 0,
  }));

  // Agrupa eventos por hora
  Object.values(rawData).forEach((historico) => {
    historico.forEach((item) => {
      const date = new Date(item.data_hora);
      const hour = date.getHours();
      const isOccupied = item.ocupada?.toLowerCase() === "true";

      hours[hour].total++;
      if (isOccupied) {
        hours[hour].occupied++;
      } else {
        hours[hour].free++;
      }
    });
  });

  // Normaliza para percentuais ou contagens médias
  return hours.map((h) => ({
    hour: h.hour,
    occupied: h.total > 0 ? Math.round((h.occupied / h.total) * 40) : 0,
    free: h.total > 0 ? Math.round((h.free / h.total) * 40) : 40,
  }));
}
