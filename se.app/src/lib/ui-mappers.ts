import type { JobStatus, Tool, Role } from '@/types/app/types';

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
