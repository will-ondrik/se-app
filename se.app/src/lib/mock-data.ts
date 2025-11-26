import { Job, JobStatus, Tool, User, Permission, Role } from '@/types/app/types';

// Basic helpers for classnames used by pages
export function getStatusBadgeColor(status: JobStatus) {
  switch (status) {
    case 'IN_PROGRESS':
      return 'bg-blue-100 text-blue-800';
    case 'SCHEDULED':
      return 'bg-amber-100 text-amber-800';
    case 'COMPLETED':
      return 'bg-green-100 text-green-800';
    case 'ON_HOLD':
      return 'bg-gray-200 text-gray-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800';
    case 'DRAFT':
    default:
      return 'bg-zinc-200 text-zinc-800';
  }
}

export function getConditionBadgeColor(condition: Tool['condition']) {
  switch (condition) {
    case 'EXCELLENT':
      return 'bg-green-100 text-green-800';
    case 'GOOD':
      return 'bg-emerald-100 text-emerald-800';
    case 'FAIR':
      return 'bg-amber-100 text-amber-800';
    case 'POOR':
      return 'bg-orange-100 text-orange-800';
    case 'NEEDS_SERVICE':
    default:
      return 'bg-red-100 text-red-800';
  }
}

export function getRoleBadgeColor(role: Role) {
  return 'bg-zinc-200 text-zinc-800';
}

export const mockUsers: User[] = [
  {
    id: 'u1',
    companyId: 'c1',
    firstName: 'Alex',
    lastName: 'Painter',
    email: 'alex@example.com',
    roles: ['EMPLOYEE'],
    permissions: ['VIEW_JOBS', 'VIEW_TOOLS', 'VIEW_REPORTS'],
  },
  {
    id: 'u2',
    companyId: 'c1',
    firstName: 'Maya',
    lastName: 'Foreman',
    email: 'maya@example.com',
    roles: ['MANAGEMENT'],
    permissions: ['VIEW_JOBS', 'VIEW_TOOLS', 'VIEW_REPORTS', 'MANAGE_USERS'],
  },
];

export const mockJobs: Job[] = [
  {
    id: 'j1',
    companyId: 'c1',
    name: 'Exterior repaint - Maple St.',
    status: 'IN_PROGRESS',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    address: '123 Maple St',
    assignedCrewIds: ['u1', 'u2'],
    toolIds: ['t1'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'j2',
    companyId: 'c1',
    name: 'Interior refresh - Oak Ave.',
    status: 'SCHEDULED',
    startDate: new Date(Date.now() + 3 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 10 * 86400000).toISOString(),
    address: '456 Oak Ave',
    assignedCrewIds: ['u1'],
    toolIds: ['t2', 't3'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockTools: Tool[] = [
  {
    id: 't1',
    name: 'Airless Sprayer',
    subCategoryId: 'sc1',
    isAvailable: false,
    lastServiced: new Date().toISOString(),
    assignedTo: mockUsers[0],
    condition: 'GOOD',
  },
  {
    id: 't2',
    name: 'Ladder 24ft',
    subCategoryId: 'sc2',
    isAvailable: true,
    lastServiced: new Date().toISOString(),
    condition: 'EXCELLENT',
  },
  {
    id: 't3',
    name: 'Sander',
    subCategoryId: 'sc3',
    isAvailable: true,
    lastServiced: new Date().toISOString(),
    condition: 'FAIR',
  },
];

export const mockCurrentUser: User = {
  id: mockUsers[0].id,
  companyId: mockUsers[0].companyId,
  firstName: mockUsers[0].firstName,
  lastName: mockUsers[0].lastName,
  email: mockUsers[0].email,
  roles: mockUsers[0].roles,
  permissions: mockUsers[0].permissions,
};

/**
 * Notifications mock removed. Keep an empty export to avoid accidental UI usage.
 * Real implementations should fetch notifications from the API.
 */
export const mockNotifications: any[] = [];
