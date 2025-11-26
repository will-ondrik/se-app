import type { Session, User, Role, Permission } from '@/types/app/types';

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
