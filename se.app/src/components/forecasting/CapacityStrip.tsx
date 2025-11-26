import { Job, Crew } from "@/types/forecasting/types";
import { format, eachDayOfInterval, isSameDay } from "date-fns";

interface CapacityStripProps {
  jobs: Job[];
  crews: Crew[];
  startDate: Date;
  endDate: Date;
}

export const CapacityStrip = ({ jobs, crews, startDate, endDate }: CapacityStripProps) => {
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const unassignedJobs = jobs.filter(job => !job.crewId);

  // Calculate hours per day (simple sum of estimated hours for jobs on that day)
  const getDayHours = (day: Date) => {
    return jobs.reduce((total, job) => {
      const jobStart = new Date(job.startDate);
      const jobEnd = new Date(job.endDate);
      if (day >= jobStart && day <= jobEnd && job.estimatedHours) {
        return total + (job.estimatedHours / ((jobEnd.getTime() - jobStart.getTime()) / (1000 * 60 * 60 * 24) + 1));
      }
      return total;
    }, 0);
  };

  const maxHours = Math.max(...days.map(getDayHours), 1);
  const availableHoursPerDay = crews.length * 8; // Assuming 8 hours per crew per day

  return (
    <div className="h-48 border-t bg-card flex gap-4 p-4">
      {/* Capacity Overview */}
      <div className="flex-1 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Capacity Overview</h2>
          <span className="text-xs text-muted-foreground">
            Booked vs Available ({availableHoursPerDay}h/day)
          </span>
        </div>
        <div className="flex-1 flex items-end gap-2 px-2">
          {days.slice(0, 14).map((day, idx) => {
            const hours = getDayHours(day);
            const percentage = (hours / maxHours) * 100;
            const isOverbooked = hours > availableHoursPerDay;
            
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col items-center justify-end h-24">
                  <div 
                    className={`w-full rounded-sm transition-all ${
                      isOverbooked ? 'bg-destructive' : 'bg-primary'
                    }`}
                    style={{ height: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <div className="text-[10px] text-muted-foreground text-center">
                  <div className="font-medium">{format(day, "EEE")}</div>
                  <div>{format(day, "MMM d")}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Unassigned Jobs */}
      <div className="w-72 border-l pl-4 flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Unassigned Jobs</h2>
        <div className="flex-1 overflow-auto space-y-1">
          {unassignedJobs.length > 0 ? (
            unassignedJobs.map(job => (
              <div 
                key={job.id} 
                className="p-2 rounded border bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
              >
                <div className="text-xs font-medium truncate">{job.title}</div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {job.client?.name}
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-muted-foreground">
              All jobs are assigned to crews
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
