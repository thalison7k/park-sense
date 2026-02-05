// src/components/dashboard/MetricsPanel.tsx
// Painel de métricas de ocupação com gráficos e indicadores

import { Clock, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { GlobalMetrics, formatDuration } from '@/services/metricsService';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

interface MetricsPanelProps {
  metrics: GlobalMetrics | null;
  isLoading?: boolean;
}

export const MetricsPanel = ({ metrics, isLoading }: MetricsPanelProps) => {
  if (isLoading) {
    return (
      <div 
        className="glass-card rounded-2xl p-6 animate-pulse"
        role="status"
        aria-label="Carregando métricas"
      >
        <div className="h-6 bg-muted rounded w-1/3 mb-4" />
        <div className="h-48 bg-muted rounded" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div 
        className="glass-card rounded-2xl p-6"
        role="region"
        aria-label="Métricas de ocupação"
      >
        <p className="text-muted-foreground text-center">
          Aguardando dados para calcular métricas...
        </p>
      </div>
    );
  }

  const peakHoursData = metrics.peakHours.map(h => ({
    hour: `${h.hour.toString().padStart(2, '0')}h`,
    ocupacao: h.occupancyRate,
  }));

  return (
    <div 
      className="glass-card rounded-2xl p-6 space-y-6"
      role="region"
      aria-label="Métricas de tempo de ocupação"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" aria-hidden="true" />
            Tempo Médio de Ocupação
          </h2>
          <p className="text-sm text-muted-foreground">
            Análise baseada no histórico disponível
          </p>
        </div>
        <div 
          className="text-right"
          aria-label={`Tempo médio: ${formatDuration(metrics.averageOccupancyMinutes)}`}
        >
          <p className="text-3xl font-bold font-mono text-primary">
            {formatDuration(metrics.averageOccupancyMinutes)}
          </p>
          <p className="text-xs text-muted-foreground">média por vaga</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div 
          className="bg-background/50 rounded-lg p-4"
          role="group"
          aria-label="Total de eventos de ocupação"
        >
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <span className="text-sm text-muted-foreground">Total Eventos</span>
          </div>
          <p className="text-2xl font-bold font-mono">
            {metrics.totalOccupancyEvents.toLocaleString('pt-BR')}
          </p>
        </div>
        <div 
          className="bg-background/50 rounded-lg p-4"
          role="group"
          aria-label={`Taxa média de utilização: ${metrics.averageUtilization}%`}
        >
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <span className="text-sm text-muted-foreground">Utilização Média</span>
          </div>
          <p className="text-2xl font-bold font-mono">
            {metrics.averageUtilization}%
          </p>
        </div>
      </div>

      {/* Hourly Chart */}
      <div>
        <h3 className="text-sm font-medium mb-3 text-muted-foreground">
          Ocupação por Hora do Dia
        </h3>
        <div 
          className="h-40"
          role="img"
          aria-label="Gráfico de ocupação por hora do dia"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={peakHoursData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
              <XAxis 
                dataKey="hour" 
                stroke="hsl(215, 20%, 55%)"
                fontSize={10}
                tickLine={false}
                interval={3}
              />
              <YAxis 
                stroke="hsl(215, 20%, 55%)"
                fontSize={10}
                tickLine={false}
                unit="%"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(220, 18%, 10%)',
                  border: '1px solid hsl(220, 15%, 18%)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'hsl(210, 40%, 98%)' }}
                formatter={(value: number) => [`${value}%`, 'Ocupação']}
              />
              <Bar dataKey="ocupacao" radius={[4, 4, 0, 0]}>
                {peakHoursData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={entry.ocupacao > 70 
                      ? 'hsl(0, 75%, 55%)' 
                      : entry.ocupacao > 40 
                        ? 'hsl(45, 95%, 55%)' 
                        : 'hsl(145, 80%, 45%)'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Most/Least Used Spots */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Most Used */}
        <div 
          className="bg-background/50 rounded-lg p-4"
          role="region"
          aria-label="Vagas mais utilizadas"
        >
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-success" aria-hidden="true" />
            Vagas Mais Utilizadas
          </h3>
          <ul className="space-y-2" role="list">
            {metrics.mostUsedSpots.slice(0, 3).map((spot, idx) => (
              <li 
                key={spot.spotId}
                className="flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-success/20 text-success text-xs flex items-center justify-center font-medium">
                    {idx + 1}
                  </span>
                  {spot.spotName}
                </span>
                <span className="font-mono text-muted-foreground">
                  {spot.utilizationRate}%
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Least Used */}
        <div 
          className="bg-background/50 rounded-lg p-4"
          role="region"
          aria-label="Vagas subutilizadas"
        >
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-warning" aria-hidden="true" />
            Vagas Subutilizadas
          </h3>
          <ul className="space-y-2" role="list">
            {metrics.leastUsedSpots.slice(0, 3).map((spot, idx) => (
              <li 
                key={spot.spotId}
                className="flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-warning/20 text-warning text-xs flex items-center justify-center font-medium">
                    {idx + 1}
                  </span>
                  {spot.spotName}
                </span>
                <span className="font-mono text-muted-foreground">
                  {spot.utilizationRate}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
