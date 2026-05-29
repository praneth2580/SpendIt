import type { AppSettings, Category, Transaction } from '../store/types';

export const DEFAULT_SETTINGS: AppSettings = {
  currency: 'USD',
  theme: 'dark',
  monthlyBudget: 6000,
  startingNetWorth: 138405.5,
  netWorthChangePercent: 12.4,
  smsAutoImport: false,
  smsImportMode: 'confirm',
};

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'food',
    name: 'Food',
    spent: 0,
    budget: 1500,
    icon: 'restaurant',
    color: 'tertiary',
  },
  {
    id: 'transit',
    name: 'Transit',
    spent: 0,
    budget: 800,
    icon: 'directions_car',
    color: 'secondary',
  },
  {
    id: 'shopping',
    name: 'Shopping',
    spent: 0,
    budget: 2000,
    icon: 'shopping_bag',
    color: 'primary',
  },
  {
    id: 'bills',
    name: 'Bills',
    spent: 0,
    budget: 1200,
    icon: 'receipt_long',
    color: 'primary',
  },
  {
    id: 'travel',
    name: 'Travel',
    spent: 0,
    budget: 2500,
    icon: 'flight_takeoff',
    color: 'secondary',
  },
];

export const DEFAULT_ACCOUNTS = [
  {
    id: 'checking-main',
    name: 'Main Checking',
    type: 'checking' as const,
    icon: 'account_balance',
    color: 'primary' as const,
    startingBalance: 84200,
    balance: 84200,
  },
  {
    id: 'savings-emergency',
    name: 'Emergency Savings',
    type: 'savings' as const,
    icon: 'savings',
    color: 'secondary' as const,
    startingBalance: 52000,
    balance: 52000,
  },
  {
    id: 'credit-card',
    name: 'Credit Card',
    type: 'credit' as const,
    icon: 'credit_card',
    color: 'tertiary' as const,
    startingBalance: -2205.5,
    balance: -2205.5,
  },
];

function hoursAgo(hours: number): string {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date.toISOString();
}

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

export const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: 'seed-1',
    merchant: 'Apple Store',
    createdAt: hoursAgo(2),
    amount: -1299,
    icon: 'devices',
    iconColor: 'white',
    categoryId: 'shopping',
    accountId: 'credit-card',
    type: 'expense',
  },
  {
    id: 'seed-2',
    merchant: 'Salary Deposit',
    createdAt: daysAgo(1),
    amount: 5400,
    icon: 'arrow_downward',
    iconColor: 'secondary',
    accountId: 'checking-main',
    type: 'income',
  },
  {
    id: 'seed-3',
    merchant: 'Artisan Coffee',
    createdAt: daysAgo(12),
    amount: -6.5,
    icon: 'local_cafe',
    iconColor: 'white',
    categoryId: 'food',
    accountId: 'checking-main',
    type: 'expense',
  },
];

export const CATEGORY_ICON_OPTIONS = [
  'restaurant',
  'directions_car',
  'shopping_bag',
  'receipt_long',
  'flight_takeoff',
  'local_cafe',
  'home',
  'fitness_center',
  'medical_services',
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
