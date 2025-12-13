'use client';

import { useEffect, useRef, useState } from "react";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, QrCode, Download, Wrench, User, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getConditionBadgeColor } from "@/lib/ui-mappers";
import { fetchToolById, fetchJobById } from "@/services/app-data";
import type { Tool, Job } from "@/types/app/types";
import { InfoTooltip } from "@/components/InfoTooltip";
import QRCodeSVG from "react-qr-code";

export default function ToolDetailPage() {
  const params = useParams<{ toolId: string }>();
  const toolId = params.toolId as string;
  const router = useRouter();
  const qrRef = useRef<HTMLDivElement>(null);

  const [tool, setTool] = useState<Tool | null>(null);
  const [assignedJob, setAssignedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const t = await fetchToolById(toolId);
      if (!mounted) return;
      setTool(t);
      if (t?.jobId) {
        const j = await fetchJobById(t.jobId);
        if (!mounted) return;
        setAssignedJob(j);
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [toolId]);

  if (loading) return <div>Loading...</div>;
  if (!tool) return <div>Tool not found</div>;

  const handleDownloadQR = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      
      const downloadLink = document.createElement("a");
      downloadLink.download = `${tool.name.replace(/\s+/g, '_')}_QR.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const toolUrl = typeof window !== 'undefined' ? `${window.location.origin}/tools/${toolId}` : '';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/tools")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">{tool.name}</h1>
          <p className="text-muted-foreground">Tool ID: {tool.id}</p>
        </div>
        <Badge variant={tool.isAvailable ? "default" : "secondary"}>
          {tool.isAvailable ? "Available" : "In Use"}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Tool Information</CardTitle>
            <CardDescription>Details and current status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Condition
                </p>
                <Badge className={getConditionBadgeColor(tool.condition)}>
                  {tool.condition}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Serviced</p>
                <p>{new Date(tool.lastServiced).toLocaleDateString()}</p>
              </div>
            </div>

            {tool.assignedTo && (
              <div className="p-4 rounded-lg border bg-accent/50">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                  <User className="h-4 w-4" />
                  Assigned To
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
                    {tool.assignedTo.firstName[0]}{tool.assignedTo.lastName[0]}
                  </div>
                  <div>
                    <p className="font-medium">{tool.assignedTo.firstName} {tool.assignedTo.lastName}</p>
                    <p className="text-sm text-muted-foreground">{tool.assignedTo.email}</p>
                  </div>
                </div>
              </div>
            )}

            {assignedJob && (
              <div className="p-4 rounded-lg border bg-accent/50">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                  <Briefcase className="h-4 w-4" />
                  Current Job
                </p>
                <div>
                  <p className="font-medium">{assignedJob.name}</p>
                  <p className="text-sm text-muted-foreground">{assignedJob.address}</p>
                  <Button 
                    variant="link" 
                    className="px-0 h-auto text-primary" 
                    size="sm"
                    onClick={() => router.push(`/jobs/${assignedJob.id}`)}
                  >
                    View Job Details
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Code
              <InfoTooltip content="Scan this code to quickly check in/out this tool" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div ref={qrRef} className="flex justify-center p-6 bg-white rounded-lg">
              {toolUrl && (
                <QRCodeSVG 
                  value={toolUrl}
                  size={200}
                  level="H"
                />
              )}
            </div>
            <Button 
              className="w-full bg-primary hover:bg-primary/90" 
              onClick={handleDownloadQR}
            >
              <Download className="mr-2 h-4 w-4" />
              Download QR Code
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Print this QR code and attach it to the tool for easy scanning
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance History</CardTitle>
          <CardDescription>Service records and maintenance logs</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Maintenance history coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
