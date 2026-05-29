import type { AppSettings, Category, Transaction } from '../store/useStore';

export const DEFAULT_SETTINGS: AppSettings = {
  currency: 'USD',
  theme: 'dark',
  monthlyBudget: 6000,
  startingNetWorth: 138405.5,
  netWorthChangePercent: 12.4,
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
    type: 'expense',
  },
  {
    id: 'seed-2',
    merchant: 'Salary Deposit',
    createdAt: daysAgo(1),
    amount: 5400,
    icon: 'arrow_downward',
    iconColor: 'secondary',
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
    type: 'expense',
  },
];
