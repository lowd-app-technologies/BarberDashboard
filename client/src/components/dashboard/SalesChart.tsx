import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, ChevronDown } from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

// Sample data structure
interface SalesData {
  name: string;
  sales: number;
}

interface SalesChartProps {
  data?: SalesData[];
  title?: string;
  className?: string;
  periodOptions?: string[];
  onPeriodChange?: (period: string) => void;
}

export function SalesChart({
  data,
  title = "Vendas da Semana",
  className,
  periodOptions = ["Hoje", "Esta Semana", "Este Mês", "Período Personalizado"],
  onPeriodChange
}: SalesChartProps) {
  const [period, setPeriod] = useState(periodOptions[1]);
  const [chartData, setChartData] = useState<SalesData[]>([]);

  // Update chart data when data prop changes
  useEffect(() => {
    if (data) {
      setChartData(data);
    } else {
      // Default data if none provided
      setChartData([
        { name: "Seg", sales: 1200 },
        { name: "Ter", sales: 1900 },
        { name: "Qua", sales: 1500 },
        { name: "Qui", sales: 2400 },
        { name: "Sex", sales: 2700 },
        { name: "Sáb", sales: 3500 },
        { name: "Dom", sales: 1700 }
      ]);
    }
  }, [data]);

  const handlePeriodChange = (selectedPeriod: string) => {
    setPeriod(selectedPeriod);
    if (onPeriodChange) {
      onPeriodChange(selectedPeriod);
    }
  };

  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:text-accent-foreground h-9 px-3 text-muted-foreground">
              {period}
              <ChevronDown className="ml-2 h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {periodOptions.map((option) => (
              <DropdownMenuItem 
                key={option}
                onClick={() => handlePeriodChange(option)}
              >
                {option}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                vertical={false} 
                stroke="hsl(var(--border))" 
              />
              <XAxis 
                dataKey="name" 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `€${value}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  color: 'hsl(var(--card-foreground))'
                }}
                formatter={(value) => [`€${value}`, 'Vendas']}
              />
              <Area 
                type="monotone" 
                dataKey="sales" 
                stroke="hsl(var(--primary))" 
                fillOpacity={1} 
                fill="url(#colorSales)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
