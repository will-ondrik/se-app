/**
 * Scheduling utilities:
 * - Conflict detection (crew overlap, employee overlap, over-capacity)
 * - Capacity calculations
 * - Helpers to bridge conflict maps back to UI needs
 *
 * Keep these pure where possible so they can later be moved server-side.
 */

import { differenceInMinutes, eachDayOfInterval, endOfDay, format, max, min, startOfDay } from "date-fns";
import type {
  ConflictMap,
  ConflictReason,
  Crew,
  CrewDayCapacity,
  Employee,
  JobTimeBlock,
} from "@/types/domain/scheduling";

/* =========================
   Time helpers
   ========================= */

export function isOverlap(aStartISO: string, aEndISO: string, bStartISO: string, bEndISO: string): boolean {
  const aS = new Date(aStartISO).getTime();
  const aE = new Date(aEndISO).getTime();
  const bS = new Date(bStartISO).getTime();
  const bE = new Date(bEndISO).getTime();
  if (!isFinite(aS) || !isFinite(aE) || !isFinite(bS) || !isFinite(bE)) return false;
  return aS < bE && bS < aE;
}

/**
 * Compute the number of hours a block overlaps a given calendar day (yyyy-MM-dd).
 * If block spans multiple days, this returns just the portion within the given day.
 */
export function hoursOverlapInDay(block: JobTimeBlock, day: Date): number {
  const dayStart = startOfDay(day);
  const dayEnd = endOfDay(day);
  const s = max([dayStart, new Date(block.startDateTime)]);
  const e = min([dayEnd, new Date(block.endDateTime)]);
  const mins = Math.max(0, differenceInMinutes(e, s));
  return mins / 60;
}

/* =========================
   Indexing helpers
   ========================= */

function ensureMapArray<K, V>(m: Map<K, V[]>, key: K): V[] {
  let arr = m.get(key);
  if (!arr) {
    arr = [];
    m.set(key, arr);
  }
  return arr;
}

function addConflict(conflicts: ConflictMap, blockId: JobTimeBlock["id"], reason: ConflictReason) {
  const list = conflicts.get(blockId) ?? [];
  list.push(reason);
  conflicts.set(blockId, list);
}

/* =========================
   Conflict detection
   ========================= */

type FindConflictsOptions = {
  crews?: Crew[];
  employees?: Employee[];
  // If true, mark blocks that contribute to over-capacity on a given day
  includeCapacityConflicts?: boolean;
  defaultCrewCapacityHoursPerDay?: number; // default 8
  // Optional date window to constrain capacity calculations
  startDate?: Date;
  endDate?: Date;
};

/**
 * Find conflicts across blocks:
 * - Crew overlap: same crewId with overlapping times
 * - Employee overlap: if crews define crewMembers and share an employee in overlapping times
 * - Over-capacity: daily sum of planned hours exceeds crew capacityHoursPerDay (default 8)
 */
