// ===============================
// URL REAL DO BACKEND
// ===============================

const BASE_URL = "https://25382ca97f25.ngrok-free.app";

// ===============================
// Tipos
// ===============================

/**
 * Estrutura REAL retornada pelo backend
 * Ex: /vagaA01.json
 */
export interface VagaHistoricoItem {
  data_hora: string;
  ocupada: string; // "True" | "False"
}

// ===============================
// API
// ===============================

/**
 * Busca o histórico de uma vaga específica (ex: A01)
 * Endpoint REAL: /vagaA01.json
 */
export async function getVaga(sensor: string): Promise<VagaHistoricoItem[]> {
  // Faz requisição GET com header para bypass do ngrok
  const response = await fetch(`${BASE_URL}/vaga${sensor}.json`, {
    method: "GET",
    headers: {
      // Header obrigatório para evitar página de aviso do ngrok
      "ngrok-skip-browser-warning": "true",
    },
  });

  // Se resposta não for OK, lança erro
  if (!response.ok) {
    throw new Error(`Erro ao buscar vaga ${sensor}: ${response.status}`);
  }

  // Retorna dados parseados como JSON
  return response.json();
}

/**
 * Busca TODAS as vagas
 * (como o backend não tem /all, montamos no frontend)
 */
export async function getAllVagas(): Promise<Record<string, VagaHistoricoItem[]>> {
  const sensores = ["A01"]; // ← adicione mais se existirem
  const result: Record<string, VagaHistoricoItem[]> = {};

  await Promise.all(
    sensores.map(async (sensor) => {
      result[sensor] = await getVaga(sensor);
    }),
  );

  return result;
}

// ===============================
// Lógica de domínio
// ===============================

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
    status: ultimo.ocupada?.toLowerCase() === "true" ? ("occupied" as const) : ("free" as const),
    lastUpdate: new Date(ultimo.data_hora),
  };
}

/**
 * Converte dados da API para o formato usado no frontend
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

// ===============================
// Gráfico de ocupação por hora
// ===============================

export function calculateHourlyOccupancy(rawData: Record<string, VagaHistoricoItem[]>) {
  const hours = Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, "0")}:00`,
    occupied: 0,
    free: 0,
    total: 0,
  }));

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

  return hours.map((h) => ({
    hour: h.hour,
    occupied: h.total > 0 ? Math.round((h.occupied / h.total) * 40) : 0,
    free: h.total > 0 ? Math.round((h.free / h.total) * 40) : 40,
  }));
}
