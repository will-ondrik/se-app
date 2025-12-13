import { addDays, endOfWeek, format, startOfWeek } from "date-fns";
import type { Client, Crew, Job } from "@/types/schedule/types";

/**
 * Schedule API
 * - By default uses an in-memory mock so the UI works immediately.
 * - When your backend endpoints are ready, set USE_MOCK = false and ensure API_BASE is correct.
 */

const USE_MOCK = true;

// Base API URL (same pattern as src/services/api.ts). Example: http://localhost:8080/api/v1
const API_BASE: string = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1").replace(/\/$/, "");

function buildUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
}

function parseErrorBody(body: any): string {
  if (!body) return "Request failed";
  return body.error || body.message || "Request failed";
}

/* =========================
   In-memory MOCK (safe for client)
   ========================= */

type GetJobsParams = {
  start?: string; // yyyy-MM-dd
  end?: string;   // yyyy-MM-dd
  clientId?: number;
  crewId?: number;
};

const overlap = (aStart: string, aEnd: string, bStart?: string, bEnd?: string) => {
  if (!bStart && !bEnd) return true;
  const aS = new Date(aStart).getTime();
  const aE = new Date(aEnd).getTime();
  const bS = bStart ? new Date(bStart).getTime() : Number.MIN_SAFE_INTEGER;
  const bE = bEnd ? new Date(bEnd).getTime() : Number.MAX_SAFE_INTEGER;
  return aS <= bE && bS <= aE;
};

// seed mock data
let mockClients: Client[] = [
  { id: 1, name: "Acme Corp", email: "ops@acme.com" },
  { id: 2, name: "Globex Inc", email: "projects@globex.com" },
  { id: 3, name: "Wayne Enterprises", email: "maintenance@wayne.com" },
];

let mockCrews: Crew[] = [
  { id: 1, name: "Crew Alpha", colorHex: "#0ea5e9" },
  { id: 2, name: "Crew Bravo", colorHex: "#22c55e" },
  { id: 3, name: "Crew Charlie", colorHex: "#f59e0b" },
];

const today = new Date();
const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 });
const thisWeekEnd = endOfWeek(today, { weekStartsOn: 1 });

let mockJobs: Job[] = [
  {
    id: 1,
    title: "Exterior repaint - Maple St.",
    clientId: 1,
    crewId: 1,
    date: format(thisWeekStart, "yyyy-MM-dd"),
    startTime: "08:00",
    endTime: "12:00",
    description: "Two-story house, prep and paint",
    notes: "Confirm color swatches with client",
    status: "SCHEDULED",
  },
  {
    id: 2,
    title: "Interior refresh - Oak Ave.",
    clientId: 2,
    crewId: 2,
    date: format(addDays(thisWeekStart, 2), "yyyy-MM-dd"),
    startTime: "09:00",
    endTime: "15:00",
    description: "Living room and hallway",
    notes: "",
    status: "SCHEDULED",
  },
  {
    id: 3,
    title: "Deck staining - Pine Rd.",
    clientId: 1,
    crewId: 3,
    date: format(addDays(thisWeekEnd, 2), "yyyy-MM-dd"),
    startTime: "07:30",
    endTime: "11:30",
    description: "Clean and restain deck",
    notes: "Weather dependent",
    status: "SCHEDULED",
  },
];

/* =========================
   MOCK implementations
   ========================= */

async function mockGetJobs(params: GetJobsParams = {}): Promise<Job[]> {
  const { start, end, clientId, crewId } = params;
  // Convert single-day jobs to a pseudo-range for filtering
  const mapped = mockJobs.map((j) => ({
    ...j,
    _start: j.date,
    _end: j.date,
  }));
  let res = mapped.filter((j) => overlap(j._start, j._end, start, end));
  if (clientId) res = res.filter((j) => j.clientId === clientId);
  if (crewId) res = res.filter((j) => j.crewId === crewId);
  // attach convenience refs
  return res.map((j) => ({
    id: j.id,
    title: j.title,
    clientId: j.clientId,
    crewId: j.crewId,
    date: j.date,
    startTime: j.startTime,
    endTime: j.endTime,
    description: j.description,
    address: j.address,
    notes: j.notes,
    status: j.status,
    client: mockClients.find((c) => c.id === j.clientId),
    crew: j.crewId ? mockCrews.find((c) => c.id === j.crewId) : undefined,
  }));
}

async function mockCreateJob(data: Omit<Job, "id">): Promise<Job> {
  const nextId = mockJobs.length ? Math.max(...mockJobs.map((j) => j.id)) + 1 : 1;
  const job: Job = { id: nextId, ...data };
  mockJobs.push(job);
  return job;
}

async function mockUpdateJob(id: number, updates: Partial<Job>): Promise<Job> {
  const idx = mockJobs.findIndex((j) => j.id === id);
  if (idx === -1) throw new Error("Job not found");
  const updated = { ...mockJobs[idx], ...updates };
  mockJobs[idx] = updated;
  return updated;
}

async function mockDeleteJob(id: number): Promise<void> {
  mockJobs = mockJobs.filter((j) => j.id !== id);
}

async function mockGetClients(): Promise<Client[]> {
  return mockClients.slice();
}

async function mockCreateClient(data: Omit<Client, "id">): Promise<Client> {
  const nextId = mockClients.length ? Math.max(...mockClients.map((c) => c.id)) + 1 : 1;
  const client: Client = { id: nextId, ...data };
  mockClients.push(client);
  return client;
}

