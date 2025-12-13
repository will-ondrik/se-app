/**
 * Scheduling adapters
 * Map existing app models (scheduleApi / forecastingApi) into domain scheduling types.
 *
 * IMPORTANT:
 * - Non-breaking: we do not change existing APIs, only adapt their data.
 * - This lets us refactor UIs to use JobTimeBlock (job+crew+time) without rewriting backends.
 */

import type {
  Job as ScheduleJob,
  Client as ScheduleClient,
  Crew as ScheduleCrew,
} from "@/types/schedule/types";
import type {
  Job as ForecastJob,
  Client as ForecastClient,
  Crew as ForecastCrew,
} from "@/types/forecasting/types";

import type {
  JobTimeBlock,
  Job as DomainJob,
  Client as DomainClient,
  Crew as DomainCrew,
  JobOperationalStatus,
  TimeBlockStatus,
} from "@/types/domain/scheduling";

/* =========================
   Helpers
   ========================= */

/** Combine date (yyyy-MM-dd) and time (HH:mm) to local ISO-like string without timezone shift. */
function combineDateTime(date: string, time?: string): string {
  const hhmm = (time && time.trim()) ? time : "08:00";
  // Keep as local wall time literal to avoid unwanted UTC offsets in UI math
  return `${date}T${hhmm}:00`;
}

