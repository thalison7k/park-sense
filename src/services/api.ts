// src/lib/api.ts

export const API_URL = "http://127.0.0.1:8000";

/**
 * Estrutura REAL do backend
 * /vagaA01.json retorna uma LISTA de registros
 */
export interface VagaHistoricoItem {
  data_hora: string;
  ocupada: string; // "True" | "False"
}

/**
 * Busca o histórico da vaga (ex: A01)
 */
export async function getVaga(sensor: string): Promise<VagaHistoricoItem[]> {
  const response = await fetch(`${API_URL}/vaga${sensor}.json`);

  if (!response.ok) {
    throw new Error("Erro ao buscar vaga");
  }

  return response.json();
}

/**
 * Busca todas as vagas (A01 até A40)
 */
export async function getAllVagas(): Promise<Record<string, VagaHistoricoItem[]>> {
  const vagaIds = [
    'A01','A02','A03','A04','A05','A06','A07','A08','A09','A10',
    'A11','A12','A13','A14','A15','A16','A17','A18','A19','A20',
    'A21','A22','A23','A24','A25','A26','A27','A28','A29','A30',
    'A31','A32','A33','A34','A35','A36','A37','A38','A39','A40',
  ];

  const result: Record<string, VagaHistoricoItem[]> = {};

  await Promise.all(
    vagaIds.map(async (id) => {
      try {
        result[id] = await getVaga(id);
      } catch {
        result[id] = [];
      }
    })
  );

  return result;
}

/**
 * Converte histórico em estado atual da vaga
 */
export function getEstadoAtual(historico: VagaHistoricoItem[]) {
  const ultimo = historico.at(-1);

  return {
    status: ultimo?.ocupada === "True" ? "occupied" : "free",
    lastUpdate: ultimo?.data_hora
      ? new Date(ultimo.data_hora)
      : new Date(),
  };
}