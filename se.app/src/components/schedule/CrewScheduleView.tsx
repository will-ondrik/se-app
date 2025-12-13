"use client";

import React, { useMemo, useState } from "react";
import { addWeeks, endOfWeek, format, startOfWeek } from "date-fns";
import { Button } from "@/components/ui/button";
import { useScheduleBlocks } from "@/hooks/useScheduleBlocks";
import { mapBlocksToForecastJobs } from "@/lib/scheduling/adapters";
import { Timeline } from "@/components/forecasting/Timeline";
import type { Crew as ForecastCrew } from "@/types/forecasting/types";
import { ScheduleFilterBar } from "@/components/schedule/ScheduleFilterBar";
import type { JobStatus } from "@/types/schedule/types";

/**
 * CrewScheduleView
 * - Crew-focused horizontal timeline (rows = crews, x = time)
 * - Uses existing Timeline component by mapping JobTimeBlocks -> Forecasting Job shape
 * - Minimal controls: prev/next week, today, day-width zoom
 *
 * NOTE: This is a presentational wrapper. Data is fetched via useScheduleBlocks.
 */
export function CrewScheduleView() {
  const [focusStart, setFocusStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [dayWidthPx, setDayWidthPx] = useState<number>(24);

  // Uniform filters (same surface/behavior across views)
  const [selectedClientId, setSelectedClientId] = useState<number | "all">("all");
  const [selectedCrewId, setSelectedCrewId] = useState<number | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | JobStatus>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const startDate = focusStart;
  const endDate = endOfWeek(focusStart, { weekStartsOn: 1 });

  const { blocks, crews, domainCrews: _domainCrews, clients, jobs } = useScheduleBlocks({
    start: startDate,
    end: endDate,
    clientId: selectedClientId,
    crewId: selectedCrewId,
    status: selectedStatus,
    searchQuery,
  });

  // Unified loading state to avoid jarring initial render
  const loading = clients.loading || crews.loading || jobs.loading;

  // Convert JobTimeBlocks to forecasting jobs for Timeline consumption
  const jobsForTimeline = useMemo(() => mapBlocksToForecastJobs(blocks), [blocks]);

  // Convert schedule crews to forecasting Crew shape (id, name, colorHex)
  const timelineCrews: ForecastCrew[] = useMemo(
    () =>
      crews.data.map((c) => ({
        id: c.id,
        name: c.name,
        colorHex: c.colorHex,
      })),
    [crews.data]
  );

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Uniform Filter Bar */}
      <ScheduleFilterBar
        clients={clients.data}
        crews={crews.data}
        selectedClientId={selectedClientId}
        setSelectedClientId={setSelectedClientId}
        selectedCrewId={selectedCrewId}
        setSelectedCrewId={setSelectedCrewId}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        compact
      />

      {/* Controls */}
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => setFocusStart((d) => addWeeks(d, -1))}>
          Prev week
        </Button>
        <Button variant="outline" onClick={() => setFocusStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
          Today
        </Button>
        <Button variant="outline" onClick={() => setFocusStart((d) => addWeeks(d, 1))}>
          Next week
        </Button>

        <div className="ml-3 text-sm text-muted-foreground">
          {format(startDate, "PPP")} – {format(endDate, "PPP")}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setDayWidthPx((w) => Math.max(6, Math.round(w * 0.8)))}>
            - Zoom
          </Button>
          <div className="text-xs text-muted-foreground w-20 text-center">{Math.round(dayWidthPx)} px/day</div>
          <Button variant="outline" size="sm" onClick={() => setDayWidthPx((w) => Math.min(120, Math.round(w * 1.25)))}>
            + Zoom
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 min-h-0 border rounded-md bg-background">
        {loading ? (
          <SkeletonTimeline />
        ) : (
          <Timeline
            jobs={jobsForTimeline}
            crews={timelineCrews}
            startDate={startDate}
            endDate={endDate}
            onJobClick={(job) => {}}
            onJobUpdate={(id, updates) => {}}
            dayWidthPx={dayWidthPx}
            onViewportWidthChange={() => {}}
            onDayWidthChange={setDayWidthPx}
            minDayWidthPx={6}
            maxDayWidthPx={120}
          />
        )}
      </div>
    </div>
  );
}

const SkeletonTimeline = () => (
  <div className="p-3 animate-pulse space-y-3">
    <div className="h-8 bg-muted rounded" />
    <div className="h-10 bg-muted rounded" />
    <div className="h-10 bg-muted rounded" />
    <div className="h-10 bg-muted rounded" />
  </div>
);

export default CrewScheduleView;
