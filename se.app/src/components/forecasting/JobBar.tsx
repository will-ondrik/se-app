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
}

export const JobBar = ({
  job,
  startDate,
  endDate,
  onJobClick,
  onDragStart,
  onDragEnd,
  isDragging,
}: JobBarProps) => {
  const jobStart = new Date(job.startDate);
  const jobEnd = new Date(job.endDate);

  // Calculate position and width
  const totalDays = differenceInDays(endDate, startDate) + 1;
  const dayWidth = 100 / totalDays;

  const offsetDays = differenceInDays(jobStart, startDate);
  const jobDuration = differenceInDays(jobEnd, jobStart) + 1;

  const left = offsetDays * dayWidth;
  const width = jobDuration * dayWidth;

  // Don't render if job is outside the visible range
  if (offsetDays < 0 && offsetDays + jobDuration < 0) return null;
  if (offsetDays >= totalDays) return null;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, job)}
      onDragEnd={onDragEnd}
      onClick={() => onJobClick(job)}
      className={cn(
        "absolute h-7 rounded shadow-sm cursor-move hover:shadow-md transition-all",
        "flex items-center px-2 text-white overflow-hidden",
        isDragging && "opacity-50"
      )}
      style={{
        left: `${Math.max(0, left)}%`,
        width: `${width}%`,
        backgroundColor: job.crew?.colorHex || "#6b7280",
        top: "50%",
        transform: "translateY(-50%)",
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="font-medium text-[11px] truncate">{job.title}</div>
        {job.client?.name && (
          <div className="text-[9px] opacity-90 truncate">{job.client.name}</div>
        )}
      </div>
    </div>
  );
};
