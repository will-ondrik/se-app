import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { InfoTooltip } from "../InfoTooltip";

interface RevenueTrendChartProps {
  data: Array<{
    month: string;
    revenue: number;
    grossProfit: number;
    netProfit: number;
  }>;
}

export const RevenueTrendChart = ({ data }: RevenueTrendChartProps) => {
  const formatCurrency = (value: number) => {
    return `$${(value / 1000).toFixed(0)}k`;
  };

  return (
    <Card className="p-6 bg-gradient-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Revenue & Profit Trends</h3>
        <InfoTooltip content="Track your project revenue and profit margins over time. Shows total revenue, gross profit (after direct costs), and net profit (after all expenses)." />
      </div>
      {data.length === 0 ? (
        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
          No data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis 
            dataKey="month" 
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '11px' }}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis 
            tickFormatter={formatCurrency}
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
            formatter={(value: number) => `$${value.toLocaleString()}`}
          />
          <Legend 
            wrapperStyle={{ 
              fontSize: '11px',
              paddingTop: '20px',
            }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5 }}
            name="Revenue"
          />
          <Line
            type="monotone"
            dataKey="netProfit"
            stroke="hsl(var(--chart-3))"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5 }}
            name="Net Profit"
            strokeDasharray="5 5"
          />
        </LineChart>
      </ResponsiveContainer>
      )}
    </Card>
  );
};