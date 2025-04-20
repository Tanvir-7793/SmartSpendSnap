
import React, { useMemo } from "react";
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend,
  CartesianGrid 
} from "recharts";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { Transaction } from "@/types";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface MonthlyOverviewChartProps {
  transactions: Transaction[];
  currentMonth?: Date;
}

export function MonthlyOverviewChart({ transactions, currentMonth = new Date() }: MonthlyOverviewChartProps) {
  const chartData = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    return daysInMonth.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayTransactions = transactions.filter(t => 
        t.date.substring(0, 10) === dayStr
      );
      
      const income = dayTransactions
        .filter(t => !t.isExpense)
        .reduce((sum, t) => sum + t.amount, 0);
        
      const expense = dayTransactions
        .filter(t => t.isExpense)
        .reduce((sum, t) => sum + t.amount, 0);
        
      return {
        date: dayStr,
        displayDate: format(day, 'dd'),
        income,
        expense
      };
    });
  }, [transactions, currentMonth]);

  const chartConfig = {
    income: {
      label: "Income",
      color: "#10B981"
    },
    expense: {
      label: "Expense", 
      color: "#EF4444"
    }
  };

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="displayDate"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis 
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value}`}
            tickMargin={8}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="income" fill="#10B981" stackId="a" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" fill="#EF4444" stackId="b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <ChartTooltipContent>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <div 
              className="h-2.5 w-2.5 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}</span>
          </div>
          <span className="font-medium">${entry.value.toFixed(2)}</span>
        </div>
      ))}
    </ChartTooltipContent>
  );
};
