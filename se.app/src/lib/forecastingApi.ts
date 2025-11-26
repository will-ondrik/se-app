import { format, addDays, startOfWeek, endOfWeek } from "date-fns";
import type { Client, Crew, Job } from "@/types/forecasting/types";

type GetJobsParams = {
  from?: string; // yyyy-MM-dd
  to?: string;   // yyyy-MM-dd
  crewId?: number;
};

// In-memory mock data for forecasting. This is a client-safe shim used until backend APIs are wired.
let clients: Client[] = [
  { id: 1, name: "Acme Corp", email: "ops@acme.com" },
  { id: 2, name: "Globex Inc", email: "projects@globex.com" },
];

let crews: Crew[] = [
  { id: 1, name: "Crew Alpha", colorHex: "#0ea5e9" },
  { id: 2, name: "Crew Bravo", colorHex: "#22c55e" },
  { id: 3, name: "Crew Charlie", colorHex: "#f59e0b" },
];

// Seed jobs around the current week
const today = new Date();
const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 });
let jobs: Job[] = [
  {
    id: 1,
    title: "Exterior repaint - Maple St.",
    description: "Two-story house, prep and paint",
    clientId: 1,
    crewId: 1,
    startDate: format(thisWeekStart, "yyyy-MM-dd"),
    endDate: format(addDays(thisWeekStart, 3), "yyyy-MM-dd"),
  },
  {
    id: 2,
    title: "Interior refresh - Oak Ave.",
    description: "Living room and hallway",
    clientId: 2,
    crewId: 2,
    startDate: format(addDays(thisWeekStart, 2), "yyyy-MM-dd"),
    endDate: format(addDays(thisWeekStart, 6), "yyyy-MM-dd"),
  },
  {
    id: 3,
    title: "Deck staining - Pine Rd.",
    description: "Clean and restain deck",
    clientId: 1,
    crewId: 3,
    startDate: format(addDays(thisWeekStart, 7), "yyyy-MM-dd"),
    endDate: format(addDays(thisWeekStart, 9), "yyyy-MM-dd"),
  },
];

const overlap = (aStart: string, aEnd: string, bStart?: string, bEnd?: string) => {
  if (!bStart && !bEnd) return true;
  const aS = new Date(aStart).getTime();
  const aE = new Date(aEnd).getTime();
  const bS = bStart ? new Date(bStart).getTime() : Number.MIN_SAFE_INTEGER;
  const bE = bEnd ? new Date(bEnd).getTime() : Number.MAX_SAFE_INTEGER;
  return aS <= bE && bS <= aE;
};

export async function getJobs(params: GetJobsParams = {}): Promise<Job[]> {
  const { from, to, crewId } = params;
  let res = jobs.filter((j) => overlap(j.startDate, j.endDate, from, to));
  if (crewId) {
    res = res.filter((j) => j.crewId === crewId);
  }
  // Attach convenience client/crew
  return res.map((j) => ({
    ...j,
    client: j.clientId ? clients.find((c) => c.id === j.clientId) : undefined,
    crew: j.crewId ? crews.find((c) => c.id === j.crewId) : undefined,
  }));
}

export async function createJob(data: Omit<Job, "id">): Promise<Job> {
  const nextId = jobs.length ? Math.max(...jobs.map((j) => j.id)) + 1 : 1;
  const job: Job = { id: nextId, ...data };
  jobs.push(job);
  return job;
}

export async function updateJob(id: number, updates: Partial<Job>): Promise<Job> {
  const idx = jobs.findIndex((j) => j.id === id);
  if (idx === -1) throw new Error("Job not found");
  const updated = { ...jobs[idx], ...updates };
  jobs[idx] = updated;
  return updated;
}

export async function getClients(): Promise<Client[]> {
  return clients.slice();
}

export async function createClient(data: Omit<Client, "id">): Promise<Client> {
  const nextId = clients.length ? Math.max(...clients.map((c) => c.id)) + 1 : 1;
  const client: Client = { id: nextId, ...data };
  clients.push(client);
  return client;
}

export async function getCrews(): Promise<Crew[]> {
  return crews.slice();
}
