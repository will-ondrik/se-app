import type { Job, Tool, User } from '@/types/app/types';

// Base API URL (same pattern as src/services/api.ts)
const API_BASE: string = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1').replace(/\/$/, '');

function buildUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
}

function parseErrorBody(body: any): string {
  if (!body) return 'Request failed';
  return body.error || body.message || 'Request failed';
}

async function safeGet<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(buildUrl(path), { credentials: 'include' });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

async function safeGetOne<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(buildUrl(path), { credentials: 'include' });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// Jobs
export async function fetchJobs(): Promise<Job[]> {
  return safeGet<Job[]>('/jobs', []);
}

export async function fetchJobById(id: string): Promise<Job | null> {
  return safeGetOne<Job>(`/jobs/${encodeURIComponent(id)}`);
}

// Tools
export async function fetchTools(): Promise<Tool[]> {
  return safeGet<Tool[]>('/tools', []);
}

export async function fetchToolById(id: string): Promise<Tool | null> {
  return safeGetOne<Tool>(`/tools/${encodeURIComponent(id)}`);
}

// Users
export async function fetchUsers(): Promise<User[]> {
  return safeGet<User[]>('/users', []);
}
