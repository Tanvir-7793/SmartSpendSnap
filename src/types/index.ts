export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
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
  quantity?: number;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}
