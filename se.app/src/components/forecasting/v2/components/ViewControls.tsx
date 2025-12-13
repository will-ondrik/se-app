import { useState } from 'react';
import { ViewMode } from '@/data/calendarData';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Users, 
  Filter,
  Layers
} from 'lucide-react';
import { format, addMonths, subMonths, addWeeks, subWeeks } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ViewControlsProps {
  currentDate: Date;
  viewMode: ViewMode;
  onDateChange: (date: Date) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onManageCrews: () => void;
}

const viewModes: { value: ViewMode; label: string }[] = [
  { value: 'week', label: 'Week' },
  { value: '1-month', label: '1M' },
  { value: '3-months', label: '3M' },
  { value: '6-months', label: '6M' },
  { value: '12-months', label: '12M' },
];

// View mode descriptions for owners
const viewModeDescriptions: Record<ViewMode, string> = {
  'week': 'Scheduling & dispatch',
  '1-month': 'Tactical planning',
  '3-months': 'Pattern detection',
  '6-months': 'Trend visibility',
  '12-months': 'Pure forecasting',
};

export function ViewControls({
  currentDate,
  viewMode,
  onDateChange,
  onViewModeChange,
  onManageCrews,
}: ViewControlsProps) {
  const [showUtilization, setShowUtilization] = useState(true);

  const handlePrevious = () => {
    if (viewMode === 'week') {
      onDateChange(subWeeks(currentDate, 1));
    } else {
      const months = viewMode === '1-month' ? 1 : viewMode === '3-months' ? 3 : viewMode === '6-months' ? 6 : 12;
      onDateChange(subMonths(currentDate, months));
    }
  };

  const handleNext = () => {
    if (viewMode === 'week') {
      onDateChange(addWeeks(currentDate, 1));
    } else {
      const months = viewMode === '1-month' ? 1 : viewMode === '3-months' ? 3 : viewMode === '6-months' ? 6 : 12;
      onDateChange(addMonths(currentDate, months));
    }
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 bg-card border-b border-border">
      {/* Date Navigation */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={handlePrevious} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleToday} className="h-8 px-3">
          <Calendar className="h-4 w-4 mr-1.5" />
          Today
        </Button>
        <Button variant="outline" size="icon" onClick={handleNext} className="h-8 w-8">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium text-foreground ml-2">
          {format(currentDate, 'MMMM yyyy')}
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Manage Crews Button */}
        <Button variant="default" size="sm" onClick={onManageCrews} className="h-8 gap-1.5">
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Manage Crews</span>
        </Button>

        {/* View Mode Selector */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
          {viewModes.map((mode) => (
            <button
              key={mode.value}
              onClick={() => onViewModeChange(mode.value)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200',
                viewMode === mode.value
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title={viewModeDescriptions[mode.value]}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
