import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { InfoTooltip } from "../InfoTooltip";

interface LabourEfficiencyChartProps {
  data: Array<{
    name: string;
    projected: number;
    actual: number;
    rate: number;
  }>;
}

export const LabourEfficiencyChart = ({ data }: LabourEfficiencyChartProps) => {
  return (
    <Card className="p-6 bg-gradient-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-warning" />
        <h3 className="text-lg font-semibold text-foreground">Labour Efficiency</h3>
        <InfoTooltip content="Compare projected vs actual labour hours by project. Helps identify projects running over budget on labour costs and efficiency opportunities." />
      </div>
      {data.length === 0 ? (
        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
          No data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis 
            dataKey="name" 
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '11px' }}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            angle={-15}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { fontSize: '11px' } }}
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '11px' }}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              color: 'hsl(var(--foreground))',
            }}
            formatter={(value: number, name: string) => [value.toLocaleString() + ' hrs', name]}
          />
          <Legend 
            wrapperStyle={{ 
              fontSize: '11px',
              paddingTop: '20px',
            }}
            iconType="rect"
          />
          <Bar
            dataKey="projected"
            fill="hsl(var(--chart-2))"
            radius={[6, 6, 0, 0]}
            name="Projected Hours"
            maxBarSize={60}
          />
          <Bar
            dataKey="actual"
            fill="hsl(var(--chart-4))"
            radius={[6, 6, 0, 0]}
            name="Actual Hours"
            maxBarSize={60}
          />
        </BarChart>
      </ResponsiveContainer>
      )}
    </Card>
  );
};