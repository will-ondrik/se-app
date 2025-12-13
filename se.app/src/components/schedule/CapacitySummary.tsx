"use client";

import React, { useMemo, useState } from "react";
import { addWeeks, endOfWeek, format, startOfWeek } from "date-fns";
import { Button } from "@/components/ui/button";
import { useScheduleBlocks } from "@/hooks/useScheduleBlocks";
import { computeCrewDayCapacity } from "@/lib/scheduling/utils";
import { ScheduleFilterBar } from "@/components/schedule/ScheduleFilterBar";
import type { JobStatus } from "@/types/schedule/types";

/**
 * CapacitySummary
 * - Per selected week, compute:
 *   - total crew capacity hours (sum of capacityHoursPerDay)
 *   - total scheduled hours (sum of JobTimeBlock.plannedHours overlapping day)
 *   - Over/Under indicator
 * - Shows a simple table of per-crew per-day hours with highlights for overbooked days
 *
 * Notes:
 * - Uses default capacityHoursPerDay=8 when crew capacity is undefined
 * - This is a minimal presentational component designed to drive a later dashboard
 */
export function CapacitySummary() {
  const [focusStart, setFocusStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  // Uniform filters (same as other views)
  const [selectedClientId, setSelectedClientId] = useState<number | "all">("all");
  const [selectedCrewId, setSelectedCrewId] = useState<number | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | JobStatus>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const startDate = focusStart;
  const endDate = endOfWeek(focusStart, { weekStartsOn: 1 });

  const { blocks, domainCrews, clients, crews, jobs } = useScheduleBlocks({
    start: startDate,
    end: endDate,
    clientId: selectedClientId,
    crewId: selectedCrewId,
    status: selectedStatus,
    searchQuery,
  });
  const loading = clients.loading || crews.loading || jobs.loading;

  const rows = useMemo(
    () => computeCrewDayCapacity(blocks, domainCrews, startDate, endDate, 8),
    [blocks, domainCrews, startDate, endDate]
  );

  const days = useMemo(() => {
    // 7 days Monday..Sunday
    const out: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      out.push(format(d, "yyyy-MM-dd"));
    }
    return out;
  }, [startDate]);

  // Aggregate totals
  const { totalCapacity, totalScheduled } = useMemo(() => {
    let cap = 0;
    let sched = 0;
    for (const r of rows) {
      cap += r.capacityHours;
      sched += r.scheduledHours;
    }
    return { totalCapacity: cap, totalScheduled: sched };
  }, [rows]);

  const overUnder = totalScheduled - totalCapacity;
  const overUnderLabel =
    overUnder > 0 ? `Over by ${overUnder.toFixed(1)}h` : `Under by ${Math.abs(overUnder).toFixed(1)}h`;

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
        <Button
          variant="outline"
          onClick={() => setFocusStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
        >
          This week
        </Button>
        <Button variant="outline" onClick={() => setFocusStart((d) => addWeeks(d, 1))}>
          Next week
        </Button>

        <div className="ml-3 text-sm text-muted-foreground">
          {format(startDate, "PPP")} – {format(endDate, "PPP")}
        </div>

        <div className="ml-auto text-sm">
          <span className="mr-3">
            Capacity: <span className="font-medium">{totalCapacity.toFixed(1)}h</span>
          </span>
          <span className="mr-3">
            Scheduled: <span className="font-medium">{totalScheduled.toFixed(1)}h</span>
          </span>
          <span
            className={
              overUnder > 0 ? "text-destructive font-medium" : "text-emerald-600 dark:text-emerald-400 font-medium"
            }
          >
            {overUnderLabel}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto rounded-md border">
        {loading ? (
          <SkeletonCapacityTable />
        ) : (
          <table className="w-full text-sm">
          <thead className="bg-muted/40 sticky top-0 z-10">
            <tr>
              <th className="text-left px-3 py-2 w-48">Crew</th>
              {days.map((d) => (
                <th key={d} className="text-left px-2 py-2">
                  {format(new Date(d), "EEE dd")}
                </th>
              ))}
              <th className="text-left px-2 py-2">Total Scheduled</th>
              <th className="text-left px-2 py-2">Total Capacity</th>
            </tr>
          </thead>
          <tbody>
            {domainCrews.map((crew) => {
              // Build a row per crew aggregating daily values
              let rowScheduledSum = 0;
              let rowCapacitySum = 0;
              return (
                <tr key={crew.id} className="border-t">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: crew.colorHex || "#64748b" }}
                      />
                      <span className="font-medium">{crew.name}</span>
                    </div>
                  </td>
                  {days.map((d) => {
                    const rec = rows.find((r) => r.crewId === crew.id && r.date === d);
                    const scheduled = rec?.scheduledHours ?? 0;
                    const capacity = rec?.capacityHours ?? (crew.capacityHoursPerDay ?? 8);
                    rowScheduledSum += scheduled;
                    rowCapacitySum += capacity;
                    const over = (rec?.overCapacity ?? false) || scheduled > capacity;
                    return (
                      <td key={`${crew.id}-${d}`} className="px-2 py-2">
                        <div
                          className={`inline-flex items-center rounded px-1.5 py-0.5 ${
                            over ? "bg-destructive/15 text-destructive" : "bg-accent/40 text-muted-foreground"
                          }`}
                          title={
                            over
                              ? `Over capacity: ${scheduled.toFixed(1)}h / ${capacity.toFixed(1)}h`
                              : `${scheduled.toFixed(1)}h / ${capacity.toFixed(1)}h`
                          }
                        >
                          {scheduled.toFixed(1)}h
                        </div>
                      </td>
                    );
                  })}
                  <td className="px-2 py-2 font-medium">{rowScheduledSum.toFixed(1)}h</td>
                  <td className="px-2 py-2 text-muted-foreground">{rowCapacitySum.toFixed(1)}h</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        )}
      </div>

      <div className="text-xs text-muted-foreground">
        Notes: Over-capacity markers are computed per day using plannedHours when available; otherwise the hours
        overlapped by a block within the day.
      </div>
    </div>
  );
}

const SkeletonCapacityTable = () => (
  <div className="p-3 animate-pulse space-y-3">
    <div className="h-6 bg-muted rounded" />
    <div className="h-10 bg-muted rounded" />
    <div className="h-10 bg-muted rounded" />
    <div className="h-10 bg-muted rounded" />
  </div>
);

export default CapacitySummary;
