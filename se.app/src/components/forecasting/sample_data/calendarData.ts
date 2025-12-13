import { addDays, addWeeks, startOfMonth } from 'date-fns';
import { generateWarnings } from '@/components/forecasting/v2/lib/alertEngine';

// ==================== Types ====================

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
  address: string;
  jobType: JobType;
  startDate: Date;
  endDate: Date;
  estimatedHours: number;
  completedHours: number;
  status: JobStatus;
  progress: number; // 0-100
  revenue: number;
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

// ==================== Mock Data ====================

const today = new Date();
const monthStart = startOfMonth(today);

export const mockCrews: Crew[] = [
  {
    id: 'crew-1',
    name: 'Crew Alpha',
    color: 'teal',
    manager: 'Mike Johnson',
    utilization: 87,
    employees: [
      { id: 'emp-1', name: 'John Smith', role: 'Lead Painter' },
      { id: 'emp-2', name: 'Steve Wilson', role: 'Painter' },
      { id: 'emp-3', name: 'Alex Brown', role: 'Apprentice' },
    ],
  },
  {
    id: 'crew-2',
    name: 'Crew Beta',
    color: 'coral',
    manager: 'Sarah Davis',
    utilization: 92,
    employees: [
      { id: 'emp-4', name: 'Mike Chen', role: 'Lead Painter' },
      { id: 'emp-5', name: 'Ryan Taylor', role: 'Painter' },
    ],
  },
  {
    id: 'crew-3',
    name: 'Crew Gamma',
    color: 'amber',
    manager: 'Tom Anderson',
    utilization: 65,
    employees: [
      { id: 'emp-6', name: 'David Lee', role: 'Lead Painter' },
      { id: 'emp-7', name: 'Chris Martin', role: 'Painter' },
      { id: 'emp-8', name: 'Jake White', role: 'Painter' },
    ],
  },
  {
    id: 'crew-4',
    name: 'Crew Delta',
    color: 'indigo',
    manager: 'Emily Clark',
    utilization: 78,
    employees: [
      { id: 'emp-9', name: 'Brian Hall', role: 'Lead Painter' },
      { id: 'emp-10', name: 'Kevin Young', role: 'Painter' },
    ],
  },
  {
    id: 'crew-5',
    name: 'Crew Echo',
    color: 'emerald',
    manager: 'Lisa Rodriguez',
    utilization: 45,
    employees: [
      { id: 'emp-11', name: 'Mark Thompson', role: 'Lead Painter' },
      { id: 'emp-12', name: 'Paul Garcia', role: 'Painter' },
      { id: 'emp-13', name: 'Sam Martinez', role: 'Apprentice' },
    ],
  },
];

export const mockJobs: Job[] = [
  {
    id: 'job-1',
    name: 'Riverside Apartments',
    crewId: 'crew-1',
    clientName: 'Riverside Properties LLC',
    address: '1234 River Road, Suite 100',
    jobType: 'new-construction',
    startDate: addDays(monthStart, 2),
    endDate: addDays(monthStart, 12),
    estimatedHours: 240,
    completedHours: 180,
    status: 'active',
    progress: 75,
    revenue: 28500,
  },
  {
    id: 'job-2',
    name: 'Downtown Office Complex',
    crewId: 'crew-1',
    clientName: 'Metro Commercial Group',
    address: '500 Main Street',
    jobType: 'repaint',
    startDate: addDays(monthStart, 14),
    endDate: addDays(monthStart, 25),
    estimatedHours: 320,
    completedHours: 0,
    status: 'pending',
    progress: 0,
    revenue: 45000,
  },
  {
    id: 'job-3',
    name: 'Lakewood Residence',
    crewId: 'crew-2',
    clientName: 'Johnson Family',
    address: '789 Lake View Drive',
    jobType: 'repaint',
    startDate: addDays(monthStart, 1),
    endDate: addDays(monthStart, 8),
    estimatedHours: 120,
    completedHours: 95,
    status: 'active',
    progress: 80,
    revenue: 15200,
  },
  {
    id: 'job-4',
    name: 'Harbor View Hotel',
    crewId: 'crew-2',
    clientName: 'Harbor Hospitality Inc',
    address: '100 Harbor Boulevard',
    jobType: 'cost-plus',
    startDate: addDays(monthStart, 10),
    endDate: addDays(monthStart, 28),
    estimatedHours: 480,
    completedHours: 120,
    status: 'over-capacity',
    progress: 25,
    revenue: 67500,
  },
  {
    id: 'job-5',
    name: 'Sunset Mall Renovation',
    crewId: 'crew-3',
    clientName: 'Sunset Retail Corp',
    address: '2000 Sunset Boulevard',
    jobType: 'repaint',
    startDate: addDays(monthStart, 5),
    endDate: addDays(monthStart, 22),
    estimatedHours: 400,
    completedHours: 150,
    status: 'delayed',
    progress: 38,
    revenue: 52000,
  },
  {
    id: 'job-6',
    name: 'Pine Street Townhomes',
    crewId: 'crew-3',
    clientName: 'Pine Development LLC',
    address: '456 Pine Street',
    jobType: 'new-construction',
    startDate: addDays(monthStart, 24),
    endDate: addDays(monthStart, 35),
    estimatedHours: 280,
    completedHours: 0,
    status: 'pending',
    progress: 0,
    revenue: 35000,
  },
  {
    id: 'job-7',
    name: 'Central Bank Branch',
    crewId: 'crew-4',
    clientName: 'Central Bank Corp',
    address: '777 Financial District',
    jobType: 'repaint',
    startDate: addDays(monthStart, 3),
    endDate: addDays(monthStart, 15),
    estimatedHours: 280,
    completedHours: 200,
    status: 'active',
    progress: 72,
    revenue: 38000,
  },
  {
    id: 'job-8',
    name: 'Greenfield School',
    crewId: 'crew-4',
    clientName: 'Greenfield School District',
    address: '1500 Education Lane',
    jobType: 'new-construction',
    startDate: addDays(monthStart, 18),
    endDate: addDays(monthStart, 30),
    estimatedHours: 320,
    completedHours: 0,
    status: 'pending',
    progress: 0,
    revenue: 42000,
  },
  {
    id: 'job-9',
    name: 'Mountain View Condos',
    crewId: 'crew-5',
    clientName: 'Mountain Developers',
    address: '3000 Summit Road',
    jobType: 'cost-plus',
    startDate: addDays(monthStart, 8),
    endDate: addDays(monthStart, 18),
    estimatedHours: 200,
    completedHours: 60,
    status: 'active',
    progress: 30,
    revenue: 26000,
  },
  {
    id: 'job-10',
    name: 'City Library Refresh',
    crewId: 'crew-5',
    clientName: 'City Public Works',
    address: '200 Library Square',
    jobType: 'repaint',
    startDate: addWeeks(monthStart, 5),
    endDate: addWeeks(monthStart, 7),
    estimatedHours: 180,
    completedHours: 0,
    status: 'pending',
    progress: 0,
    revenue: 22000,
  },
];

// Generate warnings dynamically based on actual job and crew data
export const mockWarnings: Warning[] = generateWarnings(mockJobs, mockCrews);

export const mockAnalytics: Analytics = {
  weeklyUtilization: 73,
  estimatedBacklog: 2240,
  burnRate: 85,
  completionForecast: addWeeks(today, 6),
  revenueProjection: 371200,
  totalJobs: 10,
  activeJobs: 5,
  upcomingJobs: 5,
};
