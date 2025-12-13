'use client';

import { useEffect, useState } from "react";
import { Briefcase, Wrench, Users, TrendingUp, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InfoTooltip } from "@/components/InfoTooltip";
import { Badge } from "@/components/ui/badge";
import { getStatusBadgeColor } from "@/lib/ui-mappers";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import type { Permission, Job, Tool, User } from "@/types/app/types";
import { fetchJobs, fetchTools, fetchUsers } from "@/services/app-data";

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    let mounted = true;
    Promise.all([fetchJobs(), fetchTools(), fetchUsers()]).then(([j, t, u]) => {
      if (!mounted) return;
      setJobs(Array.isArray(j) ? j : []);
      setTools(Array.isArray(t) ? t : []);
      setUsers(Array.isArray(u) ? u : []);
    });
    return () => { mounted = false; };
  }, []);

  const activeJobs = jobs.filter(j => j.status === "IN_PROGRESS").length;
  const scheduledJobs = jobs.filter(j => j.status === "SCHEDULED").length;
  const availableTools = tools.filter(t => t.isAvailable).length;
  const totalTools = tools.length;

  const onboardingSteps = [
    { id: 1, title: "Complete Company Profile", done: false, path: "/company-profile" },
    { id: 2, title: "Add a Tool Category", done: false, path: "/categories" },
    { id: 3, title: "Add Your First Tool", done: totalTools > 0, path: "/tools" },
    { id: 4, title: "Invite a Team Member", done: users.length > 1, path: "/team" },
  ];

  const completedSteps = onboardingSteps.filter(s => s.done).length;
  const progressPercent = (completedSteps / onboardingSteps.length) * 100;

  return (
    <ProtectedRoute requiredPermissions={["VIEW_DASHBOARDS"] as Permission[]}>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ''}! Here's what's happening today.
          </p>
        </div>
      </div>

      {completedSteps < onboardingSteps.length && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Getting Started
              <InfoTooltip content="Complete these steps to set up your company" className="ml-2" />
            </CardTitle>
            <CardDescription>
              {completedSteps} of {onboardingSteps.length} steps completed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progressPercent} className="h-2" />
            <div className="grid gap-2">
              {onboardingSteps.map((step) => (
                <div
                  key={step.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => router.push(step.path)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center ${
                      step.done ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      {step.done ? <CheckCircle2 className="h-4 w-4" /> : step.id}
                    </div>
                    <span className={step.done ? 'text-muted-foreground line-through' : 'font-medium'}>
                      {step.title}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm">
                    {step.done ? 'Done' : 'Start'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Jobs
              <InfoTooltip content="Jobs currently in progress" className="ml-2" />
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{activeJobs}</div>
            <p className="text-xs text-muted-foreground">{scheduledJobs} scheduled upcoming</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tool Availability
              <InfoTooltip content="Available tools vs total inventory" className="ml-2" />
            </CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{availableTools}/{totalTools}</div>
            <p className="text-xs text-muted-foreground">{Math.round((availableTools/totalTools)*100)}% available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Team Members
              <InfoTooltip content="Total active users in your company" className="ml-2" />
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{users.length}</div>
            <p className="text-xs text-muted-foreground">All active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              This Month
              <InfoTooltip content="Jobs completed this month" className="ml-2" />
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">12</div>
            <p className="text-xs text-success">+20% from last month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Jobs</CardTitle>
            <CardDescription>Latest activity on your job sites</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {jobs.slice(0, 3).map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{job.name}</p>
                    <p className="text-sm text-muted-foreground">{job.address}</p>
                  </div>
                  <Badge className={getStatusBadgeColor(job.status)}>
                    {job.status.replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tools Status</CardTitle>
            <CardDescription>Quick overview of your inventory</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tools.slice(0, 3).map((tool) => (
                <div key={tool.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{tool.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {tool.assignedTo ? `Assigned to ${tool.assignedTo.firstName}` : "Available"}
                    </p>
                  </div>
                  <Badge variant={tool.isAvailable ? "default" : "secondary"}>
                    {tool.isAvailable ? "Available" : "In Use"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </ProtectedRoute>
  );
}
