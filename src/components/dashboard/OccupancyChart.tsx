import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { VagaHistoricoItem, calculateHourlyOccupancy } from '@/services/api';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface OccupancyChartProps {
  rawData?: Record<string, VagaHistoricoItem[]>;
  isLoading?: boolean;
}

export const OccupancyChart = ({ rawData, isLoading }: OccupancyChartProps) => {
  // Calcula dados do gráfico a partir dos dados reais
  const chartData = useMemo(() => {
    if (!rawData || Object.keys(rawData).length === 0) {
      // Dados de fallback quando não há dados reais
      return Array.from({ length: 24 }, (_, i) => ({
        hour: `${String(i).padStart(2, '0')}:00`,
        occupied: 0,
        free: 40,
      }));
    }
    return calculateHourlyOccupancy(rawData);
  }, [rawData]);

  const hasRealData = rawData && Object.values(rawData).some(arr => arr.length > 0);

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Histórico de Ocupação</h2>
          <p className="text-sm text-muted-foreground">
            {hasRealData ? 'Baseado em dados reais' : 'Aguardando dados do backend'}
          </p>
        </div>
        {hasRealData && (
          <span className="text-xs bg-success/20 text-success px-2 py-1 rounded-full">
            Dados Reais
          </span>
        )}
      </div>
      
      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="occupiedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0, 75%, 55%)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(0, 75%, 55%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="freeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(145, 80%, 45%)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(145, 80%, 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
              <XAxis 
                dataKey="hour" 
                stroke="hsl(215, 20%, 55%)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(215, 20%, 55%)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(220, 18%, 10%)',
                  border: '1px solid hsl(220, 15%, 18%)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'hsl(210, 40%, 98%)' }}
              />
              <Area
                type="monotone"
                dataKey="occupied"
                stroke="hsl(0, 75%, 55%)"
                strokeWidth={2}
                fill="url(#occupiedGradient)"
                name="Ocupadas"
              />
              <Area
                type="monotone"
                dataKey="free"
                stroke="hsl(145, 80%, 45%)"
                strokeWidth={2}
                fill="url(#freeGradient)"
                name="Livres"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-destructive" />
          <span className="text-xs text-muted-foreground">Ocupadas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-success" />
          <span className="text-xs text-muted-foreground">Livres</span>
        </div>
      </div>
    </div>
  );
};
