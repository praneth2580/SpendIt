import type { AppSettings, Category, Transaction } from '../store/types';

export const DEFAULT_SETTINGS: AppSettings = {
  currency: 'INR',
  theme: 'dark',
  monthlyBudget: 50000,
  startingNetWorth: 0,
  netWorthChangePercent: 0,
  smsAutoImport: false,
  smsImportMode: 'confirm',
  recurringApplyMode: 'smart',
  recurringMatchWindowDays: 1,
  recurringAmountTolerancePercent: 5,
};

/** Common expense categories — no demo spend data. */
export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'food',
    name: 'Food & Dining',
    spent: 0,
    budget: 8000,
    budgetEnabled: true,
    rolloverEnabled: false,
    icon: 'restaurant',
    color: 'tertiary',
  },
  {
    id: 'transport',
    name: 'Transport',
    spent: 0,
    budget: 5000,
    budgetEnabled: true,
    rolloverEnabled: false,
    icon: 'directions_car',
    color: 'secondary',
  },
  {
    id: 'shopping',
    name: 'Shopping',
    spent: 0,
    budget: 10000,
    budgetEnabled: true,
    rolloverEnabled: false,
    icon: 'shopping_bag',
    color: 'primary',
  },
  {
    id: 'bills',
    name: 'Bills & Utilities',
    spent: 0,
    budget: 8000,
    budgetEnabled: true,
    rolloverEnabled: false,
    icon: 'receipt_long',
    color: 'primary',
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    spent: 0,
    budget: 4000,
    budgetEnabled: true,
    rolloverEnabled: false,
    icon: 'movie',
    color: 'secondary',
  },
  {
    id: 'health',
    name: 'Health',
    spent: 0,
    budget: 5000,
    budgetEnabled: true,
    rolloverEnabled: false,
    icon: 'medical_services',
    color: 'tertiary',
  },
  {
    id: 'home',
    name: 'Home & Rent',
    spent: 0,
    budget: 15000,
    budgetEnabled: true,
    rolloverEnabled: false,
    icon: 'home',
    color: 'primary',
  },
  {
    id: 'other',
    name: 'Other',
    spent: 0,
    budget: 3000,
    budgetEnabled: false,
    rolloverEnabled: false,
    icon: 'more_horiz',
    color: 'secondary',
  },
];

export const DEFAULT_ACCOUNTS = [
  {
    id: 'cash',
    name: 'Cash',
    type: 'cash' as const,
    icon: 'payments',
    color: 'primary' as const,
    startingBalance: 0,
    balance: 0,
  },
];

export const DEFAULT_TRANSACTIONS: Transaction[] = [];

export const CATEGORY_ICON_OPTIONS = [
  'restaurant',
  'directions_car',
  'shopping_bag',
  'receipt_long',
  'movie',
  'medical_services',
  'home',
  'more_horiz',
  'flight_takeoff',
  'local_cafe',
  'fitness_center',
  'school',
  'pets',
  'celebration',
] as const;

export const COLOR_OPTIONS = ['primary', 'secondary', 'tertiary'] as const;

export const ACCOUNT_TYPE_OPTIONS = [
  { value: 'checking' as const, label: 'Checking', icon: 'account_balance' },
  { value: 'savings' as const, label: 'Savings', icon: 'savings' },
  { value: 'credit' as const, label: 'Credit', icon: 'credit_card' },
  { value: 'cash' as const, label: 'Cash', icon: 'payments' },
];
