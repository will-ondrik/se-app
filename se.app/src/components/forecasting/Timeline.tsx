import { Job, Crew } from "@/types/forecasting/types";
import { format, eachDayOfInterval, addDays } from "date-fns";
import { JobBar } from "./JobBar";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CalendarDayHeader } from "@/components/calendar/CalendarDayHeader";

interface TimelineProps {
  jobs: Job[];
  crews: Crew[];
  startDate: Date;
  endDate: Date;
  onJobClick: (job: Job) => void;
  onJobUpdate: (jobId: number, updates: Partial<Job>) => void;
  // Zoomable/pixel-based layout
  dayWidthPx: number;
  onViewportWidthChange?: (viewportWidth: number) => void;
  onDayWidthChange?: (newWidth: number) => void;
  minDayWidthPx?: number;
  maxDayWidthPx?: number;
}

export const Timeline = ({
  jobs,
  crews,
  startDate,
  endDate,
  onJobClick,
  onJobUpdate,
  dayWidthPx,
  onViewportWidthChange,
  onDayWidthChange,
  minDayWidthPx = 6,
  maxDayWidthPx = 80,
}: TimelineProps) => {
  const [draggedJob, setDraggedJob] = useState<Job | null>(null);
  const [dragStartX, setDragStartX] = useState<number>(0);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Used to keep the same day under the cursor during wheel-zoom
  const zoomAnchorRef = useRef<{ anchorIndex: number; clientX: number } | null>(null);
  const prevDayWidthRef = useRef<number>(dayWidthPx);

  // Layout constants
  const sideColWidth = 160; // px, keep consistent with header and body
  const barHeight = 22; // px for each job bar
  const laneGap = 4; // px between lanes
  const rowPaddingY = 6; // px top/bottom padding inside each crew row
  const minRowHeight = 36; // minimum visual height for empty rows
  const MAX_VISIBLE_LANES = 3; // collapse rows beyond this by default

  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  // Observe viewport (scroll container) width so parent can compute Fit-to-Width
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const el = scrollContainerRef.current;
    const report = () => onViewportWidthChange?.(el.clientWidth);
    report(); // initial
    const ro = new ResizeObserver(report);
    ro.observe(el);
    return () => ro.disconnect();
  }, [onViewportWidthChange]);

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const totalDays = days.length;
  const totalTimelineWidth = totalDays * dayWidthPx; // px

  // Keep anchor day stable under cursor after parent applies new dayWidthPx
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const anchor = zoomAnchorRef.current;
    if (!anchor) {
      prevDayWidthRef.current = dayWidthPx;
      return;
    }

    const rect = el.getBoundingClientRect();
    const pointerOffsetX = anchor.clientX - rect.left - sideColWidth;
    const desiredContentX = anchor.anchorIndex * dayWidthPx;
    const newScrollLeft = Math.max(0, desiredContentX - Math.max(0, pointerOffsetX));

    el.scrollLeft = newScrollLeft;
    zoomAnchorRef.current = null;
    prevDayWidthRef.current = dayWidthPx;
  }, [dayWidthPx]);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!(e.ctrlKey || e.metaKey)) return; // normal scroll unless Ctrl/Cmd is held
    if (!onDayWidthChange) return;

    e.preventDefault();
    const el = scrollContainerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const pointerX = e.clientX - rect.left - sideColWidth;
    const contentX = el.scrollLeft + Math.max(0, pointerX);
    const anchorIdx = Math.max(0, Math.min(totalDays - 1, Math.floor(contentX / Math.max(1, dayWidthPx))));

    const scale = e.deltaY < 0 ? 1.1 : 0.9;
    const next = Math.max(minDayWidthPx, Math.min(maxDayWidthPx, dayWidthPx * scale));
    if (next !== dayWidthPx) {
      zoomAnchorRef.current = { anchorIndex: anchorIdx, clientX: e.clientX };
      onDayWidthChange(next);
    }
  };

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
    const daysDelta = Math.round(deltaX / dayWidthPx);

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

  // Pack jobs into stacked visual lanes per crew (avoid overlap)
  function placeJobsIntoLanes(list: Job): never;
  function placeJobsIntoLanes(list: Job[]): { job: Job; lane: number }[]; // overload signature
  function placeJobsIntoLanes(list: Job[] | Job): { job: Job; lane: number }[] {
    const arr = Array.isArray(list) ? list : [list];
    const sorted = arr
      .slice()
      .sort((a, b) => {
        const as = new Date(a.startDate).getTime();
        const bs = new Date(b.startDate).getTime();
        if (as !== bs) return as - bs;
        const ae = new Date(a.endDate).getTime();
        const be = new Date(b.endDate).getTime();
        return ae - be;
      });

    const laneEnds: number[] = []; // end timestamp per lane
    const out: { job: Job; lane: number }[] = [];
    for (const job of sorted) {
      const s = new Date(job.startDate).getTime();
      const e = new Date(job.endDate).getTime();
      let laneIdx = laneEnds.findIndex((endTs) => s > endTs);
      if (laneIdx === -1) {
        laneIdx = laneEnds.length;
        laneEnds.push(e);
      } else {
        laneEnds[laneIdx] = e;
      }
      out.push({ job, lane: laneIdx });
    }
    return out;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Scroll container holds header+body so they scroll horizontally together. Header is sticky. */}
      <div ref={scrollContainerRef} className="flex-1 overflow-auto" onWheel={handleWheel}>
        {/* Wrapper sets a min width so horizontal scrollbar appears as needed */}
        <div className="relative" style={{ width: sideColWidth + totalTimelineWidth }}>
          {/* Timeline Header */}
          <div className="sticky top-0 z-20 bg-timeline-header border-b">
            <div className="flex h-10">
              <div
                className="flex-shrink-0 px-3 flex items-center font-semibold border-r text-xs"
                style={{ width: sideColWidth }}
              >
                Crew
              </div>
              <div className="relative" style={{ width: totalTimelineWidth }}>
                <CalendarDayHeader days={days} dayWidthPx={dayWidthPx} />
              </div>
            </div>
          </div>

          {/* Timeline Body */}
          <div className="relative">
            {crews.map((crew, index) => {
              const crewJobs = getJobsForCrew(crew.id);
              const placed = placeJobsIntoLanes(crewJobs);

              // compute conflict set (overlapping jobs in same crew row)
              const conflictIds = new Set<number>();
              for (let i = 0; i < crewJobs.length; i++) {
                const a = crewJobs[i];
                const aS = new Date(a.startDate);
                const aE = new Date(a.endDate);
                for (let j = i + 1; j < crewJobs.length; j++) {
                  const b = crewJobs[j];
                  const bS = new Date(b.startDate);
                  const bE = new Date(b.endDate);
                  // overlap if not (a ends before b starts OR b ends before a starts)
                  const overlaps = !(aE < bS || bE < aS);
                  if (overlaps) {
                    conflictIds.add(a.id);
                    conflictIds.add(b.id);
                  }
                }
              }

              // compute lanes count
              const lanesCount =
                placed.length === 0 ? 0 : placed.reduce((max, p) => Math.max(max, p.lane + 1), 0);

              const expanded = !!expandedRows[crew.id];
              const visibleLanes = expanded ? lanesCount : Math.min(lanesCount, MAX_VISIBLE_LANES);
              const hiddenCount = expanded ? 0 : Math.max(0, lanesCount - MAX_VISIBLE_LANES);

              // total content height for the right side (grid + jobs)
              const contentHeight =
                visibleLanes > 0
                  ? rowPaddingY * 2 + visibleLanes * barHeight + (visibleLanes - 1) * laneGap
                  : minRowHeight;

              const rowHeight = Math.max(minRowHeight, contentHeight);

              return (
                <div
                  key={crew.id}
                  className={`${index % 2 === 0 ? "bg-timeline-row" : "bg-timeline-row-alt"}`}
                  style={{ display: "flex", height: rowHeight }}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <div
                    className="flex-shrink-0 px-2 flex items-center border-r"
                    style={{ width: sideColWidth, height: rowHeight }}
                  >
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

                  <div className="relative" style={{ width: totalTimelineWidth, height: rowHeight }}>
                    {/* Grid lines */}
                    <div className="absolute inset-0">
                      <div className="flex h-full">
                        {days.map((_, idx) => (
                          <div
                            key={idx}
                            className="border-r border-timeline-grid"
                            style={{ width: dayWidthPx }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Jobs (stacked lanes with collapse/expand) */}
                    {placed
                      .filter(({ lane }) => lane < visibleLanes)
                      .map(({ job, lane }) => (
                        <JobBar
                          key={job.id}
                          job={job}
                          startDate={startDate}
                          endDate={endDate}
                          onJobClick={onJobClick}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          isDragging={draggedJob?.id === job.id}
                          dayWidthPx={dayWidthPx}
                          topPx={rowPaddingY + lane * (barHeight + laneGap)}
                          barHeight={barHeight}
                          isConflicted={conflictIds.has(job.id)}
                        />
                      ))}

                    {/* Row density controls */}
                    {hiddenCount > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 px-2 text-[10px] absolute bottom-1 right-2 z-20"
                        onClick={() => setExpandedRows((prev) => ({ ...prev, [crew.id]: true }))}
                      >
                        +{hiddenCount} more
                      </Button>
                    )}
                    {expanded && lanesCount > MAX_VISIBLE_LANES && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 px-2 text-[10px] absolute bottom-1 right-2 z-20"
                        onClick={() => setExpandedRows((prev) => ({ ...prev, [crew.id]: false }))}
                      >
                        Collapse
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
