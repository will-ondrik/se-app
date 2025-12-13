import React, { useMemo } from "react";
import { Job, Crew } from "@/types/forecasting/types";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { cn } from "@/lib/utils";

interface ForecastingMonthViewProps {
  focusDate: Date;
  jobs: Job[];
  crews: Crew[];
  onDayDoubleClick: (d: Date) => void;
  onJobClick: (job: Job) => void;
}

export function ForecastingMonthView({
  focusDate,
  jobs,
  crews,
  onDayDoubleClick,
  onJobClick,
}: ForecastingMonthViewProps) {
  const gridStart = startOfWeek(startOfMonth(focusDate), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(focusDate), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const jobsByDate = useMemo(() => {
    const map: Record<string, Job[]> = {};
    for (const j of jobs) {
      // Include job on each day it spans
      const s = new Date(j.startDate);
      const e = new Date(j.endDate);
      const spanDays = eachDayOfInterval({ start: s, end: e });
      for (const d of spanDays) {
        const key = format(d, "yyyy-MM-dd");
        (map[key] ||= []).push(j);
      }
    }
    // simple sort by title to make display stable
    Object.values(map).forEach((arr) => arr.sort((a, b) => (a.title || "").localeCompare(b.title || "")));
    return map;
  }, [jobs]);

  const maxDayJobs = useMemo(() => {
    const counts = Object.values(jobsByDate).map((arr) => arr.length);
    return Math.max(1, ...(counts.length ? counts : [1]));
  }, [jobsByDate]);

  function hasConflict(list: Job[]) {
    const byCrew = new Map<number, number>();
    for (const j of list) {
      const id = j.crewId ?? -1;
      byCrew.set(id, (byCrew.get(id) ?? 0) + 1);
    }
    for (const v of byCrew.values()) {
      if (v > 1) return true;
    }
    return false;
  }

  const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 text-sm font-medium text-muted-foreground px-2 pb-2">
        {weekdayLabels.map((d) => (
          <div key={d} className="px-2 py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 border-t">
        {days.map((d, idx) => {
          const key = format(d, "yyyy-MM-dd");
          const dayJobs = jobsByDate[key] || [];
          const isCurrentMonth = isSameMonth(d, focusDate);
          const isToday = isSameDay(d, new Date());

          return (
            <div
              key={d.toISOString() + idx}
              onDoubleClick={() => onDayDoubleClick(d)}
              className={cn(
                "relative min-h-[100px] border-b border-r p-2 transition-colors",
                (idx + 1) % 7 === 0 && "border-r-0",
                !isCurrentMonth && "bg-muted/30",
                dayJobs.length === 0 ? "bg-muted/20 hover:bg-muted/30" : "hover:bg-accent/40",
                hasConflict(dayJobs) && "ring-1 ring-red-400/70"
              )}
              style={{
                backgroundColor: `rgba(148, 163, 184, ${0.12 * Math.min(1, (dayJobs.length / maxDayJobs))})`
              }}
            >
              {/* Capacity bar and state chips */}
              <div
                className={cn(
                  "absolute left-0 top-0 h-0.5",
                  dayJobs.length > 0 ? (hasConflict(dayJobs) ? "bg-red-500/80" : "bg-primary/60") : "bg-muted"
                )}
                style={{ width: `${Math.round(Math.min(1, (dayJobs.length / maxDayJobs)) * 100)}%` }}
              />
              {dayJobs.length === 0 && (
                <div className="absolute top-1 right-1 text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                  Idle
                </div>
              )}

              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    "h-7 w-7 text-sm flex items-center justify-center rounded-full",
                    isToday ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground"
                  )}
                >
                  {format(d, "d")}
                </div>
              </div>

              <div className="mt-2 flex flex-col gap-1">
                {dayJobs.slice(0, 3).map((j) => (
                  <button
                    key={`${j.id}-${key}`}
                    onClick={() => onJobClick(j)}
                    className="w-full truncate rounded-md px-1.5 py-0.5 text-left text-[11px] hover:opacity-90"
                    style={{ backgroundColor: getCrewColor(j.crewId, crews, true) }}
                    title={`${j.title} • ${crewName(j.crewId, crews)}`}
                  >
                    <span className="font-medium">{j.title}</span>
                    {isSpanning(j) && <span className="ml-2 opacity-80">({spanLabel(j)})</span>}
                  </button>
                ))}
                {dayJobs.length > 3 && (
                  <div className="text-xs text-muted-foreground">+ {dayJobs.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function isSpanning(j: Job) {
  return j.startDate !== j.endDate;
}

function spanLabel(j: Job) {
  return `${format(new Date(j.startDate), "MMM d")}–${format(new Date(j.endDate), "MMM d")}`;
}

function getCrewColor(crewId: number | undefined, crews: Crew[], withAlpha = false) {
  const c = crews.find((x) => x.id === crewId);
  const color = c?.colorHex || "#64748b";
  if (!withAlpha) return color;
  return color;
}

function crewName(crewId: number | undefined, crews: Crew[]) {
  const c = crews.find((x) => x.id === crewId);
  return c?.name || "Unassigned";
}
