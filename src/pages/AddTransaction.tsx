import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Upload, Receipt, ArrowDownRight, ArrowUpRight, X } from 'lucide-react';
import { analyzeReceipt } from '@/lib/gemini';
import { db, auth, addTransaction } from '@/lib/firebase';
import Layout from '@/components/Layout';
import { currencies, convertCurrency } from '@/lib/currency';

const AddTransaction = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUser, setCurrentUser] = useState<{ email: string | null } | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    setCurrentUser(user ? { email: user.email } : null);
  }, []);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    merchant: '',
    notes: '',
    isExpense: true,
    currency: 'USD'
  });
  const [previousCurrency, setPreviousCurrency] = useState('USD');
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const expenseCategories = [
    'Food', 'Transportation', 'Shopping', 'Entertainment', 
    'Bills', 'Healthcare', 'Education', 'Other'
  ];

  const incomeCategories = [
    'Salary', 'Freelance', 'Investments', 'Gifts', 
    'Business', 'Rental', 'Other'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value || '' }));
  };

  const handleCurrencyChange = async (newCurrency: string) => {
    if (formData.amount && !isConverting) {
      setIsConverting(true);
      try {
        const amount = parseFloat(formData.amount);
        if (!isNaN(amount)) {
          const result = await convertCurrency(amount, previousCurrency, newCurrency);
          if (result && result.converted_amount) {
            setFormData(prev => ({
              ...prev,
              amount: result.converted_amount.toFixed(2),
              currency: result.currency || newCurrency
            }));
            toast({
              title: "Amount converted",
              description: `Converted from ${previousCurrency} to ${newCurrency}`,
            });
          }
        }
      } catch (error) {
        console.error('Error converting currency:', error);
        toast({
          title: "Conversion error",
          description: "Failed to convert amount. Using original value.",
          variant: "destructive",
        });
      } finally {
        setIsConverting(false);
      }
    } else {
      setFormData(prev => ({ ...prev, currency: newCurrency }));
    }
    setPreviousCurrency(newCurrency);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Image = event.target?.result as string;
        if (base64Image) {
          const receiptData = await analyzeReceipt(base64Image);
          if (receiptData) {
            setFormData(prev => ({
              ...prev,
              description: receiptData.description,
              amount: receiptData.amount.toString(),
              merchant: receiptData.merchant,
              date: receiptData.date,
              category: receiptData.category,
              isExpense: receiptData.type === 'expense',
              currency: receiptData.currency || 'USD'
            }));
            toast({
              title: "Receipt analyzed",
              description: "Receipt information has been filled in automatically.",
            });
          }
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Error",
        description: "Failed to process the uploaded file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Failed to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
  };

  const captureImage = async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext('2d');
    context?.drawImage(videoRef.current, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg');

    stopCamera();
    await processReceiptImage(imageData);
  };

  const processReceiptImage = async (imageData: string) => {
    setIsScanning(true);
    try {
      const receiptData = await analyzeReceipt(imageData);
      if (receiptData) {
        setFormData(prev => ({
          ...prev,
          description: receiptData.description || '',
          amount: receiptData.amount?.toString() || '0',
          merchant: receiptData.merchant || '',
          date: receiptData.date || new Date().toISOString().split('T')[0],
          category: receiptData.category || '',
          isExpense: receiptData.type === 'expense',
          currency: receiptData.currency || 'USD'
        }));
        toast({
          title: "Receipt scanned",
          description: "Receipt information has been filled in automatically.",
        });
      }
    } catch (error) {
      console.error('Error processing receipt:', error);
      toast({
        title: "Error",
        description: "Failed to process receipt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleScanReceipt = async () => {
    setShowCamera(true);
    await startCamera();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await addTransaction({
        ...formData,
        amount: parseFloat(formData.amount),
        date: new Date(formData.date).toISOString(),
        currency: formData.currency
      });

      toast({
        title: "Success",
        description: "Transaction added successfully",
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: "Error",
        description: "Failed to add transaction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6 pb-16 md:pb-0">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Add Transaction</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload or Scan Receipt</CardTitle>
            <CardDescription>
              Choose a method to add your transaction details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="flex items-center gap-2 h-24"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="h-8 w-8 text-blue-500" />
                <div className="flex flex-col items-center">
                  <span>Upload Receipt</span>
                  <span className="text-xs text-gray-500">From your device</span>
                </div>
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  </div>
                )}
              </Button>

              <Button
                variant="outline"
                className="flex items-center gap-2 h-24"
                onClick={handleScanReceipt}
                disabled={isScanning || showCamera}
              >
                <Camera className="h-8 w-8 text-green-500" />
                <div className="flex flex-col items-center">
                  <span>Scan Receipt</span>
                  <span className="text-xs text-gray-500">Using camera</span>
                </div>
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                  </div>
                )}
              </Button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
          </CardContent>
        </Card>

        {showCamera && (
          <Card className="relative">
            <CardContent className="p-4">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={stopCamera}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-4 flex justify-center">
                <Button onClick={captureImage} className="gap-2">
                  <Camera className="h-4 w-4" />
                  Capture Receipt
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
            <CardDescription>
              Enter or review the transaction information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-4 mb-4">
                <Button
                  type="button"
                  variant={formData.isExpense ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setFormData(prev => ({ ...prev, isExpense: true }))}
                >
                  <ArrowDownRight className="h-4 w-4 mr-2" />
                  Expense
                </Button>
                <Button
                  type="button"
                  variant={!formData.isExpense ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setFormData(prev => ({ ...prev, isExpense: false }))}
                >
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  Income
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <div className="relative">
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={handleInputChange}
                      required
                      className={isConverting ? 'opacity-50' : ''}
                    />
                    {isConverting && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {(formData.isExpense ? expenseCategories : incomeCategories).map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.currency}
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
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                {formData.isExpense && (
                  <div className="space-y-2">
                    <Label htmlFor="merchant">Merchant</Label>
                    <Input
                      id="merchant"
                      name="merchant"
                      value={formData.merchant}
                      onChange={handleInputChange}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Add any additional notes about this transaction"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Adding...' : 'Add Transaction'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Connect with Gmail</CardTitle>
            {/* <CardDescription>
              Your email: <span className="font-medium">{currentUser?.email || 'Not available'}</span>
            </CardDescription> */}
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Your email: <span className="font-medium">{currentUser?.email || 'Not available'}</span>
              </p>
              <a
                href="https://mail.google.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="default">Go to Gmail</Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AddTransaction;
