"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { addMonths, endOfMonth, format, isAfter, isBefore, startOfMonth } from "date-fns";
import { SharedMonthView, MonthJob } from "./SharedMonthView";
import type { Crew } from "@/types/forecasting/types";

type Props = {
  focusDate: Date;
  monthsBefore: number; // how many months before focus to render
  monthsAfter: number; // how many months after focus to render
  jobs: MonthJob[]; // jobs across the whole visible window
  crews: Crew[];
  dayMinHeight: number; // px for day cell min-height (zoom density)
  onDayMinHeightChange?: (h: number) => void;
  onDayDoubleClick: (d: Date) => void;
  onJobClick: (job: MonthJob) => void;
  onLoadMorePast?: () => void; // called when user nears the top
  onLoadMoreFuture?: () => void; // called when user nears the bottom
};

/**
 * VerticalMonthList
 * - Stacks month sections vertically (Apple Calendar-like).
 * - Each section uses SharedMonthView (same look as Schedule Month).
 * - Sticky month headers and a scroll container internal to the component.
 * - Emits load-more events when user nears top/bottom.
 */
export function VerticalMonthList({
  focusDate,
  monthsBefore,
  monthsAfter,
  jobs,
  crews,
  dayMinHeight,
  onDayMinHeightChange,
  onDayDoubleClick,
  onJobClick,
  onLoadMorePast,
  onLoadMoreFuture,
}: Props) {
  // Build month start dates from (focus - monthsBefore) to (focus + monthsAfter)
  const monthStarts = useMemo(() => {
    const arr: Date[] = [];
    const start = startOfMonth(addMonths(focusDate, -monthsBefore));
    const end = startOfMonth(addMonths(focusDate, monthsAfter));
    let cursor = startOfMonth(start);
    while (!isAfter(cursor, end)) {
      arr.push(cursor);
      cursor = addMonths(cursor, 1);
    }
    return arr;
  }, [focusDate, monthsBefore, monthsAfter]);

  // Jobs filtered by month to avoid passing oversized arrays to SharedMonthView
  const jobsByMonth = useMemo(() => {
    const map = new Map<string, MonthJob[]>();
    for (const mStart of monthStarts) {
      map.set(format(mStart, "yyyy-MM-01"), []);
    }
    for (const j of jobs) {
      // job.date is already a single day (MonthJob shape)
      const key = format(startOfMonth(new Date(j.date)), "yyyy-MM-01");
      if (map.has(key)) {
        map.get(key)!.push(j);
      }
    }
    return map;
  }, [jobs, monthStarts]);

  // Intersection observers for infinite scroll
  const topSentinelRef = useRef<HTMLDivElement | null>(null);
  const bottomSentinelRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const topEl = topSentinelRef.current;
    const bottomEl = bottomSentinelRef.current;
    const root = scrollRef.current;
    if (!root || !topEl || !bottomEl) return;

    const opts: IntersectionObserverInit = { root, rootMargin: "200px 0px", threshold: 0 };
    const topObserver = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) onLoadMorePast?.();
      }
    }, opts);
    const bottomObserver = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) onLoadMoreFuture?.();
      }
    }, opts);

    topObserver.observe(topEl);
    bottomObserver.observe(bottomEl);
    return () => {
      topObserver.disconnect();
      bottomObserver.disconnect();
    };
  }, [onLoadMorePast, onLoadMoreFuture]);

  // Ensure day min-height is applied as CSS var for SharedMonthView
  const containerStyle: React.CSSProperties = {
    // This is consumed by SharedMonthView inline style
    ["--calendar-day-min-height" as any]: `${dayMinHeight}px`,
  };

  return (
    <div ref={scrollRef} className="h-full overflow-auto" style={containerStyle}>
      <div ref={topSentinelRef} />
      {monthStarts.map((mStart) => {
        const key = format(mStart, "yyyy-MM-01");
        const monthJobs = jobsByMonth.get(key) || [];
        const monthLabel = format(mStart, "MMMM yyyy");
        const monthEnd = endOfMonth(mStart);
        // For SharedMonthView focusDate, pass the month start so its grid matches Schedule
        return (
          <section key={key} className="mb-6">
            {/* Sticky month header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-4 py-2">
              <h2 className="text-lg font-semibold">{monthLabel}</h2>
            </div>
            <div className="px-4 py-3">
              <SharedMonthView
                focusDate={mStart}
                jobs={monthJobs}
                crews={crews}
                onDayDoubleClick={onDayDoubleClick}
                onJobClick={onJobClick}
              />
            </div>
          </section>
        );
      })}
      <div ref={bottomSentinelRef} />
    </div>
  );
}
