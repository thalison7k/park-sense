import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ParkingSpot } from '@/types/parking';
import { Car, Clock, Activity, TrendingUp, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useMemo } from 'react';

interface SpotDetailModalProps {
  spot: ParkingSpot | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SpotDetailModal = ({ spot, isOpen, onClose }: SpotDetailModalProps) => {
  const statusConfig = {
    free: { label: 'Livre', color: 'bg-success text-success-foreground', icon: 'text-success' },
    occupied: { label: 'Ocupada', color: 'bg-destructive text-destructive-foreground', icon: 'text-destructive' },
    inactive: { label: 'Inativo', color: 'bg-warning text-warning-foreground', icon: 'text-warning' },
  };

  const config = spot ? statusConfig[spot.status] : statusConfig.inactive;

  // Calcula estatísticas do histórico
  const stats = useMemo(() => {
    if (!spot?.occupancyHistory || spot.occupancyHistory.length === 0) {
      return { totalEvents: 0, occupiedPercent: 0, avgDuration: 0, lastEvents: [] as { timestamp: Date; status: string }[] };
    }

    const history = spot.occupancyHistory;
    const occupiedCount = history.filter(h => h.status === 'occupied').length;
    const occupiedPercent = Math.round((occupiedCount / history.length) * 100);

    // Últimos 10 eventos
    const lastEvents = history.slice(-10).reverse();

    // Calcula duração média de ocupação
    let totalDuration = 0;
    let durationCount = 0;
    for (let i = 1; i < history.length; i++) {
      if (history[i - 1].status === 'occupied') {
        const duration = history[i].timestamp.getTime() - history[i - 1].timestamp.getTime();
        totalDuration += duration;
        durationCount++;
      }
    }
    const avgDuration = durationCount > 0 ? Math.round(totalDuration / durationCount / 60000) : 0;

    return {
      totalEvents: history.length,
      occupiedPercent,
      avgDuration,
      lastEvents,
    };
  }, [spot?.occupancyHistory]);

  // Dados para mini gráfico
  const chartData = useMemo(() => {
    if (!spot?.occupancyHistory || spot.occupancyHistory.length === 0) return [];
    
    return spot.occupancyHistory.slice(-20).map((event, index) => ({
      index,
      value: event.status === 'occupied' ? 1 : 0,
      time: event.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    }));
  }, [spot?.occupancyHistory]);

  const formatTime = (date: Date) => {
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!spot) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              spot.status === 'occupied' ? 'bg-destructive/20' : spot.status === 'free' ? 'bg-success/20' : 'bg-warning/20'
            )}>
              <Car className={cn("w-5 h-5", config.icon)} />
            </div>
            <div>
              <span className="text-xl">{spot.name}</span>
              <Badge className={cn("ml-3", config.color)}>{config.label}</Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-secondary/30 rounded-lg p-3 text-center">
              <Activity className="w-4 h-4 mx-auto mb-1 text-primary" />
              <p className="text-lg font-bold">{stats.totalEvents}</p>
              <p className="text-xs text-muted-foreground">Eventos</p>
            </div>
            <div className="bg-secondary/30 rounded-lg p-3 text-center">
              <TrendingUp className="w-4 h-4 mx-auto mb-1 text-destructive" />
              <p className="text-lg font-bold">{stats.occupiedPercent}%</p>
              <p className="text-xs text-muted-foreground">Ocupação</p>
            </div>
            <div className="bg-secondary/30 rounded-lg p-3 text-center">
              <Clock className="w-4 h-4 mx-auto mb-1 text-warning" />
              <p className="text-lg font-bold">{stats.avgDuration}min</p>
              <p className="text-xs text-muted-foreground">Média</p>
            </div>
          </div>

          {/* Mini Chart */}
          {chartData.length > 0 && (
            <div className="bg-secondary/20 rounded-xl p-4">
              <h4 className="text-sm font-medium mb-3">Histórico Recente</h4>
              <div className="h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="occupancyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" hide />
                    <YAxis hide domain={[0, 1]} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload?.[0]) {
                          return (
                            <div className="bg-card border border-border rounded px-2 py-1 text-xs">
                              {payload[0].payload.time}: {payload[0].payload.value === 1 ? 'Ocupada' : 'Livre'}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="stepAfter"
                      dataKey="value"
                      stroke="hsl(var(--destructive))"
                      fill="url(#occupancyGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Last Events */}
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Últimos Eventos
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {stats.lastEvents.length > 0 ? (
                stats.lastEvents.map((event, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 bg-secondary/20 rounded-lg text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        event.status === 'occupied' ? 'bg-destructive' : 'bg-success'
                      )} />
                      <span>{event.status === 'occupied' ? 'Ocupada' : 'Livre'}</span>
                    </div>
                    <span className="text-muted-foreground text-xs font-mono">
                      {formatTime(event.timestamp)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum evento registrado
                </p>
              )}
            </div>
          </div>

          {/* Footer Info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-4">
            <span>Sensor: {spot.sensorType}</span>
            <span>Atualizado: {formatTime(spot.lastUpdate)}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
