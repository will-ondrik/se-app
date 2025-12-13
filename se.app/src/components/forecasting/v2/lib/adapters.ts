import type { Job as AppJob, Crew as AppCrew, Employee as AppEmployee } from '@/types/forecasting/types';
import type { Job as V2Job, Crew as V2Crew, Analytics, Warning, Employee as V2Employee } from '@/data/calendarData';
import { addDays, differenceInCalendarDays, isAfter, isBefore, isWithinInterval } from 'date-fns';
import { generateWarnings } from '@/components/forecasting/v2/lib/alertEngine';

function toDate(d: string | Date): Date {
  return typeof d === 'string' ? new Date(d) : d;
}

// Map arbitrary colorHex into one of the v2 CrewColor buckets for consistent UI badges
function mapHexToCrewColor(hex?: string): 'teal' | 'coral' | 'amber' | 'indigo' | 'emerald' | 'slate' {
  if (!hex) return 'slate';
  const h = hex.toLowerCase();
  if (h.includes('0ea5e9') || h.includes('3b82f6') || h.includes('60a5fa')) return 'indigo';
  if (h.includes('22c55e') || h.includes('10b981')) return 'emerald';
  if (h.includes('f59e0b') || h.includes('fbbf24')) return 'amber';
  if (h.includes('ef4444') || h.includes('f97316')) return 'coral';
  if (h.includes('14b8a6') || h.includes('06b6d4')) return 'teal';
  return 'slate';
}

export function adaptCrews(appCrews: AppCrew[], appEmployees: AppEmployee[] = []): V2Crew[] {
  const employeeMap = new Map<number, AppEmployee>(appEmployees.map(e => [e.id, e]));
  return appCrews.map((c) => {
    const members: V2Employee[] = (c.memberIds || []).map((id) => {
      const emp = employeeMap.get(id);
      return {
        id: String(id),
        name: emp?.name || `Employee ${id}`,
        role: emp?.role || '',
      } as V2Employee;
    });
    return {
      id: String(c.id),
      name: c.name,
      color: mapHexToCrewColor(c.colorHex),
      manager: c.name + ' Manager',
      employees: members,
      utilization: 0,
    };
  });
}

export function adaptJobs(appJobs: AppJob[], crews: V2Crew[]): V2Job[] {
  const today = new Date();
  return appJobs.map((j) => {
    const start = toDate(j.startDate);
    const end = toDate(j.endDate);
    let status: V2Job['status'] = 'pending';
    if (isBefore(end, today)) status = 'completed';
    else if (isWithinInterval(today, { start, end })) status = 'active';
    else status = 'pending';

    const total = Math.max(1, differenceInCalendarDays(end, start) + 1);
    const elapsed = Math.max(0, Math.min(total, differenceInCalendarDays(today, start) + 1));
    const progress = status === 'completed' ? 100 : Math.round((elapsed / total) * 100);

    const clientName = j.client?.name ?? '';

    return {
      id: String(j.id),
      name: j.title,
      crewId: j.crewId ? String(j.crewId) : '',
      clientName,
      address: '',
      jobType: undefined,
      startDate: start,
      endDate: end,
      estimatedHours: j.estimatedHours,
      completedHours: undefined,
      status,
      progress,
      revenue: j.estimatedRevenue,
    } as V2Job;
  });
}

export function computeAnalytics(jobs: V2Job[], crews: V2Crew[]): Analytics {
  const weeklyUtilization = Math.min(100, Math.round((jobs.length / Math.max(1, crews.length)) * 20));
  const estimatedBacklog = jobs.reduce((sum, j) => sum + (j.estimatedHours || 0), 0);
  const burnRate = Math.min(100, Math.round(weeklyUtilization * 0.9));
  const completionForecast = addDays(new Date(), Math.max(7, Math.round(jobs.length * 1.5)));
  const revenueProjection = jobs.reduce((sum, j) => sum + (j.revenue || 0), 0);
  const totalJobs = jobs.length;
  const activeJobs = jobs.filter((j) => j.status === 'active').length;
  const upcomingJobs = jobs.filter((j) => j.status === 'pending').length;
  return { weeklyUtilization, estimatedBacklog, burnRate, completionForecast, revenueProjection, totalJobs, activeJobs, upcomingJobs };
}

export function computeWarnings(jobs: V2Job[], crews: V2Crew[]): Warning[] {
  // adapt types are identical field names, so we can reuse the v2 alert engine directly
  return generateWarnings(jobs, crews);
}
