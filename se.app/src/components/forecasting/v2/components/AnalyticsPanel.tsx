import { useState } from 'react';
import { Analytics, Warning } from '@/data/calendarData';
import { 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Briefcase,
  AlertTriangle,
  AlertCircle,
  Info,
  BarChart3,
  Target,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface AnalyticsPanelProps {
  analytics: Analytics;
  warnings: Warning[];
  isOpen: boolean;
  onToggle: () => void;
  dismissedWarnings: Set<string>;
  onDismissWarning: (id: string) => void;
  onClearAllWarnings: () => void;
}

const severityConfig = {
  critical: { icon: AlertCircle, color: 'text-status-critical', bg: 'bg-status-critical/10', border: 'border-status-critical/30', priority: 1 },
  warning: { icon: AlertTriangle, color: 'text-status-warning', bg: 'bg-status-warning/10', border: 'border-status-warning/30', priority: 2 },
  info: { icon: Info, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30', priority: 3 },
};

export function AnalyticsPanel({ 
  analytics, 
  warnings, 
  isOpen, 
  onToggle,
  dismissedWarnings,
  onDismissWarning,
  onClearAllWarnings,
}: AnalyticsPanelProps) {
  const [alertsExpanded, setAlertsExpanded] = useState(true);

  // Filter out dismissed warnings
  const activeWarnings = warnings.filter(w => !dismissedWarnings.has(w.id));

  // Sort warnings by priority (critical first)
  const sortedWarnings = [...activeWarnings].sort((a, b) => 
    severityConfig[a.severity].priority - severityConfig[b.severity].priority
  );

  const criticalCount = activeWarnings.filter(w => w.severity === 'critical').length;
  const warningCount = activeWarnings.filter(w => w.severity === 'warning').length;

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="flex-shrink-0 border-l border-border bg-card hover:bg-accent/50 transition-colors flex flex-col items-center py-3 px-2 gap-2 group"
      >
        <ChevronLeft className="h-3 w-3 text-muted-foreground group-hover:text-foreground" />
        <BarChart3 className="h-4 w-4 text-primary" />
        <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground writing-mode-vertical">
          Analytics
        </span>
        
        {/* Quick stats preview */}
        <div className="flex flex-col items-center gap-2 mt-2 pt-2 border-t border-border">
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-foreground">{analytics.weeklyUtilization}%</span>
            <span className="text-[8px] text-muted-foreground">Util</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-foreground">${(analytics.revenueProjection / 1000).toFixed(0)}k</span>
            <span className="text-[8px] text-muted-foreground">Rev</span>
          </div>
          {activeWarnings.length > 0 && (
            <div className="flex flex-col items-center">
              <span className={cn(
                'text-xs font-bold',
                criticalCount > 0 ? 'text-status-critical' : 'text-status-warning'
              )}>{activeWarnings.length}</span>
              <AlertTriangle className={cn(
                'h-3 w-3',
                criticalCount > 0 ? 'text-status-critical' : 'text-status-warning'
              )} />
            </div>
          )}
        </div>
      </button>
    );
  }

  return (
    <div className="w-72 lg:w-80 flex-shrink-0 border-l border-border bg-card overflow-y-auto scrollbar-thin animate-slide-in-right">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Analytics
        </h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onToggle}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="p-4 space-y-4">
        {/* Utilization */}
        <div className="bg-analytics-bg rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Weekly Utilization</span>
            <Target className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-foreground">{analytics.weeklyUtilization}%</span>
            <span className="text-xs text-status-optimal mb-1">↑ 5%</span>
          </div>
          <div className="mt-2 w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                analytics.weeklyUtilization >= 80 ? 'bg-utilization-high' :
                analytics.weeklyUtilization >= 50 ? 'bg-utilization-medium' : 'bg-utilization-low'
              )}
              style={{ width: `${analytics.weeklyUtilization}%` }}
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={Clock}
            label="Backlog"
            value={`${analytics.estimatedBacklog}h`}
            trend="+120h"
            trendUp={false}
          />
          <StatCard
            icon={TrendingUp}
            label="Burn Rate"
            value={`${analytics.burnRate}%`}
            trend="On track"
            trendUp={true}
          />
          <StatCard
            icon={Briefcase}
            label="Active Jobs"
            value={analytics.activeJobs.toString()}
            subvalue={`of ${analytics.totalJobs}`}
          />
          <StatCard
            icon={DollarSign}
            label="Revenue"
            value={`$${(analytics.revenueProjection / 1000).toFixed(0)}k`}
            trend="+12%"
            trendUp={true}
          />
        </div>

        {/* Forecast */}
        <div className="bg-analytics-bg rounded-lg p-3">
          <div className="text-xs text-muted-foreground mb-1">Completion Forecast</div>
          <div className="text-lg font-semibold text-foreground">
            {format(analytics.completionForecast, 'MMM d, yyyy')}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {analytics.upcomingJobs} jobs scheduled
          </div>
        </div>
      </div>

      {/* Warnings Section */}
      <div className="border-t border-border">
        {/* Collapsible Header */}
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setAlertsExpanded(!alertsExpanded)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Alerts & Warnings
            </h3>
            {/* Alert count badges */}
            {criticalCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-status-critical text-white rounded-full">
                {criticalCount}
              </span>
            )}
            {warningCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-status-warning text-white rounded-full">
                {warningCount}
              </span>
            )}
            {alertsExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          
          {/* Clear All Button */}
          {activeWarnings.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-destructive"
              onClick={() => {
                onClearAllWarnings();
                toast.success('All alerts cleared');
              }}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          )}
        </div>

        {/* Collapsible Content */}
        {alertsExpanded && (
          <div className="px-4 pb-4 space-y-2">
            {sortedWarnings.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4 bg-muted/30 rounded-lg">
                No active warnings
              </div>
            ) : (
              sortedWarnings.map((warning) => (
                <WarningCard 
                  key={warning.id} 
                  warning={warning} 
                  onDismiss={() => {
                    onDismissWarning(warning.id);
                    toast.info('Alert dismissed');
                  }}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subvalue,
  trend,
  trendUp,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  subvalue?: string;
  trend?: string;
  trendUp?: boolean;
}) {
  return (
    <div className="bg-analytics-bg rounded-lg p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-semibold text-foreground">{value}</span>
        {subvalue && <span className="text-xs text-muted-foreground">{subvalue}</span>}
      </div>
      {trend && (
        <span className={cn('text-xs', trendUp ? 'text-status-optimal' : 'text-status-warning')}>
          {trend}
        </span>
      )}
    </div>
  );
}

function WarningCard({ warning, onDismiss }: { warning: Warning; onDismiss: () => void }) {
  const config = severityConfig[warning.severity];
  const Icon = config.icon;

  return (
    <div className={cn('rounded-lg p-3 border group relative', config.bg, config.border)}>
      <div className="flex items-start gap-2">
        <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', config.color)} />
        <div className="flex-1 min-w-0 pr-6">
          <div className="text-sm text-foreground leading-snug">{warning.message}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {format(warning.date, 'MMM d, yyyy')}
          </div>
        </div>
        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          className="absolute top-2 right-2 p-1 rounded hover:bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Dismiss alert"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
        </button>
      </div>
    </div>
  );
}
