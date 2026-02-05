import { useState } from 'react';
import { ParkingSpot } from '@/types/parking';
import { ParkingSpotCard } from './ParkingSpotCard';
import { SpotDetailModal } from './SpotDetailModal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter } from 'lucide-react';

interface ParkingGridProps {
  spots: ParkingSpot[];
  onSpotClick?: (spot: ParkingSpot) => void;
}

export const ParkingGrid = ({ spots, onSpotClick }: ParkingGridProps) => {
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'free' | 'occupied' | 'inactive'>('all');

  const handleSpotClick = (spot: ParkingSpot) => {
    setSelectedSpot(spot);
    setIsModalOpen(true);
    onSpotClick?.(spot);
  };

  const filteredSpots = spots.filter(spot => {
    const matchesSearch = spot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         spot.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || spot.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: spots.length,
    free: spots.filter(s => s.status === 'free').length,
    occupied: spots.filter(s => s.status === 'occupied').length,
    inactive: spots.filter(s => s.status === 'inactive').length,
  };

  return (
    <>
      <div className="glass-card rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold">Mapa de Vagas</h2>
            <p className="text-sm text-muted-foreground">Visualização em tempo real</p>
          </div>
          
          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar vaga..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 w-32 md:w-40"
              />
            </div>
            
            <div className="flex gap-1">
              {(['all', 'free', 'occupied', 'inactive'] as const).map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setStatusFilter(status)}
                >
                  {status === 'all' ? 'Todas' : 
                   status === 'free' ? 'Livres' : 
                   status === 'occupied' ? 'Ocupadas' : 'Inativas'}
                  <span className="ml-1 opacity-70">({statusCounts[status]})</span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Legenda */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-xs text-muted-foreground">Livre</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <span className="text-xs text-muted-foreground">Ocupada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-warning" />
            <span className="text-xs text-muted-foreground">Inativo</span>
          </div>
        </div>
        
        <div className="grid-lines rounded-xl p-4 bg-secondary/20">
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 md:gap-3">
            {filteredSpots.map((spot) => (
              <ParkingSpotCard
                key={spot.id}
                spot={spot}
                onClick={() => handleSpotClick(spot)}
              />
            ))}
          </div>
          
          {filteredSpots.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma vaga encontrada com os filtros atuais
            </div>
          )}
        </div>
      </div>

      <SpotDetailModal
        spot={selectedSpot}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
