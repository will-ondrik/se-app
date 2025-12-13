import type { Client, Crew, Job, Employee } from "@/types/forecasting/types";
import type { User } from "@/types/app/types";
import { getMe } from "@/services/api";

// Build API base like src/services/api.ts
const API_BASE: string = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1').replace(/\/$/, '');
function buildUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
}
function parseErrorBody(body: any): string {
  if (!body) return 'Request failed';
  return body.error || body.message || 'Request failed';
}

// Color helpers: map between color names (teal, coral, etc.) and hex codes
const COLOR_NAME_TO_HEX: Record<string, string> = {
  teal: '#14b8a6',
  coral: '#f97316',
  amber: '#f59e0b',
  indigo: '#3b82f6',
  emerald: '#10b981',
  slate: '#64748b',
};
const COLOR_HEX_TO_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(COLOR_NAME_TO_HEX).map(([name, hex]) => [hex.toLowerCase(), name])
);

function toColorName(value?: string): string | undefined {
  if (!value) return undefined;
  const v = value.trim().toLowerCase();
  if (v.startsWith('#')) return COLOR_HEX_TO_NAME[v] || undefined;
  return v; // already a name
}

function toColorHex(value?: string): string | undefined {
  if (!value) return undefined;
  if (value.startsWith('#')) return value;
  const v = value.trim().toLowerCase();
  return COLOR_NAME_TO_HEX[v] || undefined;
}

// Local stores continue to exist for jobs/clients; crews/employees now mirror backend but also update these stores
let clients: Client[] = [];
let crews: Crew[] = [];
let jobs: Job[] = [];
let employees: Employee[] = [];

// Backend<->local ID mapping to preserve v2 numeric ids while backend uses string ids
const employeeIdMap = new Map<string, number>(); // backend -> local
const employeeRevMap = new Map<number, string>(); // local -> backend
let nextEmployeeLocalId = 1;

const crewIdMap = new Map<string, number>(); // backend -> local
const crewRevMap = new Map<number, string>(); // local -> backend
let nextCrewLocalId = 1;

function ensureLocalEmployeeId(backendId: string): number {
  let local = employeeIdMap.get(backendId);
  if (!local) {
    local = nextEmployeeLocalId++;
    employeeIdMap.set(backendId, local);
    employeeRevMap.set(local, backendId);
  }
  return local;
}
function ensureLocalCrewId(backendId: string): number {
  let local = crewIdMap.get(backendId);
  if (!local) {
    local = nextCrewLocalId++;
    crewIdMap.set(backendId, local);
    crewRevMap.set(local, backendId);
  }
  return local;
}

