import { Job } from "@/types/forecasting/types";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface RightPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedJob: Job | null;
  jobs: Job[];
  onJobClick: (job: Job) => void;
  onEditJob: (job: Job) => void;
  onClose: () => void;
}

export const RightPanel = ({
  isOpen,
  onToggle,
  selectedJob,
  jobs,
  onJobClick,
  onEditJob,
  onClose,
}: RightPanelProps) => {
  return (
    <div
      className={cn(
        "border-l bg-card transition-all duration-300 flex flex-col",
        isOpen ? "w-72" : "w-0 border-l-0"
      )}
    >
      {/* Toggle Button - Fixed position when closed */}
      {!isOpen ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-30 h-16 w-8 rounded-l-md rounded-r-none border-l border-y bg-card shadow-md"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      ) : (
        <div className="flex items-center justify-between p-2 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="w-full justify-center"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Panel Content */}
      {isOpen && (
        <Tabs defaultValue="jobs" className="flex-1 flex flex-col">
          <TabsList className="w-full grid grid-cols-2 rounded-none border-b bg-muted/50">
            <TabsTrigger value="jobs">Jobs ({jobs.length})</TabsTrigger>
            <TabsTrigger value="details" disabled={!selectedJob}>
              Details
            </TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="flex-1 overflow-hidden m-0">
            <div className="h-full overflow-y-auto">
              {jobs.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No jobs in this date range
                </div>
              ) : (
                <div className="divide-y">
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => onJobClick(job)}
                      className={cn(
                        "p-3 cursor-pointer hover:bg-muted/50 transition-colors",
                        selectedJob?.id === job.id && "bg-muted"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                          style={{ backgroundColor: job.crew?.colorHex || "#6b7280" }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {job.title}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {job.client?.name}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {format(new Date(job.startDate), "MMM d")} –{" "}
                            {format(new Date(job.endDate), "MMM d")}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="details" className="flex-1 overflow-hidden m-0">
            {selectedJob ? (
              <div className="h-full overflow-y-auto p-4">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-semibold text-lg">{selectedJob.title}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  {selectedJob.client && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        Client
                      </div>
                      <div className="text-sm">{selectedJob.client.name}</div>
                      {selectedJob.client.address && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {selectedJob.client.address}
                        </div>
                      )}
                    </div>
                  )}

                  {selectedJob.crew && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        Crew
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: selectedJob.crew.colorHex }}
                        />
                        <div className="text-sm">{selectedJob.crew.name}</div>
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Schedule
                    </div>
                    <div className="text-sm">
                      {format(new Date(selectedJob.startDate), "MMM d, yyyy")} –{" "}
                      {format(new Date(selectedJob.endDate), "MMM d, yyyy")}
                    </div>
                  </div>

                  {(selectedJob.estimatedHours || selectedJob.estimatedRevenue) && (
                    <div className="grid grid-cols-2 gap-4">
                      {selectedJob.estimatedHours && (
                        <div>
                          <div className="text-sm font-medium text-muted-foreground mb-1">
                            Est. Hours
                          </div>
                          <div className="text-sm">{selectedJob.estimatedHours}h</div>
                        </div>
                      )}
                      {selectedJob.estimatedRevenue && (
                        <div>
                          <div className="text-sm font-medium text-muted-foreground mb-1">
                            Est. Revenue
                          </div>
                          <div className="text-sm">
                            ${selectedJob.estimatedRevenue.toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedJob.description && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        Description
                      </div>
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {selectedJob.description}
                      </div>
                    </div>
                  )}

                  <Button onClick={() => onEditJob(selectedJob)} className="w-full">
                    Edit Job
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground text-sm">
                Select a job to view details
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
