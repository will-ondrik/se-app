export interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface Crew {
  id: number;
  name: string;
  colorHex?: string;
  // new fields for v2 management
  crewType?: 'single' | 'multi';
  size?: number; // if multi, number of people; defaults to 1
  memberIds?: number[]; // selected employee ids
}

export interface Employee {
  id: number;
  name: string;
  role?: string;
}

export interface Job {
  id: number;
  title: string;
  description?: string;
  clientId?: number;
  crewId?: number;
  startDate: string; // "YYYY-MM-DD"
  endDate: string;   // "YYYY-MM-DD"
  estimatedHours?: number;
  estimatedRevenue?: number;

  // For display convenience:
  client?: Client;
  crew?: Crew;

  // For future Jobber integration (design only; not required to use now):
  integrationSource?: "INTERNAL" | "JOBBER";
  integrationExternalId?: string | null;
}

export type DateRangeOption = "week" | "2weeks" | "month" | "quarter" | "6months" | "year";
