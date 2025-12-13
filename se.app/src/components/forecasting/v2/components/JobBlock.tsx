import { Job, CrewColor, JobStatus, ViewMode } from '@/data/calendarData';
import { cn } from '@/lib/utils';
import { AlertTriangle, Clock, CheckCircle, Pause, AlertCircle, TrendingUp, Flag } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { format } from 'date-fns';

interface JobBlockProps {
  job: Job;
  crewColor: CrewColor;
  width: string;
  left: string;
  onClick: () => void;
  viewMode: ViewMode;
}

const colorClasses: Record<CrewColor, { bg: string; border: string; light: string }> = {
  teal: { bg: 'bg-crew-teal', border: 'border-crew-teal', light: 'bg-crew-teal/20' },
  coral: { bg: 'bg-crew-coral', border: 'border-crew-coral', light: 'bg-crew-coral/20' },
  amber: { bg: 'bg-crew-amber', border: 'border-crew-amber', light: 'bg-crew-amber/20' },
  indigo: { bg: 'bg-crew-indigo', border: 'border-crew-indigo', light: 'bg-crew-indigo/20' },
  emerald: { bg: 'bg-crew-emerald', border: 'border-crew-emerald', light: 'bg-crew-emerald/20' },
  slate: { bg: 'bg-crew-slate', border: 'border-crew-slate', light: 'bg-crew-slate/20' },
};

const statusConfig: Record<JobStatus, { icon: typeof Clock; ring: string; indicator: string }> = {
  pending: { icon: Clock, ring: '', indicator: 'bg-muted-foreground' },
  active: { icon: CheckCircle, ring: 'ring-2 ring-status-optimal ring-offset-1', indicator: 'bg-status-optimal' },
  completed: { icon: CheckCircle, ring: '', indicator: 'bg-status-optimal' },
  delayed: { icon: AlertTriangle, ring: 'ring-2 ring-status-warning ring-offset-1', indicator: 'bg-status-warning' },
  'over-capacity': { icon: AlertCircle, ring: 'ring-2 ring-status-critical ring-offset-1', indicator: 'bg-status-critical' },
};

// Compact display modes for different view ranges
const isCompactMode = (viewMode: ViewMode) => viewMode === '6-months' || viewMode === '12-months';
const isSemiCompact = (viewMode: ViewMode) => viewMode === '3-months';

const jobTypeLabels: Record<string, string> = {
  'new-construction': 'NC',
  'repaint': 'RP',
  'cost-plus': 'C+',
};

