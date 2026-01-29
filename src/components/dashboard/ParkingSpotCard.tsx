import { Car, Zap, Radio, Magnet, CircleDot, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ParkingSpot, SensorType } from '@/types/parking';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ParkingSpotCardProps {
  spot: ParkingSpot;
  onClick?: () => void;
}

const sensorIcons: Record<SensorType, typeof Radio> = {
  ultrasonic: Radio,
  infrared: Zap,
  reed_switch: Magnet,
  digital: CircleDot,
};

const sensorLabels: Record<SensorType, string> = {
  ultrasonic: 'Ultrassônico',
  infrared: 'Infravermelho',
  reed_switch: 'Reed Switch',
  digital: 'Digital',
};

export const ParkingSpotCard = ({ spot, onClick }: ParkingSpotCardProps) => {
  const SensorIcon = sensorIcons[spot.sensorType];
  
  const statusStyles = {
    free: 'bg-success/10 border-success/40 glow-success',
    occupied: 'bg-destructive/10 border-destructive/40 glow-destructive',
    inactive: 'bg-warning/10 border-warning/40 glow-warning',
  };

  const statusBgStyles = {
    free: 'bg-success',
    occupied: 'bg-destructive',
    inactive: 'bg-warning',
  };

  const statusTextStyles = {
    free: 'text-success',
    occupied: 'text-destructive',
    inactive: 'text-warning',
  };

  const timeSinceUpdate = () => {
    const diff = Date.now() - spot.lastUpdate.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'agora';
    if (minutes < 60) return `${minutes}min`;
    return `${Math.floor(minutes / 60)}h`;
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={cn(
            "parking-spot w-full aspect-square p-3 border-2 rounded-xl flex flex-col items-center justify-center gap-2",
            "transition-all duration-300 hover:scale-105 cursor-pointer group",
            statusStyles[spot.status]
          )}
        >
          <div className="relative">
            {spot.status === 'occupied' ? (
              <Car className={cn("w-8 h-8 transition-transform group-hover:scale-110", statusTextStyles[spot.status])} />
            ) : (
              <div className={cn(
                "w-8 h-8 rounded-full border-2 border-dashed flex items-center justify-center",
                spot.status === 'free' ? 'border-success/60' : 'border-warning/60'
              )}>
                {spot.status === 'inactive' && (
                  <WifiOff className="w-4 h-4 text-warning" />
                )}
              </div>
            )}
          </div>
          
          <span className="text-xs font-bold font-mono tracking-wider">{spot.name}</span>
          
          <div className="flex items-center gap-1.5">
            <div className={cn(
              "w-1.5 h-1.5 rounded-full",
              statusBgStyles[spot.status],
              spot.status !== 'inactive' && 'animate-pulse'
            )} />
            <span className={cn("text-[10px] font-medium uppercase", statusTextStyles[spot.status])}>
              {spot.status === 'free' ? 'Livre' : spot.status === 'occupied' ? 'Ocupada' : 'Inativo'}
            </span>
          </div>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="bg-card border-border">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 font-semibold">
            <SensorIcon className="w-4 h-4 text-primary" />
            <span>Vaga {spot.name}</span>
          </div>
          <div className="space-y-1 text-muted-foreground text-xs">
            <p>Sensor: {sensorLabels[spot.sensorType]}</p>
            <p className="flex items-center gap-1">
              {spot.isOnline ? (
                <><Wifi className="w-3 h-3 text-success" /> Online</>
              ) : (
                <><WifiOff className="w-3 h-3 text-destructive" /> Offline</>
              )}
            </p>
            <p>Atualizado: {timeSinceUpdate()}</p>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};
