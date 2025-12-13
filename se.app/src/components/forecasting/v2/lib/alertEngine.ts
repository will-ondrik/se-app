import { Job, Crew, Warning } from '@/data/calendarData';
import { 
  differenceInDays, 
  isWithinInterval, 
  addDays, 
  startOfWeek, 
  endOfWeek,
  isBefore,
  isAfter
} from 'date-fns';

/**
 * Generates dynamic warnings based on job and crew data
 */
export function generateWarnings(jobs: Job[], crews: Crew[]): Warning[] {
  const warnings: Warning[] = [];
  const today = new Date();

  // 1. Check for over-capacity (overlapping jobs for a crew)
  crews.forEach(crew => {
    const crewJobs = jobs.filter(j => j.crewId === crew.id && j.status !== 'completed');
    
    // Check each day in the next 30 days for overlapping jobs
    for (let i = 0; i < 30; i++) {
      const checkDate = addDays(today, i);
      const activeJobsOnDate = crewJobs.filter(job => 
        isWithinInterval(checkDate, { start: job.startDate, end: job.endDate })
      );
      
      // If more jobs than crew members, it's over capacity
      if (activeJobsOnDate.length > crew.employees.length) {
        const existingWarning = warnings.find(
          w => w.type === 'over-capacity' && w.crewId === crew.id
        );
        if (!existingWarning) {
          warnings.push({
            id: `over-capacity-${crew.id}`,
            type: 'over-capacity',
            severity: 'critical',
            crewId: crew.id,
            message: `${crew.name} is over capacity for ${activeJobsOnDate[0].name} project`,
            date: checkDate,
          });
        }
      }
    }
  });

  // 2. Check for behind schedule jobs
  jobs.forEach(job => {
    if (job.status === 'completed') return;
    
    const totalDays = differenceInDays(job.endDate, job.startDate) + 1;
    const daysElapsed = differenceInDays(today, job.startDate);
    
    if (daysElapsed > 0 && daysElapsed <= totalDays) {
      const expectedProgress = Math.min(100, (daysElapsed / totalDays) * 100);
      const progressDiff = expectedProgress - job.progress;
      
      // If more than 15% behind expected progress
      if (progressDiff > 15) {
        const daysBehing = Math.round((progressDiff / 100) * totalDays);
        warnings.push({
          id: `behind-schedule-${job.id}`,
          type: 'behind-schedule',
          severity: 'warning',
          jobId: job.id,
          message: `${job.name} is ${daysBehing} days behind schedule`,
          date: today,
        });
      }
    }
  });

  // 3. Check for underutilized crews
  crews.forEach(crew => {
    if (crew.utilization < 50) {
      const nextWeekStart = startOfWeek(addDays(today, 7));
      const nextWeekEnd = endOfWeek(addDays(today, 7));
      
      const nextWeekJobs = jobs.filter(job => 
        job.crewId === crew.id &&
        job.status !== 'completed' &&
        (isWithinInterval(nextWeekStart, { start: job.startDate, end: job.endDate }) ||
         isWithinInterval(nextWeekEnd, { start: job.startDate, end: job.endDate }))
      );
      
      if (nextWeekJobs.length === 0 || crew.utilization < 50) {
        warnings.push({
          id: `idle-${crew.id}`,
          type: 'idle',
          severity: 'info',
          crewId: crew.id,
          message: `${crew.name} has ${100 - crew.utilization}% idle capacity next week`,
          date: nextWeekStart,
        });
      }
    }
  });

  // 4. Check for bottlenecks (multiple large jobs starting same week)
  const upcomingWeeks = 4;
  for (let week = 0; week < upcomingWeeks; week++) {
    const weekStart = startOfWeek(addDays(today, week * 7));
    const weekEnd = endOfWeek(addDays(today, week * 7));
    
    const jobsStartingThisWeek = jobs.filter(job =>
      job.status !== 'completed' &&
      isWithinInterval(job.startDate, { start: weekStart, end: weekEnd }) &&
      job.estimatedHours > 100 // Large jobs
    );
    
    if (jobsStartingThisWeek.length >= 2) {
      warnings.push({
        id: `bottleneck-week-${week}`,
        type: 'bottleneck',
        severity: 'warning',
        message: `Potential bottleneck: ${jobsStartingThisWeek.length} large projects overlap in week ${week + 1}`,
        date: weekStart,
      });
    }
  }

  // 5. Check for delayed jobs (status is delayed)
  jobs.forEach(job => {
    if (job.status === 'delayed') {
      const crew = crews.find(c => c.id === job.crewId);
      warnings.push({
        id: `delayed-${job.id}`,
        type: 'behind-schedule',
        severity: 'warning',
        jobId: job.id,
        crewId: job.crewId,
        message: `${job.name} is marked as delayed`,
        date: today,
      });
    }
  });

  // Remove duplicates by id
  const uniqueWarnings = warnings.filter((warning, index, self) =>
    index === self.findIndex(w => w.id === warning.id)
  );

  // Sort by severity (critical first) then by date
  return uniqueWarnings.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return a.date.getTime() - b.date.getTime();
  });
}

/**
 * Calculate crew utilization based on jobs
 */
export function calculateCrewUtilization(crew: Crew, jobs: Job[]): number {
  const today = new Date();
  const weekEnd = endOfWeek(today);
  
  const crewJobs = jobs.filter(job => 
    job.crewId === crew.id &&
    job.status !== 'completed' &&
    isWithinInterval(today, { start: job.startDate, end: job.endDate })
  );
  
  if (crewJobs.length === 0) return 0;
  
  // Calculate based on active jobs vs crew capacity
  const totalHoursThisWeek = crewJobs.reduce((sum, job) => {
    const daysInWeek = Math.min(
      differenceInDays(weekEnd, today) + 1,
      differenceInDays(job.endDate, today) + 1
    );
    const dailyHours = job.estimatedHours / differenceInDays(job.endDate, job.startDate);
    return sum + (dailyHours * daysInWeek);
  }, 0);
  
  const crewCapacityPerWeek = crew.employees.length * 40; // 40 hours per employee per week
  
  return Math.min(100, Math.round((totalHoursThisWeek / crewCapacityPerWeek) * 100));
}