// Utilities
type GetJobsParams = {
  from?: string; // yyyy-MM-dd
  to?: string;   // yyyy-MM-dd
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

export async function getJobs(params: GetJobsParams = {}): Promise<Job[]> {
  const { from, to, crewId } = params;
  let res = jobs.filter((j) => overlap(j.startDate, j.endDate, from, to));
  if (crewId) {
    res = res.filter((j) => j.crewId === crewId);
  }
  // Attach convenience client/crew if available (uses local mirrors updated by getCrews/getEmployees)
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

// Fetch users -> map to v2 Employees (numeric ids)
export async function getEmployees(): Promise<Employee[]> {
  try {
    const res = await fetch(buildUrl('/user/team-members'), { credentials: 'include' });
    if (!res.ok) return employees.slice();
    const body = await res.json();
    // Accept several API response shapes for employees
    let items: any[] = [];
    if (Array.isArray(body)) items = body as any[];
    else if (Array.isArray((body as any)?.data)) items = (body as any).data as any[];
    else if (Array.isArray((body as any)?.employees)) items = (body as any).employees as any[];
    else if (Array.isArray((body as any)?.items)) items = (body as any).items as any[];
    else if (Array.isArray((body as any)?.data?.items)) items = (body as any).data.items as any[];

    const mapped: Employee[] = items.map((u: any) => {
      const backendId: string = u?.id ?? u?.userId ?? '';
      const first = (u?.firstName ?? '').trim();
      const last = (u?.lastName ?? '').trim();
      const name = [first, last].filter(Boolean).join(' ') || (u?.email ?? 'User');
      const role = Array.isArray(u?.roles) && u.roles.length ? String(u.roles[0]) : undefined;
      const localId = backendId ? ensureLocalEmployeeId(backendId) : ensureLocalEmployeeId(`anon:${name}:${Math.random()}`);
      return { id: localId, name, role } as Employee;
    });

    employees = mapped;
    return employees.slice();
  } catch (err) {
    console.error('getEmployees failed:', err);
    return employees.slice();
  }
}

// Backend crew shape (best-effort)
interface BackendCrew {
  id: string;
  companyId?: string;
  name: string;
  color?: string;
  managerId?: string;
  managerName?: string;
  utilization?: string | number | null;
  memberIds?: string[];
}

export async function getCrews(): Promise<Crew[]> {
  try {
    // Try modern endpoint first, fall back to legacy
    const endpoints = ['/forecasting/crews', '/crews'];
    let body: any = null;
    for (const path of endpoints) {
      try {
        const res = await fetch(buildUrl(path), { credentials: 'include' });
        if (res.ok) { body = await res.json(); break; }
      } catch {
        // try next endpoint
      }
    }
    if (!body) return crews.slice();

    // Accept several API response shapes: [], { data: [] }, { crews: [] }, { items: [] }, { data: { items: [] } }
    let items: BackendCrew[] = [] as any;
    if (Array.isArray(body)) items = body as any;
    else if (Array.isArray((body as any)?.data)) items = (body as any).data as any;
    else if (Array.isArray((body as any)?.crews)) items = (body as any).crews as any;
    else if (Array.isArray((body as any)?.items)) items = (body as any).items as any;
    else if (Array.isArray((body as any)?.data?.items)) items = (body as any).data.items as any;

    const mapped: Crew[] = items.map((c, idx) => {
      const obj = c as any;
      const pick = (...keys: string[]) => keys.find((k) => obj[k] !== undefined) ?? '';
      const pickStr = (...keys: string[]) => {
        const k = pick(...keys);
        const v = k ? obj[k] : undefined;
        return typeof v === 'string' ? v : undefined;
      };

      // Normalize backend id field variants (case-insensitive)
      const backendId = String(
        obj.id ?? obj.Id ?? obj.ID ?? obj.crewId ?? obj.CrewId ?? obj.crew_id ?? obj.crewID ?? `${idx}`
      );
      const localId = ensureLocalCrewId(backendId);

      // Normalize members: support memberIds or members arrays (case-insensitive)
      const rawMembers = obj.memberIds ?? obj.MemberIds ?? (
        Array.isArray(obj.members || obj.Members)
          ? (obj.members || obj.Members).map((m: any) => (m?.id ?? m?.Id ?? m?.userId ?? m?.UserId ?? m?.memberId ?? m))
          : []
      );
      const memberLocalIds: number[] = (rawMembers as any[]).map((v) => ensureLocalEmployeeId(String(v)));

      // Normalize name from common variants (case-insensitive)
      const name = (
        pickStr('name', 'Name', 'crewName', 'CrewName', 'crew_name', 'displayName', 'DisplayName', 'title', 'Title')
        || `Crew ${backendId}`
      );

      // Normalize color from name or hex (case-insensitive)
      const colorInput = pickStr('color', 'Color', 'colorHex', 'ColorHex', 'color_hex', 'crewColor', 'CrewColor');

      return {
        id: localId,
        name,
        colorHex: toColorHex(colorInput),
        memberIds: memberLocalIds,
      } as Crew;
    });

    crews = mapped;
    return crews.slice();
  } catch (err) {
    console.error('getCrews failed:', err);
    return crews.slice();
  }
}

export async function createEmployee(data: Omit<Employee, "id">): Promise<Employee> {
  // Local only helper (not used by v2 flows); keep behavior for compatibility
  const nextId = employees.length ? Math.max(...employees.map((e) => e.id)) + 1 : 1;
  const emp: Employee = { id: nextId, ...data };
  employees.push(emp);
  return emp;
}

export async function createCrew(data: Omit<Crew, "id">): Promise<Crew> {
  // Build backend payload using current user/company
  const { session, user } = await getMe();
  const companyId = session?.companyId || '';
  const managerId = user?.id || '';
  const managerName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';

  // Translate local member numeric ids -> backend string ids
  const backendMemberIds: string[] = (data.memberIds || [])
    .map((local) => employeeRevMap.get(local))
    .filter((v): v is string => Boolean(v));

  const payload = {
    managerId,
    companyId,
    crewName: data.name,
    managerName,
    memberIds: backendMemberIds,
    color: toColorName(data.colorHex),
  };

  const res = await fetch(buildUrl('/crews'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let msg = 'Failed to create crew';
    try { msg = parseErrorBody(await res.json()); } catch {}
    throw new Error(msg);
  }

  // Best-effort return: echo local object; actual list will refresh via getCrews in caller
  const localId = nextCrewLocalId++;
  const local: Crew = {
    id: localId,
    name: data.name,
    colorHex: data.colorHex,
    memberIds: data.memberIds?.slice() || [],
  };
  // we don't know backend id here; on next getCrews the map will reconcile
  return local;
}

export async function updateCrew(localId: number, updates: Partial<Crew>): Promise<Crew> {
  // Ensure we know backend id
  let backendId = crewRevMap.get(localId);
  if (!backendId) {
    await getCrews();
    backendId = crewRevMap.get(localId);
  }
  if (!backendId) throw new Error('Crew not found');

  const { session, user } = await getMe();
  const companyId = session?.companyId || '';
  const managerId = user?.id || '';

  // Compute member deltas if provided
  let addMemberIds: string[] | undefined;
  let removeMemberIds: string[] | undefined;
  if (Array.isArray(updates.memberIds)) {
    const current = (crews.find(c => c.id === localId)?.memberIds) || [];
    const next = updates.memberIds || [];
    const curSet = new Set(current);
    const nextSet = new Set(next);
    const adds = [...nextSet].filter(id => !curSet.has(id));
    const rems = [...curSet].filter(id => !nextSet.has(id));
    addMemberIds = adds.map((n) => employeeRevMap.get(n)).filter((v): v is string => Boolean(v));
    removeMemberIds = rems.map((n) => employeeRevMap.get(n)).filter((v): v is string => Boolean(v));
  }

  const payload: any = {
    id: backendId,
    company: companyId, // per UpdateCrewDto json tag
    managerId,
  };
  if (typeof updates.name === 'string') payload.crewName = updates.name;
  if (typeof updates.colorHex === 'string') payload.color = toColorName(updates.colorHex);
  if (addMemberIds && addMemberIds.length) payload.addMemberIds = addMemberIds;
  if (removeMemberIds && removeMemberIds.length) payload.removeMemberIds = removeMemberIds;

  const res = await fetch(buildUrl(`/crews/${encodeURIComponent(backendId)}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let msg = 'Failed to update crew';
    try { msg = parseErrorBody(await res.json()); } catch {}
    throw new Error(msg);
  }

  // Reflect locally
  const idx = crews.findIndex(c => c.id === localId);
  if (idx !== -1) crews[idx] = { ...crews[idx], ...updates } as Crew;
  return idx !== -1 ? crews[idx] : ({ id: localId, ...updates } as Crew);
}

export async function deleteCrew(localId: number): Promise<void> {
  let backendId = crewRevMap.get(localId);
  if (!backendId) {
    await getCrews();
    backendId = crewRevMap.get(localId);
  }
  if (!backendId) throw new Error('Crew not found');

  const { session } = await getMe();
  const companyId = session?.companyId || '';

  const res = await fetch(buildUrl(`/crews/${encodeURIComponent(backendId)}`), {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ id: backendId, companyId }),
  });

  if (!res.ok) {
    let msg = 'Failed to delete crew';
    try { msg = parseErrorBody(await res.json()); } catch {}
    throw new Error(msg);
  }

  // Update local mirrors
  crews = crews.filter(c => c.id !== localId);
  const back = crewRevMap.get(localId);
  if (back) crewIdMap.delete(back);
  crewRevMap.delete(localId);
}
