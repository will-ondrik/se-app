import { Card } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { InfoTooltip } from "./InfoTooltip";

interface KpiCardProps {
  title: string;
  value: string;
  delta?: number;
  sparklineData?: number[];
  format?: "currency" | "number" | "percentage" | "hours";
  subtitle?: string;
  description?: string;
}

export const KpiCard = ({
  title,
  value,
  delta,
  sparklineData,
  subtitle,
  description,
}: KpiCardProps) => {
  const getDeltaColor = (delta: number) => {
    if (delta > 0) return "text-success";
    if (delta < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  const getDeltaIcon = (delta: number) => {
    if (delta > 0) return <ArrowUp className="h-3 w-3" />;
    if (delta < 0) return <ArrowDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  return (
    <Card className="p-6 bg-gradient-card hover:shadow-lg transition-all duration-300 border-border/50">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {description && <InfoTooltip content={description} />}
        </div>
        <div className="flex items-baseline justify-between">
          <h3 className="text-3xl font-bold text-foreground">{value}</h3>
          {delta !== undefined && (
            <div
              className={cn(
                "flex items-center gap-1 text-sm font-semibold",
                getDeltaColor(delta)
              )}
            >
              {getDeltaIcon(delta)}
              <span>{Math.abs(delta)}%</span>
            </div>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
        {sparklineData && sparklineData.length > 0 && (
          <div className="h-8 flex items-end gap-0.5 mt-4">
            {sparklineData.map((value, index) => {
              const max = Math.max(...sparklineData);
              const height = (value / max) * 100;
              return (
                <div
                  key={index}
                  className="flex-1 bg-primary/20 rounded-t transition-all duration-300 hover:bg-primary/40"
                  style={{ height: `${height}%` }}
                />
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
};