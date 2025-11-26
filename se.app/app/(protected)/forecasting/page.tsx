'use client';

import { useState, useEffect } from "react";
import { Client, Crew, Job, DateRangeOption } from "@/types/forecasting/types";
import {
  getJobs,
  createJob,
  updateJob,
  getClients,
  createClient,
  getCrews,
} from "@/lib/forecastingApi";
import { addDays, startOfWeek, endOfWeek, addWeeks, startOfMonth, endOfMonth, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DateRangeSelector } from "@/components/forecasting/DateRangeSelector";
import { CrewFilter } from "@/components/forecasting/CrewFilter";
import { JobList } from "@/components/forecasting/JobList";
import { Timeline } from "@/components/forecasting/Timeline";
import { JobModal } from "@/components/forecasting/JobModal";
import { RightPanel } from "@/components/forecasting/RightPanel";
import { CapacityStrip } from "@/components/forecasting/CapacityStrip";
import { useToast } from "@/hooks/use-toast";

const Forecast = () => {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [crews, setCrews] = useState<Crew[]>([]);
  const [loading, setLoading] = useState(true);

  const [dateRange, setDateRange] = useState<DateRangeOption>("2weeks");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [selectedCrewId, setSelectedCrewId] = useState<number | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [detailJob, setDetailJob] = useState<Job | null>(null);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);

  // Calculate date range based on option
  useEffect(() => {
    const today = new Date();
    let start: Date = startOfWeek(today, { weekStartsOn: 1 });
    let end: Date = endOfWeek(today, { weekStartsOn: 1 });

    switch (dateRange) {
      case "week":
        start = startOfWeek(today, { weekStartsOn: 1 });
        end = endOfWeek(today, { weekStartsOn: 1 });
        break;
      case "2weeks":
        start = startOfWeek(today, { weekStartsOn: 1 });
        end = endOfWeek(addWeeks(today, 1), { weekStartsOn: 1 });
        break;
      case "month":
        start = startOfMonth(today);
        end = endOfMonth(today);
        break;
    }

    setStartDate(start);
    setEndDate(end);
  }, [dateRange]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [jobsData, clientsData, crewsData] = await Promise.all([
          getJobs({
            from: format(startDate, "yyyy-MM-dd"),
            to: format(endDate, "yyyy-MM-dd"),
            crewId: selectedCrewId || undefined,
          }),
          getClients(),
          getCrews(),
        ]);
        setJobs(jobsData);
        setClients(clientsData);
        setCrews(crewsData);
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [startDate, endDate, selectedCrewId, toast]);

  const handleAddJob = () => {
    setEditingJob(null);
    setModalOpen(true);
  };

  const handleEditJob = (job: Job) => {
    setEditingJob(job);
    setDetailJob(null);
    setModalOpen(true);
  };

  const handleSaveJob = async (jobData: Omit<Job, "id"> | Job) => {
    try {
      if ("id" in jobData) {
        // Update existing job
        await updateJob(jobData.id, jobData);
        toast({
          title: "Success",
          description: "Job updated successfully",
        });
      } else {
        // Create new job
        await createJob(jobData);
        toast({
          title: "Success",
          description: "Job created successfully",
        });
      }

      // Reload jobs
      const jobsData = await getJobs({
        from: format(startDate, "yyyy-MM-dd"),
        to: format(endDate, "yyyy-MM-dd"),
        crewId: selectedCrewId || undefined,
      });
      setJobs(jobsData);
    } catch (error) {
      console.error("Error saving job:", error);
      toast({
        title: "Error",
        description: "Failed to save job",
        variant: "destructive",
      });
    }
  };

  const handleJobUpdate = async (jobId: number, updates: Partial<Job>) => {
    try {
      await updateJob(jobId, updates);
      
      // Reload jobs
      const jobsData = await getJobs({
        from: format(startDate, "yyyy-MM-dd"),
        to: format(endDate, "yyyy-MM-dd"),
        crewId: selectedCrewId || undefined,
      });
      setJobs(jobsData);

      toast({
        title: "Success",
        description: "Job moved successfully",
      });
    } catch (error) {
      console.error("Error updating job:", error);
      toast({
        title: "Error",
        description: "Failed to update job",
        variant: "destructive",
      });
    }
  };

  const handleCreateClient = async (clientData: Omit<Client, "id">) => {
    try {
      const newClient = await createClient(clientData);
      setClients([...clients, newClient]);
      toast({
        title: "Success",
        description: "Client created successfully",
      });
    } catch (error) {
      console.error("Error creating client:", error);
      toast({
        title: "Error",
        description: "Failed to create client",
        variant: "destructive",
      });
    }
  };

  const handleJobClick = (jobOrId: Job | number) => {
    const job = typeof jobOrId === "number" 
      ? jobs.find(j => j.id === jobOrId) || null
      : jobOrId;
    
    setDetailJob(job);
    setSelectedJobId(job?.id || null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Bar */}
      <header className="border-b bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold">Job Forecasting Board</h1>
          <div className="flex items-center gap-4">
            <DateRangeSelector
              selectedRange={dateRange}
              onRangeChange={setDateRange}
              startDate={startDate}
              endDate={endDate}
            />
            <CrewFilter
              crews={crews}
              selectedCrewId={selectedCrewId}
              onCrewChange={setSelectedCrewId}
            />
            <Button onClick={handleAddJob}>
              <Plus className="h-4 w-4 mr-2" />
              Add Job
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden flex-col">
        {/* Calendar Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Timeline */}
          <main className="flex-1 overflow-hidden">
            <Timeline
              jobs={jobs}
              crews={crews}
              startDate={startDate}
              endDate={endDate}
              onJobClick={handleJobClick}
              onJobUpdate={handleJobUpdate}
            />
          </main>

          {/* Right Panel - Collapsible */}
          <RightPanel
            isOpen={rightPanelOpen}
            onToggle={() => setRightPanelOpen(!rightPanelOpen)}
            selectedJob={detailJob}
            jobs={jobs}
            onJobClick={handleJobClick}
            onEditJob={handleEditJob}
            onClose={() => {
              setDetailJob(null);
              setSelectedJobId(null);
            }}
          />
        </div>

        {/* Bottom Capacity Strip */}
        <CapacityStrip 
          jobs={jobs}
          crews={crews}
          startDate={startDate}
          endDate={endDate}
        />
      </div>

      {/* Job Modal */}
      <JobModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveJob}
        job={editingJob}
        clients={clients}
        crews={crews}
        onCreateClient={handleCreateClient}
      />
    </div>
  );
};

export default Forecast;
