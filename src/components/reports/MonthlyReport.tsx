import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Transaction } from '@/types/transaction';

interface MonthlyReportProps {
  transactions: Transaction[];
  isLoading: boolean;
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export const MonthlyReport = ({ 
  transactions, 
  isLoading, 
  currentDate,
  onDateChange 
}: MonthlyReportProps) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const monthlyTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate >= monthStart && transactionDate <= monthEnd;
  });

  const totalIncome = monthlyTransactions
    .filter(t => !t.isExpense)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = monthlyTransactions
    .filter(t => t.isExpense)
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = totalIncome - totalExpenses;

  const handlePreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() - 1);
    onDateChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + 1);
    onDateChange(newDate);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Report</CardTitle>
          <CardDescription>Loading monthly data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Monthly Report</CardTitle>
            <CardDescription>
              Summary for {format(currentDate, 'MMMM yyyy')}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-gray-500">Total Income</div>
              <div className="text-2xl font-bold text-emerald-500">
                ${totalIncome.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {monthlyTransactions.filter(t => !t.isExpense).length} income transactions
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-gray-500">Total Expenses</div>
              <div className="text-2xl font-bold text-rose-500">
                ${totalExpenses.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {monthlyTransactions.filter(t => t.isExpense).length} expense transactions
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-gray-500">Net Savings</div>
              <div className={`text-2xl font-bold ${netSavings >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                ${netSavings.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {monthlyTransactions.length} total transactions
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}; 