/**
 * Scheduling domain types aligned to painting operations
 * Clients → Jobs → Crews → Time Blocks
 *
 * These types are additive and do not replace existing schedule/forecasting types.
 * Use adapters to map from existing API models to this domain model.
 */

export type AccountType = "Residential" | "Commercial" | "Builder";

export interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  accountType?: AccountType;
  stats?: {
    totalJobs?: number;
    totalRevenue?: number;
  };
}

export type JobOperationalStatus =
  | "quoted"
  | "booked"
  | "scheduled"
  | "in-progress"
  | "paused"
  | "complete"
  | "canceled";

export type JobType = "interior" | "exterior" | "both" | "commercial";

export interface Job {
  id: number;
  clientId: number;
  address?: string;
  scopeSummary: string;
  jobType?: JobType;
  estimatedHours?: number;
  requiredCrewSize?: number;
  skillTags?: string[];
  status?: JobOperationalStatus;
  targetStartDate?: string; // yyyy-MM-dd
  dueDate?: string; // yyyy-MM-dd
  weatherSensitive?: boolean;

  // Convenience
  client?: Client;
}

export interface Employee {
  id: number;
  name: string;
  active: boolean;
  primaryCrewId?: number;
  skillTags?: string[];
}

export interface Crew {
  id: number;
  name: string;
  leadPainterId?: number;
  capacityHoursPerDay?: number; // default to 8 when undefined
  crewMembers?: number[]; // employee IDs
  colorHex?: string;
}

export type TimeBlockStatus = "planned" | "active" | "delayed" | "complete" | "canceled";

/**
 * JobTimeBlock (ScheduledBlock)
 * The unit that drives the calendar. Associates a job with a crew for a time span.
 */
export interface JobTimeBlock {
  id: string | number;
  jobId: number;
  crewId: number;
  startDateTime: string; // ISO
  endDateTime: string; // ISO
  plannedHours?: number;
  status?: TimeBlockStatus;
  notes?: string;

  // Optional convenience references (front-end only)
  job?: Job;
  client?: Client;
  crew?: Crew;
}

/**
 * Utility types
 */
export interface CrewDayCapacity {
  crewId: number;
  date: string; // yyyy-MM-dd
  capacityHours: number;
  scheduledHours: number;
  overCapacity: boolean;
}

export interface ConflictReason {
  type: "CREW_OVERLAP" | "EMPLOYEE_OVERLAP" | "OVER_CAPACITY";
  details?: string;
}

export type ConflictMap = Map<JobTimeBlock["id"], ConflictReason[]>;
