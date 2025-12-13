"use client";

import React from "react";
import { format } from "date-fns";

export function CalendarDayHeader({
  days,
  dayWidthPx,
  className,
}: {
  days: Date[];
  dayWidthPx: number;
  className?: string;
}) {
  return (
    <div className={className ?? ""}>
      <div className="flex">
        {days.map((day, index) => (
          <div
            key={index}
            className="flex flex-col items-center justify-center border-r text-[10px]"
            style={{ width: dayWidthPx }}
          >
            <div className="font-medium">{format(day, "EEE")}</div>
            <div className="text-muted-foreground">{format(day, "MMM d")}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
