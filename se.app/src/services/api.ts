import type { Session, User, Role, Permission, UserInvite } from '@/types/app/types';
import type { Project } from '@/types/kpi_dashboard/types';

// Base API URL (include version segment). Example: http://localhost:8080/api/v1
const API_BASE: string = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1').replace(/\/$/, '');

function buildUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
}

function parseErrorBody(body: any): string {
  if (!body) return 'Request failed';
  return body.error || body.message || 'Request failed';
}

function synthesizeSessionFromUser(user: User | null): Session | null {
  if (!user) return null;
  return {
    id: '', // not exposed by backend /auth/me
    userId: user.id,
    companyId: user.companyId,
    email: user.email,
    firstName: user.firstName,
    roles: user.roles as Role[],
    permissions: user.permissions as Permission[],
    ttl: 0,
  };
}

export async function getMe(): Promise<{ session: Session | null; user: User | null }> {
  try {
    const res = await fetch(buildUrl('/auth/me'), {
      credentials: 'include',
    });

    if (!res.ok) {
      return { session: null, user: null };
    }

    const user = (await res.json()) as User;
    return {
      user,
      session: synthesizeSessionFromUser(user),
    };
  } catch (err) {
    console.error('getMe failed:', err);
    return { session: null, user: null };
  }
}

export interface LoginDto {
  email: string;
  password: string;
}

export async function postLogin(dto: LoginDto) {
  const res = await fetch(buildUrl('/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(dto),
  });

  if (!res.ok) {
    let msg = 'Login failed';
    try {
      msg = parseErrorBody(await res.json());
    } catch {}
    throw new Error(msg);
  }

  // Backend returns summary fields; cookie set via Set-Cookie
  return res.json();
}

