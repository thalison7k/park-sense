import { Wifi, Server, Database, Clock, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  isApiConnected?: boolean;
  isMqttConnected?: boolean;
}

export const ConnectionStatus = ({ isApiConnected = false, isMqttConnected = false }: ConnectionStatusProps) => {
  const connections = [
    { 
      name: 'MQTT Broker', 
      icon: Radio, 
      status: isMqttConnected ? 'online' : 'offline', 
      description: isMqttConnected ? 'Tempo real ativo' : 'Aguardando conexão'
    },
    { 
      name: 'API Backend', 
      icon: Server, 
      status: isApiConnected ? 'online' : 'offline', 
      description: isApiConnected ? 'Dados carregados' : 'Sem conexão'
    },
    { 
      name: 'Gateway IoT', 
      icon: Wifi, 
      status: isApiConnected ? 'online' : 'offline', 
      description: 'Django + ngrok'
    },
  ];

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Status da Conexão</h2>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span className="font-mono">Tempo real</span>
        </div>
      </div>

      <div className="space-y-3">
        {connections.map((conn) => {
          const Icon = conn.icon;
          const isOnline = conn.status === 'online';
          
          return (
            <div
              key={conn.name}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  isOnline ? "bg-success/20" : "bg-destructive/20"
                )}>
                  <Icon className={cn(
                    "w-4 h-4",
                    isOnline ? "text-success" : "text-destructive"
                  )} />
                </div>
                <div>
                  <p className="text-sm font-medium">{conn.name}</p>
                  <p className={cn(
                    "text-xs",
                    isOnline ? "text-success" : "text-destructive"
                  )}>
                    {conn.status} — {conn.description}
                  </p>
                </div>
              </div>
              <div className={cn(
                "w-2 h-2 rounded-full",
                isOnline ? "bg-success animate-pulse" : "bg-destructive"
              )} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
