import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'success' | 'destructive' | 'warning';
}

export const StatsCard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'default',
}: StatsCardProps) => {
  const variantStyles = {
    default: 'border-border/50',
    success: 'border-success/30 bg-success/5',
    destructive: 'border-destructive/30 bg-destructive/5',
    warning: 'border-warning/30 bg-warning/5',
  };

  const iconVariantStyles = {
    default: 'bg-primary/20 text-primary',
    success: 'bg-success/20 text-success',
    destructive: 'bg-destructive/20 text-destructive',
    warning: 'bg-warning/20 text-warning',
  };

  return (
    <div className={cn(
      "stat-card glass-card rounded-xl p-5 border transition-all duration-300 hover:scale-[1.02]",
      variantStyles[variant]
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold font-mono tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              "inline-flex items-center gap-1 text-xs font-medium",
              trend.isPositive ? "text-success" : "text-destructive"
            )}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{trend.value}%</span>
              <span className="text-muted-foreground">vs ontem</span>
            </div>
          )}
        </div>
        <div className={cn(
          "w-12 h-12 rounded-lg flex items-center justify-center",
          iconVariantStyles[variant]
        )}>
          {icon}
        </div>
      </div>
    </div>
  );
};
