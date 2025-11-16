import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card } from "@/components/ui/card";
import { Layers } from "lucide-react";
import { InfoTooltip } from "../InfoTooltip";

interface BusinessMixChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-6))',
];

export const BusinessMixChart = ({ data }: BusinessMixChartProps) => {
  const formatCurrency = (value: number) => {
    return `$${(value / 1000).toFixed(0)}k`;
  };

  return (
    <Card className="p-6 bg-gradient-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="h-5 w-5 text-success" />
        <h3 className="text-lg font-semibold text-foreground">Business Type Mix</h3>
        <InfoTooltip content="Visual breakdown of your project portfolio by business type. Shows the distribution of revenue across different customer segments." />
      </div>
      {data.length === 0 ? (
        <div className="h-[350px] flex items-center justify-center text-muted-foreground">
          No data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="42%"
            labelLine={false}
            label={false}
            outerRadius={100}
            innerRadius={60}
            fill="#8884d8"
            dataKey="value"
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              color: 'hsl(var(--foreground))',
            }}
            formatter={(value: number, name: string) => [formatCurrency(value), name]}
          />
          <Legend 
            wrapperStyle={{ 
              fontSize: '11px',
              paddingTop: '10px',
            }}
            layout="horizontal"
            align="center"
            verticalAlign="bottom"
            iconType="circle"
            formatter={(value, entry: any) => {
              const percent = entry.payload?.percent || 0;
              return `${value} (${(percent * 100).toFixed(0)}%)`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      )}
    </Card>
  );
};