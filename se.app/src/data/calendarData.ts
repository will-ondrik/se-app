// Types for the v2 forecasting components. These intentionally mirror
// src/components/forecasting/sample_data/calendarData.ts, but without any mock data.

export type CrewColor = 'teal' | 'coral' | 'amber' | 'indigo' | 'emerald' | 'slate';

export type JobStatus = 'pending' | 'active' | 'completed' | 'delayed' | 'over-capacity';

export type JobType = 'new-construction' | 'repaint' | 'cost-plus';

export type ViewMode = 'week' | '1-month' | '3-months' | '6-months' | '12-months';

export interface Employee {
  id: string;
  name: string;
  role: string;
  avatar?: string;
}

export interface Crew {
  id: string;
  name: string;
  color: CrewColor;
  manager: string;
  employees: Employee[];
  utilization: number; // 0-100
}

export interface Job {
  id: string;
  name: string;
  crewId: string;
  clientName: string;
  address?: string;
  jobType?: JobType;
  startDate: Date;
  endDate: Date;
  estimatedHours?: number;
  completedHours?: number;
  status: JobStatus;
  progress: number; // 0-100
  revenue?: number;
}

export interface Warning {
  id: string;
  type: 'double-booked' | 'over-capacity' | 'underutilized' | 'behind-schedule' | 'bottleneck' | 'idle';
  severity: 'critical' | 'warning' | 'info';
  crewId?: string;
  employeeId?: string;
  jobId?: string;
  message: string;
  date: Date;
}

export interface Analytics {
  weeklyUtilization: number;
  estimatedBacklog: number;
  burnRate: number;
  completionForecast: Date;
  revenueProjection: number;
  totalJobs: number;
  activeJobs: number;
  upcomingJobs: number;
}
