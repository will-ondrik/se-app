import React, { useMemo, useState } from "react";
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
  addDays,
} from "date-fns";
import { cn } from "@/lib/utils";

interface ResourceMonthViewProps {
  focusDate: Date;
  jobs: Job[];
  crews: Crew[];
  onDayDoubleClick: (d: Date) => void;
  onJobClick: (job: Job) => void;
  maxVisibleCrews?: number; // collapsed by default for large crews
}

/**
 * ResourceMonthView
 * - SAME calendar look as Schedule Month:
 *   - Weekday header row
 *   - Month grid lines/colors/spacing
 * - Adds a left sticky crew column and repeats a crew row for each calendar week (6 weeks visible)
 * - Day cells show per-crew chips (same style as Schedule chips)
 * - Collapse crews beyond maxVisibleCrews with a toggle
 */
export function ResourceMonthView({
  focusDate,
  jobs,
  crews,
  onDayDoubleClick,
  onJobClick,
  maxVisibleCrews = 5,
}: ResourceMonthViewProps) {
  // Compute month grid range
  const gridStart = startOfWeek(startOfMonth(focusDate), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(focusDate), { weekStartsOn: 1 });

  // Build days array grouped by weeks (6 rows of 7 days)
  const weeks: Date[][] = useMemo(() => {
    const out: Date[][] = [];
    let cursor = gridStart;
    while (cursor <= gridEnd) {
      const row: Date[] = [];
      for (let i = 0; i < 7; i++) {
        row.push(addDays(cursor, i));
      }
      out.push(row);
      cursor = addDays(cursor, 7);
    }
    return out;
  }, [gridStart, gridEnd]);

  // Index jobs per crew per day key for quick cell rendering
  const jobsByCrewDay = useMemo(() => {
    const map = new Map<number, Map<string, Job[]>>();
    for (const j of jobs) {
      const s = new Date(j.startDate);
      const e = new Date(j.endDate);
      const span = eachDayOfInterval({ start: s, end: e });
      const crewId = j.crewId ?? -1;
      if (!map.has(crewId)) map.set(crewId, new Map());
      const inner = map.get(crewId)!;
      for (const d of span) {
        const key = format(d, "yyyy-MM-dd");
        const arr = inner.get(key) ?? [];
        arr.push(j);
        inner.set(key, arr);
      }
    }
    // Sort chips in each day for stable render
    for (const inner of map.values()) {
      for (const [k, arr] of inner.entries()) {
        inner.set(
          k,
          arr.slice().sort((a, b) => (a.title || "").localeCompare(b.title || ""))
        );
      }
    }
    return map;
  }, [jobs]);

  const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Crew collapsing
  const [showAllCrews, setShowAllCrews] = useState(false);
  const visibleCrews = showAllCrews ? crews : crews.slice(0, maxVisibleCrews);
  const hiddenCount = crews.length - visibleCrews.length;

  return (
    <div className="w-full">
      {/* Header row: empty sticky crew column + weekday labels, same styling as Schedule */}
      <div className="grid grid-cols-[160px_repeat(7,1fr)] text-sm font-medium text-muted-foreground px-2 pb-2 sticky top-0 bg-background z-10">
        <div />
        {weekdayLabels.map((d) => (
          <div key={d} className="px-2 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Optional collapse/expand crews control */}
      {hiddenCount > 0 && !showAllCrews && (
        <div className="px-2 pb-2">
          <button
            className="text-xs text-muted-foreground underline"
            onClick={() => setShowAllCrews(true)}
          >
            Show {hiddenCount} more crews
          </button>
        </div>
      )}
      {showAllCrews && crews.length > maxVisibleCrews && (
        <div className="px-2 pb-2">
          <button
            className="text-xs text-muted-foreground underline"
            onClick={() => setShowAllCrews(false)}
          >
            Collapse crews
          </button>
        </div>
      )}

      {/* For each week, render one row per crew */}
      <div className="space-y-0">
        {weeks.map((weekDays, wIdx) => (
          <div key={wIdx} className="border-t">
            {visibleCrews.map((crew, cIdx) => (
              <div
                key={`${crew.id}-${wIdx}`}
                className={cn(
                  "grid grid-cols-[160px_repeat(7,1fr)]",
                  (wIdx + cIdx) % 2 === 0 ? "bg-timeline-row" : "bg-timeline-row-alt"
                )}
              >
                {/* Sticky crew column on the left */}
                <div className="px-2 py-2 border-r sticky left-0 bg-inherit z-10">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: crew.colorHex }}
                    />
                    <span className="font-medium text-[11px] truncate">{crew.name}</span>
                  </div>
                </div>

                {/* 7 day cells for this calendar week for the crew */}
                {weekDays.map((d, idx) => {
                  const key = format(d, "yyyy-MM-dd");
                  const isCurrentMonth = isSameMonth(d, focusDate);
                  const isToday = isSameDay(d, new Date());
                  const crewDayJobs =
                    jobsByCrewDay.get(crew.id)?.get(key) ?? [];

                  return (
                    <div
                      key={key}
                      onDoubleClick={() => onDayDoubleClick(d)}
                      className={cn(
                        "min-h-[70px] border-r p-2 hover:bg-accent/40 transition-colors relative",
                        idx === 6 && "border-r-0",
                        !isCurrentMonth && "bg-muted/30"
                      )}
                      style={{ borderColor: "var(--muted)" }}
                    >
                      {/* Day number bubble in top-left, same as Schedule look */}
                      <div className="absolute top-1 left-1">
                        <div
                          className={cn(
                            "h-6 w-6 text-xs flex items-center justify-center rounded-full",
                            isToday
                              ? "bg-primary text-primary-foreground font-semibold"
                              : "text-muted-foreground"
                          )}
                        >
                          {format(d, "d")}
                        </div>
                      </div>

                      {/* Chips list (Schedule-like) */}
                      <div className="mt-6 flex flex-col gap-1">
                        {crewDayJobs.slice(0, 3).map((j) => (
                          <button
                            key={`${j.id}-${key}`}
                            onClick={() => onJobClick(j)}
                            className="w-full truncate rounded-md px-1.5 py-0.5 text-left text-[11px] hover:opacity-90"
                            style={{
                              backgroundColor: getCrewColor(j.crewId, crews, true),
                            }}
                            title={`${j.title} • ${crewName(j.crewId, crews)}`}
                          >
                            <span className="font-medium">{j.title}</span>
                          </button>
                        ))}
                        {crewDayJobs.length > 3 && (
                          <div className="text-[10px] text-muted-foreground">
                            + {crewDayJobs.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
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
