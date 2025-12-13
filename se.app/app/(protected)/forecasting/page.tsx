'use client';

import React from 'react';
import { CrewForecastCalendar } from '@/components/forecasting/v2/components/CrewForecastCalendar';

export default function ForecastingPage() {
  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-background">
      <CrewForecastCalendar />
    </div>
  );
}
