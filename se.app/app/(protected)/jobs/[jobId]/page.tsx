'use client';

import { useEffect, useState } from "react";

import { ArrowLeft, MapPin, Calendar, Users, Wrench, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getStatusBadgeColor } from "@/lib/ui-mappers";
import { fetchJobById, fetchUsers, fetchTools } from "@/services/app-data";
import type { Job, User, Tool } from "@/types/app/types";
import { InfoTooltip } from "@/components/InfoTooltip";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import type { Permission } from "@/types/app/types";

export default function JobDetail({ params }: { params: { jobId: string } }) {
  const { jobId } = params;
  const router = useRouter();

  const [job, setJob] = useState<Job | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([fetchJobById(jobId), fetchUsers(), fetchTools()])
      .then(([j, u, t]) => {
        if (!mounted) return;
        setJob(j);
        setUsers(Array.isArray(u) ? u : []);
        setTools(Array.isArray(t) ? t : []);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [jobId]);

  if (loading) {
    return <div>Loading...</div>;
  }
  if (!job) {
    return <div>Job not found</div>;
  }

  const crewMembers = users.filter(u => job.assignedCrewIds.includes(u.id));
  const assignedTools = tools.filter(t => job.toolIds.includes(t.id));

  return (
    <ProtectedRoute requiredPermissions={["VIEW_JOBS"] as Permission[]}>
      <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/jobs")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">{job.name}</h1>
          <p className="text-muted-foreground">Job ID: {job.id}</p>
        </div>
        <Badge className={getStatusBadgeColor(job.status)}>
          {job.status.replace("_", " ")}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Start Date</p>
                <p className="font-medium">{new Date(job.startDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">End Date</p>
                <p className="font-medium">{new Date(job.endDate).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{job.address}</p>
            {job.coordinates && (
              <Button variant="link" className="px-0 h-auto text-primary" size="sm">
                Open in Maps
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Crew Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{crewMembers.length}</p>
            <p className="text-xs text-muted-foreground">team members assigned</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="crew">Crew</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
          <TabsTrigger value="activity">
            Activity
            <InfoTooltip content="View job history and comments" className="ml-2" />
          </TabsTrigger>
          <TabsTrigger value="chat">
            <MessageSquare className="h-4 w-4 mr-1" />
            Chat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
              <CardDescription>Complete information about this project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p>{new Date(job.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                  <p>{new Date(job.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crew" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Crew Members</CardTitle>
              <CardDescription>{crewMembers.length} team members on this job</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {crewMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
                        {member.firstName[0]}{member.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium">{member.firstName} {member.lastName}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{member.roles[0]}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tools Assigned</CardTitle>
              <CardDescription>{assignedTools.length} tools allocated to this job</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {assignedTools.map((tool) => (
                  <div key={tool.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Wrench className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{tool.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {tool.assignedTo ? `Assigned to ${tool.assignedTo?.firstName}` : 'Unassigned'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{tool.condition}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Feed</CardTitle>
              <CardDescription>Job history and status changes</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Activity tracking coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Job Chat</CardTitle>
              <CardDescription>Team communication for this project</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Chat functionality coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </ProtectedRoute>
  );
}