async function mockUpdateClient(id: number, updates: Partial<Client>): Promise<Client> {
  const idx = mockClients.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error("Client not found");
  const updated = { ...mockClients[idx], ...updates };
  mockClients[idx] = updated;
  return updated;
}

async function mockDeleteClient(id: number): Promise<void> {
  mockClients = mockClients.filter((c) => c.id !== id);
  // cascade delete jobs from that client
  mockJobs = mockJobs.filter((j) => j.clientId !== id);
}

async function mockGetCrews(): Promise<Crew[]> {
  return mockCrews.slice();
}

async function mockCreateCrew(data: Omit<Crew, "id">): Promise<Crew> {
  const nextId = mockCrews.length ? Math.max(...mockCrews.map((c) => c.id)) + 1 : 1;
  const crew: Crew = { id: nextId, ...data };
  mockCrews.push(crew);
  return crew;
}

async function mockUpdateCrew(id: number, updates: Partial<Crew>): Promise<Crew> {
  const idx = mockCrews.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error("Crew not found");
  const updated = { ...mockCrews[idx], ...updates };
  mockCrews[idx] = updated;
  return updated;
}

async function mockDeleteCrew(id: number): Promise<void> {
  mockCrews = mockCrews.filter((c) => c.id !== id);
  // disassociate crew from jobs
  mockJobs = mockJobs.map((j) => (j.crewId === id ? { ...j, crewId: undefined } : j));
}

/* =========================
   REAL API implementations (REST)
   Paths assumed (adjust to your backend when ready):
   - GET    /schedule/jobs?start=YYYY-MM-DD&end=YYYY-MM-DD&clientId=&crewId=
   - POST   /schedule/jobs
   - PUT    /schedule/jobs/:id
   - DELETE /schedule/jobs/:id
   - GET    /clients ; POST /clients ; PUT /clients/:id ; DELETE /clients/:id
   - GET    /crews   ; POST /crews   ; PUT /crews/:id   ; DELETE /crews/:id
   ========================= */

async function realGet<T>(path: string): Promise<T> {
  const res = await fetch(buildUrl(path), { credentials: "include" });
  if (!res.ok) {
    let msg = "Request failed";
    try {
      msg = parseErrorBody(await res.json());
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

async function realSend<T>(path: string, method: "POST" | "PUT" | "DELETE", body?: any): Promise<T> {
  const res = await fetch(buildUrl(path), {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let msg = "Request failed";
    try {
      msg = parseErrorBody(await res.json());
    } catch {}
    throw new Error(msg);
  }
  // some DELETE endpoints may return empty; guard it
  try {
    return (await res.json()) as T;
  } catch {
    return undefined as unknown as T;
  }
}

/* =========================
   Public API (auto-select mock vs real)
   ========================= */

export async function getJobs(params: GetJobsParams = {}): Promise<Job[]> {
  if (USE_MOCK) return mockGetJobs(params);
  const query = new URLSearchParams();
  if (params.start) query.set("start", params.start);
  if (params.end) query.set("end", params.end);
  if (params.clientId) query.set("clientId", String(params.clientId));
  if (params.crewId) query.set("crewId", String(params.crewId));
  const path = `/schedule/jobs${query.toString() ? `?${query.toString()}` : ""}`;
  return realGet<Job[]>(path);
}

export async function createJob(data: Omit<Job, "id">): Promise<Job> {
  if (USE_MOCK) return mockCreateJob(data);
  return realSend<Job>("/schedule/jobs", "POST", data);
}

export async function updateJob(id: number, updates: Partial<Job>): Promise<Job> {
  if (USE_MOCK) return mockUpdateJob(id, updates);
  return realSend<Job>(`/schedule/jobs/${id}`, "PUT", updates);
}

export async function deleteJob(id: number): Promise<void> {
  if (USE_MOCK) return mockDeleteJob(id);
  await realSend<void>(`/schedule/jobs/${id}`, "DELETE");
}

export async function getClients(): Promise<Client[]> {
  if (USE_MOCK) return mockGetClients();
  return realGet<Client[]>("/clients");
}

export async function createClient(data: Omit<Client, "id">): Promise<Client> {
  if (USE_MOCK) return mockCreateClient(data);
  return realSend<Client>("/clients", "POST", data);
}

export async function updateClient(id: number, updates: Partial<Client>): Promise<Client> {
  if (USE_MOCK) return mockUpdateClient(id, updates);
  return realSend<Client>(`/clients/${id}`, "PUT", updates);
}

export async function deleteClient(id: number): Promise<void> {
  if (USE_MOCK) return mockDeleteClient(id);
  await realSend<void>(`/clients/${id}`, "DELETE");
}

export async function getCrews(): Promise<Crew[]> {
  if (USE_MOCK) return mockGetCrews();
  return realGet<Crew[]>("/crews");
}

export async function createCrew(data: Omit<Crew, "id">): Promise<Crew> {
  if (USE_MOCK) return mockCreateCrew(data);
  return realSend<Crew>("/crews", "POST", data);
}

export async function updateCrew(id: number, updates: Partial<Crew>): Promise<Crew> {
  if (USE_MOCK) return mockUpdateCrew(id, updates);
  return realSend<Crew>(`/crews/${id}`, "PUT", updates);
}

export async function deleteCrew(id: number): Promise<void> {
  if (USE_MOCK) return mockDeleteCrew(id);
  await realSend<void>(`/crews/${id}`, "DELETE");
}
