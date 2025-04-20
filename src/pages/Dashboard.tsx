import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Transaction } from '@/types';
import Layout from '@/components/Layout';
import { DollarSign, TrendingUp, TrendingDown, Plus, Calendar, ArrowRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FinancialTips } from '@/components/FinancialTips';
import { useTransactions } from '@/hooks/useTransactions';
import { getUserTransactions } from '@/lib/firebase';
import { auth } from '@/lib/firebase';
import { getFinancialTips, getTransactionTips } from '@/lib/gemini';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { currencies } from '@/lib/currency';

interface FinancialTip {
  title: string;
  description: string;
  category: string;
  action: string;
}

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState('month');
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();
  const { data: transactions = [], isLoading } = useTransactions();
  const [overallTips, setOverallTips] = useState<FinancialTip[]>([]);
  const [transactionTips, setTransactionTips] = useState<Record<string, FinancialTip[]>>({});
  const [rateLimitExceeded, setRateLimitExceeded] = useState(false);
  const { currentUser } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  useEffect(() => {
    if (transactions.length > 0 || !isLoading) {
      setLoading(false);
    }
  }, [transactions, isLoading]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
          navigate('/login');
          return;
        }

        // Calculate total expenses and spending by category
        const expenses = transactions
          .filter(t => t.isExpense)
          .reduce((sum, t) => sum + t.amount, 0);
        
        const spendingByCategory = transactions
          .filter(t => t.isExpense)
          .reduce((acc, t) => {
            const category = t.category || 'Uncategorized';
            acc[category] = (acc[category] || 0) + t.amount;
            return acc;
          }, {} as Record<string, number>);

        // Get overall financial tips
        const tips = await getFinancialTips(expenses, spendingByCategory);
        if (tips.tips[0]?.title === "Rate Limit Exceeded") {
          setRateLimitExceeded(true);
        }
        setOverallTips(tips.tips);

        // Get tips for only the first 5 transactions to reduce API calls
        const transactionTipsMap: Record<string, FinancialTip[]> = {};
        for (const transaction of transactions.slice(0, 5)) {
          const tips = await getTransactionTips(transaction);
          if (tips.tips[0]?.title === "Rate Limit Exceeded") {
            setRateLimitExceeded(true);
            break;
          }
          transactionTipsMap[transaction.id] = tips.tips;
        }
        setTransactionTips(transactionTipsMap);

      } catch (error) {
        console.error('Error fetching data:', error);
        setRateLimitExceeded(true);
      }
    };

    if (transactions.length > 0) {
      fetchData();
    }
  }, [transactions, navigate]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setDisplayName(userData.displayName || '');
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };
    fetchUserProfile();
  }, [currentUser]);

  useEffect(() => {
    const fetchUserCurrency = async () => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setSelectedCurrency(userData.currency || 'USD');
          }
        } catch (error) {
          console.error('Error fetching user currency:', error);
        }
      }
    };
    fetchUserCurrency();
  }, [currentUser]);

  const income = transactions.filter(t => !t.isExpense).reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions.filter(t => t.isExpense).reduce((sum, t) => sum + t.amount, 0);
  const balance = income - expenses;

  const formatCurrency = (value: number) => {
    const currencyInfo = currencies.find(c => c.code === selectedCurrency);
    const symbol = currencyInfo?.symbol || '$';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedCurrency,
      currencyDisplay: 'symbol',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value).replace(selectedCurrency, symbol);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  // Filter transactions based on active tab
  const filteredTransactions = transactions.filter(transaction => {
    if (activeTab === 'all') return true;
    if (activeTab === 'income') return !transaction.isExpense;
    if (activeTab === 'expense') return transaction.isExpense;
    return true;
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    if (hour >= 17 && hour < 22) return 'Good Evening';
    return 'Good Night';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 pb-16 md:pb-0">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{getGreeting()}, {displayName || 'there'}!</h1>
            <p className="text-muted-foreground">Welcome back to your financial dashboard</p>
          </div>
          <Button onClick={() => navigate('/add-transaction')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatCurrency(balance)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {balance >= 0 ? '+20.1%' : '-20.1%'} from last month
              </p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-500">{formatCurrency(income)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                +20.1% from last month
              </p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <ArrowDownRight className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-500">{formatCurrency(expenses)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                +20.1% from last month
              </p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">
                {income > 0 ? ((income - expenses) / income * 100).toFixed(1) : '0'}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {income > 0 && ((income - expenses) / income * 100) > 0 ? '+20.1%' : '-20.1%'} from last month
              </p>
            </CardContent>
          </Card>
        </div>

        <FinancialTips />

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="text-xl">Financial Tips</CardTitle>
          </CardHeader>
          <CardContent>
            {rateLimitExceeded && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800">
                  Rate limit exceeded. Some tips may be limited. Please try again in a few minutes.
                </p>
              </div>
            )}
            <div className="space-y-4">
              {overallTips.map((tip, index) => (
                <div key={index} className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  <h3 className="font-medium text-blue-800">{tip.title}</h3>
                  <p className="text-sm text-blue-700 mt-1">{tip.description}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {tip.category}
                    </span>
                    <span className="text-xs text-blue-600">
                      {tip.action}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Recent Transactions</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={activeTab === 'all' ? 'default' : 'outline'}
                onClick={() => setActiveTab('all')}
                className="h-8"
              >
                All
              </Button>
              <Button
                variant={activeTab === 'income' ? 'default' : 'outline'}
                onClick={() => setActiveTab('income')}
                className="h-8"
              >
                Income
              </Button>
              <Button
                variant={activeTab === 'expense' ? 'default' : 'outline'}
                onClick={() => setActiveTab('expense')}
                className="h-8"
              >
                Expense
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {activeTab === 'all' ? 'No transactions yet' :
                   activeTab === 'income' ? 'No income transactions yet' :
                   'No expense transactions yet'}
                </p>
                <Button
                  variant="link"
                  onClick={() => navigate('/add-transaction')}
                  className="mt-2 text-primary hover:text-primary/90"
                >
                  Add your first {activeTab === 'all' ? 'transaction' : activeTab}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTransactions.map((transaction) => (
                  <div 
                    key={transaction.id} 
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{transaction.description}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {transaction.merchant} • {new Date(transaction.date).toLocaleDateString()}
                        </p>
                        {transaction.category && (
                          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full mt-2 inline-block">
                            {transaction.category}
                          </span>
                        )}
                      </div>
                      <span className={`font-medium ${transaction.isExpense ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {transaction.isExpense ? '-' : '+'}{formatCurrency(transaction.amount)}
                      </span>
                    </div>
                    
                    {/* Transaction-specific tips */}
                    {transactionTips[transaction.id] && (
                      <div className="mt-3 pt-3 border-t">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Tips for this transaction:</h4>
                        <div className="space-y-2">
                          {transactionTips[transaction.id].map((tip, index) => (
                            <div key={index} className="text-sm text-gray-600">
                              <span className="font-medium">{tip.title}:</span> {tip.description}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
