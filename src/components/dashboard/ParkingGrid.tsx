import { ParkingSpot } from '@/types/parking';
import { ParkingSpotCard } from './ParkingSpotCard';

interface ParkingGridProps {
  spots: ParkingSpot[];
  onSpotClick?: (spot: ParkingSpot) => void;
}

export const ParkingGrid = ({ spots, onSpotClick }: ParkingGridProps) => {
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">Mapa de Vagas</h2>
          <p className="text-sm text-muted-foreground">Visualização em tempo real</p>
        </div>
        <div className="flex items-center gap-4">
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
      </div>
      
      <div className="grid-lines rounded-xl p-4 bg-secondary/20">
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 md:gap-3">
          {spots.map((spot) => (
            <ParkingSpotCard
              key={spot.id}
              spot={spot}
              onClick={() => onSpotClick?.(spot)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
