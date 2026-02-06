// ===============================
// src/services/api.ts
// Serviço de API para comunicação com o backend Django
// ===============================

// URL base do túnel ngrok que expõe o servidor Django
const BASE_URL = "https://25382ca97f25.ngrok-free.app";

// ===============================
// Interfaces de tipos de dados
// ===============================

/**
 * Interface que representa um item do histórico de uma vaga
 * Estrutura retornada pelo backend Django em /vagaXXX.json
 */
export interface VagaHistoricoItem {
  // Data e hora do registro no formato ISO string
  data_hora: string;
  // Status de ocupação: "True" = ocupada, "False" = livre
  ocupada: string;
}

// ===============================
// Funções de requisição à API
// ===============================

/**
 * Busca dados de uma vaga específica pelo ID do sensor
 * Endpoint: GET /vagaXXX.json (ex: /vagaA01.json)
 * @param sensor - ID da vaga (ex: "A01", "B05", "C10")
 * @returns Array com histórico de ocupação da vaga
 */
export async function getVaga(sensor: string): Promise<VagaHistoricoItem[]> {
  // Monta a URL completa: BASE_URL + /vaga + sensor + .json
  const url = `${BASE_URL}/vaga${sensor}.json`;
  
  // Faz a requisição GET para o endpoint da vaga
  const response = await fetch(url, {
    // Método HTTP GET para buscar dados
    method: "GET",
    // Headers necessários para a requisição
    headers: {
      // Indica que esperamos resposta em JSON
      "Content-Type": "application/json",
      // Header especial do ngrok para pular a página de aviso do navegador
      "ngrok-skip-browser-warning": "true",
    },
  });

  // Verifica se a resposta foi bem-sucedida (status 200-299)
  if (!response.ok) {
    // Se falhou, lança erro com o código de status
    throw new Error(`Erro ao buscar vaga ${sensor}: ${response.status}`);
  }

  // Converte a resposta JSON para objeto JavaScript e retorna
  return response.json();
}

/**
 * Busca dados de TODAS as vagas de uma vez (40 vagas: A01-A10, B01-B10, C01-C10, D01-D10)
 * Faz requisições em paralelo para cada vaga e consolida os resultados
 * @returns Objeto onde chave = ID da vaga, valor = array de histórico
 */
export async function getAllVagas(): Promise<Record<string, VagaHistoricoItem[]>> {
  // Array com as letras dos setores do estacionamento
  const setores = ["A", "B", "C", "D"];
  
  // Gera array com todos os IDs de vagas: A01, A02, ..., D10
  const vagaIds: string[] = [];
  
  // Para cada setor (A, B, C, D)
  for (const setor of setores) {
    // Para cada número de vaga (01 a 10)
    for (let num = 1; num <= 10; num++) {
      // Formata o número com zero à esquerda (01, 02, ..., 10)
      const numFormatado = String(num).padStart(2, "0");
      // Adiciona o ID completo ao array (ex: A01, B05)
      vagaIds.push(`${setor}${numFormatado}`);
    }
  }

  // Objeto que armazenará os resultados de todas as vagas
  const resultado: Record<string, VagaHistoricoItem[]> = {};

  // Faz todas as requisições em paralelo usando Promise.allSettled
  // Isso permite que algumas falhem sem afetar as outras
  const promessas = vagaIds.map(async (vagaId) => {
    try {
      // Busca dados da vaga específica
      const historico = await getVaga(vagaId);
      // Retorna objeto com ID e dados
      return { vagaId, historico };
    } catch (erro) {
      // Se falhar, loga o erro e retorna array vazio
      console.warn(`Falha ao buscar vaga ${vagaId}:`, erro);
      return { vagaId, historico: [] };
    }
  });

  // Aguarda todas as promessas serem resolvidas
  const resultados = await Promise.all(promessas);

  // Popula o objeto de resultado com os dados de cada vaga
  for (const { vagaId, historico } of resultados) {
    resultado[vagaId] = historico;
  }

  // Retorna o objeto consolidado com todas as vagas
  return resultado;
}

// ===============================
// Funções de processamento de dados
// ===============================

