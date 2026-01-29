import { Radio, Wifi, WifiOff, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onlineCount: number;
  totalCount: number;
}

export const Header = ({ onlineCount, totalCount }: HeaderProps) => {
  return (
    <header className="glass-card rounded-2xl p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center glow-primary">
              <Radio className="w-7 h-7 text-primary" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full pulse-dot" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              <span className="text-gradient">GAMATEC</span>
              <span className="text-foreground/80 font-medium ml-2">IoT</span>
            </h1>
            <p className="text-muted-foreground text-sm">
              Sistema de Monitoramento de Vagas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50">
            {onlineCount === totalCount ? (
              <Wifi className="w-4 h-4 text-success" />
            ) : (
              <WifiOff className="w-4 h-4 text-warning" />
            )}
            <span className="text-sm font-mono">
              <span className="text-success">{onlineCount}</span>
              <span className="text-muted-foreground">/{totalCount}</span>
              <span className="text-muted-foreground ml-1">online</span>
            </span>
          </div>
          
          <Button variant="outline" size="icon" className="border-border/50 hover:bg-secondary">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};
