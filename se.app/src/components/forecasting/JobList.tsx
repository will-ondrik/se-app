import { Job } from "@/types";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface JobListProps {
  jobs: Job[];
  selectedJobId: number | null;
  onJobClick: (jobId: number) => void;
}

export const JobList = ({ jobs, selectedJobId, onJobClick }: JobListProps) => {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-sm">Jobs in View</h2>
        <p className="text-xs text-muted-foreground mt-1">
          {jobs.length} {jobs.length === 1 ? "job" : "jobs"}
        </p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {jobs.map((job) => (
            <button
              key={job.id}
              onClick={() => onJobClick(job.id)}
              className={cn(
                "w-full text-left p-3 rounded-lg hover:bg-muted transition-colors",
                selectedJobId === job.id && "bg-muted"
              )}
            >
              <div className="flex items-start gap-2">
                <div
                  className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                  style={{ backgroundColor: job.crew?.colorHex || "#ccc" }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {job.title}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {job.client?.name}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {format(new Date(job.startDate), "MMM d")} -{" "}
                    {format(new Date(job.endDate), "MMM d")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {job.crew?.name}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};