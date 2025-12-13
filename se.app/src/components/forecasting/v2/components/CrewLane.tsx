import { Crew, CrewColor } from '@/data/calendarData';
import { Users, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CrewLaneProps {
  crew: Crew;
  onClick: () => void;
  compact?: boolean;
}

const colorClasses: Record<CrewColor, string> = {
  teal: 'bg-crew-teal',
  coral: 'bg-crew-coral',
  amber: 'bg-crew-amber',
  indigo: 'bg-crew-indigo',
  emerald: 'bg-crew-emerald',
  slate: 'bg-crew-slate',
};

const utilizationColor = (util: number) => {
  if (util >= 80) return 'bg-utilization-high';
  if (util >= 50) return 'bg-utilization-medium';
  return 'bg-utilization-low';
};

const utilizationTextColor = (util: number) => {
  if (util >= 80) return 'text-utilization-high';
  if (util >= 50) return 'text-utilization-medium';
  return 'text-utilization-low';
};

// Get utilization status indicator
const getUtilizationIndicator = (util: number) => {
  if (util >= 90) return { icon: TrendingUp, label: 'High Load', color: 'text-status-warning' };
  if (util >= 70) return { icon: TrendingUp, label: 'Optimal', color: 'text-status-optimal' };
  if (util >= 50) return { icon: Minus, label: 'Moderate', color: 'text-muted-foreground' };
  return { icon: TrendingDown, label: 'Under-utilized', color: 'text-status-critical' };
};

// Heat map background based on utilization
const getHeatBg = (util: number) => {
  if (util >= 90) return 'bg-status-warning/5';
  if (util < 50) return 'bg-status-critical/5';
  return '';
};

export function CrewLane({ crew, onClick, compact = false }: CrewLaneProps) {
  const indicator = getUtilizationIndicator(crew.utilization);
  const IndicatorIcon = indicator.icon;
  const heatBg = getHeatBg(crew.utilization);

  if (compact) {
    return (
      <div className={cn('border-b border-border', heatBg)}>
        <button
          onClick={onClick}
          className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-accent/50 transition-colors"
        >
          <div className={cn('w-2 h-2 rounded-full flex-shrink-0', colorClasses[crew.color])} />
          <div className="flex-1 text-left min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-foreground truncate">{crew.name}</span>
              <span className="text-[10px] text-muted-foreground flex-shrink-0">
                <Users className="h-2.5 w-2.5 inline" />
                {crew.employees.length}
              </span>
            </div>
          </div>
          {/* Compact utilization */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="w-10 h-1 bg-muted rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full', utilizationColor(crew.utilization))}
                style={{ width: `${crew.utilization}%` }}
              />
            </div>
            <span className={cn('text-[10px] font-medium w-6 text-right', utilizationTextColor(crew.utilization))}>
              {crew.utilization}%
            </span>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className={cn('border-b border-border', heatBg)}>
      <button
        onClick={onClick}
        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent/50 transition-colors"
      >
        <div className={cn('w-3 h-3 rounded-full flex-shrink-0', colorClasses[crew.color])} />
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground truncate">{crew.name}</span>
            <span className="text-xs text-muted-foreground flex items-center gap-0.5 flex-shrink-0">
              <Users className="h-3 w-3" />
              {crew.employees.length}
            </span>
          </div>
          <div className="text-xs text-muted-foreground truncate">{crew.manager}</div>
        </div>
        {/* Utilization Indicator */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', utilizationColor(crew.utilization))}
                style={{ width: `${crew.utilization}%` }}
              />
            </div>
            <span className={cn('text-xs font-semibold w-9 text-right', utilizationTextColor(crew.utilization))}>
              {crew.utilization}%
            </span>
          </div>
          {/* Status indicator - only show for non-optimal states */}
          {(crew.utilization >= 90 || crew.utilization < 50) && (
            <div className={cn('flex items-center gap-0.5 text-[9px]', indicator.color)}>
              <IndicatorIcon className="h-2.5 w-2.5" />
              <span>{indicator.label}</span>
            </div>
          )}
        </div>
      </button>
    </div>
  );
}
