import { create } from 'zustand';

export interface Transaction {
  id: string;
  merchant: string;
  date: string;
  amount: number;
  icon: string;
  iconColor: 'white' | 'primary' | 'secondary' | 'tertiary';
}

export interface Category {
  id: string;
  name: string;
  spent: number;
  budget: number;
  icon: string;
  color: 'primary' | 'secondary' | 'tertiary';
}

interface AppState {
  user: {
    totalNetWorth: number;
    monthlySpent: number;
    monthlyBudget: number;
    netWorthChangePercent: number;
  };
  transactions: Transaction[];
  categories: Category[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateBudget: (amount: number) => void;
}

export const useStore = create<AppState>((set) => ({
  user: {
    totalNetWorth: 142500.00,
    monthlySpent: 4250.00,
    monthlyBudget: 6000.00,
    netWorthChangePercent: 12.4,
  },
  transactions: [
    {
      id: '1',
      merchant: 'Apple Store',
      date: 'Today, 2:45 PM',
      amount: -1299.00,
      icon: 'ios',
      iconColor: 'white',
    },
    {
      id: '2',
      merchant: 'Salary Deposit',
      date: 'Yesterday',
      amount: 5400.00,
      icon: 'arrow_downward',
      iconColor: 'secondary',
    },
    {
      id: '3',
      merchant: 'Artisan Coffee',
      date: 'Aug 12',
      amount: -6.50,
      icon: 'local_cafe',
      iconColor: 'white',
    },
  ],
  categories: [
    {
      id: 'c1',
      name: 'Shopping',
      spent: 1240,
      budget: 2000,
      icon: 'shopping_cart',
      color: 'primary',
    },
    {
      id: 'c2',
      name: 'Dining',
      spent: 850,
      budget: 1500,
      icon: 'restaurant',
      color: 'tertiary',
    },
    {
      id: 'c3',
      name: 'Travel',
      spent: 2100,
      budget: 2500,
      icon: 'flight_takeoff',
      color: 'secondary',
    },
  ],
  addTransaction: (transaction) => set((state) => ({
    transactions: [
      { ...transaction, id: Math.random().toString(36).substr(2, 9) },
      ...state.transactions,
    ],
    user: {
      ...state.user,
      totalNetWorth: state.user.totalNetWorth + transaction.amount,
      monthlySpent: transaction.amount < 0 ? state.user.monthlySpent + Math.abs(transaction.amount) : state.user.monthlySpent,
    }
  })),
  updateBudget: (amount) => set((state) => ({
    user: {
      ...state.user,
      monthlyBudget: amount,
    }
  })),
}));
