import { useState } from 'react';
import { Power, RefreshCw, Radio, Zap, Magnet, CircleDot, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export const SensorControls = () => {
  const [isAllActive, setIsAllActive] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const sensors = [
    { type: 'ultrasonic', name: 'Ultrassônico', icon: Radio, count: 12, online: 11 },
    { type: 'infrared', name: 'Infravermelho', icon: Zap, count: 10, online: 10 },
    { type: 'reed_switch', name: 'Reed Switch', icon: Magnet, count: 8, online: 7 },
    { type: 'digital', name: 'Digital', icon: CircleDot, count: 10, online: 9 },
  ];

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">Controle de Sensores</h2>
          <p className="text-sm text-muted-foreground">Gerenciamento do sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <Activity className={cn(
            "w-4 h-4 transition-colors",
            isAllActive ? "text-success" : "text-muted-foreground"
          )} />
          <span className="text-sm text-muted-foreground mr-2">Sistema</span>
          <Switch checked={isAllActive} onCheckedChange={setIsAllActive} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {sensors.map((sensor) => {
          const Icon = sensor.icon;
          const isFullyOnline = sensor.online === sensor.count;
          
          return (
            <div
              key={sensor.type}
              className={cn(
                "p-4 rounded-xl border transition-all duration-300",
                isFullyOnline 
                  ? "bg-success/5 border-success/20" 
                  : "bg-warning/5 border-warning/20"
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  isFullyOnline ? "bg-success/20" : "bg-warning/20"
                )}>
                  <Icon className={cn(
                    "w-4 h-4",
                    isFullyOnline ? "text-success" : "text-warning"
                  )} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{sensor.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    <span className={isFullyOnline ? "text-success" : "text-warning"}>
                      {sensor.online}
                    </span>
                    /{sensor.count}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1 border-border/50 hover:bg-secondary"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
          {isRefreshing ? 'Atualizando...' : 'Atualizar'}
        </Button>
        <Button
          variant="outline"
          className="flex-1 border-destructive/50 text-destructive hover:bg-destructive/10"
        >
          <Power className="w-4 h-4 mr-2" />
          Resetar
        </Button>
      </div>
    </div>
  );
};
