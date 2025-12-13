import { Crew, CrewColor } from '@/data/calendarData';
import { X, Users, User, TrendingUp, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CrewDetailPanelProps {
  crew: Crew | null;
  onClose: () => void;
}

const colorClasses: Record<CrewColor, { bg: string; text: string }> = {
  teal: { bg: 'bg-crew-teal', text: 'text-crew-teal' },
  coral: { bg: 'bg-crew-coral', text: 'text-crew-coral' },
  amber: { bg: 'bg-crew-amber', text: 'text-crew-amber' },
  indigo: { bg: 'bg-crew-indigo', text: 'text-crew-indigo' },
  emerald: { bg: 'bg-crew-emerald', text: 'text-crew-emerald' },
  slate: { bg: 'bg-crew-slate', text: 'text-crew-slate' },
};

const utilizationColor = (util: number) => {
  if (util >= 80) return 'text-utilization-high';
  if (util >= 50) return 'text-utilization-medium';
  return 'text-utilization-low';
};

const utilizationBgColor = (util: number) => {
  if (util >= 80) return 'bg-utilization-high';
  if (util >= 50) return 'bg-utilization-medium';
  return 'bg-utilization-low';
};

export function CrewDetailPanel({ crew, onClose }: CrewDetailPanelProps) {
  if (!crew) return null;

  const colors = colorClasses[crew.color];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l border-border shadow-xl z-50 overflow-y-auto animate-slide-in-right">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('w-4 h-4 rounded-full', colors.bg)} />
            <h2 className="text-lg font-semibold text-foreground">{crew.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Manager */}
          <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Manager</p>
              <p className="text-sm font-medium text-foreground">{crew.manager}</p>
            </div>
          </div>

          {/* Utilization */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Utilization</span>
              </div>
              <span className={cn('text-lg font-semibold', utilizationColor(crew.utilization))}>
                {crew.utilization}%
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', utilizationBgColor(crew.utilization))}
                style={{ width: `${crew.utilization}%` }}
              />
            </div>
          </div>

          {/* Team Members */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                Team Members ({crew.employees.length})
              </span>
            </div>
            <div className="space-y-2">
              {crew.employees.map((employee) => (
                <div
                  key={employee.id}
                  className="flex items-center gap-3 p-3 bg-accent/30 rounded-lg"
                >
                  <div className={cn('w-2 h-2 rounded-full', colors.bg)} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{employee.name}</p>
                    <p className="text-xs text-muted-foreground">{employee.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-accent/30 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Active Jobs</span>
              </div>
              <p className="text-lg font-semibold text-foreground">—</p>
            </div>
            <div className="p-3 bg-accent/30 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Hours This Week</span>
              </div>
              <p className="text-lg font-semibold text-foreground">—</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
