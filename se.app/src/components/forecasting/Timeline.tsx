import { Job, Crew } from "@/types/forecasting/types";
import { format, eachDayOfInterval, differenceInDays, addDays } from "date-fns";
import { JobBar } from "./JobBar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

interface TimelineProps {
  jobs: Job[];
  crews: Crew[];
  startDate: Date;
  endDate: Date;
  onJobClick: (job: Job) => void;
  onJobUpdate: (jobId: number, updates: Partial<Job>) => void;
}

export const Timeline = ({
  jobs,
  crews,
  startDate,
  endDate,
  onJobClick,
  onJobUpdate,
}: TimelineProps) => {
  const [draggedJob, setDraggedJob] = useState<Job | null>(null);
  const [dragStartX, setDragStartX] = useState<number>(0);

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const totalDays = days.length;
  const dayWidth = 100 / totalDays;

  const handleDragStart = (e: React.DragEvent, job: Job) => {
    setDraggedJob(job);
    setDragStartX(e.clientX);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedJob(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedJob) return;

    const deltaX = e.clientX - dragStartX;
    const timelineWidth = e.currentTarget.clientWidth;
    const pixelsPerDay = timelineWidth / totalDays;
    const daysDelta = Math.round(deltaX / pixelsPerDay);

    if (daysDelta !== 0) {
      const jobStart = new Date(draggedJob.startDate);
      const jobEnd = new Date(draggedJob.endDate);
      const newStartDate = addDays(jobStart, daysDelta);
      const newEndDate = addDays(jobEnd, daysDelta);

      onJobUpdate(draggedJob.id, {
        startDate: format(newStartDate, "yyyy-MM-dd"),
        endDate: format(newEndDate, "yyyy-MM-dd"),
      });
    }

    setDraggedJob(null);
  };

  const getJobsForCrew = (crewId: number) => {
    return jobs.filter((job) => job.crewId === crewId);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Timeline Header */}
      <div className="sticky top-0 z-20 bg-timeline-header border-b">
        <div className="flex h-10">
          <div className="w-32 flex-shrink-0 px-3 flex items-center font-semibold border-r text-xs">
            Crew
          </div>
          <div className="flex-1 flex">
            {days.map((day, index) => (
              <div
                key={index}
                className="flex-1 flex flex-col items-center justify-center border-r text-[10px]"
                style={{ minWidth: `${dayWidth}%` }}
              >
                <div className="font-medium">{format(day, "EEE")}</div>
                <div className="text-muted-foreground">{format(day, "MMM d")}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline Body */}
      <ScrollArea className="flex-1">
        <div className="relative">
          {crews.map((crew, index) => {
            const crewJobs = getJobsForCrew(crew.id);
            return (
              <div
                key={crew.id}
                className={`flex h-10 ${
                  index % 2 === 0 ? "bg-timeline-row" : "bg-timeline-row-alt"
                }`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <div className="w-32 flex-shrink-0 px-2 flex items-center border-r">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: crew.colorHex }}
                    />
                    <span className="font-medium text-[11px] truncate">
                      {crew.name}
                    </span>
                  </div>
                </div>
                <div className="flex-1 relative">
                  {/* Grid lines */}
                  <div className="absolute inset-0 flex">
                    {days.map((_, index) => (
                      <div
                        key={index}
                        className="flex-1 border-r border-timeline-grid"
                        style={{ minWidth: `${dayWidth}%` }}
                      />
                    ))}
                  </div>
                  {/* Jobs */}
                  {crewJobs.map((job) => (
                    <JobBar
                      key={job.id}
                      job={job}
                      startDate={startDate}
                      endDate={endDate}
                      onJobClick={onJobClick}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      isDragging={draggedJob?.id === job.id}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
