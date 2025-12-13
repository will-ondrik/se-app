import { useMemo } from 'react';
import { ViewMode, Crew, Job } from '@/data/calendarData';
import { CrewLane } from './CrewLane';
import { JobBlock } from './JobBlock';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  eachWeekOfInterval,
  format,
  differenceInDays,
  isToday,
  isSameMonth,
  addMonths,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { cn } from '@/lib/utils';

interface CalendarGridProps {
  currentDate: Date;
  viewMode: ViewMode;
  crews: Crew[];
  jobs: Job[];
  onJobClick: (job: Job) => void;
  onCrewClick: (crew: Crew) => void;
  crewPanelOpen: boolean;
  onToggleCrewPanel: () => void;
}

// Determine row height based on view mode
const getRowHeight = (viewMode: ViewMode) => {
  switch (viewMode) {
    case '12-months': return 'h-10';
    case '6-months': return 'h-11';
    case '3-months': return 'h-12';
    default: return 'h-14';
  }
};

// Determine header height based on view mode
const getHeaderHeight = (viewMode: ViewMode) => {
  switch (viewMode) {
    case '12-months':
    case '6-months': return 'h-8';
    default: return 'h-10';
  }
};

export function CalendarGrid({
  currentDate,
  viewMode,
  crews,
  jobs,
  onJobClick,
  onCrewClick,
  crewPanelOpen,
  onToggleCrewPanel,
}: CalendarGridProps) {

  // Calculate date range based on view mode
  const { dates, columnWidth, headerFormat } = useMemo(() => {
    const monthsToShow = viewMode === 'week' ? 0.25 : viewMode === '1-month' ? 1 : viewMode === '3-months' ? 3 : viewMode === '6-months' ? 6 : 12;
    
    let start: Date;
    let end: Date;
    let columnWidthValue: string;
    let headerFormatStr: string;

    if (viewMode === 'week') {
      start = startOfWeek(currentDate);
      end = endOfWeek(currentDate);
      columnWidthValue = 'calc(100% / 7)';
      headerFormatStr = 'EEE d';
    } else if (viewMode === '1-month') {
      start = startOfMonth(currentDate);
      end = endOfMonth(currentDate);
      const days = differenceInDays(end, start) + 1;
      columnWidthValue = `calc(100% / ${days})`;
      headerFormatStr = 'd';
    } else {
      start = startOfMonth(currentDate);
      end = endOfMonth(addMonths(currentDate, monthsToShow - 1));
      const weeks = Math.ceil(differenceInDays(end, start) / 7);
      columnWidthValue = `calc(100% / ${weeks})`;
      headerFormatStr = 'MMM';
    }

    const interval = eachDayOfInterval({ start, end });
    return { dates: interval, columnWidth: columnWidthValue, headerFormat: headerFormatStr };
  }, [currentDate, viewMode]);

  // Calculate job positions
  const getJobPosition = (job: Job) => {
    const rangeStart = dates[0];
    const rangeEnd = dates[dates.length - 1];
    const totalDays = differenceInDays(rangeEnd, rangeStart) + 1;

    const jobStart = Math.max(0, differenceInDays(job.startDate, rangeStart));
    const jobEnd = Math.min(totalDays - 1, differenceInDays(job.endDate, rangeStart));
    const jobDuration = jobEnd - jobStart + 1;

    if (jobEnd < 0 || jobStart >= totalDays) return null;

    return {
      left: `${(jobStart / totalDays) * 100}%`,
      width: `${(jobDuration / totalDays) * 100}%`,
    };
  };

  // Generate header dates based on view mode
  const headerDates = useMemo(() => {
    if (viewMode === 'week' || viewMode === '1-month') {
      return dates;
    }
    // For 3, 6, 12 months, show weeks
    const monthsToShow = viewMode === '3-months' ? 3 : viewMode === '6-months' ? 6 : 12;
    const start = startOfMonth(currentDate);
    const end = endOfMonth(addMonths(currentDate, monthsToShow - 1));
    return eachWeekOfInterval({ start, end });
  }, [dates, viewMode, currentDate]);

  // Format header label based on view mode
  const getHeaderLabel = (date: Date, index: number) => {
    if (viewMode === 'week') {
      return format(date, 'EEE d');
    }
    if (viewMode === '1-month') {
      return format(date, 'd');
    }
    if (viewMode === '3-months') {
      return format(date, 'MMM d');
    }
    if (viewMode === '6-months') {
      // Show abbreviated month + day for 6M
      return format(date, 'M/d');
    }
    // 12 months - ultra compact
    const month = format(date, 'MMM');
    return month[0]; // Just first letter
  };

  const rowHeight = getRowHeight(viewMode);
  const headerHeight = getHeaderHeight(viewMode);
  const isCompact = viewMode === '6-months' || viewMode === '12-months';

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Collapsible Crew List Sidebar */}
      {crewPanelOpen ? (
        <div className={cn(
          'flex-shrink-0 border-r border-border bg-card overflow-y-auto scrollbar-thin transition-all duration-300',
          isCompact ? 'w-40 md:w-48' : 'w-48 md:w-56 lg:w-64'
        )}>
          <div className={cn(headerHeight, 'border-b border-border flex items-center justify-between px-3 bg-muted/50')}>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Crews
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onToggleCrewPanel}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          {crews.map((crew) => (
            <CrewLane
              key={crew.id}
              crew={crew}
              onClick={() => onCrewClick(crew)}
              compact={isCompact}
            />
          ))}
        </div>
      ) : (
        <button
          onClick={onToggleCrewPanel}
          className="flex-shrink-0 border-r border-border bg-card hover:bg-accent/50 transition-colors flex flex-col items-center py-3 px-2 gap-2 group"
        >
          <Users className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
          <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground writing-mode-vertical">
            Crews
          </span>
          <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-foreground mt-1" />
          {/* Crew color dots */}
          <div className="flex flex-col gap-1.5 mt-2">
            {crews.map((crew) => (
              <div
                key={crew.id}
                className={cn(
                  'w-2.5 h-2.5 rounded-full',
                  crew.color === 'teal' && 'bg-crew-teal',
                  crew.color === 'coral' && 'bg-crew-coral',
                  crew.color === 'amber' && 'bg-crew-amber',
                  crew.color === 'indigo' && 'bg-crew-indigo',
                  crew.color === 'emerald' && 'bg-crew-emerald',
                  crew.color === 'slate' && 'bg-crew-slate',
                )}
              />
            ))}
          </div>
        </button>
      )}

      {/* Calendar Grid */}
      <div className="flex-1 overflow-x-auto scrollbar-thin">
        {/* Date Headers */}
        <div className={cn('flex border-b border-border bg-muted/50 sticky top-0 z-10', headerHeight)}>
          {headerDates.map((date, i) => (
            <div
              key={i}
              className={cn(
                'flex-shrink-0 flex items-center justify-center border-r border-border/50 last:border-r-0',
                isCompact ? 'text-[10px]' : 'text-xs',
                isToday(date) && 'bg-primary/10 font-semibold text-primary',
                !isSameMonth(date, currentDate) && viewMode === '1-month' && 'text-muted-foreground/50'
              )}
              style={{ width: `${100 / headerDates.length}%` }}
            >
              <span className="truncate px-0.5">{getHeaderLabel(date, i)}</span>
            </div>
          ))}
        </div>

        {/* Empty state: show gridlines even with 0 crews */}
        {crews.length === 0 && (
          <div>
            <div className={cn('relative border-b border-border bg-card', rowHeight)}>
              {/* Grid lines */}
              <div className="absolute inset-0 flex pointer-events-none">
                {headerDates.map((date, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex-shrink-0 border-r border-border/30 last:border-r-0',
                      isToday(date) && 'bg-primary/5'
                    )}
                    style={{ width: `${100 / headerDates.length}%` }}
                  />
                ))}
              </div>
              {/* Empty prompt */}
              <div className="relative h-full w-full flex items-center justify-center">
                <div className="text-sm text-muted-foreground bg-background/80 px-3 py-1.5 rounded-md border border-border shadow-sm">
                  No crews yet — add crews from the Manage Crews button above.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Crew Rows with Jobs */}
        {crews.map((crew) => {
          const crewJobs = jobs.filter((job) => job.crewId === crew.id);

          return (
            <div key={crew.id}>
              {/* Main crew row */}
              <div className={cn('relative border-b border-border bg-card hover:bg-accent/20 transition-colors', rowHeight)}>
                {/* Grid lines */}
                <div className="absolute inset-0 flex pointer-events-none">
                  {headerDates.map((date, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex-shrink-0 border-r border-border/30 last:border-r-0',
                        isToday(date) && 'bg-primary/5'
                      )}
                      style={{ width: `${100 / headerDates.length}%` }}
                    />
                  ))}
                </div>
                {/* Jobs */}
                {crewJobs.map((job) => {
                  const position = getJobPosition(job);
                  if (!position) return null;
                  return (
                    <JobBlock
                      key={job.id}
                      job={job}
                      crewColor={crew.color}
                      width={position.width}
                      left={position.left}
                      onClick={() => onJobClick(job)}
                      viewMode={viewMode}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
