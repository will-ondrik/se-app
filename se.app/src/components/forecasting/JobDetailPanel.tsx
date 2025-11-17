import { Job } from "@/types";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { X, Calendar, DollarSign, Clock, MapPin, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface JobDetailPanelProps {
  job: Job;
  onClose: () => void;
  onEdit: () => void;
}

export const JobDetailPanel = ({ job, onClose, onEdit }: JobDetailPanelProps) => {
  return (
    <div className="fixed right-0 top-0 bottom-0 w-96 bg-card border-l shadow-lg z-30">
      <div className="flex flex-col h-full">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">Job Details</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            <div>
              <div className="flex items-start gap-3 mb-2">
                <div
                  className="w-4 h-4 rounded-full mt-1 flex-shrink-0"
                  style={{ backgroundColor: job.crew?.colorHex || "#ccc" }}
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-lg">{job.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {job.crew?.name}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {job.client && (
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">{job.client.name}</div>
                    {job.client.email && (
                      <div className="text-xs text-muted-foreground">
                        {job.client.email}
                      </div>
                    )}
                    {job.client.phone && (
                      <div className="text-xs text-muted-foreground">
                        {job.client.phone}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {job.client?.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm">{job.client.address}</div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm">
                    {format(new Date(job.startDate), "MMMM d, yyyy")} -{" "}
                    {format(new Date(job.endDate), "MMMM d, yyyy")}
                  </div>
                </div>
              </div>

              {job.estimatedHours && (
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm">{job.estimatedHours} hours</div>
                </div>
              )}

              {job.estimatedRevenue && (
                <div className="flex items-start gap-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm">
                    ${job.estimatedRevenue.toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            {job.description && (
              <div>
                <h5 className="font-medium text-sm mb-2">Description</h5>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {job.description}
                </p>
              </div>
            )}

            {job.integrationSource && (
              <div>
                <h5 className="font-medium text-sm mb-2">Integration</h5>
                <p className="text-xs text-muted-foreground">
                  Source: {job.integrationSource}
                  {job.integrationExternalId && (
                    <span> (ID: {job.integrationExternalId})</span>
                  )}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <Button onClick={onEdit} className="w-full">
            Edit Job
          </Button>
        </div>
      </div>
    </div>
  );
};