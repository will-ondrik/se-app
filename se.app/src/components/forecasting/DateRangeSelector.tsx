import { DateRangeOption } from "@/types/forecasting/types";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DateRangeSelectorProps {
  selectedRange: DateRangeOption;
  onRangeChange: (range: DateRangeOption) => void;
  startDate: Date;
  endDate: Date;
}

export const DateRangeSelector = ({
  selectedRange,
  onRangeChange,
  startDate,
  endDate,
}: DateRangeSelectorProps) => {
  const ranges: { value: DateRangeOption; label: string }[] = [
    { value: "week", label: "Week" },
    { value: "2weeks", label: "2 Weeks" },
    { value: "month", label: "Month" },
    { value: "quarter", label: "Quarter" },
    { value: "6months", label: "6 Months" },
    { value: "year", label: "Year" },
  ];

  return (
    <div className="flex items-center gap-4">
      <div className="flex gap-1 bg-muted rounded-lg p-1">
        {ranges.map((range) => (
          <Button
            key={range.value}
            variant="ghost"
            size="sm"
            onClick={() => onRangeChange(range.value)}
            className={cn(
              "px-4",
              selectedRange === range.value && "bg-background shadow-sm"
            )}
          >
            {range.label}
          </Button>
        ))}
      </div>
      <div className="text-sm text-muted-foreground">
        {format(startDate, "MMM d")} – {format(endDate, "MMM d, yyyy")}
      </div>
    </div>
  );
};