export function JobBlock({ job, crewColor, width, left, onClick, viewMode }: JobBlockProps) {
  const colors = colorClasses[crewColor];
  const status = statusConfig[job.status];
  const StatusIcon = status.icon;
  const compact = isCompactMode(viewMode);
  const semiCompact = isSemiCompact(viewMode);
  const jobTypeLabel = job.jobType ? jobTypeLabels[job.jobType] : null;

  // Truncate name based on view mode
  const getDisplayName = () => {
    if (compact) {
      // Ultra-compact: just initials or first few chars
      const words = job.name.split(' ');
      if (words.length >= 2) {
        return words.slice(0, 2).map(w => w[0]).join('');
      }
      return job.name.slice(0, 3);
    }
    if (semiCompact) {
      return job.name.length > 12 ? job.name.slice(0, 10) + '...' : job.name;
    }
    return job.name;
  };

  const getClientDisplay = () => {
    if (compact) return null;
    if (semiCompact) {
      return job.clientName.length > 12 ? job.clientName.slice(0, 10) + '...' : job.clientName;
    }
    return job.clientName;
  };

  // Ultra-compact mode (12M view)
  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              'absolute top-1 h-[calc(100%-8px)] rounded px-1 py-0.5',
              'cursor-pointer hover:shadow-md hover:z-10',
              'transition-all duration-150 overflow-hidden',
              'flex items-center justify-center gap-0.5',
              colors.bg,
              'text-white text-[9px] font-semibold',
              status.ring
            )}
            style={{ width, left, minWidth: '20px' }}
          >
            <StatusIcon className="h-2.5 w-2.5 flex-shrink-0 opacity-90" />
            <span className="truncate">{getDisplayName()}</span>
            {/* Risk indicator dot */}
            {(job.status === 'delayed' || job.status === 'over-capacity') && (
              <span className={cn('absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full', status.indicator)} />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs p-3">
          <CompactTooltip job={job} />
        </TooltipContent>
      </Tooltip>
    );
  }

  // Semi-compact mode (3M, 6M views)
  if (semiCompact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              'absolute top-1 h-[calc(100%-8px)] rounded-md px-1.5 py-0.5',
              'cursor-grab hover:shadow-lg hover:scale-[1.01] active:cursor-grabbing',
              'transition-all duration-150 overflow-hidden',
              colors.bg,
              'text-white',
              status.ring
            )}
            style={{ width, left, minWidth: '32px' }}
          >
            <div className="flex items-start gap-1 h-full">
              <StatusIcon className="h-3 w-3 mt-0.5 flex-shrink-0 opacity-80" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-medium truncate leading-tight">{getDisplayName()}</div>
                {getClientDisplay() && (
                  <div className="text-[9px] opacity-75 truncate">{getClientDisplay()}</div>
                )}
              </div>
            </div>
            {/* Progress indicator - simplified bar */}
            <div className="absolute bottom-0.5 left-1 right-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/90 rounded-full"
                style={{ width: `${job.progress}%` }}
              />
            </div>
            {/* Risk indicator */}
            {(job.status === 'delayed' || job.status === 'over-capacity') && (
              <span className={cn('absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white', status.indicator)} />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs p-3">
          <CompactTooltip job={job} />
        </TooltipContent>
      </Tooltip>
    );
  }

  // Full mode (Week, 1M views)
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={cn(
            'absolute top-1 h-[calc(100%-8px)] rounded-md px-2 py-1 text-left',
            'cursor-grab hover:shadow-lg hover:scale-[1.02] active:cursor-grabbing',
            'transition-all duration-200 overflow-hidden',
            colors.bg,
            'text-white',
            status.ring
          )}
          style={{ width, left }}
        >
          <div className="flex items-start gap-1.5 h-full">
            <StatusIcon className="h-3 w-3 mt-0.5 flex-shrink-0 opacity-80" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium truncate leading-tight">{job.name}</span>
                {jobTypeLabel && (
                  <span className="text-[8px] px-1 py-0.5 rounded bg-white/20 font-semibold flex-shrink-0">
                    {jobTypeLabel}
                  </span>
                )}
              </div>
              <div className="text-[10px] opacity-80 truncate">{job.clientName}</div>
              {/* Progress bar - only show in week/1M view */}
              {(viewMode === 'week' || viewMode === '1-month') && (
                <div className="mt-1 w-full h-1 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white/80 rounded-full"
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
          {/* Status chip for delayed/over-capacity */}
          {(job.status === 'delayed' || job.status === 'over-capacity') && (
            <div className={cn(
              'absolute top-0.5 right-0.5 px-1 py-0.5 rounded text-[8px] font-semibold uppercase',
              job.status === 'delayed' ? 'bg-status-warning text-white' : 'bg-status-critical text-white'
            )}>
              {job.status === 'delayed' ? 'Late' : 'Over'}
            </div>
          )}
          {/* Drag handles */}
          <div className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-white/30 rounded-l-md" />
          <div className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-white/30 rounded-r-md" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs p-3">
        <FullTooltip job={job} viewMode={viewMode} />
      </TooltipContent>
    </Tooltip>
  );
}

function CompactTooltip({ job }: { job: Job }) {
  const jobTypeDisplay = job.jobType === 'new-construction' ? 'New Construction' : 
                         job.jobType === 'repaint' ? 'Repaint' : 
                         job.jobType === 'cost-plus' ? 'Cost Plus' : null;
  return (
    <div className="space-y-2">
      <div className="font-medium">{job.name}</div>
      <div className="text-xs text-muted-foreground space-y-1">
        {jobTypeDisplay && <div><span className="font-medium">Type:</span> {jobTypeDisplay}</div>}
        <div><span className="font-medium">Client:</span> {job.clientName}</div>
        <div><span className="font-medium">Duration:</span> {format(job.startDate, 'MMM d')} - {format(job.endDate, 'MMM d')}</div>
        <div><span className="font-medium">Progress:</span> {job.progress}%</div>
        <div><span className="font-medium">Revenue:</span> ${(job.revenue ?? 0).toLocaleString()}</div>

      </div>
    </div>
  );
}

function FullTooltip({ job, viewMode }: { job: Job; viewMode: ViewMode }) {
  const showHours = viewMode === 'week' || viewMode === '1-month';
  const jobTypeDisplay = job.jobType === 'new-construction' ? 'New Construction' : 
                         job.jobType === 'repaint' ? 'Repaint' : 
                         job.jobType === 'cost-plus' ? 'Cost Plus' : null;
  
  return (
    <div className="space-y-2">
      <div className="font-medium">{job.name}</div>
      <div className="text-xs text-muted-foreground space-y-1">
        {jobTypeDisplay && <div><span className="font-medium">Type:</span> {jobTypeDisplay}</div>}
        <div><span className="font-medium">Client:</span> {job.clientName}</div>
        <div><span className="font-medium">Address:</span> {job.address}</div>
        <div><span className="font-medium">Duration:</span> {format(job.startDate, 'MMM d')} - {format(job.endDate, 'MMM d')}</div>
        {showHours && (
          <div><span className="font-medium">Hours:</span> {job.completedHours}/{job.estimatedHours}h ({job.progress}%)</div>
        )}
        <div><span className="font-medium">Revenue:</span> ${(job.revenue ?? 0).toLocaleString()}</div>

      </div>
    </div>
  );
}
