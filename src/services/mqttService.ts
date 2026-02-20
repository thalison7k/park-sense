// ===============================
// Serviço MQTT para comunicação em tempo real
// ===============================

// Importa a biblioteca MQTT
import mqtt from "mqtt";

// ===============================
// Configurações do broker MQTT
// ===============================

// URL do broker MQTT público (test.mosquitto.org via WebSocket seguro)
// Porta 8081 é para conexões WebSocket seguras (wss://)
const BROKER_URL = "wss://test.mosquitto.org:8081";

// Padrão de tópico para subscrição
// # é wildcard que captura qualquer sufixo (A01, B02, etc.)
// Formato das mensagens: pi5/estacionamento/vaga/A01, pi5/estacionamento/vaga/B02, etc.
const TOPIC_PATTERN = "pi5/estacionamento/vaga/#";

// ===============================
// Tipos
// ===============================

/**
 * Interface que representa uma mensagem MQTT processada
 */
export interface MqttMessage {
  // ID da vaga extraído do tópico (ex: "A01", "B02")
  vagaId: string;
  // Status de ocupação (true = ocupada, false = livre)
  ocupada: boolean;
  // Momento em que a mensagem foi recebida
  timestamp: Date;
}

// Tipo para função callback que processa mensagens
type MessageCallback = (message: MqttMessage) => void;

// ===============================
// Classe do serviço MQTT
// ===============================

/**
 * Serviço singleton para gerenciar conexão MQTT
 * Mantém conexão única com o broker e distribui mensagens
 */
class MqttService {
  // Cliente MQTT (null quando desconectado)
  private client: mqtt.MqttClient | null = null;

  // Set de callbacks registrados para receber mensagens
  private subscribers: Set<MessageCallback> = new Set();

  // Flag que indica se está no processo de conexão
  private isConnecting = false;

  // Contador de tentativas de reconexão
  private reconnectAttempts = 0;

  // Máximo de tentativas de reconexão antes de desistir
  private maxReconnectAttempts = 5;

  /**
   * Conecta ao broker MQTT
   * @returns Promise que resolve quando conectado e subscrito
   */
  connect(): Promise<void> {
    // Se já está conectado ou conectando, retorna imediatamente
    if (this.client?.connected || this.isConnecting) {
      return Promise.resolve();
    }

    // Marca que está tentando conectar
    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      try {
        // Cria cliente MQTT com configurações
        this.client = mqtt.connect(BROKER_URL, {
          // ID único do cliente para identificação no broker
          clientId: `lovable_parking_${Math.random().toString(16).slice(2, 10)}`,
          // Sessão limpa (não persiste mensagens)
          clean: true,
          // Timeout de conexão em milissegundos
          connectTimeout: 10000,
          // Intervalo entre tentativas de reconexão em ms
          reconnectPeriod: 5000,
        });

        // Handler executado quando conexão é estabelecida
        this.client.on("connect", () => {
          // Loga sucesso da conexão
          console.log("[MQTT] Conectado ao broker");

          // Reseta flags de conexão
          this.isConnecting = false;
          this.reconnectAttempts = 0;

          // Inscreve no padrão de tópicos das vagas
          this.client?.subscribe(TOPIC_PATTERN, { qos: 0 }, (err) => {
            if (err) {
              // Erro ao subscrever
              console.error("[MQTT] Erro ao subscrever:", err);
              reject(err);
            } else {
              // Subscrição bem sucedida
              console.log("[MQTT] Subscrito em:", TOPIC_PATTERN);
              resolve();
            }
          });
        });

        // Handler para mensagens recebidas
        this.client.on("message", (topic, payload) => {
          try {
            // Extrai o ID da vaga do tópico
            // Exemplo: "pi5/estacionamento/vaga/A01" -> ["pi5", "estacionamento", "vaga", "A01"]
            const parts = topic.split("/");
            // Pega o último elemento que é o ID da vaga
            const vagaId = parts[parts.length - 1];

            // Variável para armazenar status de ocupação
            let ocupada = false;

            // Converte payload de Buffer para string
            const payloadStr = payload.toString();

            try {
              // Tenta parsear como JSON
              const data = JSON.parse(payloadStr);
              // Aceita várias formas de "true": boolean true, string "True" ou "true"
              ocupada = data.ocupada === true || data.ocupada === "True" || data.ocupada === "true";
            } catch {
              // Se não for JSON válido, trata como string simples
              // Aceita "true" (case insensitive) ou "1"
              ocupada = payloadStr.toLowerCase() === "true" || payloadStr === "1";
            }

            // Cria objeto de mensagem padronizado
            const message: MqttMessage = {
              vagaId,
              ocupada,
              timestamp: new Date(),
            };

            // Loga mensagem processada
            console.log("[MQTT] Mensagem recebida:", message);

            // Notifica todos os callbacks registrados
            this.subscribers.forEach((callback) => callback(message));
          } catch (error) {
            // Erro no processamento não deve quebrar o serviço
            console.error("[MQTT] Erro ao processar mensagem:", error);
          }
        });

        // Handler para erros de conexão
        this.client.on("error", (error) => {
          console.error("[MQTT] Erro:", error);
          this.isConnecting = false;
        });

        // Handler para conexão fechada
        this.client.on("close", () => {
          console.log("[MQTT] Conexão fechada");
          this.isConnecting = false;
        });

        // Handler para tentativas de reconexão
        this.client.on("reconnect", () => {
          // Incrementa contador de tentativas
          this.reconnectAttempts++;
          console.log(`[MQTT] Tentando reconectar (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

          // Se atingiu máximo de tentativas, desiste
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.warn("[MQTT] Máximo de tentativas atingido");
            this.client?.end();
          }
        });
      } catch (error) {
        // Erro na criação do cliente
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Registra um callback para receber mensagens MQTT
   * @param callback - Função a ser chamada quando chegar mensagem
   * @returns Função para cancelar a inscrição
   */
  subscribe(callback: MessageCallback): () => void {
    // Adiciona callback ao set de subscribers
    this.subscribers.add(callback);

    // Auto-conecta se ainda não estiver conectado
    if (!this.client?.connected && !this.isConnecting) {
      this.connect().catch(console.error);
    }

    // Retorna função de cleanup para remover o callback
    return () => {
      // Remove callback do set
      this.subscribers.delete(callback);

      // Se não há mais subscribers, desconecta para economizar recursos
      if (this.subscribers.size === 0) {
        this.disconnect();
      }
    };
  }

  /**
   * Desconecta do broker MQTT
   */
  disconnect(): void {
    if (this.client) {
      // Encerra conexão
      this.client.end();
      // Limpa referência
      this.client = null;
      console.log("[MQTT] Desconectado");
    }
  }

  /**
   * Retorna status atual de conexão
   * @returns true se conectado, false caso contrário
   */
  isConnected(): boolean {
    // Usa optional chaining e nullish coalescing
    return this.client?.connected ?? false;
  }
}

// ===============================
// Exporta instância singleton
// ===============================

// Cria instância única do serviço para uso em toda a aplicação
export const mqttService = new MqttService();
