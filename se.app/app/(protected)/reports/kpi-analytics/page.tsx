'use client';

import { useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, TrendingUp } from "lucide-react";
import { KpiCard } from "@/components/kpi_dashboard/KpiCard";
import { FilterBar } from "@/components/kpi_dashboard/FilterBar";
import { ReportModal } from "@/components/kpi_dashboard/ReportModal";
import { RevenueTrendChart } from "@/components/charts/RevenueTrendChart";
import { ChangeOrdersChart } from "@/components/charts/ChangeOrdersChart";
import { BusinessMixChart } from "@/components/charts/BusinessMixChart";
import { LabourEfficiencyChart } from "@/components/charts/LabourEfficiencyChart";
import { ProjectsTable } from "@/components/kpi_dashboard/ProjectsTable";
import { ProjectDetailModal } from "@/components/kpi_dashboard/ProjectDetailModal";
import { AdvancedAnalytics } from "@/components/kpi_dashboard/AdvancedAnalytics";
import { TeamLeadersAnalytics } from "@/components/kpi_dashboard/TeamLeadersAnalytics";
import { projects, filterProjects } from "@/lib/projectData";
import { Project } from "@/types/project";

export default function KpiAnalyticsReportsPage() {
  const [filters, setFilters] = useState<any>({
    dateRange: { from: null, to: null, preset: "all" },
    client: null,
    leader: null,
    businessType: null,
    billingType: null,
  });
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // Chart refs for PDF generation
  const revenueChartRef = useRef<HTMLDivElement>(null);
  const changeOrdersChartRef = useRef<HTMLDivElement>(null);
  const businessMixChartRef = useRef<HTMLDivElement>(null);
  const labourChartRef = useRef<HTMLDivElement>(null);

  const filteredProjects = useMemo(
    () => filterProjects(projects, filters),
    [filters]
  );

  // KPIs
  const kpis = useMemo(() => {
    const totalRevenue = filteredProjects.reduce((sum, p) => sum + p.revenue.total, 0);
    const changeOrderCount = filteredProjects.filter((p) => p.changeOrders > 0).length;
    const changeOrderRevenue = filteredProjects.reduce(
      (sum, p) => sum + p.revenue.changeOrder,
      0
    );
    const grossProfit = filteredProjects.reduce((sum, p) => sum + p.profit.gross, 0);
    const grossVariance = filteredProjects.reduce(
      (sum, p) => sum + p.profit.grossVariance,
      0
    );
    const netProfit = filteredProjects.reduce((sum, p) => sum + p.profit.net, 0);
    const projectedHours = filteredProjects.reduce(
      (sum, p) => sum + p.labour.projectedHours,
      0
    );
    const actualHours = filteredProjects.reduce((sum, p) => sum + p.labour.actualHours, 0);
    const totalLabourCost = filteredProjects.reduce(
      (sum, p) => sum + p.labour.actualHours * p.labour.effectiveRate,
      0
    );
    const effectiveRate = actualHours > 0 ? totalLabourCost / actualHours : 0;

    const revenueSparkline = [380000, 420000, 390000, 460000, 440000, 480000, 470000, totalRevenue];
    const profitSparkline = [95000, 105000, 98000, 115000, 110000, 120000, 118000, grossProfit];

    return {
      totalRevenue: { value: totalRevenue, delta: 8.5, sparkline: revenueSparkline },
      changeOrderCount: {
        value: changeOrderCount,
        delta: -12.3,
        sparkline: [8, 9, 7, 10, 9, 8, 7, changeOrderCount],
      },
      changeOrderRevenue: {
        value: changeOrderRevenue,
        delta: -5.2,
        sparkline: [55000, 60000, 52000, 65000, 58000, 62000, 57000, changeOrderRevenue],
      },
      grossProfit: { value: grossProfit, delta: 6.8, sparkline: profitSparkline },
      grossVariance: {
        value: grossVariance,
        delta: grossVariance > 0 ? 15.4 : -8.2,
        sparkline: [8000, -5000, 3000, 10000, 2000, 12000, 5000, grossVariance],
      },
      netProfit: {
        value: netProfit,
        delta: 9.3,
        sparkline: [72000, 79000, 74000, 86000, 83000, 90000, 89000, netProfit],
      },
      projectedVsActual: {
        projected: projectedHours,
        actual: actualHours,
        delta: projectedHours > 0 ? ((actualHours - projectedHours) / projectedHours) * 100 : 0,
        sparkline: [
          projectedHours * 0.9,
          projectedHours * 0.95,
          projectedHours,
          actualHours * 0.9,
          actualHours * 0.95,
          actualHours * 0.98,
          actualHours * 1.02,
          actualHours,
        ],
      },
      effectiveRate: {
        value: effectiveRate,
        delta: 3.7,
        sparkline: [72, 74, 73, 76, 75, 78, 77, effectiveRate],
      },
    };
  }, [filteredProjects]);

  // Chart data
  const revenueTrendData = useMemo(() => {
    if (filteredProjects.length === 0) return [];
    const monthMap = new Map<string, { revenue: number; grossProfit: number; netProfit: number }>();
    filteredProjects.forEach(p => {
      const month = p.startDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const existing = monthMap.get(month) || { revenue: 0, grossProfit: 0, netProfit: 0 };
      monthMap.set(month, {
        revenue: existing.revenue + p.revenue.total,
        grossProfit: existing.grossProfit + p.profit.gross,
        netProfit: existing.netProfit + p.profit.net,
      });
    });
    return Array.from(monthMap.entries())
      // Simple lexicographic sort works with "Jan 25" style by Date parsing
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([month, data]) => ({ month, ...data }));
  }, [filteredProjects]);

  const changeOrdersData = useMemo(() => {
    if (filteredProjects.length === 0) return [];
    const monthMap = new Map<string, { count: number; revenue: number }>();
    filteredProjects.forEach(p => {
      if (p.changeOrders > 0) {
        const month = p.startDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        const existing = monthMap.get(month) || { count: 0, revenue: 0 };
        monthMap.set(month, {
          count: existing.count + 1,
          revenue: existing.revenue + p.revenue.changeOrder,
        });
      }
    });
    return Array.from(monthMap.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([name, data]) => ({ name, ...data }));
  }, [filteredProjects]);

  const businessMixData = useMemo(() => {
    const typeMap = new Map<string, number>();
    filteredProjects.forEach((p) => {
      const type = p.businessType.type;
      typeMap.set(type, (typeMap.get(type) || 0) + p.revenue.total);
    });
    const colors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
    return Array.from(typeMap.entries()).map(([name, value], idx) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: colors[idx % colors.length],
    }));
  }, [filteredProjects]);

  const labourEfficiencyData = useMemo(() => {
    if (filteredProjects.length === 0) return [];
    const monthMap = new Map<string, { projected: number; actual: number; totalLabourCost: number }>();
    filteredProjects.forEach(p => {
      const month = p.startDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const existing = monthMap.get(month) || { projected: 0, actual: 0, totalLabourCost: 0 };
      monthMap.set(month, {
        projected: existing.projected + p.labour.projectedHours,
        actual: existing.actual + p.labour.actualHours,
        totalLabourCost: existing.totalLabourCost + (p.labour.actualHours * p.labour.effectiveRate),
      });
    });
    return Array.from(monthMap.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([name, data]) => ({
        name,
        projected: data.projected,
        actual: data.actual,
        rate: data.actual > 0 ? data.totalLabourCost / data.actual : 0,
      }));
  }, [filteredProjects]);

  // Advanced analytics
  const advancedAnalytics = useMemo(() => {
    if (filteredProjects.length === 0) return null;

    const totalRevenue = filteredProjects.reduce((sum, p) => sum + p.revenue.total, 0);
    const totalGrossProfit = filteredProjects.reduce((sum, p) => sum + p.profit.gross, 0);
    const totalNetProfit = filteredProjects.reduce((sum, p) => sum + p.profit.net, 0);
    const totalProjectedHours = filteredProjects.reduce((sum, p) => sum + p.labour.projectedHours, 0);
    const totalActualHours = filteredProjects.reduce((sum, p) => sum + p.labour.actualHours, 0);
    
    const efficiencyIndex = totalProjectedHours > 0 ? totalActualHours / totalProjectedHours : 0;
    const profitPerHour = totalActualHours > 0 ? totalNetProfit / totalActualHours : 0;
    const grossMargin = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;
    const netMargin = totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100 : 0;
    
    const overrunProjects = filteredProjects.filter(p => p.labour.actualHours > p.labour.projectedHours).length;
    const overrunIndex = filteredProjects.length > 0 ? overrunProjects / filteredProjects.length : 0;
    
    const avgProjectDuration = filteredProjects.length > 0 
      ? filteredProjects.reduce((sum, p) => sum + (p.endDate.getTime() - p.startDate.getTime()) / (1000 * 60 * 60 * 24), 0) / filteredProjects.length
      : 0;
    
    const changeOrderRate = filteredProjects.length > 0 
      ? (filteredProjects.filter(p => p.changeOrders > 0).length / filteredProjects.length) * 100 
      : 0;
    
    const profitMargins = filteredProjects.map(p => p.revenue.total > 0 ? (p.profit.net / p.revenue.total) * 100 : 0);
    const avgMargin = profitMargins.reduce((sum, m) => sum + m, 0) / (profitMargins.length || 1);
    const profitStability = profitMargins.length > 1 
      ? Math.sqrt(profitMargins.reduce((sum, m) => sum + Math.pow(m - avgMargin, 2), 0) / profitMargins.length) 
      : 0;

    return {
      efficiencyIndex,
      profitPerHour,
      grossMargin,
      netMargin,
      overrunIndex,
      avgProjectDuration,
      changeOrderRate,
      profitStability,
    };
  }, [filteredProjects]);

  // Leader metrics
  const leaderMetrics = useMemo(() => {
    const leaderMap = new Map<string, any>();
    
    filteredProjects.forEach((project) => {
      const leaderName = `${project.lead.firstName} ${project.lead.lastName}`;
      const existing = leaderMap.get(leaderName) || {
        leaderName,
        projectCount: 0,
        totalRevenue: 0,
        totalGrossProfit: 0,
        totalNetProfit: 0,
        totalProjectedHours: 0,
        totalActualHours: 0,
      };

      leaderMap.set(leaderName, {
        leaderName,
        projectCount: existing.projectCount + 1,
        totalRevenue: existing.totalRevenue + project.revenue.total,
        totalGrossProfit: existing.totalGrossProfit + project.profit.gross,
        totalNetProfit: existing.totalNetProfit + project.profit.net,
        totalProjectedHours: existing.totalProjectedHours + project.labour.projectedHours,
        totalActualHours: existing.totalActualHours + project.labour.actualHours,
      });
    });

    return Array.from(leaderMap.values()).map(leader => ({
      ...leader,
      grossMargin: leader.totalRevenue > 0 ? (leader.totalGrossProfit / leader.totalRevenue) * 100 : 0,
      netMargin: leader.totalRevenue > 0 ? (leader.totalNetProfit / leader.totalRevenue) * 100 : 0,
      efficiency: leader.totalActualHours > 0 ? (leader.totalProjectedHours / leader.totalActualHours) * 100 : 0,
    })).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [filteredProjects]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const formatNumber = (value: number) =>
    new Intl.NumberFormat("en-US").format(Math.round(value));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">StraightEdge</h1>
                <p className="text-sm text-muted-foreground">CEO KPI Dashboard</p>
              </div>
            </div>
            <Button
              onClick={() => setReportModalOpen(true)}
              className="bg-gradient-primary shadow-glow hover:shadow-lg transition-all"
            >
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Filters */}
        <FilterBar onFilterChange={setFilters} />

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Advanced Analytics</TabsTrigger>
            <TabsTrigger value="team-leaders">Team Leaders</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8 animate-fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <KpiCard
                title="Total Revenue"
                value={formatCurrency(kpis.totalRevenue.value)}
                delta={kpis.totalRevenue.delta}
                sparklineData={kpis.totalRevenue.sparkline}
                subtitle="vs previous period"
                description="Total revenue generated from all projects in the selected period, including base contracts and change orders."
              />
              <KpiCard
                title="Change Order Count"
                value={kpis.changeOrderCount.value.toString()}
                delta={kpis.changeOrderCount.delta}
                sparklineData={kpis.changeOrderCount.sparkline}
                subtitle={`${filteredProjects.length} total projects`}
                description="Number of projects with approved change orders. Lower is better as it indicates accurate initial project scoping."
              />
              <KpiCard
                title="Change Order Revenue"
                value={formatCurrency(kpis.changeOrderRevenue.value)}
                delta={kpis.changeOrderRevenue.delta}
                sparklineData={kpis.changeOrderRevenue.sparkline}
                subtitle="additional revenue"
                description="Total additional revenue from scope changes and project modifications beyond the original contract."
              />
              <KpiCard
                title="Gross Profit"
                value={formatCurrency(kpis.grossProfit.value)}
                delta={kpis.grossProfit.delta}
                sparklineData={kpis.grossProfit.sparkline}
                subtitle={`${kpis.totalRevenue.value > 0 ? ((kpis.grossProfit.value / kpis.totalRevenue.value) * 100).toFixed(1) : '0.0'}% margin`}
                description="Revenue minus direct costs like materials and labor. Indicates project profitability before overhead expenses."
              />
              <KpiCard
                title="Gross Profit Variance"
                value={formatCurrency(Math.abs(kpis.grossVariance.value))}
                delta={kpis.grossVariance.delta}
                sparklineData={kpis.grossVariance.sparkline}
                subtitle={kpis.grossVariance.value >= 0 ? "above target" : "below target"}
                description="Difference between actual and projected gross profit. Positive values indicate better than expected performance."
              />
              <KpiCard
                title="Net Profit"
                value={formatCurrency(kpis.netProfit.value)}
                delta={kpis.netProfit.delta}
                sparklineData={kpis.netProfit.sparkline}
                subtitle={`${kpis.totalRevenue.value > 0 ? ((kpis.netProfit.value / kpis.totalRevenue.value) * 100).toFixed(1) : '0.0'}% margin`}
                description="Final profit after all costs including materials, labor, overhead, and operating expenses. The bottom line."
              />
              <KpiCard
                title="Labour Hours"
                value={formatNumber(kpis.projectedVsActual.actual)}
                delta={kpis.projectedVsActual.delta}
                sparklineData={kpis.projectedVsActual.sparkline}
                subtitle={`${formatNumber(kpis.projectedVsActual.projected)} projected`}
                description="Total actual labour hours spent vs projected hours. Helps identify estimation accuracy and project efficiency."
              />
              <KpiCard
                title="Effective Labour Rate"
                value={`$${kpis.effectiveRate.value.toFixed(2)}`}
                delta={kpis.effectiveRate.delta}
                sparklineData={kpis.effectiveRate.sparkline}
                subtitle="per hour"
                description="Average cost per labour hour including wages, benefits, and overhead. Key metric for pricing and profitability."
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div ref={revenueChartRef}>
                <RevenueTrendChart data={revenueTrendData} />
              </div>
              <div ref={changeOrdersChartRef}>
                <ChangeOrdersChart data={changeOrdersData} />
              </div>
              <div ref={businessMixChartRef}>
                <BusinessMixChart data={businessMixData} />
              </div>
              <div ref={labourChartRef}>
                <LabourEfficiencyChart data={labourEfficiencyData} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="animate-fade-in">
            <AdvancedAnalytics projects={filteredProjects} />
          </TabsContent>

          <TabsContent value="team-leaders" className="animate-fade-in">
            <TeamLeadersAnalytics projects={filteredProjects} />
          </TabsContent>

          <TabsContent value="projects" className="animate-fade-in">
            <ProjectsTable
              projects={filteredProjects}
              onRowClick={setSelectedProject}
            />
          </TabsContent>
        </Tabs>
      </main>

      <ReportModal
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
        filters={filters}
        kpis={kpis}
        projects={filteredProjects}
        advancedAnalytics={advancedAnalytics}
        leaderMetrics={leaderMetrics}
        chartRefs={{
          revenue: revenueChartRef.current,
          changeOrders: changeOrdersChartRef.current,
          businessMix: businessMixChartRef.current,
          labour: labourChartRef.current,
        }}
      />

      <ProjectDetailModal
        project={selectedProject}
        open={!!selectedProject}
        onOpenChange={(open) => !open && setSelectedProject(null)}
      />
    </div>
  );
}
