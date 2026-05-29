export interface Transaction {
  id: string;
  merchant: string;
  createdAt: string;
  amount: number;
  icon: string;
  iconColor: 'white' | 'primary' | 'secondary' | 'tertiary';
  categoryId?: string;
  accountId?: string;
  type: 'expense' | 'income';
}

export interface Category {
  id: string;
  name: string;
  spent: number;
  budget: number;
  icon: string;
  color: 'primary' | 'secondary' | 'tertiary';
}

export type AccountType = 'checking' | 'savings' | 'credit' | 'cash';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  icon: string;
  color: 'primary' | 'secondary' | 'tertiary';
  startingBalance: number;
  balance: number;
}

export type SmsImportMode = 'confirm' | 'auto';

export interface AppSettings {
  currency: string;
  theme: 'dark' | 'light' | 'system';
  monthlyBudget: number;
  startingNetWorth: number;
  netWorthChangePercent: number;
  /** Android only: listen for bank/UPI SMS */
  smsAutoImport: boolean;
  /** confirm = bottom sheet; auto = save immediately */
  smsImportMode: SmsImportMode;
}

export type ExtractionTransactionType = 'any' | 'expense' | 'income';

export interface ExtractionRule {
  id: string;
  name: string;
  enabled: boolean;
  /** Lower number is checked first */
  priority: number;
  senderPattern?: string;
  bodyPattern?: string;
  merchantPattern?: string;
  transactionType: ExtractionTransactionType;
  categoryId?: string;
  accountId?: string;
  /** Use {merchant} for parsed payee name */
  noteTemplate?: string;
  promptCategory: boolean;
  promptAccount: boolean;
  promptNote: boolean;
}

export type NewExtractionRule = Omit<ExtractionRule, 'id' | 'priority'> & {
  priority?: number;
};

export interface PendingUpiImportAction {
  ruleId?: string;
  ruleName?: string;
  categoryId?: string;
  accountId?: string;
  merchant: string;
  type: 'expense' | 'income';
  promptCategory: boolean;
  promptAccount: boolean;
  promptNote: boolean;
}

export interface PendingUpiImport {
  id: string;
  amount: number;
  type: 'expense' | 'income';
  merchant: string;
  body: string;
  sender: string;
  timestamp: number;
  dedupeKey: string;
  action: PendingUpiImportAction;
}

export interface UserSummary {
  totalNetWorth: number;
  monthlySpent: number;
  monthlyBudget: number;
  netWorthChangePercent: number;
}

export interface AppDataState {
  hydrated: boolean;
  user: UserSummary;
  settings: AppSettings;
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  pendingUpiImport: PendingUpiImport | null;
  processedSmsKeys: string[];
  extractionRules: ExtractionRule[];
}

export type NewCategory = Omit<Category, 'id' | 'spent'>;
export type NewAccount = Omit<Account, 'id' | 'balance'>;
