import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, FileText, FileJson, Trash2, ArrowRight } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, getDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { convertCurrency, currencies } from '@/lib/currency';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Transaction } from '@/types/transaction';

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const { data: transactions = [] } = useTransactions();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [conversionResult, setConversionResult] = useState<{ converted_amount: number; currency: string } | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setEmail(currentUser.email || '');
      // Fetch user profile data
      const fetchUserProfile = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setName(userData.displayName || '');
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      };
      fetchUserProfile();
    }
  }, [currentUser]);

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    
    setIsSaving(true);
    try {
      // Update user profile in Firestore
      await updateDoc(doc(db, 'users', currentUser.uid), {
        displayName: name,
        updatedAt: new Date().toISOString()
      });

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = () => {
    navigate('/reports');
  };

  const handleResetData = async () => {
    if (!window.confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
      return;
    }

    setIsResetting(true);
    try {
      // Get all transaction documents
      const transactionsRef = collection(db, 'transactions');
      const snapshot = await getDocs(transactionsRef);
      
      // Delete each transaction
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      toast({
        title: "Success",
        description: "All data has been reset successfully.",
      });
    } catch (error) {
      console.error('Error resetting data:', error);
      toast({
        title: "Error",
        description: "Failed to reset data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleCurrencyChange = async (currency: string) => {
    setSelectedCurrency(currency);
    setIsConverting(true);
    try {
      // Convert all transactions to the new currency
      const convertedTransactions = await Promise.all(
        transactions.map(async (transaction) => {
          try {
            const result = await convertCurrency(transaction.amount, transaction.currency || 'USD', currency);
            return {
              ...transaction,
              amount: result.converted_amount,
              currency: result.currency
            };
          } catch (error) {
            console.error('Error converting transaction:', error);
            // Keep the original transaction if conversion fails
            return transaction;
          }
        })
      );

      // Update transactions in Firestore
      const batch = writeBatch(db);
      convertedTransactions.forEach((transaction) => {
        const transactionRef = doc(db, 'transactions', transaction.id);
        batch.update(transactionRef, {
          amount: transaction.amount,
          currency: transaction.currency
        });
      });
      await batch.commit();

      // Update user's preferred currency
      if (currentUser) {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          currency: currency,
          updatedAt: new Date().toISOString()
        });
      }

      setConversionResult({
        converted_amount: convertedTransactions.reduce((sum, t) => sum + t.amount, 0),
        currency: currency
      });

      toast({
        title: "Success",
        description: `All transactions have been converted to ${currency}`,
      });
    } catch (error) {
      console.error('Error converting currency:', error);
      toast({
        title: "Error",
        description: "Some transactions may not have been converted. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-8 pb-16 md:pb-0">
        <h1 className="text-2xl font-bold">Settings</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>
              Manage your account information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Your Name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                disabled
              />
              <p className="text-sm text-muted-foreground">
                Email cannot be changed
              </p>
            </div>
            <Button 
              type="button"
              onClick={handleSaveProfile}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Profile'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>
              Customize your app experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications" className="flex flex-col items-start gap-1">
                <span>Notifications</span>
                <span className="font-normal text-sm text-muted-foreground">
                  Receive alerts for important updates
                </span>
              </Label>
              <Switch 
                id="notifications" 
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="darkMode" className="flex flex-col items-start gap-1">
                <span>Dark Mode</span>
                <span className="font-normal text-sm text-muted-foreground">
                  Use dark theme across the app
                </span>
              </Label>
              <Switch 
                id="darkMode" 
                checked={darkModeEnabled}
                onCheckedChange={setDarkModeEnabled}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Currency Settings</CardTitle>
            <CardDescription>
              Set your preferred currency for all transactions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Default Currency</Label>
              <Select
                value={selectedCurrency}
                onValueChange={handleCurrencyChange}
                disabled={isConverting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.name} ({currency.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isConverting && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Converting transactions...
                </div>
              )}
            </div>
            {conversionResult && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Currency Conversion</AlertTitle>
                <AlertDescription>
                  All transactions have been converted to {conversionResult.currency}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="text-xl">Data Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <AlertTitle className="text-yellow-800">Data Management</AlertTitle>
              <AlertDescription className="text-yellow-700">
                Manage your transaction data. Export for backup or reset to start fresh.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={handleExportData}
                variant="outline"
                className="flex items-center gap-2 hover:bg-gray-100 h-24"
              >
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <span>Export Data</span>
                  <span className="text-xs text-gray-500">Backup your transactions</span>
                  <ArrowRight className="h-4 w-4 text-blue-500" />
                </div>
              </Button>

              <Button
                onClick={handleResetData}
                variant="outline"
                className="flex items-center gap-2 hover:bg-red-50 h-24"
                disabled={isResetting}
              >
                <div className="flex flex-col items-center gap-2">
                  <Trash2 className="h-8 w-8 text-red-500" />
                  <span>Reset All Data</span>
                  <span className="text-xs text-gray-500">Clear all transactions</span>
                  {isResetting && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                  )}
                </div>
              </Button>
            </div>

            <div className="text-sm text-gray-500">
              <p>Current data summary:</p>
              <ul className="list-disc list-inside mt-2">
                <li>{transactions.length} total transactions</li>
                <li>
                  ${transactions.filter(t => !t.isExpense).reduce((sum, t) => sum + t.amount, 0).toFixed(2)} total income
                </li>
                <li>
                  ${transactions.filter(t => t.isExpense).reduce((sum, t) => sum + t.amount, 0).toFixed(2)} total expenses
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Settings;
