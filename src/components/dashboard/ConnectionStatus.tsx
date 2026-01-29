import { Wifi, Server, Database, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ConnectionStatus = () => {
  const connections = [
    { name: 'MQTT Broker', icon: Server, status: 'online', latency: '12ms' },
    { name: 'Database', icon: Database, status: 'online', latency: '8ms' },
    { name: 'Gateway', icon: Wifi, status: 'online', latency: '23ms' },
  ];

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Status da Conexão</h2>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span className="font-mono">Atualizado há 2s</span>
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
                    "text-xs font-mono",
                    isOnline ? "text-success" : "text-destructive"
                  )}>
                    {conn.status}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono text-primary">{conn.latency}</p>
                <p className="text-xs text-muted-foreground">latência</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
