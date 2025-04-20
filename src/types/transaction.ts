export interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  isExpense: boolean;
  receiptUrl?: string;
  merchant?: string;
  items?: TransactionItem[];
  currency?: string;
}

export interface TransactionItem {
  name: string;
  price: number;
  quantity: number;
} 