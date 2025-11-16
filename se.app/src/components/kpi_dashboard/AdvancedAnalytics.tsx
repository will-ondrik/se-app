import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Project } from "@/types/project";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { useMemo } from "react";
import { InfoTooltip } from "./InfoTooltip";

interface AdvancedAnalyticsProps {
  projects: Project[];
}

export const AdvancedAnalytics = ({ projects }: AdvancedAnalyticsProps) => {
  const analytics = useMemo(() => {
    if (projects.length === 0) return null;

    // Efficiency Index = (Actual/Projected) * (TargetRate / EffectiveRate)
    const targetRate = 75; // Assumed target
    const efficiencyScores = projects
      .filter((p) => p.labour.projectedHours > 0 && p.labour.effectiveRate > 0)
      .map((p) => {
        const hourRatio = p.labour.actualHours / p.labour.projectedHours;
        const rateRatio = targetRate / p.labour.effectiveRate;
        return hourRatio * rateRatio;
      });
    const avgEfficiencyIndex = efficiencyScores.length > 0 
      ? efficiencyScores.reduce((a, b) => a + b, 0) / efficiencyScores.length 
      : 0;

    // Profit per Hour
    const profitPerHourValues = projects
      .filter((p) => p.labour.actualHours > 0)
      .map((p) => p.profit.net / p.labour.actualHours);
    const avgProfitPerHour = profitPerHourValues.length > 0
      ? profitPerHourValues.reduce((a, b) => a + b, 0) / profitPerHourValues.length
      : 0;

    // Change Order %
    const totalRevenue = projects.reduce((sum, p) => sum + p.revenue.total, 0);
    const totalChangeOrders = projects.reduce((sum, p) => sum + p.revenue.changeOrder, 0);
    const changeOrderPercentage = (totalChangeOrders / totalRevenue) * 100;

    // Margins
    const grossMargins = projects.map((p) => (p.profit.gross / p.revenue.total) * 100);
    const netMargins = projects.map((p) => (p.profit.net / p.revenue.total) * 100);
    const avgGrossMargin = grossMargins.reduce((a, b) => a + b, 0) / grossMargins.length;
    const avgNetMargin = netMargins.reduce((a, b) => a + b, 0) / netMargins.length;

    // Overrun Index
    const overruns = projects
      .filter((p) => p.labour.projectedHours > 0)
      .map((p) => p.labour.actualHours / p.labour.projectedHours);
    const avgOverrunIndex = overruns.length > 0 
      ? overruns.reduce((a, b) => a + b, 0) / overruns.length 
      : 1;

    // Average Project Duration
    const durations = projects.map(
      (p) => (p.endDate.getTime() - p.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

    // Profit Stability (% within ±10% variance)
    const stableProjects = projects.filter(
      (p) => p.profit.gross !== 0 && Math.abs(p.profit.grossVariance / p.profit.gross) <= 0.1
    );
    const profitStability = projects.length > 0 
      ? (stableProjects.length / projects.length) * 100 
      : 0;

    // Additional metrics
    const avgEffectiveRate = projects.reduce((sum, p) => sum + p.labour.effectiveRate, 0) / projects.length;
    const totalBalanceDue = projects.reduce((sum, p) => sum + p.balanceDue, 0);
    const avgRevenuePerProject = totalRevenue / projects.length;
    const avgGrossProfitPerProject = projects.reduce((sum, p) => sum + p.profit.gross, 0) / projects.length;

    return {
      efficiencyIndex: avgEfficiencyIndex,
      profitPerHour: avgProfitPerHour,
      changeOrderPercentage,
      grossMargin: avgGrossMargin,
      netMargin: avgNetMargin,
      overrunIndex: avgOverrunIndex,
      avgDuration,
      profitStability,
      avgEffectiveRate,
      totalBalanceDue,
      avgRevenuePerProject,
      avgGrossProfitPerProject,
    };
  }, [projects]);

  if (!analytics) {
    return (
      <Card className="p-6 bg-card border-border/50">
        <p className="text-muted-foreground">No data available for advanced analytics.</p>
      </Card>
    );
  }

  const MetricCard = ({
    title,
    value,
    format,
    trend,
    description,
  }: {
    title: string;
    value: number;
    format: "number" | "currency" | "percentage" | "days";
    trend?: "up" | "down" | "neutral";
    description: string;
  }) => {
    const formatValue = (val: number) => {
      switch (format) {
        case "currency":
          return `$${val.toFixed(2)}`;
        case "percentage":
          return `${val.toFixed(1)}%`;
        case "days":
          return `${Math.round(val)} days`;
        case "number":
        default:
          return val.toFixed(2);
      }
    };

    const getTrendColor = () => {
      if (!trend) return "text-muted-foreground";
      if (trend === "up") return "text-success";
      if (trend === "down") return "text-destructive";
      return "text-muted-foreground";
    };

    const getTrendIcon = () => {
      if (!trend || trend === "neutral") return <Activity className="h-4 w-4" />;
      if (trend === "up") return <TrendingUp className="h-4 w-4" />;
      return <TrendingDown className="h-4 w-4" />;
    };

    return (
      <Card className="p-5 bg-gradient-card border-border/50 hover:shadow-md transition-all">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <InfoTooltip content={description} />
            </div>
            <div className={getTrendColor()}>{getTrendIcon()}</div>
          </div>
          <p className="text-2xl font-bold text-foreground">{formatValue(value)}</p>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-foreground">Advanced Analytics</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Deep insights into performance and profitability
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {projects.length} Projects Analyzed
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Efficiency Index"
          value={analytics.efficiencyIndex}
          format="number"
          trend={analytics.efficiencyIndex > 1 ? "down" : "up"}
          description="Measures how efficiently projects use labour and budget. Calculated as (Actual Hours ÷ Projected Hours) × (Target Rate ÷ Effective Rate). Lower values indicate better efficiency."
        />

        <MetricCard
          title="Profit per Hour"
          value={analytics.profitPerHour}
          format="currency"
          trend="up"
          description="Average net profit earned for each hour of labour invested. Calculated as Net Profit ÷ Actual Labour Hours. Higher values indicate better profitability per hour worked."
        />

        <MetricCard
          title="Change Order %"
          value={analytics.changeOrderPercentage}
          format="percentage"
          trend={analytics.changeOrderPercentage > 10 ? "down" : "neutral"}
          description="Percentage of total revenue from change orders. High percentages may indicate initial scoping issues or scope creep. Calculated as (Change Order Revenue ÷ Total Revenue) × 100."
        />

        <MetricCard
          title="Gross Margin"
          value={analytics.grossMargin}
          format="percentage"
          trend="up"
          description="Average gross profit as a percentage of revenue across all projects. Shows profitability before overhead costs. Calculated as (Gross Profit ÷ Total Revenue) × 100."
        />

        <MetricCard
          title="Net Margin"
          value={analytics.netMargin}
          format="percentage"
          trend="up"
          description="Average net profit as a percentage of revenue after all costs. The ultimate measure of project profitability. Calculated as (Net Profit ÷ Total Revenue) × 100."
        />

        <MetricCard
          title="Overrun Index"
          value={analytics.overrunIndex}
          format="number"
          trend={analytics.overrunIndex > 1.05 ? "down" : "up"}
          description="Ratio of actual to projected labour hours. Values above 1.0 indicate projects took longer than estimated. Calculated as Actual Hours ÷ Projected Hours. Target is 1.0 or below."
        />

        <MetricCard
          title="Avg Project Duration"
          value={analytics.avgDuration}
          format="days"
          trend="neutral"
          description="Average number of calendar days from project start to completion. Helps identify typical project timelines and scheduling patterns for similar future projects."
        />

        <MetricCard
          title="Profit Stability"
          value={analytics.profitStability}
          format="percentage"
          trend="up"
          description="Percentage of projects that came within ±10% of their profit target. Higher values indicate more consistent and predictable project outcomes. Shows estimation accuracy."
        />

        <MetricCard
          title="Avg Effective Rate"
          value={analytics.avgEffectiveRate}
          format="currency"
          trend="up"
          description="Average cost per labour hour including wages, benefits, overhead, and all labour-related expenses. Critical for pricing decisions and profitability analysis."
        />

        <MetricCard
          title="Total Balance Due"
          value={analytics.totalBalanceDue}
          format="currency"
          trend="neutral"
          description="Total unpaid invoices and outstanding receivables across all projects. Important for cash flow management and accounts receivable tracking."
        />

        <MetricCard
          title="Avg Revenue/Project"
          value={analytics.avgRevenuePerProject}
          format="currency"
          trend="up"
          description="Average total revenue generated per project including base contracts and change orders. Helps identify typical project size and revenue potential."
        />

        <MetricCard
          title="Avg Gross Profit/Project"
          value={analytics.avgGrossProfitPerProject}
          format="currency"
          trend="up"
          description="Average gross profit earned per project after direct costs but before overhead. Indicates typical profit potential per project and helps with project selection."
        />
      </div>

      {/* Formula Reference */}
      <Card className="p-6 bg-muted/30 border-border/50">
        <h4 className="text-sm font-semibold text-foreground mb-3">Metric Definitions</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div>
            <strong className="text-foreground">Efficiency Index:</strong> (Actual Hours / Projected Hours) × (Target Rate / Effective Rate)
          </div>
          <div>
            <strong className="text-foreground">Profit per Hour:</strong> Net Profit ÷ Actual Labour Hours
          </div>
          <div>
            <strong className="text-foreground">Change Order %:</strong> (Change Order Revenue ÷ Total Revenue) × 100
          </div>
          <div>
            <strong className="text-foreground">Overrun Index:</strong> Actual Hours ÷ Projected Hours
          </div>
        </div>
      </Card>
    </div>
  );
};