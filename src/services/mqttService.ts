import mqtt from 'mqtt';

// Broker público test.mosquitto.org via WebSocket
const BROKER_URL = 'wss://test.mosquitto.org:8081/mqtt';
const TOPIC_PATTERN = 'pi5/estacionamento/vaga/#';

export interface MqttMessage {
  vagaId: string;
  ocupada: boolean;
  timestamp: Date;
}

type MessageCallback = (message: MqttMessage) => void;

class MqttService {
  private client: mqtt.MqttClient | null = null;
  private subscribers: Set<MessageCallback> = new Set();
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(): Promise<void> {
    if (this.client?.connected || this.isConnecting) {
      return Promise.resolve();
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      try {
        this.client = mqtt.connect(BROKER_URL, {
          clientId: `lovable_parking_${Math.random().toString(16).slice(2, 10)}`,
          clean: true,
          connectTimeout: 10000,
          reconnectPeriod: 5000,
        });

        this.client.on('connect', () => {
          console.log('[MQTT] Conectado ao broker');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          
          this.client?.subscribe(TOPIC_PATTERN, { qos: 0 }, (err) => {
            if (err) {
              console.error('[MQTT] Erro ao subscrever:', err);
              reject(err);
            } else {
              console.log('[MQTT] Subscrito em:', TOPIC_PATTERN);
              resolve();
            }
          });
        });

        this.client.on('message', (topic, payload) => {
          try {
            // Extrai o ID da vaga do tópico (ex: pi5/estacionamento/vaga/A01)
            const parts = topic.split('/');
            const vagaId = parts[parts.length - 1];
            
            // Payload pode ser JSON ou string simples
            let ocupada = false;
            const payloadStr = payload.toString();
            
            try {
              const data = JSON.parse(payloadStr);
              ocupada = data.ocupada === true || data.ocupada === 'True' || data.ocupada === 'true';
            } catch {
              // Se não for JSON, trata como string
              ocupada = payloadStr.toLowerCase() === 'true' || payloadStr === '1';
            }

            const message: MqttMessage = {
              vagaId,
              ocupada,
              timestamp: new Date(),
            };

            console.log('[MQTT] Mensagem recebida:', message);
            
            // Notifica todos os subscribers
            this.subscribers.forEach(callback => callback(message));
          } catch (error) {
            console.error('[MQTT] Erro ao processar mensagem:', error);
          }
        });

        this.client.on('error', (error) => {
          console.error('[MQTT] Erro:', error);
          this.isConnecting = false;
        });

        this.client.on('close', () => {
          console.log('[MQTT] Conexão fechada');
          this.isConnecting = false;
        });

        this.client.on('reconnect', () => {
          this.reconnectAttempts++;
          console.log(`[MQTT] Tentando reconectar (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.warn('[MQTT] Máximo de tentativas atingido');
            this.client?.end();
          }
        });

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  subscribe(callback: MessageCallback): () => void {
    this.subscribers.add(callback);
    
    // Auto-connect se ainda não conectado
    if (!this.client?.connected && !this.isConnecting) {
      this.connect().catch(console.error);
    }

    // Retorna função de unsubscribe
    return () => {
      this.subscribers.delete(callback);
      
      // Desconecta se não houver mais subscribers
      if (this.subscribers.size === 0) {
        this.disconnect();
      }
    };
  }

  disconnect(): void {
    if (this.client) {
      this.client.end();
      this.client = null;
      console.log('[MQTT] Desconectado');
    }
  }

  isConnected(): boolean {
    return this.client?.connected ?? false;
  }
}

// Singleton instance
export const mqttService = new MqttService();