/**
 * Converte o array de histórico em estado atual da vaga
 * Pega o último registro do histórico para determinar o status atual
 * @param historico - Array com histórico de ocupação
 * @returns Objeto com status atual e data da última atualização
 */
export function getEstadoAtual(historico: VagaHistoricoItem[]) {
  // Se não há histórico, retorna vaga como inativa
  if (!historico || historico.length === 0) {
    return {
      // Status inativo indica sem dados
      status: "inactive" as const,
      // Data atual como última atualização
      lastUpdate: new Date(),
    };
  }

  // Pega o último item do histórico (mais recente)
  const ultimo = historico[historico.length - 1];

  // Retorna o estado baseado no último registro
  return {
    // Converte "True"/"False" para "occupied"/"free"
    status: ultimo.ocupada?.toLowerCase() === "true" ? "occupied" : "free",
    // Converte a string de data para objeto Date
    lastUpdate: new Date(ultimo.data_hora),
  };
}

/**
 * Converte dados da API para o formato ParkingSpot usado no frontend
 * Mapeia a estrutura do backend para a estrutura de componentes React
 * @param id - ID da vaga (ex: "A01")
 * @param historico - Array com histórico de ocupação
 * @returns Objeto ParkingSpot formatado para o frontend
 */
export function mapApiToSpot(id: string, historico: VagaHistoricoItem[]) {
  // Obtém o estado atual da vaga
  const estado = getEstadoAtual(historico);

  // Retorna objeto no formato esperado pelo frontend
  return {
    // ID único da vaga
    id,
    // Nome legível para exibição (ex: "Vaga A01")
    name: `Vaga ${id}`,
    // Status atual: "free", "occupied" ou "inactive"
    status: estado.status as "free" | "occupied" | "inactive",
    // Tipo do sensor (ultrassônico para este projeto)
    sensorType: "ultrasonic" as const,
    // Data/hora da última atualização
    lastUpdate: estado.lastUpdate,
    // Vaga está online se não estiver inativa
    isOnline: estado.status !== "inactive",
    // Histórico de ocupação formatado para gráficos
    occupancyHistory: historico.map((item) => ({
      // Converte string de data para objeto Date
      timestamp: new Date(item.data_hora),
      // Converte "True"/"False" para "occupied"/"free"
      status: item.ocupada?.toLowerCase() === "true" ? ("occupied" as const) : ("free" as const),
    })),
  };
}

/**
 * Calcula dados de ocupação por hora para o gráfico
 * Agrupa os registros históricos por hora do dia
 * @param rawData - Dados brutos de todas as vagas
 * @returns Array com ocupação por hora (00:00 a 23:00)
 */
export function calculateHourlyOccupancy(rawData: Record<string, VagaHistoricoItem[]>) {
  // Cria array com 24 posições (uma para cada hora do dia)
  const hours = Array.from({ length: 24 }, (_, i) => ({
    // Hora formatada (ex: "00:00", "14:00")
    hour: `${String(i).padStart(2, "0")}:00`,
    // Contador de registros ocupados nesta hora
    occupied: 0,
    // Contador de registros livres nesta hora
    free: 0,
    // Total de registros nesta hora
    total: 0,
  }));

  // Itera sobre todas as vagas e seus históricos
  Object.values(rawData).forEach((historico) => {
    // Para cada registro no histórico
    historico.forEach((item) => {
      // Extrai a hora do registro
      const date = new Date(item.data_hora);
      const hour = date.getHours();
      // Verifica se estava ocupada
      const isOccupied = item.ocupada?.toLowerCase() === "true";

      // Incrementa os contadores da hora correspondente
      hours[hour].total++;
      if (isOccupied) {
        hours[hour].occupied++;
      } else {
        hours[hour].free++;
      }
    });
  });

  // Normaliza os dados para exibição no gráfico
  return hours.map((h) => ({
    // Mantém a hora formatada
    hour: h.hour,
    // Calcula proporção de ocupados (normalizado para escala de 40)
    occupied: h.total > 0 ? Math.round((h.occupied / h.total) * 40) : 0,
    // Calcula proporção de livres (normalizado para escala de 40)
    free: h.total > 0 ? Math.round((h.free / h.total) * 40) : 40,
  }));
}
