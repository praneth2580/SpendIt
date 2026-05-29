export type TransactionType = 'expense' | 'income' | 'transfer';

export interface Transaction {
  id: string;
  merchant: string;
  createdAt: string;
  /**
   * Signed for expense/income (expense < 0, income > 0).
   * Positive for transfers (moved amount).
   */
  amount: number;
  icon: string;
  iconColor: 'white' | 'primary' | 'secondary' | 'tertiary';
  categoryId?: string;
  /** Used for expense/income. Transfers use fromAccountId/toAccountId. */
  accountId?: string;
  type: TransactionType;
  /** Transfers only */
  fromAccountId?: string;
  /** Transfers only */
  toAccountId?: string;
  /** Set when generated from a recurring rule */
  recurringRuleId?: string;
}

export interface Category {
  id: string;
  name: string;
  spent: number;
  budget: number;
  /** Whether this category participates in budget UI/totals */
  budgetEnabled: boolean;
  /** If enabled, unused budget rolls over month-to-month (v2) */
  rolloverEnabled?: boolean;
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

/** How due recurring rules become transactions */
export type RecurringApplyMode =
  | 'auto'
  | 'confirm'
  | 'smart';

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
  /**
   * smart = match existing tx on due day, else ask;
   * confirm = always ask before creating;
   * auto = create immediately (legacy)
   */
  recurringApplyMode?: RecurringApplyMode;
  /** Calendar days around due date to match an existing transaction */
  recurringMatchWindowDays?: number;
  /** Amount match tolerance in percent (e.g. 5 = ±5%) */
  recurringAmountTolerancePercent?: number;
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

/** A due recurring run waiting for confirm / link / create */
export interface PendingRecurringInstance {
  id: string;
  ruleId: string;
  dueAt: string;
  /** Best existing transaction match on due day, if any */
  suggestedMatchId?: string;
}

export interface UserSummary {
  totalNetWorth: number;
  monthlySpent: number;
  monthlyBudget: number;
  netWorthChangePercent: number;
}

export type RecurringCadence = 'daily' | 'weekly' | 'monthly';
export type RecurringRuleType = 'expense' | 'income' | 'transfer';

export interface RecurringRule {
  id: string;
  name: string;
  /** Positive amount in the app currency */
  amount: number;
  type: RecurringRuleType;
  categoryId?: string;
  /** Used for expense/income */
  accountId?: string;
  /** Used for transfers */
  fromAccountId?: string;
  toAccountId?: string;
  cadence: RecurringCadence;
  interval: number;
  startDate: string; // ISO date (yyyy-mm-dd)
  nextRunAt: string; // ISO datetime
  endDate?: string; // ISO date (yyyy-mm-dd)
  active: boolean;
}

export interface AppDataState {
  hydrated: boolean;
  user: UserSummary;
  settings: AppSettings;
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  pendingUpiImport: PendingUpiImport | null;
  /** Queue of due recurring items needing approval (FIFO) */
  pendingRecurringQueue: PendingRecurringInstance[];
  processedSmsKeys: string[];
  extractionRules: ExtractionRule[];
  recurringRules: RecurringRule[];
}

export type NewCategory = Omit<Category, 'id' | 'spent'>;
export type NewAccount = Omit<Account, 'id' | 'balance'>;
