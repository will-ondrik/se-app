import * as React from "react";
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface InfoTooltipProps {
  content: string;
}

// Non-JSX version to be valid in a .ts file
export function InfoTooltip({ content }: InfoTooltipProps) {
  return React.createElement(
    TooltipProvider,
    null,
    React.createElement(
      Tooltip,
      null,
      React.createElement(
        TooltipTrigger as any,
        { asChild: true },
        React.createElement(HelpCircle, {
          className:
            "h-4 w-4 text-muted-foreground hover:text-foreground cursor-help transition-colors",
        })
      ),
      React.createElement(
        TooltipContent as any,
        { className: "max-w-xs" },
        React.createElement("p", { className: "text-sm" }, content)
      )
    )
  );
}
