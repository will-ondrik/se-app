"use client";

import React, { useMemo } from "react";
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
import type { Crew } from "@/types/forecasting/types";

export type MonthJob = {
  id: number | string;
  title: string;
  date: string; // yyyy-MM-dd
  startTime?: string | null;
  endTime?: string | null;
  client?: { name?: string | null } | null;
  crewId?: number;
  crew?: { colorHex?: string | null; name?: string | null } | null;
};

export function SharedMonthView({
  focusDate,
  jobs,
  crews,
  onDayDoubleClick,
  onJobClick,
}: {
  focusDate: Date;
  jobs: MonthJob[];
  crews: Crew[];
  onDayDoubleClick: (d: Date) => void;
  onJobClick: (job: MonthJob) => void;
}) {
  const gridStart = startOfWeek(startOfMonth(focusDate), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(focusDate), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const jobsByDate = useMemo(() => {
    const map: Record<string, MonthJob[]> = {};
    for (const j of jobs) {
      const key = j.date;
      map[key] = map[key] || [];
      map[key].push(j);
    }
    Object.values(map).forEach((arr) =>
      arr.sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""))
    );
    return map;
  }, [jobs]);

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
          const dayJobs = jobsByDate[format(d, "yyyy-MM-dd")] || [];
          const isCurrentMonth = isSameMonth(d, focusDate);
          const isToday = isSameDay(d, new Date());

          return (
            <div
              key={d.toISOString() + idx}
              onDoubleClick={() => onDayDoubleClick(d)}
              className={cn(
                "border-b border-r p-2 hover:bg-accent/40 transition-colors",
                (idx + 1) % 7 === 0 && "border-r-0",
                !isCurrentMonth && "bg-muted/30"
              )}
              style={{ minHeight: "var(--calendar-day-min-height, 100px)" }}
            >
              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    "h-7 w-7 text-sm flex items-center justify-center rounded-full",
                    isToday
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-muted-foreground"
                  )}
                >
                  {format(d, "d")}
                </div>
              </div>

              <div className="mt-2 flex flex-col gap-1">
                {dayJobs.slice(0, 3).map((j) => (
                  <button
                    key={String(j.id)}
                    onClick={() => onJobClick(j)}
                    className="w-full truncate rounded-md px-1.5 py-0.5 text-left text-[11px] hover:opacity-90"
                    style={{ backgroundColor: getCrewColor(j.crewId, crews, true) }}
                    title={`${j.title} • ${fmtTimeRange(j.startTime || undefined, j.endTime || undefined)} • ${crewName(j.crewId, crews)}`}
                  >
                    <span className="font-medium">{j.title}</span>
                    <span className="ml-2 opacity-80">
                      {fmtTimeRange(j.startTime || undefined, j.endTime || undefined)}
                    </span>
                  </button>
                ))}
                {dayJobs.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    + {dayJobs.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function fmtTimeRange(start?: string, end?: string) {
  if (!start && !end) return "";
  if (start && end) return `${start}–${end}`;
  return start || end || "";
}

function getCrewColor(
  crewId: number | undefined,
  crews: Crew[],
  _withAlpha = false
) {
  const c = crews.find((x) => x.id === crewId);
  const color = c?.colorHex || "#64748b";
  return color;
}

function crewName(crewId: number | undefined, crews: Crew[]) {
  const c = crews.find((x) => x.id === crewId);
  return c?.name || "Unassigned";
}
