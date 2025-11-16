import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import { InfoTooltip } from "../InfoTooltip";

interface ChangeOrdersChartProps {
  data: Array<{
    name: string;
    count: number;
    revenue: number;
  }>;
}

export const ChangeOrdersChart = ({ data }: ChangeOrdersChartProps) => {
  const formatCurrency = (value: number) => {
    return `$${(value / 1000).toFixed(0)}k`;
  };

  return (
    <Card className="p-6 bg-gradient-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="h-5 w-5 text-accent" />
        <h3 className="text-lg font-semibold text-foreground">Change Orders Impact</h3>
        <InfoTooltip content="Track the frequency and financial impact of change orders over time. High counts may indicate scoping issues." />
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
          />
          <YAxis 
            yAxisId="left"
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '11px' }}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { fontSize: '11px' } }}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right"
            tickFormatter={formatCurrency}
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '11px' }}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            label={{ value: 'Revenue', angle: 90, position: 'insideRight', style: { fontSize: '11px' } }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              color: 'hsl(var(--foreground))',
            }}
            formatter={(value: number, name: string) => {
              if (name === "Revenue") return [`$${value.toLocaleString()}`, name];
              return [value, name];
            }}
          />
          <Legend 
            wrapperStyle={{ 
              fontSize: '11px',
              paddingTop: '20px',
            }}
            iconType="rect"
          />
          <Bar
            yAxisId="left"
            dataKey="count"
            fill="hsl(var(--chart-4))"
            radius={[6, 6, 0, 0]}
            name="Count"
            maxBarSize={50}
          />
          <Bar
            yAxisId="right"
            dataKey="revenue"
            fill="hsl(var(--chart-1))"
            radius={[6, 6, 0, 0]}
            name="Revenue"
            maxBarSize={50}
          />
        </BarChart>
      </ResponsiveContainer>
      )}
    </Card>
  );
};