export interface RegisterFirstDto {
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export async function postRegisterFirst(dto: RegisterFirstDto) {
  const res = await fetch(buildUrl('/auth/register-first'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(dto),
  });

  if (!res.ok) {
    let msg = 'Registration failed';
    try {
      msg = parseErrorBody(await res.json());
    } catch {}
    throw new Error(msg);
  }

  return res.json();
}

export interface RegisterInvitedDto {
  token: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export async function postRegisterInvited(dto: RegisterInvitedDto) {
  const res = await fetch(buildUrl('/auth/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(dto),
  });

  if (!res.ok) {
    let msg = 'Registration failed';
    try {
      msg = parseErrorBody(await res.json());
    } catch {}
    throw new Error(msg);
  }

  return res.json();
}

export async function postLogout() {
  const res = await fetch(buildUrl('/auth/logout'), {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error('Logout failed');
  }
  return res.json();
}

export async function confirmEmail(token: string) {
  const url = buildUrl(`/auth/confirm-email?token=${encodeURIComponent(token)}`);
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    let msg = 'Email confirmation failed';
    try {
      msg = parseErrorBody(await res.json());
    } catch {}
    throw new Error(msg);
  }
  return res.json(); // { data: session }
}

export async function requestPasswordReset(email: string) {
  const res = await fetch(buildUrl('/auth/request-reset'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    let msg = 'Request failed';
    try {
      msg = parseErrorBody(await res.json());
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export async function resetPassword(token: string, newPassword: string) {
  const res = await fetch(buildUrl('/auth/reset-password'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ token, newPassword }),
  });
  if (!res.ok) {
    let msg = 'Reset failed';
    try {
      msg = parseErrorBody(await res.json());
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

// Invite user (admin/owner action)
export interface InviteUserDto {
  email: string;
  firstName: string;
  lastName: string;
  roles: Role[];
}

export async function postInviteUser(dto: InviteUserDto) {
  const res = await fetch(buildUrl('/auth/invite'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(dto),
  });

  if (!res.ok) {
    let msg = 'Invite failed';
    try {
      msg = parseErrorBody(await res.json());
    } catch {}
    throw new Error(msg);
  }

  // Gin returns { message: "user invited" }
  return res.json();
}

// Optional helper for showing invite context before submission
export interface InvitePreview {
  email?: string;
  firstName?: string;
  lastName?: string;
  companyId?: string;
  companyName?: string;
  roles?: string[];
  expiresAt?: string;
}

export async function getInvitePreview(token: string): Promise<InvitePreview> {
  const url = buildUrl(`/auth/invite/preview?token=${encodeURIComponent(token)}`);
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    let msg = 'Failed to load invite preview';
    try {
      msg = parseErrorBody(await res.json());
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

// Pending invite details for accept-invite page
export interface PendingInviteDetails {
  email?: string;
  firstName?: string;
  lastName?: string;
}

export async function getPendingInviteDetails(token: string): Promise<PendingInviteDetails> {
  const url = buildUrl(`/user/pending-details/${encodeURIComponent(token)}`);
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    let msg = 'Failed to load invite details';
    try {
      msg = parseErrorBody(await res.json());
    } catch {}
    throw new Error(msg);
  }
  try {
    const body = await res.json();
    return (body && (body.data ?? body)) as PendingInviteDetails;
  } catch {
    return {} as PendingInviteDetails;
  }
}

/**
 * KPI Analytics: fetch projects from backend.
 * Expects server to return the same shape as mock data (dates as strings).
 * Normalizes:
 *  - startDate/endDate -> Date
 *  - businessType.type -> lowercase (BusinessTypeEnum)
 *  - labour.projectedHours/actualHours -> rounded to 1 decimal
 */
export async function getKpiProjects(): Promise<Project[]> {
  try {
    const res = await fetch(buildUrl('/reports/kpi-analytics'), {
      credentials: 'include',
    });

    if (!res.ok) {
      // Surface a controlled empty result; caller may show "data unavailable"
      return [];
    }

    const body = await res.json();
    const items: any[] = Array.isArray(body) ? body : (Array.isArray(body?.data) ? body.data : []);

    return items.map((project: any, index: number) => ({
      ...project,
      id: project?.id ?? String(index + 1),
      startDate: project?.startDate ? new Date(project.startDate) : new Date(),
      endDate: project?.endDate ? new Date(project.endDate) : new Date(),
      businessType: {
        ...(project?.businessType ?? {}),
        type: (project?.businessType?.type ?? '').toLowerCase(),
      },
      labour: {
        ...(project?.labour ?? {}),
        projectedHours: Math.round(((project?.labour?.projectedHours ?? 0) as number) * 10) / 10,
        actualHours: Math.round(((project?.labour?.actualHours ?? 0) as number) * 10) / 10,
      },
    })) as Project[];
  } catch (err) {
    console.error('getKpiProjects failed:', err);
    return [];
  }
}

// Company profile & logo endpoints
export interface CompanyProfileDto {
  companyName: string;
  email: string;
  phone?: string;
  website?: string;
}

export async function saveCompanyProfile(dto: CompanyProfileDto) {
  const res = await fetch(buildUrl('/company/profile'), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(dto),
  });

  if (!res.ok) {
    let msg = 'Failed to save company profile';
    try {
      msg = parseErrorBody(await res.json());
    } catch {}
    throw new Error(msg);
  }

  return res.json();
}

export async function uploadCompanyLogo(file: File) {
  // Convert file to base64 so backend can persist bytes in DB
  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  const mimeType = file.type || 'application/octet-stream';
  const fileName = file.name || 'logo';

  const res = await fetch(buildUrl('/company/logo'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ fileName, mimeType, base64 }),
  });

  if (!res.ok) {
    let msg = 'Failed to upload logo';
    try {
      msg = parseErrorBody(await res.json());
    } catch {}
    throw new Error(msg);
  }

  // Some backends may not return a JSON body. Safely attempt to parse.
  try {
    return await res.json();
  } catch {
    return {} as any;
  }
}

// User pending invites
export async function getPendingInvites(): Promise<UserInvite[]> {
  try {
    const res = await fetch(buildUrl('/user/pending-invites'), {
      credentials: 'include',
    });
    if (!res.ok) return [];

    const body = await res.json();
    const items = Array.isArray(body) ? body : (Array.isArray(body?.data) ? body.data : []);
    return (items ?? []) as UserInvite[];
  } catch (err) {
    console.error('getPendingInvites failed:', err);
    return [];
  }
}

// Team members for the current company (derived from cookie/session)
export async function getTeamMembers(): Promise<User[]> {
  try {
    const res = await fetch(buildUrl('/user/team-members'), {
      credentials: 'include',
    });
    if (!res.ok) return [];

    const body = await res.json();
    const items = Array.isArray(body) ? body : (Array.isArray(body?.data) ? body.data : []);
    return (items ?? []) as User[];
  } catch (err) {
    console.error('getTeamMembers failed:', err);
    return [];
  }
}
