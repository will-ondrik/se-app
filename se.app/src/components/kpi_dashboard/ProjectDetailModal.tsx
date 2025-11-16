import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Project } from "@/types/project";
import { format, differenceInDays } from "date-fns";
import { 
  Building2, 
  User, 
  Calendar, 
  DollarSign, 
  Clock, 
  TrendingUp,
  FileText,
  Users
} from "lucide-react";

interface ProjectDetailModalProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProjectDetailModal = ({ project, open, onOpenChange }: ProjectDetailModalProps) => {
  if (!project) return null;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);

  const duration = differenceInDays(project.endDate, project.startDate);
  const efficiency = (project.labour.actualHours / project.labour.projectedHours) * 100;
  const grossMargin = (project.profit.gross / project.revenue.total) * 100;
  const netMargin = (project.profit.net / project.revenue.total) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold text-foreground">
                  {project.title}
                </DialogTitle>
                <p className="text-sm text-muted-foreground font-mono mt-1">
                  {project.jobberNum}
                </p>
              </div>
              <Badge
                variant={project.businessType.billingMethod === "Quote" ? "default" : "outline"}
                className="text-sm"
              >
                {project.businessType.billingMethod}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Client & Leader Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">Client</p>
                <p className="text-sm text-muted-foreground">{project.clientName.name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">Project Leader</p>
                <p className="text-sm text-muted-foreground">
                  {project.lead.firstName} {project.lead.lastName}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Timeline */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-5 w-5 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">Timeline</h4>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Start Date</p>
                <p className="text-sm font-medium text-foreground">
                  {format(project.startDate, "MMM d, yyyy")}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">End Date</p>
                <p className="text-sm font-medium text-foreground">
                  {format(project.endDate, "MMM d, yyyy")}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="text-sm font-medium text-foreground">{duration} days</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Financial Summary */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-5 w-5 text-success" />
              <h4 className="text-sm font-semibold text-foreground">Financial Summary</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Total Revenue</p>
                <p className="text-xl font-bold text-foreground">{formatCurrency(project.revenue.total)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Change Orders: {formatCurrency(project.revenue.changeOrder)} ({project.changeOrders})
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Balance Due</p>
                <p className="text-xl font-bold text-warning">{formatCurrency(project.balanceDue)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {((project.balanceDue / project.revenue.total) * 100).toFixed(1)}% of total
                </p>
              </div>
              <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                <p className="text-xs text-muted-foreground">Gross Profit</p>
                <p className="text-xl font-bold text-success">{formatCurrency(project.profit.gross)}</p>
                <p className="text-xs text-success mt-1">
                  {grossMargin.toFixed(1)}% margin • Variance: {formatCurrency(project.profit.grossVariance)}
                </p>
              </div>
              <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                <p className="text-xs text-muted-foreground">Net Profit</p>
                <p className="text-xl font-bold text-success">{formatCurrency(project.profit.net)}</p>
                <p className="text-xs text-success mt-1">
                  {netMargin.toFixed(1)}% margin • Variance: {formatCurrency(project.profit.netVariance)}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Labour Analysis */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-5 w-5 text-warning" />
              <h4 className="text-sm font-semibold text-foreground">Labour Analysis</h4>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Projected Hours</p>
                <p className="text-lg font-bold text-foreground">
                  {project.labour.projectedHours.toFixed(1)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Actual Hours</p>
                <p className="text-lg font-bold text-foreground">
                  {project.labour.actualHours.toFixed(1)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Effective Rate</p>
                <p className="text-lg font-bold text-foreground">
                  ${project.labour.effectiveRate.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Efficiency</p>
                <p
                  className={`text-lg font-bold ${
                    efficiency > 105
                      ? "text-destructive"
                      : efficiency < 95
                      ? "text-success"
                      : "text-foreground"
                  }`}
                >
                  {efficiency.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Stage Leads */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-5 w-5 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">Stage Leads</h4>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Stage 1</p>
                <p className="text-sm font-medium text-foreground">
                  {project.stages.stage1Lead.firstName} {project.stages.stage1Lead.lastName}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Stage 2</p>
                <p className="text-sm font-medium text-foreground">
                  {project.stages.stage2Lead.firstName} {project.stages.stage2Lead.lastName}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Stage 3</p>
                <p className="text-sm font-medium text-foreground">
                  {project.stages.stage3Lead.firstName} {project.stages.stage3Lead.lastName}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Stage 4</p>
                <p className="text-sm font-medium text-foreground">
                  {project.stages.stage4Lead.firstName} {project.stages.stage4Lead.lastName}
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {project.notes.content && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground">Project Notes</h4>
                </div>
                <p className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
                  {project.notes.content}
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};