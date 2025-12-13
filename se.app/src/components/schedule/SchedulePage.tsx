'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns';
import { cn } from '@/lib/utils';
import {
  getJobs,
  createJob,
  updateJob,
  deleteJob,
  getClients,
  getCrews,
  createClient,
  updateClient,
  deleteClient,
  createCrew,
  updateCrew,
  deleteCrew,
} from '@/lib/scheduleApi';
import type { CalendarView, Client, Crew, Job, JobStatus } from '@/types/schedule/types';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Calendar as CalendarIcon, Settings2 } from 'lucide-react';
import { mapScheduleDataToDomain, mapScheduleCrewToDomain } from '@/lib/scheduling/adapters';
import { findScheduleConflicts, conflictJobIdSetFromBlocks } from '@/lib/scheduling/utils';
import { ScheduleFilterBar } from '@/components/schedule/ScheduleFilterBar';

// Layout constants
const WEEK_STARTS_ON = 1; // Monday
const WEEK_HOURS_START = 7;
const WEEK_HOURS_END = 19;
const TIME_STEP_MIN = 30;

type JobDraft = Omit<Job, 'id'> & { id?: number };

export default function SchedulePage() {
  const { toast } = useToast();

  // State
  const [view, setView] = useState<CalendarView>('month');
  const [focusDate, setFocusDate] = useState<Date>(new Date());
  const [clients, setClients] = useState<Client[]>([]);
  const [crews, setCrews] = useState<Crew[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | 'all'>('all');
  const [selectedCrewId, setSelectedCrewId] = useState<number | 'all'>('all');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState<boolean>(false);
  const [initialDate, setInitialDate] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'all' | JobStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  const [manageOrgOpen, setManageOrgOpen] = useState(false);

  // Load clients and crews once
  useEffect(() => {
    (async () => {
      try {
        const [c, r] = await Promise.all([getClients(), getCrews()]);
        setClients(c);
        setCrews(r);
      } catch (e: any) {
        toast({ title: 'Failed to load references', description: e?.message || 'Please try again', variant: 'destructive' });
      }
    })();
  }, [toast]);

  // Compute range by view
  const { rangeStart, rangeEnd } = useMemo(() => {
    if (view === 'week') {
      return {
        rangeStart: startOfWeek(focusDate, { weekStartsOn: WEEK_STARTS_ON }),
        rangeEnd: endOfWeek(focusDate, { weekStartsOn: WEEK_STARTS_ON }),
      };
    }
    // month
    const start = startOfWeek(startOfMonth(focusDate), { weekStartsOn: WEEK_STARTS_ON });
    const end = endOfWeek(endOfMonth(focusDate), { weekStartsOn: WEEK_STARTS_ON });
    return { rangeStart: start, rangeEnd: end };
  }, [focusDate, view]);

  // Load jobs when range or filters change
  useEffect(() => {
    (async () => {
      try {
        setJobsLoading(true);
        const data = await getJobs({
          start: format(rangeStart, 'yyyy-MM-dd'),
          end: format(rangeEnd, 'yyyy-MM-dd'),
          clientId: selectedClientId === 'all' ? undefined : selectedClientId,
          crewId: selectedCrewId === 'all' ? undefined : selectedCrewId,
        });
        setJobs(data);
        setJobsLoading(false);
      } catch (e: any) {
        toast({ title: 'Failed to load jobs', description: e?.message || 'Please try again', variant: 'destructive' });
        setJobsLoading(false);
      }
    })();
  }, [rangeStart, rangeEnd, selectedClientId, selectedCrewId, toast]);

  const filteredJobs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return jobs.filter((j) => {
      const statusOk = selectedStatus === 'all' || j.status === selectedStatus;
      if (!q) return statusOk;
      const hay = [j.title, j.address, j.client?.name].map((s) => (s || '').toLowerCase()).join(' ');
      return statusOk && hay.includes(q);
    });
  }, [jobs, selectedStatus, searchQuery]);

  // Adapt current schedule jobs to domain JobTimeBlocks and compute conflicts
  const domainCrews = useMemo(() => crews.map(mapScheduleCrewToDomain), [crews]);
  const { blocks } = useMemo(() => mapScheduleDataToDomain({ jobs: filteredJobs }), [filteredJobs]);
  const conflictJobIds = useMemo(() => {
    const conflicts = findScheduleConflicts(blocks, domainCrews);
    return conflictJobIdSetFromBlocks(conflicts, blocks);
  }, [blocks, domainCrews]);

  // Handlers
  const goPrev = () => {
    if (view === 'week') setFocusDate((d) => subWeeks(d, 1));
    else setFocusDate((d) => subMonths(d, 1));
  };
  const goNext = () => {
    if (view === 'week') setFocusDate((d) => addWeeks(d, 1));
    else setFocusDate((d) => addMonths(d, 1));
  };
  const goToday = () => setFocusDate(new Date());

  const openCreateJob = (date?: Date) => {
    const iso = format(date ?? new Date(), 'yyyy-MM-dd');
    setEditingJob(null);
    setInitialDate(iso);
    setJobDialogOpen(true);
  };

  const openEditJob = (job: Job) => {
    setEditingJob(job);
    setInitialDate(null);
    setJobDialogOpen(true);
  };

  const onSavedJob = async (draft: JobDraft) => {
    try {
      if (editingJob?.id) {
        const updated = await updateJob(editingJob.id, draft as Partial<Job>);
        setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
        toast({ title: 'Job updated' });
      } else {
        const created = await createJob(draft as Omit<Job, 'id'>);
        setJobs((prev) => [created, ...prev]);
        toast({ title: 'Job created' });
      }
      setJobDialogOpen(false);
      setEditingJob(null);
    } catch (e: any) {
      toast({ title: 'Save failed', description: e?.message || 'Please try again', variant: 'destructive' });
    }
  };

  const onDeleteJob = async () => {
    if (!editingJob) return;
    try {
      await deleteJob(editingJob.id);
      setJobs((prev) => prev.filter((j) => j.id !== editingJob.id));
      toast({ title: 'Job deleted' });
      setJobDialogOpen(false);
      setEditingJob(null);
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e?.message || 'Please try again', variant: 'destructive' });
    }
  };

  const onDeleteJobById = async (id: number) => {
    try {
      await deleteJob(id);
      setJobs((prev) => prev.filter((j) => j.id !== id));
      toast({ title: 'Job deleted' });
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e?.message || 'Please try again', variant: 'destructive' });
    }
  };

  // Render
  return (
    <div className="flex h-full flex-col gap-4">
      <HeaderBar
        view={view}
        onViewChange={setView}
        focusDate={focusDate}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToday}
        onAddJob={() => openCreateJob(focusDate)}
      />

      <div className="flex items-center gap-2 sm:gap-3">
        <ScheduleFilterBar
          clients={clients}
          crews={crews}
          selectedClientId={selectedClientId}
          setSelectedClientId={setSelectedClientId}
          selectedCrewId={selectedCrewId}
          setSelectedCrewId={setSelectedCrewId}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onManageClients={() => setManageOrgOpen(true)}
          onManageCrews={() => setManageOrgOpen(true)}
        />
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setFocusDate(new Date())}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            Jump to {format(focusDate, 'PPP')}
          </Button>
          <span className="text-sm text-muted-foreground hidden md:inline">{filteredJobs.length} jobs</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-2">
        <aside className="hidden">
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Filters</h3>
            <div className="space-y-3">
              <ClientSelect
                clients={clients}
                value={selectedClientId}
                onChange={setSelectedClientId}
                onManage={() => setManageOrgOpen(true)}
              />
              <CrewSelect
                crews={crews}
                value={selectedCrewId}
                onChange={setSelectedCrewId}
                onManage={() => setManageOrgOpen(true)}
              />
              <div>
                <Label className="mb-2 block">Jump to date</Label>
                <DatePicker value={focusDate} onChange={setFocusDate} />
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Summary</h3>
            <div className="text-sm text-muted-foreground">
              {jobs.length} jobs in view
            </div>
          </Card>
        </aside>

        <main className="col-span-12">
          <Card className="p-1.5 lg:p-3">
            {jobsLoading ? (
              <ScheduleSkeleton view={view} />
            ) : view === 'month' ? (
              <MonthView
                focusDate={focusDate}
                jobs={filteredJobs}
                crews={crews}
                conflictJobIds={conflictJobIds}
                onDayDoubleClick={(d) => openCreateJob(d)}
                onJobClick={openEditJob}
              />
            ) : (
              <WeekView
                focusDate={focusDate}
                jobs={filteredJobs}
                crews={crews}
                conflictJobIds={conflictJobIds}
                onBackgroundDoubleClick={(d) => openCreateJob(d)}
                onJobClick={openEditJob}
              />
            )}
          </Card>
        </main>
      </div>

      <ManageOrgDialog
        open={manageOrgOpen}
        onOpenChange={setManageOrgOpen}
        clients={clients}
        setClients={setClients}
        crews={crews}
        setCrews={setCrews}
        jobs={jobs}
        onNewJob={() => openCreateJob(focusDate)}
        onEditJob={(j) => openEditJob(j)}
        onDeleteJob={(id) => onDeleteJobById(id)}
      />

      <JobDialog
        open={jobDialogOpen}
        onOpenChange={(v) => {
          setJobDialogOpen(v);
          if (!v) {
            setEditingJob(null);
            setInitialDate(null);
          }
        }}
        job={editingJob}
        initialDate={initialDate}
        clients={clients}
        crews={crews}
        onSave={onSavedJob}
        onDelete={onDeleteJob}
      />
    </div>
  );
}

