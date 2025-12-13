import { useEffect, useMemo, useState } from 'react';
import { ViewMode, Job, Crew, Warning, Analytics } from '@/data/calendarData';
import { ViewControls } from './ViewControls';
import { CalendarGrid } from './CalendarGrid';
import { AnalyticsPanel } from './AnalyticsPanel';
import { JobDetailPanel } from './JobDetailPanel';
import { CrewDetailPanel } from './CrewDetailPanel';
import { CrewManagementDialog } from './CrewManagementDialog';
import { CreateJobDialog } from './CreateJobDialog';
import { AddJobButton } from './AddJobButton';
import { TopSummaryBar } from './TopSummaryBar';
import { getJobs, getCrews, getEmployees } from '@/lib/forecastingApi';
import { adaptJobs, adaptCrews, computeAnalytics, computeWarnings } from '@/components/forecasting/v2/lib/adapters';

export function CrewForecastCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('1-month');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedCrew, setSelectedCrew] = useState<Crew | null>(null);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [crewPanelOpen, setCrewPanelOpen] = useState(false);
  const [crewManagementOpen, setCrewManagementOpen] = useState(false);
  const [createJobOpen, setCreateJobOpen] = useState(false);
  const [dismissedWarnings, setDismissedWarnings] = useState<Set<string>>(new Set());

  const [jobs, setJobs] = useState<Job[]>([]);
  const [crews, setCrews] = useState<Crew[]>([]);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  const range = useMemo(() => {
    const d = new Date(currentDate);
    if (viewMode === 'week') {
      const start = new Date(d);
      start.setDate(d.getDate() - d.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { start, end };
    }
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return { start, end };
  }, [currentDate, viewMode]);

  useEffect(() => {
    (async () => {
      const [appJobs, appCrews, appEmployees] = await Promise.all([
        getJobs({ from: range.start.toISOString().slice(0, 10), to: range.end.toISOString().slice(0, 10) }),
        getCrews(),
        getEmployees(),
      ]);
      const v2Crews = adaptCrews(appCrews, appEmployees);
      const v2Jobs = adaptJobs(appJobs, v2Crews);
      setCrews(v2Crews);
      setJobs(v2Jobs);
      setAnalytics(computeAnalytics(v2Jobs, v2Crews));
      setWarnings(computeWarnings(v2Jobs, v2Crews));
    })();
  }, [range.start, range.end]);

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    setSelectedCrew(null);
  };

  const handleCrewClick = (crew: Crew) => {
    setSelectedCrew(crew);
    setSelectedJob(null);
  };

  const handleCreateJob = (_jobData: Omit<Job, 'id'>) => {
    // Creation disabled in v2 for now
  };

  const handleDismissWarning = (id: string) => {
    setDismissedWarnings((prev) => new Set([...prev, id]));
  };

  const handleClearAllWarnings = () => {
    setDismissedWarnings(new Set(warnings.map((w) => w.id)));
  };

  const activeWarnings = useMemo(() => warnings.filter((w) => !dismissedWarnings.has(w.id)), [warnings, dismissedWarnings]);

  const jobCrew = selectedJob ? crews.find((c) => c.id === selectedJob.crewId) : undefined;

  const refreshCrews = async () => {
    const [appCrews, appEmployees] = await Promise.all([getCrews(), getEmployees()]);
    const v2Crews = adaptCrews(appCrews, appEmployees);
    setCrews(v2Crews);
    setAnalytics(computeAnalytics(jobs, v2Crews));
    setWarnings(computeWarnings(jobs, v2Crews));
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Summary Bar */}
      {analytics && (
        <TopSummaryBar analytics={analytics} warnings={activeWarnings} crewCount={crews.length} />
      )}

      {/* View Controls */}
      <ViewControls
        currentDate={currentDate}
        viewMode={viewMode}
        onDateChange={setCurrentDate}
        onViewModeChange={setViewMode}
        onManageCrews={() => setCrewManagementOpen(true)}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Calendar Grid */}
        <CalendarGrid
          currentDate={currentDate}
          viewMode={viewMode}
          crews={crews}
          jobs={jobs}
          onJobClick={handleJobClick}
          onCrewClick={handleCrewClick}
          crewPanelOpen={crewPanelOpen}
          onToggleCrewPanel={() => setCrewPanelOpen(!crewPanelOpen)}
        />

        {/* Analytics Panel */}
        {analytics && (
          <AnalyticsPanel
            analytics={analytics}
            warnings={warnings}
            isOpen={analyticsOpen}
            onToggle={() => setAnalyticsOpen(!analyticsOpen)}
            dismissedWarnings={dismissedWarnings}
            onDismissWarning={handleDismissWarning}
            onClearAllWarnings={handleClearAllWarnings}
          />
        )}
      </div>

      {/* Floating Add Button */}
      <AddJobButton onClick={() => setCreateJobOpen(true)} />

      {/* Create Job Dialog */}
      {/* This needs to work with the "+" button on the botto right of this page */}
      <CreateJobDialog open={createJobOpen} onOpenChange={setCreateJobOpen} crews={crews} onCreateJob={handleCreateJob} />

      {/* Crew Detail Panel */}
      <CrewDetailPanel crew={selectedCrew} onClose={() => setSelectedCrew(null)} />


      {/* Crew Management Dialog */}
      {/* This needs to work with the "Manage Crews" button on this page */}
      <CrewManagementDialog
        open={crewManagementOpen}
        onOpenChange={setCrewManagementOpen}
        crews={crews}
        onCreated={async () => { await refreshCrews(); setCrewPanelOpen(true); }}
      />
    </div>
  );
}
