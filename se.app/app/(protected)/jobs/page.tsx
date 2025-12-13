'use client';

import { useEffect, useState } from "react";
import { Plus, Search, Filter, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { getStatusBadgeColor } from "@/lib/ui-mappers";
import { fetchJobs, fetchUsers } from "@/services/app-data";
import type { Job, User } from "@/types/app/types";
import { InfoTooltip } from "@/components/InfoTooltip";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import type { Permission } from "@/types/app/types";

export default function Jobs() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const statusLabels: Record<string, string> = {
    all: "All statuses",
    DRAFT: "Draft",
    SCHEDULED: "Scheduled",
    IN_PROGRESS: "In progress",
    ON_HOLD: "On hold",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };

  // Load jobs and users
  useEffect(() => {
    let mounted = true;
    Promise.all([fetchJobs(), fetchUsers()])
      .then(([j, u]) => {
        if (!mounted) return;
        setJobs(Array.isArray(j) ? j : []);
        setUsers(Array.isArray(u) ? u : []);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const filteredJobs = statusFilter === "all" 
    ? jobs 
    : jobs.filter(j => j.status === statusFilter);

  return (
    <ProtectedRoute requiredPermissions={["VIEW_JOBS"] as Permission[]}>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Jobs
            <InfoTooltip content="View and manage all your painting projects" className="ml-2" />
          </h1>
          <p className="text-muted-foreground">Manage your active and upcoming projects</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          New Job
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 md:gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search jobs..." className="pl-10" />
        </div>
        <div className="relative min-w-[220px]">
          <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="pl-9 pr-8 w-full h-9 items-center">
              <span>{statusLabels[statusFilter] ?? statusFilter}</span>
            </SelectTrigger>
            <SelectContent>
              <div className="px-2 py-1 text-xs text-muted-foreground">Quick filter</div>
              <SelectItem value="all" className="px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm">All statuses</SelectItem>
              <div role="separator" className="my-1 h-px bg-border" />
              <div className="px-2 py-1 text-xs text-muted-foreground">Statuses</div>
              <SelectItem value="DRAFT" className="px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm">Draft</SelectItem>
              <SelectItem value="SCHEDULED" className="px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm">Scheduled</SelectItem>
              <SelectItem value="IN_PROGRESS" className="px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm">In progress</SelectItem>
              <SelectItem value="ON_HOLD" className="px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm">On hold</SelectItem>
              <SelectItem value="COMPLETED" className="px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm">Completed</SelectItem>
              <SelectItem value="CANCELLED" className="px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Crew</TableHead>
              <TableHead>Tools</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredJobs.map((job) => {
              const crewMembers = users.filter(u => job.assignedCrewIds.includes(u.id));
              return (
                <TableRow 
                  key={job.id} 
                  className="cursor-pointer hover:bg-accent/50"
                  onClick={() => router.push(`/jobs/${job.id}`)}
                >
                  <TableCell className="font-medium">{job.name}</TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeColor(job.status)}>
                      {job.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(job.startDate).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(job.endDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm truncate max-w-[200px]">{job.address}</span>
                    </div>
                  </TableCell>
                  <TableCell>{crewMembers.length} members</TableCell>
                  <TableCell>{job.toolIds.length} tools</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      </div>
    </ProtectedRoute>
  );
}
