import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Download, Mail, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generatePDF } from "@/lib/pdfGenerator";

interface ReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: any;
  kpis?: any;
  projects?: any[];
  advancedAnalytics?: any;
  leaderMetrics?: any[];
  chartRefs?: {
    revenue?: HTMLElement | null;
    changeOrders?: HTMLElement | null;
    businessMix?: HTMLElement | null;
    labour?: HTMLElement | null;
  };
}

const reportSections = [
  { id: "executiveSummary", label: "Executive Summary (AI)", checked: true },
  { id: "overview", label: "Overview KPIs", checked: true },
  { id: "overviewInsights", label: "Overview Insights (AI)", checked: true },
  { id: "trends", label: "Revenue & Profit Trends", checked: true },
  { id: "changeOrders", label: "Change Orders Analysis", checked: true },
  { id: "labour", label: "Labour & Efficiency", checked: true },
  { id: "businessMix", label: "Business Mix", checked: true },
  { id: "chartInsights", label: "Chart Analysis (AI)", checked: true },
  { id: "advanced", label: "Advanced Analytics", checked: true },
  { id: "advancedInsights", label: "Advanced Metrics Insights (AI)", checked: true },
  { id: "leaders", label: "Team Leader Performance", checked: true },
  { id: "leaderInsights", label: "Leadership Analysis (AI)", checked: true },
  { id: "projectsTable", label: "Projects Table", checked: true },
  { id: "riskAnalysis", label: "Risk Analysis (AI)", checked: true },
  { id: "recommendations", label: "Strategic Recommendations (AI)", checked: true },
];

export const ReportModal = ({ 
  open, 
  onOpenChange, 
  filters,
  kpis = {},
  projects = [],
  advancedAnalytics = {},
  leaderMetrics = [],
  chartRefs 
}: ReportModalProps) => {
  const [companyName, setCompanyName] = useState("StraightEdge");
  const [sections, setSections] = useState(reportSections);
  const [includeAttachments, setIncludeAttachments] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleSectionToggle = (id: string) => {
    setSections(
      sections.map((section) =>
        section.id === id ? { ...section, checked: !section.checked } : section
      )
    );
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generatePDF({
        companyName,
        filters,
        sections,
        kpis,
        projects,
        advancedAnalytics,
        leaderMetrics,
        chartRefs,
      });
      
      toast({
        title: "Report Generated",
        description: "Your CEO KPI report has been downloaded.",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEmail = () => {
    toast({
      title: "Report Sent",
      description: "The report has been emailed to your address.",
    });
    onOpenChange(false);
  };

  const getFilterSummary = () => {
    const parts = [];
    if (filters.dateRange?.preset !== "all") {
      parts.push(`Period: ${filters.dateRange.preset}`);
    }
    if (filters.client) parts.push(`Client: ${filters.client}`);
    if (filters.leader) parts.push(`Leader: ${filters.leader}`);
    if (filters.businessType) parts.push(`Type: ${filters.businessType}`);
    if (filters.billingType) parts.push(`Billing: ${filters.billingType}`);
    return parts.length > 0 ? parts.join(" • ") : "All data included";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <FileText className="h-5 w-5 text-primary" />
            Generate CEO Report
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Create a comprehensive meeting-ready PDF report for the current filter scope.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Scope Summary */}
          <div className="p-4 bg-muted/50 rounded-lg border border-border">
            <h4 className="text-sm font-semibold text-foreground mb-2">Report Scope</h4>
            <p className="text-sm text-muted-foreground">{getFilterSummary()}</p>
          </div>

          {/* Branding */}
          <div className="space-y-2">
            <Label htmlFor="company" className="text-foreground">Company Name</Label>
            <Input
              id="company"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Your company name"
              className="bg-background border-border"
            />
          </div>

          {/* Sections Selection */}
          <div className="space-y-3">
            <Label className="text-foreground">Report Sections</Label>
            <div className="grid grid-cols-2 gap-3">
              {sections.map((section) => (
                <div key={section.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={section.id}
                    checked={section.checked}
                    onCheckedChange={() => handleSectionToggle(section.id)}
                  />
                  <label
                    htmlFor={section.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground cursor-pointer"
                  >
                    {section.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Export Options */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="attachments"
              checked={includeAttachments}
              onCheckedChange={(checked) => setIncludeAttachments(checked as boolean)}
            />
            <label
              htmlFor="attachments"
              className="text-sm font-medium leading-none text-foreground cursor-pointer"
            >
              Include CSV/XLSX attachments
            </label>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handleEmail} className="gap-2" disabled={isGenerating}>
            <Mail className="h-4 w-4" />
            Email Report
          </Button>
          <Button onClick={handleGenerate} className="gap-2 bg-gradient-primary" disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Generate PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};