import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface InfoTooltipProps {
  content: string;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
}

export function InfoTooltip({ content, className = "", side = "top" }: InfoTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            tabIndex={0}
            aria-label="More information"
            className={cn(
              "inline-flex h-4 w-4 items-center justify-center align-middle cursor-help text-muted-foreground transition-colors hover:text-foreground",
              className
            )}
          >
            <HelpCircle className="h-4 w-4" />
          </span>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          <p className="text-sm leading-snug">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
