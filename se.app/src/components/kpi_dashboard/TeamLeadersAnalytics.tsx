import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Project } from "@/types/project";
import { Trophy, TrendingUp, TrendingDown, ArrowUpDown, DollarSign, Target, Zap, Clock } from "lucide-react";
import { KpiCard } from "./KpiCard";

interface TeamLeadersAnalyticsProps {
  projects: Project[];
}

interface LeaderMetrics {
  name: string;
  projectCount: number;
  totalRevenue: number;
  grossProfit: number;
  netProfit: number;
  grossMargin: number;
  netMargin: number;
  projectedHours: number;
  actualHours: number;
  efficiency: number;
  changeOrders: number;
  avgProjectRevenue: number;
}

export function TeamLeadersAnalytics({ projects }: TeamLeadersAnalyticsProps) {
  const [sortField, setSortField] = useState<keyof LeaderMetrics>("totalRevenue");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const handleSort = (field: keyof LeaderMetrics) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const leaderMetrics = useMemo(() => {
    const metricsMap = new Map<string, LeaderMetrics>();

    projects.forEach((project) => {
      const leaderName = `${project.lead.firstName} ${project.lead.lastName}`;
      
      if (!metricsMap.has(leaderName)) {
        metricsMap.set(leaderName, {
          name: leaderName,
          projectCount: 0,
          totalRevenue: 0,
          grossProfit: 0,
          netProfit: 0,
          grossMargin: 0,
          netMargin: 0,
          projectedHours: 0,
          actualHours: 0,
          efficiency: 0,
          changeOrders: 0,
          avgProjectRevenue: 0,
        });
      }

      const metrics = metricsMap.get(leaderName)!;
      metrics.projectCount++;
      metrics.totalRevenue += project.revenue.total;
      metrics.grossProfit += project.profit.gross;
      metrics.netProfit += project.profit.net;
      metrics.projectedHours += project.labour.projectedHours;
      metrics.actualHours += project.labour.actualHours;
      metrics.changeOrders += project.changeOrders;
    });

    // Calculate derived metrics
    const leaders: LeaderMetrics[] = Array.from(metricsMap.values()).map((leader) => {
      const grossMargin = leader.totalRevenue > 0 ? (leader.grossProfit / leader.totalRevenue) * 100 : 0;
      const netMargin = leader.totalRevenue > 0 ? (leader.netProfit / leader.totalRevenue) * 100 : 0;
      const efficiency = leader.projectedHours > 0 ? (leader.projectedHours / leader.actualHours) * 100 : 0;
      const avgProjectRevenue = leader.projectCount > 0 ? leader.totalRevenue / leader.projectCount : 0;

      return {
        ...leader,
        grossMargin,
        netMargin,
        efficiency,
        avgProjectRevenue,
      };
    });

    // Sort by selected field and direction
    return leaders.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const comparison = typeof aVal === 'string' 
        ? aVal.localeCompare(bVal as string)
        : (aVal as number) - (bVal as number);
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [projects, sortField, sortDirection]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const formatNumber = (value: number) =>
    new Intl.NumberFormat("en-US").format(Math.round(value));

  const teamAverages = useMemo(() => {
    if (leaderMetrics.length === 0) return null;
    
    return {
      avgProjects: leaderMetrics.reduce((sum, l) => sum + l.projectCount, 0) / leaderMetrics.length,
      avgRevenue: leaderMetrics.reduce((sum, l) => sum + l.totalRevenue, 0) / leaderMetrics.length,
      avgGrossProfit: leaderMetrics.reduce((sum, l) => sum + l.grossProfit, 0) / leaderMetrics.length,
      avgGrossMargin: leaderMetrics.reduce((sum, l) => sum + l.grossMargin, 0) / leaderMetrics.length,
      avgEfficiency: leaderMetrics.reduce((sum, l) => sum + l.efficiency, 0) / leaderMetrics.length,
      avgProjectedHours: leaderMetrics.reduce((sum, l) => sum + l.projectedHours, 0) / leaderMetrics.length,
      avgActualHours: leaderMetrics.reduce((sum, l) => sum + l.actualHours, 0) / leaderMetrics.length,
    };
  }, [leaderMetrics]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-500" />;
    if (rank === 2) return <Trophy className="h-4 w-4 text-gray-400" />;
    if (rank === 3) return <Trophy className="h-4 w-4 text-amber-600" />;
    return <span className="text-muted-foreground">#{rank}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Team Leaders Performance</h2>
          <p className="text-muted-foreground">Rankings and metrics by project lead</p>
        </div>
      </div>

      {/* Team Averages KPI Cards */}
      {teamAverages && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard
            title="Avg Projects per Leader"
            value={teamAverages.avgProjects.toFixed(1)}
            subtitle="projects"
            description="Average number of projects managed by each team leader"
          />
          <KpiCard
            title="Avg Revenue per Leader"
            value={formatCurrency(teamAverages.avgRevenue)}
            subtitle="total revenue"
            description="Average revenue generated by each team leader across their projects"
          />
          <KpiCard
            title="Avg Gross Margin"
            value={`${teamAverages.avgGrossMargin.toFixed(1)}%`}
            subtitle="margin"
            description="Average gross profit margin across all team leaders"
          />
          <KpiCard
            title="Avg Efficiency"
            value={`${teamAverages.avgEfficiency.toFixed(0)}%`}
            subtitle="efficiency rate"
            description="Average labour efficiency (projected vs actual hours) across all leaders"
          />
        </div>
      )}

      {/* Top 3 Leaders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {leaderMetrics.slice(0, 3).map((leader, index) => (
          <Card key={leader.name} className="border-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {getRankBadge(index + 1)}
                {leader.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-2xl font-bold">{formatCurrency(leader.totalRevenue)}</p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold">{leader.projectCount}</p>
                  <p className="text-muted-foreground">Projects</p>
                </div>
                <div>
                  <p className="font-semibold">{leader.grossMargin.toFixed(1)}%</p>
                  <p className="text-muted-foreground">Margin</p>
                </div>
                <div>
                  <p className="font-semibold">{leader.efficiency.toFixed(0)}%</p>
                  <p className="text-muted-foreground">Efficiency</p>
                </div>
                <div>
                  <p className="font-semibold">{leader.changeOrders}</p>
                  <p className="text-muted-foreground">Change Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Full Rankings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Complete Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Rank</th>
                  <th 
                    className="text-left p-3 font-semibold cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-1">
                      Team Leader <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th 
                    className="text-right p-3 font-semibold cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSort("projectCount")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Projects <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th 
                    className="text-right p-3 font-semibold cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSort("totalRevenue")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Revenue <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th 
                    className="text-right p-3 font-semibold cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSort("grossProfit")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Gross Profit <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th 
                    className="text-right p-3 font-semibold cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSort("grossMargin")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Margin <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th 
                    className="text-right p-3 font-semibold cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSort("efficiency")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Efficiency <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th 
                    className="text-right p-3 font-semibold cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSort("actualHours")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Hours (P/A) <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {leaderMetrics.map((leader, index) => (
                  <tr key={leader.name} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {getRankBadge(index + 1)}
                      </div>
                    </td>
                    <td className="p-3 font-medium">{leader.name}</td>
                    <td className="p-3 text-right">{leader.projectCount}</td>
                    <td className="p-3 text-right">{formatCurrency(leader.totalRevenue)}</td>
                    <td className="p-3 text-right">{formatCurrency(leader.grossProfit)}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {leader.grossMargin.toFixed(1)}%
                        {leader.grossMargin >= 25 ? (
                          <TrendingUp className="h-3 w-3 text-green-500" />
                        ) : leader.grossMargin < 20 ? (
                          <TrendingDown className="h-3 w-3 text-red-500" />
                        ) : null}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {leader.efficiency.toFixed(0)}%
                        {leader.efficiency >= 100 ? (
                          <TrendingUp className="h-3 w-3 text-green-500" />
                        ) : leader.efficiency < 90 ? (
                          <TrendingDown className="h-3 w-3 text-red-500" />
                        ) : null}
                      </div>
                    </td>
                    <td className="p-3 text-right text-sm">
                      {formatNumber(leader.projectedHours)} / {formatNumber(leader.actualHours)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}