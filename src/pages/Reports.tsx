import { useState } from 'react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MonthlyOverviewChart } from '@/components/charts/MonthlyOverviewChart';
import { CategoryPieChart } from '@/components/charts/CategoryPieChart';
import { MonthlyReport } from '@/components/reports/MonthlyReport';
import { useTransactions } from '@/hooks/useTransactions';
import { CalendarIcon, RefreshCw, FileText, FileJson, Download, Calendar, BarChart2, PieChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

const Reports = () => {
  const { toast } = useToast();
  const [date, setDate] = useState<Date>(new Date());
  const { data: transactions = [], isLoading, isError, refetch } = useTransactions();
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  const handleRefresh = () => {
    refetch();
    toast({
      description: "Report data refreshed",
    });
  };

  const exportToCSV = () => {
    if (!transactions || transactions.length === 0) {
      toast({
        title: "No Data",
        description: "There are no transactions to export.",
        variant: "destructive",
      });
      return;
    }

    const headers = ['Date', 'Description', 'Merchant', 'Category', 'Amount', 'Type'];
    const csvContent = [
      headers.join(','),
      ...transactions.map(t => [
        new Date(t.date).toLocaleDateString(),
        `"${t.description.replace(/"/g, '""')}"`,
        `"${t.merchant.replace(/"/g, '""')}"`,
        `"${t.category || ''}"`,
        t.amount.toFixed(2),
        t.isExpense ? 'Expense' : 'Income'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    if (!transactions || transactions.length === 0) {
      toast({
        title: "No Data",
        description: "There are no transactions to export.",
        variant: "destructive",
      });
      return;
    }

    const jsonContent = JSON.stringify(transactions, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const noDataDisplay = (
    <div className="h-[300px] flex items-center justify-center border rounded-md">
      <p className="text-muted-foreground">
        {isLoading ? "Loading transaction data..." : 
         isError ? "Error loading transactions" : 
         "No transactions found. Add some transactions to see charts."}
      </p>
    </div>
  );

  // Calculate summary data
  const totalTransactions = transactions?.length || 0;
  const totalIncome = transactions?.filter(t => !t.isExpense).reduce((sum, t) => sum + t.amount, 0) || 0;
  const totalExpenses = transactions?.filter(t => t.isExpense).reduce((sum, t) => sum + t.amount, 0) || 0;

  return (
    <Layout>
      <div className="space-y-6 pb-16 md:pb-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground">
              Generate and export financial reports
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="h-4 w-4" />
              {selectedPeriod === 'all' ? 'All Time' : 
               selectedPeriod === 'month' ? 'This Month' : 'This Year'}
            </Button>
          </div>
        </div>

        <Card className="hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-white to-gray-50">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={exportToCSV}
                variant="outline"
                className="flex items-center gap-2 hover:bg-gray-100 h-24"
                disabled={!transactions || transactions.length === 0}
              >
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <span>Export as CSV</span>
                  <span className="text-xs text-gray-500">Spreadsheet format</span>
                </div>
              </Button>
              <Button
                onClick={exportToJSON}
                variant="outline"
                className="flex items-center gap-2 hover:bg-gray-100 h-24"
                disabled={!transactions || transactions.length === 0}
              >
                <div className="flex flex-col items-center gap-2">
                  <FileJson className="h-8 w-8 text-green-500" />
                  <span>Export as JSON</span>
                  <span className="text-xs text-gray-500">Data backup format</span>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Monthly Overview</CardTitle>
              <CardDescription>
                Your financial overview for {format(date, 'MMMM yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <MonthlyReport 
                  transactions={transactions} 
                  isLoading={isLoading} 
                  currentDate={date}
                  onDateChange={setDate}
                />
                {!transactions || transactions.length === 0 || isLoading ? (
                  noDataDisplay
                ) : (
                  <MonthlyOverviewChart 
                    transactions={transactions} 
                    currentMonth={date} 
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-blue-500" />
                Transaction Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Total Transactions</span>
                  <span className="font-medium">{totalTransactions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Total Income</span>
                  <span className="font-medium text-emerald-500">
                    ${totalIncome.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Total Expenses</span>
                  <span className="font-medium text-rose-500">
                    ${totalExpenses.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <PieChart className="h-5 w-5 text-purple-500" />
                Category Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!transactions || transactions.length === 0 ? (
                <p className="text-sm text-gray-500">No transaction data available</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(
                    transactions.reduce((acc, t) => {
                      const category = t.category || 'Uncategorized';
                      acc[category] = (acc[category] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  )
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([category, count]) => (
                    <div key={category} className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">{category}</span>
                      <span className="font-medium">{count} transactions</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Expense Categories</CardTitle>
            <CardDescription>
              Breakdown of your spending by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!transactions || transactions.length === 0 || isLoading ? (
              noDataDisplay
            ) : (
              <CategoryPieChart transactions={transactions} />
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Reports;
