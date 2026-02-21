import { Car, ParkingCircle, AlertTriangle, TrendingUp, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/dashboard/Header';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ParkingGrid } from '@/components/dashboard/ParkingGrid';
import { OccupancyChart } from '@/components/dashboard/OccupancyChart';
import { ConnectionStatus } from '@/components/dashboard/ConnectionStatus';
import { useVagas } from '@/hooks/useVagas';

const Index = () => {
  // Dados sempre da API real
  const { spots, rawData, stats, isConnected, error, refresh, isLoading } = useVagas();

  const onlineCount = spots.filter((s) => s.isOnline).length;

  return (
    <main 
      id="main-content"
      className="min-h-screen bg-background p-4 md:p-6 lg:p-8"
      role="main"
      aria-label="Dashboard de Monitoramento de Estacionamento"
    >
      <div className="max-w-[1600px] mx-auto animate-fade-in">
        <Header onlineCount={onlineCount} totalCount={spots.length} />

        {/* Stats Grid */}
        <section 
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
          aria-label="Estatísticas resumidas"
        >
          <StatsCard
            title="Vagas Livres"
            value={stats.freeSpots}
            subtitle={`de ${stats.totalSpots} vagas`}
            icon={<ParkingCircle className="w-6 h-6" aria-hidden="true" />}
            variant="success"
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard
            title="Vagas Ocupadas"
            value={stats.occupiedSpots}
            subtitle={`${stats.averageOccupancy}% ocupação`}
            icon={<Car className="w-6 h-6" aria-hidden="true" />}
            variant="destructive"
          />
          <StatsCard
            title="Sensores Inativos"
            value={stats.inactiveSpots}
            subtitle="Requer atenção"
            icon={<AlertTriangle className="w-6 h-6" aria-hidden="true" />}
            variant="warning"
          />
          <StatsCard
            title="Taxa de Ocupação"
            value={`${stats.averageOccupancy}%`}
            subtitle="Média do dia"
            icon={<TrendingUp className="w-6 h-6" aria-hidden="true" />}
            trend={{ value: 5, isPositive: false }}
          />
        </section>

        {/* Main Content */}
        <section 
          className="grid lg:grid-cols-3 gap-6 mb-6"
          aria-label="Visualização das vagas e controles"
        >
          <div className="lg:col-span-2">
            <ParkingGrid 
              spots={spots} 
              onSpotClick={(spot) => console.log('Clicked:', spot.id)} 
            />
          </div>
          <div className="space-y-6">
            <ConnectionStatus 
              isApiConnected={isConnected} 
              sensorStats={{ total: spots.length, online: onlineCount }}
            />
          </div>
        </section>


        {/* Chart - agora com dados reais */}
        <section aria-label="Histórico de ocupação">
          <OccupancyChart rawData={rawData} isLoading={isLoading} />
        </section>

        {/* Footer */}
        <footer 
          className="mt-8 text-center text-sm text-muted-foreground"
          role="contentinfo"
        >
          <p className="flex items-center justify-center gap-2">
            <span className="text-gradient font-semibold">GAMATEC</span>
            <span>— Digital Spark © 2025</span>
          </p>
          <p className="mt-2 text-xs">
            Projeto Integrador V — Trabalho de Faculdade
          </p>
          <p className="mt-1 text-xs">
            Desenvolvido pela <span className="text-gradient font-semibold">GAMATEC</span>
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4 border-primary/50 hover:bg-primary/10"
            asChild
          >
            <a 
              href="https://gamatec-digital-spark.lovable.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="Visitar site da GAMATEC (abre em nova janela)"
            >
              <ExternalLink className="w-4 h-4 mr-2" aria-hidden="true" />
              Visitar GAMATEC
            </a>
          </Button>
        </footer>
      </div>
    </main>
  );
};

export default Index;