/* =========================
   Header
   ========================= */

function HeaderBar({
  view,
  onViewChange,
  focusDate,
  onPrev,
  onNext,
  onToday,
  onAddJob,
}: {
  view: CalendarView;
  onViewChange: (v: CalendarView) => void;
  focusDate: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onAddJob: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onPrev}>Prev</Button>
        <Button variant="outline" onClick={onToday}>Today</Button>
        <Button variant="outline" onClick={onNext}>Next</Button>
        <div className="ml-3 text-lg font-semibold">{format(focusDate, 'MMMM yyyy')}</div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant={view === 'month' ? 'default' : 'outline'}
          onClick={() => onViewChange('month')}
        >
          Month
        </Button>
        <Button
          variant={view === 'week' ? 'default' : 'outline'}
          onClick={() => onViewChange('week')}
        >
          Week
        </Button>
        <Button className="ml-2" onClick={onAddJob}>Add Job</Button>
      </div>
    </div>
  );
}

/* =========================
   Filters
   ========================= */

function ClientSelect({
  clients,
  value,
  onChange,
  onManage,
  showLabel = true,
}: {
  clients: Client[];
  value: number | 'all';
  onChange: (v: number | 'all') => void;
  onManage: () => void;
  showLabel?: boolean;
}) {
  return (
    <div className="space-y-2">
      {showLabel && <Label>Client</Label>}
      <div className="flex items-center gap-2">
        <Select
          value={String(value)}
          onValueChange={(v) => onChange(v === 'all' ? 'all' : Number(v))}
        >
          <SelectTrigger className={cn('w-full', !showLabel && 'h-9 min-w-[200px]')}>
            <SelectValue placeholder="All clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All clients</SelectItem>
            {clients.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size={showLabel ? 'default' : 'sm'} onClick={onManage}>
          <Settings2 className={cn('h-4 w-4', showLabel && 'mr-2')} />
          {showLabel ? 'Manage' : ''}
        </Button>
      </div>
    </div>
  );
}

function CrewSelect({
  crews,
  value,
  onChange,
  onManage,
  showLabel = true,
}: {
  crews: Crew[];
  value: number | 'all';
  onChange: (v: number | 'all') => void;
  onManage: () => void;
  showLabel?: boolean;
}) {
  return (
    <div className="space-y-2">
      {showLabel && <Label>Crew</Label>}
      <div className="flex items-center gap-2">
        <Select
          value={String(value)}
          onValueChange={(v) => onChange(v === 'all' ? 'all' : Number(v))}
        >
          <SelectTrigger className={cn('w-full', !showLabel && 'h-9 min-w-[200px]')}>
            <SelectValue placeholder="All crews" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All crews</SelectItem>
            {crews.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: c.colorHex || '#64748b' }}
                  />
                  {c.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size={showLabel ? 'default' : 'sm'} onClick={onManage}>
          <Settings2 className={cn('h-4 w-4', showLabel && 'mr-2')} />
          {showLabel ? 'Manage' : ''}
        </Button>
      </div>
    </div>
  );
}

/* =========================
   Combobox variants (compact + searchable)
   ========================= */

function ClientCombobox({
  clients,
  value,
  onChange,
  onManage,
}: {
  clients: Client[];
  value: number | 'all';
  onChange: (v: number | 'all') => void;
  onManage: () => void;
}) {
  const [open, setOpen] = useState(false);
  const current =
    value === 'all' ? null : clients.find((c) => c.id === value) || null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-9 min-w-[200px] justify-between">
          {current ? current.name : 'All clients'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0">
        <Command>
          <div className="flex items-center gap-2 p-2">
            <CommandInput placeholder="Search clients..." className="h-8" />
            <Button size="sm" variant="outline" onClick={onManage}>Manage</Button>
          </div>
          <CommandList>
            <CommandEmpty>No clients found.</CommandEmpty>
            <CommandGroup>
              <CommandItem value="all" onSelect={() => { onChange('all'); setOpen(false); }}>
                All clients
              </CommandItem>
              {clients.map((c) => (
                <CommandItem key={c.id} value={String(c.id)} onSelect={() => { onChange(c.id); setOpen(false); }}>
                  {c.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function CrewCombobox({
  crews,
  value,
  onChange,
  onManage,
}: {
  crews: Crew[];
  value: number | 'all';
  onChange: (v: number | 'all') => void;
  onManage: () => void;
}) {
  const [open, setOpen] = useState(false);
  const current =
    value === 'all' ? null : crews.find((c) => c.id === value) || null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-9 min-w-[200px] justify-between">
          <span className="flex items-center gap-2">
            {current && (
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: current.colorHex || '#64748b' }}
              />
            )}
            {current ? current.name : 'All crews'}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0">
        <Command>
          <div className="flex items-center gap-2 p-2">
            <CommandInput placeholder="Search crews..." className="h-8" />
            <Button size="sm" variant="outline" onClick={onManage}>Manage</Button>
          </div>
          <CommandList>
            <CommandEmpty>No crews found.</CommandEmpty>
            <CommandGroup>
              <CommandItem value="all" onSelect={() => { onChange('all'); setOpen(false); }}>
                All crews
              </CommandItem>
              {crews.map((c) => (
                <CommandItem key={c.id} value={String(c.id)} onSelect={() => { onChange(c.id); setOpen(false); }}>
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ backgroundColor: c.colorHex || '#64748b' }}
                    />
                    {c.name}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function DatePicker({
  value,
  onChange,
}: {
  value: Date;
  onChange: (d: Date) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          {format(value, 'PPP')}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(d) => {
            if (d) onChange(d);
            setOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

/* =========================
   Month View
   ========================= */

function ScheduleSkeleton({ view }: { view: CalendarView }) {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="h-6 bg-muted rounded" />
      <div className="h-24 bg-muted rounded" />
      <div className="h-24 bg-muted rounded" />
      <div className="h-24 bg-muted rounded" />
    </div>
  );
}

function MonthView({
  focusDate,
  jobs,
  crews,
  conflictJobIds,
  onDayDoubleClick,
  onJobClick,
}: {
  focusDate: Date;
  jobs: Job[];
  crews: Crew[];
  conflictJobIds: Set<number>;
  onDayDoubleClick: (d: Date) => void;
  onJobClick: (job: Job) => void;
}) {
  const gridStart = startOfWeek(startOfMonth(focusDate), { weekStartsOn: WEEK_STARTS_ON });
  const gridEnd = endOfWeek(endOfMonth(focusDate), { weekStartsOn: WEEK_STARTS_ON });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const jobsByDate = useMemo(() => {
    const map: Record<string, Job[]> = {};
    for (const j of jobs) {
      const key = j.date;
      map[key] = map[key] || [];
      map[key].push(j);
    }
    // sort by start time
    Object.values(map).forEach((arr) =>
      arr.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
    );
    return map;
  }, [jobs]);

  const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 text-sm font-medium text-muted-foreground px-2 pb-2">
        {weekdayLabels.map((d) => (
          <div key={d} className="px-2 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 border-t">
        {days.map((d, idx) => {
          const dayJobs = jobsByDate[format(d, 'yyyy-MM-dd')] || [];
          const isCurrentMonth = isSameMonth(d, focusDate);
          const isToday = isSameDay(d, new Date());

          return (
            <div
              key={d.toISOString() + idx}
              onDoubleClick={() => onDayDoubleClick(d)}
              className={cn(
                'min-h-[100px] border-b border-r p-2 hover:bg-accent/40 transition-colors',
                (idx + 1) % 7 === 0 && 'border-r-0',
                !isCurrentMonth && 'bg-muted/30'
              )}
            >
              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    'h-7 w-7 text-sm flex items-center justify-center rounded-full',
                    isToday ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground'
                  )}
                >
                  {format(d, 'd')}
                </div>
              </div>

              <div className="mt-2 flex flex-col gap-1">
                {dayJobs.slice(0, 3).map((j) => (
                  <button
                    key={j.id}
                    onClick={() => onJobClick(j)}
                    className={cn("w-full truncate rounded-md px-1.5 py-0.5 text-left text-[11px] hover:opacity-90", conflictJobIds.has(j.id) && "ring-2 ring-destructive")}
                    style={{ backgroundColor: getCrewColor(j.crewId, crews, true) }}
                    title={`${j.title} • ${fmtTimeRange(j.startTime, j.endTime)} • ${crewName(j.crewId, crews)}`}
                  >
                    <span className="font-medium truncate">
                      {(j.client?.name || `Client #${j.clientId}`)} — {j.title} — {crewName(j.crewId, crews)}
                    </span>
                    <span className="ml-2 opacity-80">{fmtTimeRange(j.startTime, j.endTime)}</span>
                  </button>
                ))}
                {dayJobs.length > 3 && (
                  <div className="text-xs text-muted-foreground">+ {dayJobs.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =========================
   Week View
   ========================= */

function WeekView({
  focusDate,
  jobs,
  crews,
  conflictJobIds,
  onBackgroundDoubleClick,
  onJobClick,
}: {
  focusDate: Date;
  jobs: Job[];
  crews: Crew[];
  conflictJobIds: Set<number>;
  onBackgroundDoubleClick: (d: Date) => void;
  onJobClick: (job: Job) => void;
}) {
  const weekStart = startOfWeek(focusDate, { weekStartsOn: WEEK_STARTS_ON });
  const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  const hours = Array.from({ length: (WEEK_HOURS_END - WEEK_HOURS_START) * (60 / TIME_STEP_MIN) + 1 }).map(
    (_, i) => WEEK_HOURS_START * 60 + i * TIME_STEP_MIN
  );

  const jobsByDay = useMemo(() => {
    const map: Record<string, Job[]> = {};
    for (const j of jobs) {
      map[j.date] = map[j.date] || [];
      map[j.date].push(j);
    }
    return map;
  }, [jobs]);

  const handleBgDblClick = (day: Date, minuteOffset: number) => {
    const h = Math.floor(minuteOffset / 60);
    const m = minuteOffset % 60;
    const date = new Date(day);
    date.setHours(h, m, 0, 0);
    onBackgroundDoubleClick(date);
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-[64px_repeat(7,1fr)] items-center text-sm font-medium text-muted-foreground px-2 pb-2">
        <div />
        {days.map((d) => (
          <div key={d.toISOString()} className="px-2">
            {format(d, 'EEE dd')}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[64px_repeat(7,1fr)] border-t">
        {/* Time labels column */}
        <div className="border-r">
          {hours.map((m, idx) => (
            <div key={m} className={cn('h-10 text-xs text-muted-foreground pr-2 flex justify-end items-start', idx === 0 && 'pt-3')}>
              {minuteLabel(m)}
            </div>
          ))}
        </div>

        {/* 7 day columns */}
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayJobs = (jobsByDay[key] || []).filter((j) => !!j.startTime && !!j.endTime);

          return (
            <div key={key} className="relative border-r last:border-r-0">
              {/* Background grid */}
              <div
                className="absolute inset-0"
                onDoubleClick={(e) => {
                  const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                  const y = e.clientY - rect.top;
                  const totalHeight = rect.height;
                  const totalMinutes = (WEEK_HOURS_END - WEEK_HOURS_START) * 60;
                  const minuteOffset = Math.round((y / totalHeight) * totalMinutes);
                  handleBgDblClick(day, WEEK_HOURS_START * 60 + minuteOffset);
                }}
              />
              <div className="flex flex-col">
                {hours.map((m) => (
                  <div key={m} className="h-10 border-b border-muted/50" />
                ))}
              </div>

              {/* Events */}
              {dayJobs.map((j) => {
                const [sH, sM] = (j.startTime || '00:00').split(':').map(Number);
                const [eH, eM] = (j.endTime || '00:00').split(':').map(Number);
                const startMin = sH * 60 + sM;
                const endMin = eH * 60 + eM;
                const totalMinutes = (WEEK_HOURS_END - WEEK_HOURS_START) * 60;
                const topPct = ((startMin - WEEK_HOURS_START * 60) / totalMinutes) * 100;
                const heightPct = ((endMin - startMin) / totalMinutes) * 100;

                return (
                  <div
                    key={j.id}
                    onClick={() => onJobClick(j)}
                    className={cn("absolute left-1 right-1 rounded-md p-2 text-xs shadow-sm cursor-pointer hover:opacity-90", conflictJobIds.has(j.id) && "ring-2 ring-destructive")}
                    style={{
                      top: `${topPct}%`,
                      height: `${heightPct}%`,
                      backgroundColor: getCrewColor(j.crewId, crews, true),
                    }}
                    title={`${j.title} • ${fmtTimeRange(j.startTime, j.endTime)} • ${crewName(j.crewId, crews)}`}
                  >
                    <div className="font-medium truncate">
                      {(j.client?.name || `Client #${j.clientId}`)} — {j.title} — {crewName(j.crewId, crews)}
                    </div>
                    <div className="opacity-80 truncate">{fmtTimeRange(j.startTime, j.endTime)}</div>
                    {j.clientId && (
                      <div className="mt-1">
                        <Badge variant="secondary" className="px-1 py-0 text-[10px]">
                          {j.client?.name || `Client #${j.clientId}`}
                        </Badge>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =========================
   Manage Clients / Crews
   ========================= */

function ManageClientsDialog({
  open,
  onOpenChange,
  clients,
  setClients,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
}) {
  const { toast } = useToast();
  const [editing, setEditing] = useState<Client | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!open) {
      setEditing(null);
      setName('');
      setEmail('');
    }
  }, [open]);

  const submit = async () => {
    try {
      if (editing) {
        const updated = await updateClient(editing.id, { name, email });
        setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        toast({ title: 'Client updated' });
      } else {
        const created = await createClient({ name, email });
        setClients((prev) => [created, ...prev]);
        toast({ title: 'Client created' });
      }
      setEditing(null);
      setName('');
      setEmail('');
    } catch (e: any) {
      toast({ title: 'Save failed', description: e?.message || 'Please try again', variant: 'destructive' });
    }
  };

  const onEdit = (c: Client) => {
    setEditing(c);
    setName(c.name);
    setEmail(c.email || '');
  };

  const onDeleteClient = async (c: Client) => {
    try {
      await deleteClient(c.id);
      setClients((prev) => prev.filter((x) => x.id !== c.id));
      toast({ title: 'Client deleted' });
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e?.message || 'Please try again', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Manage Clients</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-3">
            <h4 className="font-medium mb-2">{editing ? 'Edit client' : 'Add client'}</h4>
            <div className="space-y-3">
              <div>
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Client name" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="client@acme.com" />
              </div>
              <div className="flex justify-end">
                <Button onClick={submit} disabled={!name.trim()}>{editing ? 'Save' : 'Create'}</Button>
              </div>
            </div>
          </Card>

          <Card className="p-3">
            <h4 className="font-medium mb-2">Existing</h4>
            <ScrollArea className="h-72">
              <div className="space-y-2">
                {clients.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-md border p-2">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{c.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{c.email}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => onEdit(c)}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => onDeleteClient(c)}>Delete</Button>
                    </div>
                  </div>
                ))}
                {!clients.length && <div className="text-sm text-muted-foreground">No clients yet</div>}
              </div>
            </ScrollArea>
          </Card>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ManageCrewsDialog({
  open,
  onOpenChange,
  crews,
  setCrews,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  crews: Crew[];
  setCrews: React.Dispatch<React.SetStateAction<Crew[]>>;
}) {
  const { toast } = useToast();
  const [editing, setEditing] = useState<Crew | null>(null);
  const [name, setName] = useState('');
  const [colorHex, setColorHex] = useState('#0ea5e9');

  useEffect(() => {
    if (!open) {
      setEditing(null);
      setName('');
      setColorHex('#0ea5e9');
    }
  }, [open]);

  const submit = async () => {
    try {
      if (editing) {
        const updated = await updateCrew(editing.id, { name, colorHex });
        setCrews((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        toast({ title: 'Crew updated' });
      } else {
        const created = await createCrew({ name, colorHex });
        setCrews((prev) => [created, ...prev]);
        toast({ title: 'Crew created' });
      }
      setEditing(null);
      setName('');
      setColorHex('#0ea5e9');
    } catch (e: any) {
      toast({ title: 'Save failed', description: e?.message || 'Please try again', variant: 'destructive' });
    }
  };

  const onEdit = (c: Crew) => {
    setEditing(c);
    setName(c.name);
    setColorHex(c.colorHex || '#0ea5e9');
  };

  const onDeleteCrewClick = async (c: Crew) => {
    try {
      await deleteCrew(c.id);
      setCrews((prev) => prev.filter((x) => x.id !== c.id));
      toast({ title: 'Crew deleted' });
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e?.message || 'Please try again', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Manage Crews</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-3">
            <h4 className="font-medium mb-2">{editing ? 'Edit crew' : 'Add crew'}</h4>
            <div className="space-y-3">
              <div>
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Crew name" />
              </div>
              <div>
                <Label>Color</Label>
                <div className="flex items-center gap-2">
                  <Input type="color" className="h-10 w-16 p-1" value={colorHex} onChange={(e) => setColorHex(e.target.value)} />
                  <Input value={colorHex} onChange={(e) => setColorHex(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={submit} disabled={!name.trim()}>{editing ? 'Save' : 'Create'}</Button>
              </div>
            </div>
          </Card>

          <Card className="p-3">
            <h4 className="font-medium mb-2">Existing</h4>
            <ScrollArea className="h-72">
              <div className="space-y-2">
                {crews.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-md border p-2">
                    <div className="min-w-0 flex items-center gap-2">
                      <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: c.colorHex || '#64748b' }} />
                      <div>
                        <div className="truncate font-medium">{c.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{c.colorHex}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => onEdit(c)}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => onDeleteCrewClick(c)}>Delete</Button>
                    </div>
                  </div>
                ))}
                {!crews.length && <div className="text-sm text-muted-foreground">No crews yet</div>}
              </div>
            </ScrollArea>
          </Card>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* =========================
   Unified management dialog (Clients & Crews)
   ========================= */

function ManageOrgDialog({
  open,
  onOpenChange,
  clients,
  setClients,
  crews,
  setCrews,
  jobs,
  onNewJob,
  onEditJob,
  onDeleteJob,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  crews: Crew[];
  setCrews: React.Dispatch<React.SetStateAction<Crew[]>>;
  jobs: Job[];
  onNewJob: () => void;
  onEditJob: (job: Job) => void;
  onDeleteJob: (id: number) => void;
}) {
  const { toast } = useToast();

  // Clients tab local state
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');

  // Crews tab local state
  const [editingCrew, setEditingCrew] = useState<Crew | null>(null);
  const [crewName, setCrewName] = useState('');
  const [crewColorHex, setCrewColorHex] = useState('#0ea5e9');

  useEffect(() => {
    if (!open) {
      setEditingClient(null);
      setClientName('');
      setClientEmail('');
      setEditingCrew(null);
      setCrewName('');
      setCrewColorHex('#0ea5e9');
    }
  }, [open]);

  const submitClient = async () => {
    try {
      if (editingClient) {
        const updated = await updateClient(editingClient.id, { name: clientName, email: clientEmail });
        setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        toast({ title: 'Client updated' });
      } else {
        const created = await createClient({ name: clientName, email: clientEmail });
        setClients((prev) => [created, ...prev]);
        toast({ title: 'Client created' });
      }
      setEditingClient(null);
      setClientName('');
      setClientEmail('');
    } catch (e: any) {
      toast({ title: 'Save failed', description: e?.message || 'Please try again', variant: 'destructive' });
    }
  };

  const deleteClientHandler = async (c: Client) => {
    try {
      await deleteClient(c.id);
      setClients((prev) => prev.filter((x) => x.id !== c.id));
      toast({ title: 'Client deleted' });
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e?.message || 'Please try again', variant: 'destructive' });
    }
  };

  const submitCrew = async () => {
    try {
      if (editingCrew) {
        const updated = await updateCrew(editingCrew.id, { name: crewName, colorHex: crewColorHex });
        setCrews((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        toast({ title: 'Crew updated' });
      } else {
        const created = await createCrew({ name: crewName, colorHex: crewColorHex });
        setCrews((prev) => [created, ...prev]);
        toast({ title: 'Crew created' });
      }
      setEditingCrew(null);
      setCrewName('');
      setCrewColorHex('#0ea5e9');
    } catch (e: any) {
      toast({ title: 'Save failed', description: e?.message || 'Please try again', variant: 'destructive' });
    }
  };

  const deleteCrewHandler = async (c: Crew) => {
    try {
      await deleteCrew(c.id);
      setCrews((prev) => prev.filter((x) => x.id !== c.id));
      toast({ title: 'Crew deleted' });
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e?.message || 'Please try again', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Manage Clients & Crews</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="clients" className="w-full">
          <TabsList>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="crews">Crews</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-3">
                <h4 className="font-medium mb-2">{editingClient ? 'Edit client' : 'Add client'}</h4>
                <div className="space-y-3">
                  <div>
                    <Label>Name</Label>
                    <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Client name" />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="client@acme.com" />
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={submitClient} disabled={!clientName.trim()}>{editingClient ? 'Save' : 'Create'}</Button>
                  </div>
                </div>
              </Card>

              <Card className="p-3">
                <h4 className="font-medium mb-2">Existing</h4>
                <ScrollArea className="h-72">
                  <div className="space-y-2">
                    {clients.map((c) => (
                      <div key={c.id} className="flex items-center justify-between rounded-md border p-2">
                        <div className="min-w-0">
                          <div className="truncate font-medium">{c.name}</div>
                          <div className="truncate text-xs text-muted-foreground">{c.email}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setEditingClient(c); setClientName(c.name); setClientEmail(c.email || ''); }}>Edit</Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteClientHandler(c)}>Delete</Button>
                        </div>
                      </div>
                    ))}
                    {!clients.length && <div className="text-sm text-muted-foreground">No clients yet</div>}
                  </div>
                </ScrollArea>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="jobs" className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Jobs</h4>
              <Button size="sm" onClick={onNewJob}>Add Job</Button>
            </div>
            <Card className="p-2">
              <ScrollArea className="h-80">
                <div className="space-y-2">
                  {jobs.map((j) => (
                    <div key={j.id} className="flex items-center justify-between rounded-md border p-2">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{j.title}</div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="secondary" className="px-1 py-0 text-[10px]">
                            {j.date} {fmtTimeRange(j.startTime, j.endTime)}
                          </Badge>
                          {j.client && (
                            <Badge variant="secondary" className="px-1 py-0 text-[10px]">{j.client.name}</Badge>
                          )}
                          {j.crew && (
                            <Badge
                              className="px-1 py-0 text-[10px] border-0"
                              style={{ backgroundColor: j.crew.colorHex || '#64748b' }}
                            >
                              {j.crew.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => onEditJob(j)}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => onDeleteJob(j.id)}>Delete</Button>
                      </div>
                    </div>
                  ))}
                  {!jobs.length && <div className="text-sm text-muted-foreground">No jobs in this date range</div>}
                </div>
              </ScrollArea>
            </Card>
          </TabsContent>

          <TabsContent value="crews" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-3">
                <h4 className="font-medium mb-2">{editingCrew ? 'Edit crew' : 'Add crew'}</h4>
                <div className="space-y-3">
                  <div>
                    <Label>Name</Label>
                    <Input value={crewName} onChange={(e) => setCrewName(e.target.value)} placeholder="Crew name" />
                  </div>
                  <div>
                    <Label>Color</Label>
                    <div className="flex items-center gap-2">
                      <Input type="color" className="h-10 w-16 p-1" value={crewColorHex} onChange={(e) => setCrewColorHex(e.target.value)} />
                      <Input value={crewColorHex} onChange={(e) => setCrewColorHex(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={submitCrew} disabled={!crewName.trim()}>{editingCrew ? 'Save' : 'Create'}</Button>
                  </div>
                </div>
              </Card>

              <Card className="p-3">
                <h4 className="font-medium mb-2">Existing</h4>
                <ScrollArea className="h-72">
                  <div className="space-y-2">
                    {crews.map((c) => (
                      <div key={c.id} className="flex items-center justify-between rounded-md border p-2">
                        <div className="min-w-0 flex items-center gap-2">
                          <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: c.colorHex || '#64748b' }} />
                          <div>
                            <div className="truncate font-medium">{c.name}</div>
                            <div className="truncate text-xs text-muted-foreground">{c.colorHex}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setEditingCrew(c); setCrewName(c.name); setCrewColorHex(c.colorHex || '#0ea5e9'); }}>Edit</Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteCrewHandler(c)}>Delete</Button>
                        </div>
                      </div>
                    ))}
                    {!crews.length && <div className="text-sm text-muted-foreground">No crews yet</div>}
                  </div>
                </ScrollArea>
              </Card>
            </div>
          </TabsContent>

        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

/* =========================
   Job Dialog (Create/Update) with Notes area
   ========================= */

function JobDialog({
  open,
  onOpenChange,
  job,
  initialDate,
  clients,
  crews,
  onSave,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  job: Job | null;
  initialDate?: string | null;
  clients: Client[];
  crews: Crew[];
  onSave: (draft: JobDraft) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [form, setForm] = useState<JobDraft>({
    title: '',
    clientId: clients[0]?.id ?? 0,
    crewId: crews[0]?.id,
    date: initialDate || format(new Date(), 'yyyy-MM-dd'),
    startTime: '08:00',
    endTime: '12:00',
    description: '',
    address: '',
    notes: '',
    status: 'SCHEDULED',
  });

  useEffect(() => {
    if (open) {
      if (job) {
        setForm({ ...job });
      }
    } else {
      // reset
      setForm({
        title: '',
        clientId: clients[0]?.id ?? 0,
        crewId: crews[0]?.id,
        date: initialDate || format(new Date(), 'yyyy-MM-dd'),
        startTime: '08:00',
        endTime: '12:00',
        description: '',
        address: '',
        notes: '',
        status: 'SCHEDULED',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, job]);

  const notesCount = form.notes?.length || 0;
  const maxNotes = 1000;

  const updateField = <K extends keyof JobDraft>(key: K, value: JobDraft[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async () => {
    if (!form.title?.trim()) return;
    if (!form.clientId) return;
    await onSave({
      title: form.title.trim(),
      clientId: form.clientId,
      crewId: form.crewId,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      description: form.description?.trim(),
      address: form.address?.trim(),
      notes: form.notes,
      status: form.status,
    });
  };

  const timeInvalid = Boolean(form.startTime && form.endTime && form.startTime > form.endTime);
  const canSave = Boolean(form.title?.trim() && form.clientId && !timeInvalid);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{job ? 'Edit Job' : 'Add Job'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="Job title"
            />
          </div>

          <div>
            <Label>Client</Label>
            <Select
              value={String(form.clientId ?? '')}
              onValueChange={(v) => updateField('clientId', Number(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Crew</Label>
            <Select
              value={form.crewId ? String(form.crewId) : 'none'}
              onValueChange={(v) => updateField('crewId', v === 'none' ? undefined : Number(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Assign crew" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {crews.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Date</Label>
            <DateInput value={form.date} onChange={(v) => updateField('date', v)} />
          </div>

          <div>
            <Label>Start time</Label>
            <Input
              type="time"
              value={form.startTime || ''}
              onChange={(e) => updateField('startTime', e.target.value)}
            />
          </div>

          <div>
            <Label>End time</Label>
            <Input
              type="time"
              value={form.endTime || ''}
              onChange={(e) => updateField('endTime', e.target.value)}
            />
            {timeInvalid && (
              <div className="mt-1 text-xs text-destructive">End time must be after start time</div>
            )}
          </div>

          <div className="sm:col-span-2">
            <Label>Address</Label>
            <Input
              value={form.address || ''}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="Street, City, ZIP"
            />
          </div>

          <div className="sm:col-span-2">
            <Label>Description</Label>
            <Textarea
              value={form.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Short description"
            />
          </div>

          <div className="sm:col-span-2">
            <div className="flex items-center justify-between">
              <Label>Notes</Label>
              <span className="text-xs text-muted-foreground">{notesCount}/{maxNotes}</span>
            </div>
            <Textarea
              value={form.notes || ''}
              onChange={(e) => updateField('notes', e.target.value.slice(0, maxNotes))}
              placeholder="Internal notes"
              maxLength={maxNotes}
              rows={4}
            />
          </div>

          <div>
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => updateField('status', v as JobDraft['status'])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="mt-4">
          {job?.id ? (
            <Button variant="destructive" onClick={onDelete}>Delete</Button>
          ) : (
            <div />
          )}
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={onSubmit} disabled={!canSave}>Save</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

}

/* =========================
   Small inputs
   ========================= */

function DateInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const d = new Date(value);
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          {isNaN(d.getTime()) ? 'Pick a date' : format(d, 'PPP')}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0">
        <Calendar
          mode="single"
          selected={isNaN(d.getTime()) ? new Date() : d}
          onSelect={(date) => {
            if (date) onChange(format(date, 'yyyy-MM-dd'));
            setOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

/* =========================
   Helpers
   ========================= */

function fmtTimeRange(start?: string, end?: string) {
  if (!start && !end) return '';
  if (start && end) return `${start}–${end}`;
  return start || end || '';
}

function minuteLabel(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function getCrewColor(crewId: number | undefined, crews: Crew[], withAlpha = false) {
  const c = crews.find((x) => x.id === crewId);
  const color = c?.colorHex || '#64748b';
  if (!withAlpha) return color;
  // simple alpha overlay by blending with opacity using backgroundColor; we return solid for simplicity
  return color;
}

function crewName(crewId: number | undefined, crews: Crew[]) {
  const c = crews.find((x) => x.id === crewId);
  return c?.name || 'Unassigned';
}
