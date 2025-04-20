
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PiggyBank, Coins, DollarSign, Wallet, BarChart } from 'lucide-react';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import { useTransactions } from '@/hooks/useTransactions';
import { getFinancialTips } from '@/lib/gemini';
import { Skeleton } from '@/components/ui/skeleton';

interface Tip {
  title: string;
  description: string;
  icon: string;
}

export function FinancialTips() {
  const [tips, setTips] = React.useState<Tip[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { data: transactions } = useTransactions();

  React.useEffect(() => {
    async function fetchTips() {
      if (!transactions || transactions.length === 0) return;
      
      try {
        const fetchedTips = await getFinancialTips(transactions);
        setTips(fetchedTips);
      } catch (error) {
        console.error("Error fetching tips:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTips();
  }, [transactions]);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'piggy-bank':
        return <PiggyBank className="h-5 w-5 text-indigo-500" />;
      case 'coins':
        return <Coins className="h-5 w-5 text-amber-500" />;
      case 'dollar-sign':
        return <DollarSign className="h-5 w-5 text-green-500" />;
      case 'wallet':
        return <Wallet className="h-5 w-5 text-blue-500" />;
      case 'chart-bar':
        return <BarChart className="h-5 w-5 text-purple-500" />;
      default:
        return <PiggyBank className="h-5 w-5 text-indigo-500" />;
    }
  };

  if (loading) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Financial Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!tips.length) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Financial Tips</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tips.map((tip, index) => (
            <HoverCard key={index}>
              <HoverCardTrigger asChild>
                <div className="flex items-start space-x-3 cursor-pointer p-3 rounded-md hover:bg-muted/50 transition-colors">
                  <div className="mt-1">
                    {getIcon(tip.icon)}
                  </div>
                  <div>
                    <h4 className="font-medium">{tip.title}</h4>
                  </div>
                </div>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">{tip.title}</h4>
                  <p className="text-sm">{tip.description}</p>
                </div>
              </HoverCardContent>
            </HoverCard>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
