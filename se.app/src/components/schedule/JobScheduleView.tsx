"use client";

import React, { useMemo, useState } from "react";
import { addWeeks, endOfWeek, format, startOfWeek } from "date-fns";
import { Button } from "@/components/ui/button";
import { useScheduleBlocks } from "@/hooks/useScheduleBlocks";
import { Badge } from "@/components/ui/badge";

/**
 * JobScheduleView
 * - For a selected job, show its scheduled time blocks across days/weeks
 * - Display assigned crew and planned hours
 * - If estimatedHours is available on the mapped domain job, show remaining hours
 *
 * Minimal, presentational-only. Can be embedded in a Job detail page or used as a route page.
 */
export function JobScheduleView({ jobId }: { jobId: number }) {
  const [focusStart, setFocusStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const startDate = focusStart;
  const endDate = endOfWeek(focusStart, { weekStartsOn: 1 });

  // Fetch schedule blocks in range
  const { blocks, domainCrews, clients, crews, jobs } = useScheduleBlocks({
    start: startDate,
    end: endDate,
    clientId: "all",
    crewId: "all",
  });

  const loading = clients.loading || crews.loading || jobs.loading;

  // Filter to the selected job
  const jobBlocks = useMemo(() => blocks.filter((b) => b.jobId === jobId), [blocks, jobId]);

  const totalPlanned = useMemo(
    () =>
      jobBlocks.reduce((acc, b) => acc + (typeof b.plannedHours === "number" ? b.plannedHours : 0), 0),
    [jobBlocks]
  );

  const estimated = jobBlocks[0]?.job?.estimatedHours;
  const remaining = typeof estimated === "number" ? Math.max(0, estimated - totalPlanned) : 0;

  const jobTitle = jobBlocks[0]?.job?.scopeSummary || `Job #${jobId}`;
  const clientName = jobBlocks[0]?.client?.name;

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">
            {clientName ? `${clientName} — ${jobTitle}` : jobTitle}
          </div>
          <div className="text-sm text-muted-foreground">
            {format(startDate, "PPP")} – {format(endDate, "PPP")}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setFocusStart((d) => addWeeks(d, -1))}>
            Prev week
          </Button>
          <Button
            variant="outline"
            onClick={() => setFocusStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
          >
            This week
          </Button>
          <Button variant="outline" onClick={() => setFocusStart((d) => addWeeks(d, 1))}>
            Next week
          </Button>
        </div>
      </div>

      {/* Summary badges */}
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="px-2 py-1 text-xs">
          Scheduled: {totalPlanned.toFixed(1)}h
        </Badge>
        {typeof estimated === "number" && (
          <>
            <Badge variant="secondary" className="px-2 py-1 text-xs">
              Estimated: {estimated.toFixed(1)}h
            </Badge>
            <Badge
              className="px-2 py-1 text-xs border-0"
              style={{ backgroundColor: remaining > 0 ? "#fde68a" : "#bbf7d0", color: "#111827" }}
            >
              {remaining > 0 ? `Remaining: ${remaining.toFixed(1)}h` : "Fully scheduled"}
            </Badge>
          </>
        )}
      </div>

      {/* Blocks list */}
      <div className="flex-1 overflow-auto rounded-md border">
        {loading ? (
          <SkeletonJobTable />
        ) : (
          <table className="w-full text-sm">
          <thead className="bg-muted/40 sticky top-0 z-10">
            <tr>
              <th className="text-left px-3 py-2 w-48">Date</th>
              <th className="text-left px-2 py-2">Time</th>
              <th className="text-left px-2 py-2">Crew</th>
              <th className="text-left px-2 py-2">Planned Hours</th>
              <th className="text-left px-2 py-2">Status</th>
              <th className="text-left px-2 py-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {jobBlocks.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                  No scheduled time blocks for this job in the selected week.
                </td>
              </tr>
            )}
            {jobBlocks
              .slice()
              .sort((a, b) => +new Date(a.startDateTime) - +new Date(b.startDateTime))
              .map((b) => {
                const s = new Date(b.startDateTime);
                const e = new Date(b.endDateTime);
                const crew =
                  b.crew ||
                  domainCrews.find((c) => c.id === b.crewId) || { id: b.crewId, name: "Unassigned" };
                const hh = typeof b.plannedHours === "number" ? b.plannedHours : (e.getTime() - s.getTime()) / 3.6e6;
                return (
                  <tr key={String(b.id)} className="border-t">
                    <td className="px-3 py-2">{format(s, "EEE, MMM dd")}</td>
                    <td className="px-2 py-2">
                      {format(s, "HH:mm")} – {format(e, "HH:mm")}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: (crew as any).colorHex || "#64748b" }}
                        />
                        <span>{crew?.name || "Unassigned"}</span>
                      </div>
                    </td>
                    <td className="px-2 py-2">{hh.toFixed(1)}h</td>
                    <td className="px-2 py-2 capitalize">{b.status || "planned"}</td>
                    <td className="px-2 py-2 text-muted-foreground">
                      {b.notes || (b.job?.weatherSensitive ? "Weather sensitive" : "")}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
        )}
      </div>

      <div className="text-xs text-muted-foreground">
        Tip: For weather-sensitive jobs, you can quickly reschedule blocks by adjusting date/time in the job edit
        dialog on the Schedule page.
      </div>
    </div>
  );
}

const SkeletonJobTable = () => (
  <div className="p-3 animate-pulse space-y-3">
    <div className="h-6 bg-muted rounded" />
    <div className="h-10 bg-muted rounded" />
    <div className="h-10 bg-muted rounded" />
    <div className="h-10 bg-muted rounded" />
  </div>
);

export default JobScheduleView;
