import { Job } from "@/types/forecasting/types";
import { differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

interface JobBarProps {
  job: Job;
  startDate: Date;
  endDate: Date;
  onJobClick: (job: Job) => void;
  onDragStart: (e: React.DragEvent, job: Job) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  dayWidthPx: number;
  topPx: number;
  barHeight: number;
  isConflicted?: boolean; // visual-only: highlight conflicts
}

export const JobBar = ({
  job,
  startDate,
  endDate,
  onJobClick,
  onDragStart,
  onDragEnd,
  isDragging,
  dayWidthPx,
  topPx,
  barHeight,
  isConflicted,
}: JobBarProps) => {
  const jobStart = new Date(job.startDate);
  const jobEnd = new Date(job.endDate);

  // Calculate position and width in pixels with clamping for partial overlaps
  const totalDays = differenceInDays(endDate, startDate) + 1;

  const offsetDays = differenceInDays(jobStart, startDate);
  const jobDuration = differenceInDays(jobEnd, jobStart) + 1;

  const startIndex = Math.max(0, offsetDays);
  const endIndex = Math.min(totalDays, offsetDays + jobDuration);
  const visibleDuration = Math.max(0, endIndex - startIndex);

  if (visibleDuration <= 0) return null;

  const leftPx = startIndex * dayWidthPx;
  const widthPx = visibleDuration * dayWidthPx;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, job)}
      onDragEnd={onDragEnd}
      onClick={() => onJobClick(job)}
      className={cn(
        "absolute h-7 rounded shadow-sm cursor-move hover:shadow-md transition-all",
        "flex items-center px-2 text-white overflow-hidden",
        isDragging && "opacity-50",
        isConflicted && "ring-2 ring-red-500"
      )}
      style={{
        left: `${leftPx}px`,
        width: `${widthPx}px`,
        height: `${barHeight}px`,
        backgroundColor: job.crew?.colorHex || "#6b7280",
        top: `${topPx}px`,
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="font-medium text-[11px] truncate">{job.title}</div>
        {job.client?.name && (
          <div className="text-[9px] opacity-90 truncate">{job.client.name}</div>
        )}
      </div>
      {isConflicted && (
        <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
      )}
    </div>
  );
};