export function findScheduleConflicts(
  blocks: JobTimeBlock[],
  crews?: Crew[],
  employees?: Employee[],
  options: Omit<FindConflictsOptions, "crews" | "employees"> = {}
): ConflictMap {
  const conflicts: ConflictMap = new Map();

  // Group blocks by crew
  const byCrew = new Map<number, JobTimeBlock[]>();
  for (const b of blocks) {
    if (b.crewId == null) continue;
    const arr = ensureMapArray(byCrew, b.crewId);
    arr.push(b);
  }

  // Crew overlap: sort by start and check overlaps within same crew
  for (const [crewId, list] of byCrew.entries()) {
    const sorted = list.slice().sort((a, b) => +new Date(a.startDateTime) - +new Date(b.startDateTime));
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const A = sorted[i];
        const B = sorted[j];
        // Early exit if B starts after A ends (sorted by start)
        if (new Date(B.startDateTime).getTime() >= new Date(A.endDateTime).getTime()) break;
        if (isOverlap(A.startDateTime, A.endDateTime, B.startDateTime, B.endDateTime)) {
          addConflict(conflicts, A.id, { type: "CREW_OVERLAP", details: `Crew ${crewId}` });
          addConflict(conflicts, B.id, { type: "CREW_OVERLAP", details: `Crew ${crewId}` });
        }
      }
    }
  }

  // Employee overlap: if crews have members and any shared employee is double-booked
  // Build map crewId -> member set
  const crewMembers = new Map<number, Set<number>>();
  if (crews) {
    for (const c of crews) {
      if (c.crewMembers && c.crewMembers.length) {
        crewMembers.set(c.id, new Set(c.crewMembers));
      }
    }
  }

  if (crewMembers.size > 0) {
    // Compare pairs across potentially different crews
    const all = blocks.slice().sort((a, b) => +new Date(a.startDateTime) - +new Date(b.startDateTime));
    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        const A = all[i];
        const B = all[j];
        // Quick window skip
        if (new Date(B.startDateTime).getTime() >= new Date(A.endDateTime).getTime()) break;

        if (A.crewId == null || B.crewId == null) continue;
        const memA = crewMembers.get(A.crewId);
        const memB = crewMembers.get(B.crewId);
        if (!memA || !memB) continue;

        // Any intersection?
        let shared = false;
        for (const id of memA) {
          if (memB.has(id)) {
            shared = true;
            break;
          }
        }
        if (shared && isOverlap(A.startDateTime, A.endDateTime, B.startDateTime, B.endDateTime)) {
          addConflict(conflicts, A.id, { type: "EMPLOYEE_OVERLAP" });
          addConflict(conflicts, B.id, { type: "EMPLOYEE_OVERLAP" });
        }
      }
    }
  }

  // Over-capacity by crew/day
  const includeCapacity = options.includeCapacityConflicts ?? true;
  if (includeCapacity) {
    const defaultCap = options.defaultCrewCapacityHoursPerDay ?? 8;

    // Build capacity map per crew/day
    // Determine range to evaluate (either provided or derived from blocks)
    const startDate =
      options.startDate ??
      new Date(
        blocks.length ? min(blocks.map((b) => new Date(b.startDateTime))) : new Date()
      );
    const endDate =
      options.endDate ??
      new Date(
        blocks.length ? max(blocks.map((b) => new Date(b.endDateTime))) : new Date()
      );

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    // For quick lookup of crew capacity
    const crewCap = new Map<number, number>();
    if (crews) {
      for (const c of crews) crewCap.set(c.id, c.capacityHoursPerDay ?? defaultCap);
    }

    // For each day/crew, sum planned hours that overlap that day
    const perDayByCrew = new Map<string, number>(); // key = `${crewId}|yyyy-MM-dd`
    const perDayBlocks = new Map<string, JobTimeBlock[]>(); // to mark conflicting blocks later

    const fmt = (d: Date) => format(d, "yyyy-MM-dd");

    for (const day of days) {
      const dateKey = fmt(day);
      for (const b of blocks) {
        if (b.crewId == null) continue;
        const hours = hoursOverlapInDay(b, day);
        if (hours <= 0) continue;
        const key = `${b.crewId}|${dateKey}`;
        perDayByCrew.set(key, (perDayByCrew.get(key) ?? 0) + (b.plannedHours ?? hours));
        const arr = perDayBlocks.get(key) ?? [];
        arr.push(b);
        perDayBlocks.set(key, arr);
      }
    }

    // Mark over-capacity conflicts
    for (const [key, scheduled] of perDayByCrew.entries()) {
      const [crewIdStr, dateStr] = key.split("|");
      const crewId = Number(crewIdStr);
      const cap = crewCap.get(crewId) ?? defaultCap;
      if (scheduled > cap) {
        const blocksInDay = perDayBlocks.get(key) ?? [];
        for (const b of blocksInDay) {
          addConflict(conflicts, b.id, {
            type: "OVER_CAPACITY",
            details: `Crew ${crewId} ${dateStr}: ${scheduled.toFixed(1)}h / ${cap}h`,
          });
        }
      }
    }
  }

  return conflicts;
}

/* =========================
   Capacity aggregation
   ========================= */

export function computeCrewDayCapacity(
  blocks: JobTimeBlock[],
  crews: Crew[],
  startDate?: Date,
  endDate?: Date,
  defaultCrewCapacityHoursPerDay = 8
): CrewDayCapacity[] {
  if (!blocks.length && !crews.length) return [];
  const start =
    startDate ??
    new Date(blocks.length ? min(blocks.map((b) => new Date(b.startDateTime))) : new Date());
  const end =
    endDate ??
    new Date(blocks.length ? max(blocks.map((b) => new Date(b.endDateTime))) : new Date());

  const days = eachDayOfInterval({ start, end });
  const fmt = (d: Date) => format(d, "yyyy-MM-dd");

  const capByCrew = new Map<number, number>();
  for (const c of crews) capByCrew.set(c.id, c.capacityHoursPerDay ?? defaultCrewCapacityHoursPerDay);

  const out: CrewDayCapacity[] = [];
  for (const day of days) {
    const dateKey = fmt(day);
    for (const c of crews) {
      // Sum scheduled
      let scheduled = 0;
      for (const b of blocks) {
        if (b.crewId !== c.id) continue;
        const hours = hoursOverlapInDay(b, day);
        if (hours > 0) scheduled += b.plannedHours ?? hours;
      }
      const capacityHours = capByCrew.get(c.id) ?? defaultCrewCapacityHoursPerDay;
      out.push({
        crewId: c.id,
        date: dateKey,
        capacityHours,
        scheduledHours: scheduled,
        overCapacity: scheduled > capacityHours,
      });
    }
  }
  return out;
}

/* =========================
   UI glue helpers
   ========================= */

/** Gather all schedule Job IDs that have any conflict from a ConflictMap and the originating blocks. */
export function conflictJobIdSetFromBlocks(conflicts: ConflictMap, blocks: JobTimeBlock[]): Set<number> {
  const ids = new Set<number>();
  const conflictedBlockIds = new Set(Array.from(conflicts.keys()));
  for (const b of blocks) {
    if (conflictedBlockIds.has(b.id) && typeof b.jobId === "number") {
      ids.add(b.jobId);
    }
  }
  return ids;
}
