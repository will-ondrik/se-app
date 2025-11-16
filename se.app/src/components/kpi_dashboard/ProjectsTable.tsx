import { useState, useMemo } from "react";
import { Project } from "@/types/project";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Download, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

interface ProjectsTableProps {
  projects: Project[];
  onRowClick?: (project: Project) => void;
}

const ITEMS_PER_PAGE = 10;

export const ProjectsTable = ({ projects, onRowClick }: ProjectsTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof Project | "">("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (field: keyof Project) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const filteredProjects = useMemo(() => {
    let filtered = projects.filter(
      (project) =>
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.clientName.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.jobberNum.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply sorting
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        let aVal: any = a[sortField];
        let bVal: any = b[sortField];
        
        // Handle nested objects
        if (sortField === "clientName") aVal = a.clientName.name, bVal = b.clientName.name;
        if (sortField === "revenue") aVal = a.revenue.total, bVal = b.revenue.total;
        if (sortField === "profit") aVal = a.profit.gross, bVal = b.profit.gross;
        
        const comparison = typeof aVal === 'string' 
          ? aVal.localeCompare(bVal as string)
          : (aVal as number) - (bVal as number);
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    return filtered;
  }, [projects, searchTerm, sortField, sortDirection]);

  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProjects.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProjects, currentPage]);

  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);

  const aggregates = useMemo(() => {
    const avgRate = filteredProjects.length > 0 
      ? filteredProjects.reduce((sum, p) => sum + p.labour.effectiveRate, 0) / filteredProjects.length 
      : 0;
    
    return {
      totalRevenue: filteredProjects.reduce((sum, p) => sum + p.revenue.total, 0),
      totalChangeOrders: filteredProjects.reduce((sum, p) => sum + p.revenue.changeOrder, 0),
      totalGrossProfit: filteredProjects.reduce((sum, p) => sum + p.profit.gross, 0),
      totalNetProfit: filteredProjects.reduce((sum, p) => sum + p.profit.net, 0),
      totalProjectedHours: filteredProjects.reduce((sum, p) => sum + p.labour.projectedHours, 0),
      totalActualHours: filteredProjects.reduce((sum, p) => sum + p.labour.actualHours, 0),
      avgRate,
    };
  }, [filteredProjects]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);

  const exportToCSV = () => {
    const headers = [
      "Job Number",
      "Client",
      "Title",
      "Leader",
      "Business Type",
      "Billing",
      "Revenue",
      "Change Order Revenue",
      "Gross Profit",
      "Net Profit",
      "Projected Hours",
      "Actual Hours",
      "Effective Rate",
      "Start Date",
      "End Date",
      "Balance Due",
    ];

    const rows = filteredProjects.map((p) => [
      p.jobberNum,
      p.clientName.name,
      p.title,
      `${p.lead.firstName} ${p.lead.lastName}`,
      p.businessType.type,
      p.businessType.billingMethod,
      p.revenue.total,
      p.revenue.changeOrder,
      p.profit.gross,
      p.profit.net,
      p.labour.projectedHours.toFixed(1),
      p.labour.actualHours.toFixed(1),
      p.labour.effectiveRate,
      format(p.startDate, "yyyy-MM-dd"),
      format(p.endDate, "yyyy-MM-dd"),
      p.balanceDue,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `projects-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  return (
    <Card className="p-6 bg-card border-border/50 shadow-sm">
      <div className="space-y-4">
        {/* Header with search and export */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 max-w-sm relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 bg-background"
            />
          </div>
          <Button onClick={exportToCSV} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Aggregates */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground">Total Revenue</p>
            <p className="text-sm font-bold text-foreground">{formatCurrency(aggregates.totalRevenue)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Change Orders</p>
            <p className="text-sm font-bold text-foreground">{formatCurrency(aggregates.totalChangeOrders)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Gross Profit</p>
            <p className="text-sm font-bold text-success">{formatCurrency(aggregates.totalGrossProfit)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Net Profit</p>
            <p className="text-sm font-bold text-success">{formatCurrency(aggregates.totalNetProfit)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Proj. Hours</p>
            <p className="text-sm font-bold text-foreground">{aggregates.totalProjectedHours.toFixed(1)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Actual Hours</p>
            <p className="text-sm font-bold text-foreground">{aggregates.totalActualHours.toFixed(1)}</p>
          </div>
        </div>

        {/* Table */}
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead 
                  className="font-semibold cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => handleSort("jobberNum")}
                >
                  <div className="flex items-center gap-1">
                    Jobber # <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead 
                  className="font-semibold cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => handleSort("clientName")}
                >
                  <div className="flex items-center gap-1">
                    Client <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead 
                  className="font-semibold cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => handleSort("title")}
                >
                  <div className="flex items-center gap-1">
                    Title <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead 
                  className="font-semibold cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => handleSort("lead")}
                >
                  <div className="flex items-center gap-1">
                    Leader <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Billing</TableHead>
                <TableHead 
                  className="text-right font-semibold cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => handleSort("revenue")}
                >
                  <div className="flex items-center justify-end gap-1">
                    Revenue <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead 
                  className="text-right font-semibold cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => handleSort("profit")}
                >
                  <div className="flex items-center justify-end gap-1">
                    Gross Profit <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead className="text-right font-semibold">Hours</TableHead>
                <TableHead className="text-right font-semibold">Rate</TableHead>
                <TableHead 
                  className="font-semibold cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => handleSort("startDate")}
                >
                  <div className="flex items-center gap-1">
                    Start Date <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead 
                  className="font-semibold cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => handleSort("endDate")}
                >
                  <div className="flex items-center gap-1">
                    End Date <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProjects.map((project) => {
                const efficiency = (project.labour.actualHours / project.labour.projectedHours) * 100;
                const isOverBudget = project.labour.actualHours > project.labour.projectedHours;
                const rateVariance = ((project.labour.effectiveRate - aggregates.avgRate) / aggregates.avgRate) * 100;
                const isAboveAvgRate = project.labour.effectiveRate > aggregates.avgRate;
                
                return (
                  <TableRow
                    key={project.id}
                    onClick={() => onRowClick?.(project)}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <TableCell className="font-mono text-sm whitespace-nowrap">{project.jobberNum}</TableCell>
                    <TableCell>{project.clientName.name}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{project.title}</TableCell>
                    <TableCell>
                      {project.lead.firstName} {project.lead.lastName}
                    </TableCell>
                    <TableCell className="text-sm capitalize">
                      {project.businessType.type}
                    </TableCell>
                    <TableCell className="text-sm">
                      {project.businessType.billingMethod}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(project.revenue.total)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-success">
                      {formatCurrency(project.profit.gross)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className={`text-sm font-medium ${isOverBudget ? "text-destructive" : "text-success"}`}>
                        {project.labour.actualHours.toFixed(1)}
                        <span className="text-xs text-muted-foreground font-normal"> / {project.labour.projectedHours.toFixed(1)}</span>
                      </div>
                      <div className={`text-xs ${efficiency > 100 ? "text-destructive" : "text-success"}`}>
                        {efficiency.toFixed(0)}%
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="text-sm font-medium">${project.labour.effectiveRate.toFixed(2)}</div>
                      <div className={`text-xs ${isAboveAvgRate ? "text-success" : "text-destructive"}`}>
                        {isAboveAvgRate ? "+" : ""}{rateVariance.toFixed(1)}% {isAboveAvgRate ? "above" : "below"} average
                      </div>
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {format(project.startDate, "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {format(project.endDate, "MMM dd, yyyy")}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredProjects.length)} of{" "}
            {filteredProjects.length} projects
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};