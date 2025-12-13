export interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  externalId?: string; // optional Jobber ID or external reference
}

export interface Crew {
  id: number;
  name: string;
  members?: string[];
  colorHex?: string;
  externalId?: string; // optional Jobber ID or external reference
}

export type JobStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";

export interface Job {
  id: number;
  title: string;
  clientId: number;
  crewId?: number;

  // Core scheduling fields
  date: string;       // "YYYY-MM-DD"
  startTime?: string; // "HH:mm"
  endTime?: string;   // "HH:mm"

  // Optional metadata
  description?: string;
  address?: string;
  notes?: string;
  status?: JobStatus;

  // For display convenience
  client?: Client;
  crew?: Crew;

  // Future Jobber integration (design only; not required to use now)
  integrationSource?: "INTERNAL" | "JOBBER";
  integrationExternalId?: string | null;
}

export type CalendarView = "month" | "week";