/** Add hours to a local ISO-like string yyyy-MM-ddTHH:mm:ss (no timezone conversion). */
function addHoursLocal(isoLocal: string, hours: number): string {
  const d = new Date(isoLocal);
  // If isoLocal lacks timezone, Date may interpret as local; this is fine for UI approximations.
  d.setHours(d.getHours() + hours);
  // Return as yyyy-MM-ddTHH:mm:ss in local time
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const HH = String(d.getHours()).padStart(2, "0");
  const MM = String(d.getMinutes()).padStart(2, "0");
  const SS = String(d.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${HH}:${MM}:${SS}`;
}

/** Compute hours between two local ISO-like strings. */
function diffHours(startIsoLocal: string, endIsoLocal: string): number {
  const s = new Date(startIsoLocal).getTime();
  const e = new Date(endIsoLocal).getTime();
  if (!isFinite(s) || !isFinite(e)) return 0;
  return Math.max(0, (e - s) / (1000 * 60 * 60));
}

/** Status mapper (Schedule -> Domain) */
function mapScheduleStatus(s?: "SCHEDULED" | "COMPLETED" | "CANCELLED"): JobOperationalStatus | undefined {
  switch (s) {
    case "SCHEDULED":
      return "scheduled";
    case "COMPLETED":
      return "complete";
    case "CANCELLED":
      return "canceled";
    default:
      return undefined;
  }
}

/** Map schedule job status to block status */
function mapScheduleToBlockStatus(s?: "SCHEDULED" | "COMPLETED" | "CANCELLED"): TimeBlockStatus {
  switch (s) {
    case "SCHEDULED":
      return "planned";
    case "COMPLETED":
      return "complete";
    case "CANCELLED":
      return "canceled";
    default:
      return "planned";
  }
}

/* =========================
   scheduleApi -> Domain
   ========================= */

/** Map schedule Client to domain Client (1:1 fields preserved) */
export function mapScheduleClientToDomain(c: ScheduleClient): DomainClient {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    address: c.address,
  };
}

/** Map schedule Crew to domain Crew (capacity optional; default handled in utilities) */
export function mapScheduleCrewToDomain(c: ScheduleCrew): DomainCrew {
  return {
    id: c.id,
    name: c.name,
    colorHex: c.colorHex,
  };
}

/** Minimal Job (domain) derived from a schedule Job row */
export function mapScheduleJobToDomain(job: ScheduleJob): DomainJob {
  return {
    id: job.id,
    clientId: job.clientId,
    address: job.address,
    scopeSummary: job.title,
    status: mapScheduleStatus(job.status),
    client: job.client ? mapScheduleClientToDomain(job.client as any) : undefined,
  };
}

/** JobTimeBlock for a schedule Job (single-day time window) */
export function mapScheduleJobToBlock(job: ScheduleJob): JobTimeBlock {
  const start = combineDateTime(job.date, job.startTime);
  const end = job.endTime ? combineDateTime(job.date, job.endTime) : addHoursLocal(start, 4);
  const plannedHours = diffHours(start, end);

  return {
    id: `sched-${job.id}`,
    jobId: job.id,
    crewId: job.crewId ?? 0,
    startDateTime: start,
    endDateTime: end,
    plannedHours,
    status: mapScheduleToBlockStatus(job.status),
    notes: job.notes,
    job: mapScheduleJobToDomain(job),
    client: job.client ? mapScheduleClientToDomain(job.client as any) : undefined,
    crew: job.crew ? mapScheduleCrewToDomain(job.crew as any) : undefined,
  };
}

/** Bulk map for schedule data */
export function mapScheduleDataToDomain(input: {
  jobs: ScheduleJob[];
  clients?: ScheduleClient[];
  crews?: ScheduleCrew[];
}): {
  domainJobs: DomainJob[];
  blocks: JobTimeBlock[];
  domainClients?: DomainClient[];
  domainCrews?: DomainCrew[];
} {
  const domainJobs = input.jobs.map(mapScheduleJobToDomain);
  const blocks = input.jobs.map(mapScheduleJobToBlock);
  const domainClients = input.clients?.map(mapScheduleClientToDomain);
  const domainCrews = input.crews?.map(mapScheduleCrewToDomain);
  return { domainJobs, blocks, domainClients, domainCrews };
}

/* =========================
   forecastingApi -> Domain
   ========================= */

/** Map forecasting Client to domain Client */
export function mapForecastClientToDomain(c: ForecastClient): DomainClient {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    address: c.address,
  };
}

/** Map forecasting Crew to domain Crew */
export function mapForecastCrewToDomain(c: ForecastCrew): DomainCrew {
  return {
    id: c.id,
    name: c.name,
    colorHex: c.colorHex,
  };
}

/** Minimal domain Job from forecasting job */
export function mapForecastJobToDomain(job: ForecastJob): DomainJob {
  return {
    id: job.id,
    clientId: job.clientId ?? 0,
    scopeSummary: job.title,
    estimatedHours: job.estimatedHours,
    client: job.client ? mapForecastClientToDomain(job.client as any) : undefined,
  };
}

/** A single spanning block (startDate 00:00 -> endDate 23:59) for forecasting job */
export function mapForecastJobToBlock(job: ForecastJob, crewCapacityHoursPerDay = 8): JobTimeBlock {
  const start = combineDateTime(job.startDate, "08:00");
  const end = combineDateTime(job.endDate, "17:00");

  // Planned hours heuristic:
  // - Prefer job.estimatedHours if provided
  // - Else estimate days * crewCapacityHoursPerDay
  const startD = new Date(job.startDate);
  const endD = new Date(job.endDate);
  const days = Math.max(1, Math.round((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  const plannedHours = job.estimatedHours ?? days * crewCapacityHoursPerDay;

  return {
    id: `fcst-${job.id}`,
    jobId: job.id,
    crewId: job.crewId ?? 0,
    startDateTime: start,
    endDateTime: end,
    plannedHours,
    status: "planned",
    job: mapForecastJobToDomain(job),
    client: job.client ? mapForecastClientToDomain(job.client as any) : undefined,
    crew: job.crew ? mapForecastCrewToDomain(job.crew as any) : undefined,
  };
}

/** Bulk map for forecasting data */
export function mapForecastDataToDomain(input: {
  jobs: ForecastJob[];
  clients?: ForecastClient[];
  crews?: ForecastCrew[];
  defaultCrewCapacityHoursPerDay?: number;
}): {
  domainJobs: DomainJob[];
  blocks: JobTimeBlock[];
  domainClients?: DomainClient[];
  domainCrews?: DomainCrew[];
} {
  const domainJobs = input.jobs.map(mapForecastJobToDomain);
  const blocks = input.jobs.map((j) =>
    mapForecastJobToBlock(j, input.defaultCrewCapacityHoursPerDay ?? 8)
  );
  const domainClients = input.clients?.map(mapForecastClientToDomain);
  const domainCrews = input.crews?.map(mapForecastCrewToDomain);
  return { domainJobs, blocks, domainClients, domainCrews };
}

/* =========================
   Convenience bridge: blocks -> forecasting jobs (for Timeline reuse)
   ========================= */

/**
 * Convert JobTimeBlocks back into a minimal ForecastJob shape so we can reuse Timeline.tsx
 * (rows = crews, columns = days). This avoids introducing a new timeline just for blocks.
 */
export function mapBlocksToForecastJobs(blocks: JobTimeBlock[]): ForecastJob[] {
  return blocks.map((b, idx) => {
    const startDate = b.startDateTime.slice(0, 10);
    const endDate = b.endDateTime.slice(0, 10);
    return {
      id: typeof b.id === "number" ? b.id : idx + 1, // ensure a number
      title: b.job?.scopeSummary || "Job",
      clientId: b.client?.id,
      crewId: b.crewId,
      startDate,
      endDate,
      estimatedHours: b.plannedHours,
      client: b.client
        ? {
            id: b.client.id,
            name: b.client.name,
            email: b.client.email,
            phone: b.client.phone,
            address: b.client.address,
          }
        : undefined,
      crew: b.crew
        ? {
            id: b.crew.id,
            name: b.crew.name,
            colorHex: b.crew.colorHex,
          }
        : undefined,
    } as ForecastJob;
  });
}
