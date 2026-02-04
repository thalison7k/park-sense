import { Car, ParkingCircle, AlertTriangle, TrendingUp, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/dashboard/Header';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ParkingGrid } from '@/components/dashboard/ParkingGrid';
import { OccupancyChart } from '@/components/dashboard/OccupancyChart';
import { SensorControls } from '@/components/dashboard/SensorControls';
import { ConnectionStatus } from '@/components/dashboard/ConnectionStatus';
import { useVagas } from '@/hooks/useVagas';

const Index = () => {
  // useMockData: false para usar API real, true para dados simulados
  const { spots, stats, isConnected, error, refresh } = useVagas({ 
    useMockData: false, // Mude para true se quiser testar sem backend
    refreshInterval: 5000 
  });

  const onlineCount = spots.filter((s) => s.isOnline).length;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto">
        <Header onlineCount={onlineCount} totalCount={spots.length} />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="Vagas Livres"
            value={stats.freeSpots}
            subtitle={`de ${stats.totalSpots} vagas`}
            icon={<ParkingCircle className="w-6 h-6" />}
            variant="success"
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard
            title="Vagas Ocupadas"
            value={stats.occupiedSpots}
            subtitle={`${stats.averageOccupancy}% ocupação`}
            icon={<Car className="w-6 h-6" />}
            variant="destructive"
          />
          <StatsCard
            title="Sensores Inativos"
            value={stats.inactiveSpots}
            subtitle="Requer atenção"
            icon={<AlertTriangle className="w-6 h-6" />}
            variant="warning"
          />
          <StatsCard
            title="Taxa de Ocupação"
            value={`${stats.averageOccupancy}%`}
            subtitle="Média do dia"
            icon={<TrendingUp className="w-6 h-6" />}
            trend={{ value: 5, isPositive: false }}
          />
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <ParkingGrid spots={spots} onSpotClick={(spot) => console.log('Clicked:', spot.id)} />
          </div>
          <div className="space-y-6">
            <SensorControls />
            <ConnectionStatus />
          </div>
        </div>

        {/* Chart */}
        <OccupancyChart />

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-muted-foreground">
          <p className="flex items-center justify-center gap-2">
            <span className="text-gradient font-semibold">GAMATEC</span>
            <span>— Digital Spark © 2025</span>
          </p>
          <p className="mt-2 text-xs">
            Desenvolvido pela <span className="text-gradient font-semibold">GAMATEC</span> — PIV
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4 border-primary/50 hover:bg-primary/10"
            asChild
          >
            <a href="https://gamatec-digital-spark.lovable.app/" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Visitar GAMATEC
            </a>
          </Button>
        </footer>
      </div>
    </div>
  );
};

export default Index;
