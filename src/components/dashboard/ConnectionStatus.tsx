import { Server, Cpu, Clock, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  isApiConnected?: boolean;
  sensorStats?: { total: number; online: number };
}

export const ConnectionStatus = ({ isApiConnected = false, sensorStats }: ConnectionStatusProps) => {
  const sensorOnline = sensorStats ? sensorStats.online : 0;
  const sensorTotal = sensorStats ? sensorStats.total : 0;
  const allSensorsOnline = sensorTotal > 0 && sensorOnline === sensorTotal;

  const connections = [
    { 
      name: 'API Backend', 
      icon: Server, 
      status: isApiConnected ? 'online' : 'offline', 
      description: isApiConnected ? 'Dados carregados' : 'Sem conexão'
    },
    { 
      name: 'Plataforma IoT', 
      icon: Cpu, 
      status: isApiConnected ? 'online' : 'offline', 
      description: 'Django + PythonAnywhere'
    },
    { 
      name: 'Sensores Ultrassônicos', 
      icon: Radio, 
      status: allSensorsOnline ? 'online' : sensorOnline > 0 ? 'partial' : 'offline', 
      description: sensorTotal > 0 
        ? `${sensorOnline}/${sensorTotal} ativos` 
        : 'Aguardando dados'
    },
  ];

  return (
    <div className="glass-card rounded-2xl p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Status da Conexão</h2>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span className="font-mono">Polling REST</span>
        </div>
      </div>

      <div className="space-y-3">
        {connections.map((conn, index) => {
          const Icon = conn.icon;
          const isOnline = conn.status === 'online';
          const isPartial = conn.status === 'partial';
          
          return (
            <div
              key={conn.name}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 transition-all duration-300 hover:bg-secondary/50 hover:translate-x-1"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-300",
                  isOnline ? "bg-success/20" : isPartial ? "bg-warning/20" : "bg-destructive/20"
                )}>
                  <Icon className={cn(
                    "w-4 h-4 transition-colors duration-300",
                    isOnline ? "text-success" : isPartial ? "text-warning" : "text-destructive"
                  )} />
                </div>
                <div>
                  <p className="text-sm font-medium">{conn.name}</p>
                  <p className={cn(
                    "text-xs transition-colors duration-300",
                    isOnline ? "text-success" : isPartial ? "text-warning" : "text-destructive"
                  )}>
                    {isPartial ? 'parcial' : conn.status} — {conn.description}
                  </p>
                </div>
              </div>
              <div className={cn(
                "w-2 h-2 rounded-full transition-colors duration-300",
                isOnline ? "bg-success animate-pulse" : isPartial ? "bg-warning animate-pulse" : "bg-destructive"
              )} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
