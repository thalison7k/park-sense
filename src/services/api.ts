export const API_URL = "http://127.0.0.1";

export interface VagaResponse {
  id: string;
  nome: string;
  status: 'livre' | 'ocupada' | 'inativo';
  sensor_tipo: string;
  online: boolean;
  ultima_atualizacao: string;
}

export async function getVaga(sensor: string): Promise<VagaResponse> {
  const response = await fetch(`${API_URL}/vaga${sensor}.json`);

  if (!response.ok) {
    throw new Error("Erro ao buscar vaga");
  }

  return response.json();
}

export async function getAllVagas(): Promise<VagaResponse[]> {
  // Busca todas as vagas - ajuste os IDs conforme seu backend
  const vagaIds = [
    'A01', 'A02', 'A03', 'A04', 'A05', 'A06', 'A07', 'A08', 'A09', 'A10',
    'A11', 'A12', 'A13', 'A14', 'A15', 'A16', 'A17', 'A18', 'A19', 'A20',
    'A21', 'A22', 'A23', 'A24', 'A25', 'A26', 'A27', 'A28', 'A29', 'A30',
    'A31', 'A32', 'A33', 'A34', 'A35', 'A36', 'A37', 'A38', 'A39', 'A40',
  ];

  const promises = vagaIds.map(async (id) => {
    try {
      return await getVaga(id);
    } catch {
      // Retorna vaga inativa se não conseguir buscar
      return {
        id: `spot-${id}`,
        nome: id,
        status: 'inativo' as const,
        sensor_tipo: 'digital',
        online: false,
        ultima_atualizacao: new Date().toISOString(),
      };
    }
  });

  return Promise.all(promises);
}

// Mapeia resposta da API para o tipo ParkingSpot do frontend
export function mapApiToSpot(vaga: VagaResponse) {
  const statusMap: Record<string, 'free' | 'occupied' | 'inactive'> = {
    'livre': 'free',
    'ocupada': 'occupied',
    'inativo': 'inactive',
  };

  const sensorMap: Record<string, 'ultrasonic' | 'infrared' | 'reed_switch' | 'digital'> = {
    'ultrassonico': 'ultrasonic',
    'ultrasonic': 'ultrasonic',
    'infravermelho': 'infrared',
    'infrared': 'infrared',
    'reed_switch': 'reed_switch',
    'reed': 'reed_switch',
    'digital': 'digital',
  };

  return {
    id: vaga.id,
    name: vaga.nome,
    status: statusMap[vaga.status] || 'inactive',
    sensorType: sensorMap[vaga.sensor_tipo?.toLowerCase()] || 'digital',
    lastUpdate: new Date(vaga.ultima_atualizacao),
    isOnline: vaga.online,
    occupancyHistory: [],
  };
}
