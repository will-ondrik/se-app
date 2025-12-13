import { Analytics, Warning } from '@/data/calendarData';
import { 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  DollarSign,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TopSummaryBarProps {
  analytics: Analytics;
  warnings: Warning[];
  crewCount: number;
}

export function TopSummaryBar({ analytics, warnings, crewCount }: TopSummaryBarProps) {
  const criticalWarnings = warnings.filter(w => w.severity === 'critical').length;
  const allAlerts = warnings.length;

  return (
    <div className="bg-card border-b border-border px-4 py-2 flex items-center gap-4 overflow-x-auto scrollbar-thin">
      <SummaryItem
        icon={Users}
        label="Crews"
        value={crewCount.toString()}
      />
      <Divider />
      <SummaryItem
        icon={Briefcase}
        label="Active"
        value={analytics.activeJobs.toString()}
        subvalue={`of ${analytics.totalJobs}`}
      />
      <Divider />
      <SummaryItem
        icon={TrendingUp}
        label="Utilization"
        value={`${analytics.weeklyUtilization}%`}
        valueColor={analytics.weeklyUtilization >= 70 ? 'text-status-optimal' : 'text-status-warning'}
      />
      <Divider />
      <SummaryItem
        icon={DollarSign}
        label="Pipeline"
        value={`$${(analytics.revenueProjection / 1000).toFixed(0)}k`}
      />
      {allAlerts > 0 && (
        <>
          <Divider />
          <div className="flex items-center gap-2 flex-shrink-0">
            {criticalWarnings > 0 ? (
              <AlertCircle className="h-4 w-4 text-status-critical" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-status-warning" />
            )}
            <div className="flex items-baseline gap-1">
              <span className="text-xs text-muted-foreground">Alerts:</span>
              <span className={cn(
                'text-sm font-semibold',
                criticalWarnings > 0 ? 'text-status-critical' : 'text-status-warning'
              )}>
                {allAlerts}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SummaryItem({
  icon: Icon,
  label,
  value,
  subvalue,
  valueColor = 'text-foreground',
}: {
  icon: typeof Users;
  label: string;
  value: string;
  subvalue?: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div className="flex items-baseline gap-1">
        <span className="text-xs text-muted-foreground">{label}:</span>
        <span className={cn('text-sm font-semibold', valueColor)}>{value}</span>
        {subvalue && <span className="text-xs text-muted-foreground">{subvalue}</span>}
      </div>
    </div>
  );
}

function Divider() {
  return <div className="h-4 w-px bg-border flex-shrink-0" />;
}
