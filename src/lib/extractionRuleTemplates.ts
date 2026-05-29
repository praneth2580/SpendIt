import type { ExtractionRule } from '../store/types';

/** Starter rules seeded on first install — edit anytime in Settings. */
export const DEFAULT_EXTRACTION_RULES: ExtractionRule[] = [
  {
    id: 'rule-upi-debit',
    name: 'UPI payment (debited)',
    enabled: true,
    priority: 1,
    bodyPattern: 'upi',
    transactionType: 'expense',
    categoryId: undefined,
    accountId: 'checking-main',
    noteTemplate: '{merchant}',
    promptCategory: true,
    promptAccount: false,
    promptNote: true,
  },
  {
    id: 'rule-upi-credit',
    name: 'UPI received (credited)',
    enabled: true,
    priority: 2,
    bodyPattern: 'upi',
    transactionType: 'income',
    accountId: 'checking-main',
    noteTemplate: '{merchant}',
    promptCategory: false,
    promptAccount: false,
    promptNote: true,
  },
  {
    id: 'rule-food-zomato',
    name: 'Food — Zomato',
    enabled: true,
    priority: 3,
    bodyPattern: 'zomato',
    transactionType: 'expense',
    categoryId: 'food',
    accountId: 'checking-main',
    noteTemplate: '{merchant}',
    promptCategory: false,
    promptAccount: false,
    promptNote: true,
  },
  {
    id: 'rule-food-swiggy',
    name: 'Food — Swiggy',
    enabled: true,
    priority: 4,
    bodyPattern: 'swiggy',
    transactionType: 'expense',
    categoryId: 'food',
    accountId: 'checking-main',
    noteTemplate: '{merchant}',
    promptCategory: false,
    promptAccount: false,
    promptNote: true,
  },
  {
    id: 'rule-bank-debit',
    name: 'Bank debit (debited)',
    enabled: true,
    priority: 5,
    bodyPattern: 'debited',
    transactionType: 'expense',
    accountId: 'checking-main',
    noteTemplate: '{merchant}',
    promptCategory: true,
    promptAccount: true,
    promptNote: true,
  },
  {
    id: 'rule-bank-credit',
    name: 'Bank credit (credited)',
    enabled: true,
    priority: 6,
    bodyPattern: 'credited',
    transactionType: 'income',
    accountId: 'checking-main',
    noteTemplate: '{merchant}',
    promptCategory: false,
    promptAccount: true,
    promptNote: true,
  },
  {
    id: 'rule-imps-neft',
    name: 'IMPS / NEFT transfer',
    enabled: false,
    priority: 7,
    bodyPattern: 'imps',
    transactionType: 'expense',
    accountId: 'checking-main',
    noteTemplate: '{merchant}',
    promptCategory: true,
    promptAccount: true,
    promptNote: true,
  },
  {
    id: 'rule-catch-all-debit',
    name: 'Any debit (fallback)',
    enabled: true,
    priority: 99,
    bodyPattern: 'debited',
    transactionType: 'expense',
    accountId: 'checking-main',
    noteTemplate: '{merchant}',
    promptCategory: true,
    promptAccount: true,
    promptNote: true,
  },
];

export interface ExtractionRuleTemplate {
  id: string;
  title: string;
  description: string;
  /** Typical Indian bank / UPI SMS for reference */
  sampleSms: string;
  rule: Omit<ExtractionRule, 'id' | 'priority'>;
}

/** Templates users can add from Settings — same patterns as defaults, editable before save. */
export const EXTRACTION_RULE_TEMPLATES: ExtractionRuleTemplate[] = [
  {
    id: 'tpl-upi-debit',
    title: 'UPI payment (debited)',
    description:
      'Matches “Rs … debited” with UPI in the message. Common HDFC, SBI, ICICI formats.',
    sampleSms:
      'Rs.500.00 debited from A/c **1234 on 29-05-26. UPI 123456789012. Paid to ZOMATO LTD. Avl Bal Rs 12,000.',
    rule: {
      name: 'UPI payment (debited)',
      enabled: true,
      bodyPattern: 'upi',
      transactionType: 'expense',
      accountId: 'checking-main',
      noteTemplate: '{merchant}',
      promptCategory: true,
      promptAccount: false,
      promptNote: true,
    },
  },
  {
    id: 'tpl-upi-credit',
    title: 'UPI received (credited)',
    description: 'Money received via UPI — “credited” with UPI reference.',
    sampleSms:
      'Rs.1,200.00 credited to A/c **1234 on 29-05-26. UPI 987654321098 from JOHN DOE. Avl Bal Rs 13,200.',
    rule: {
      name: 'UPI received (credited)',
      enabled: true,
      bodyPattern: 'upi',
      transactionType: 'income',
      accountId: 'checking-main',
      noteTemplate: '{merchant}',
      promptCategory: false,
      promptAccount: false,
      promptNote: true,
    },
  },
  {
    id: 'tpl-bank-debit',
    title: 'Bank debit (debited)',
    description: 'Any account debit SMS without requiring the word UPI.',
    sampleSms:
      'INR 2,499.00 debited from your A/c **5678 on 28-05-26. Info: POS purchase. Available balance INR 45,000.',
    rule: {
      name: 'Bank debit (debited)',
      enabled: true,
      bodyPattern: 'debited',
      transactionType: 'expense',
      accountId: 'checking-main',
      noteTemplate: '{merchant}',
      promptCategory: true,
      promptAccount: true,
      promptNote: true,
    },
  },
  {
    id: 'tpl-bank-credit',
    title: 'Bank credit (credited)',
    description: 'Salary, refunds, or transfers credited to your account.',
    sampleSms:
      'Rs 50,000.00 credited to A/c XX1234 on 01-05-26. NEFT*SALARY*ACME CORP. Avl bal Rs 1,05,000.',
    rule: {
      name: 'Bank credit (credited)',
      enabled: true,
      bodyPattern: 'credited',
      transactionType: 'income',
      accountId: 'checking-main',
      noteTemplate: '{merchant}',
      promptCategory: false,
      promptAccount: true,
      promptNote: true,
    },
  },
  {
    id: 'tpl-food-zomato',
    title: 'Food — Zomato',
    description: 'Debit SMS mentioning Zomato — assigns Food category.',
    sampleSms:
      'Rs.350.00 debited from A/c **1234. UPI/pay to ZOMATO LTD. Ref 1234567890.',
    rule: {
      name: 'Food — Zomato',
      enabled: true,
      bodyPattern: 'zomato',
      transactionType: 'expense',
      categoryId: 'food',
      accountId: 'checking-main',
      noteTemplate: '{merchant}',
      promptCategory: false,
      promptAccount: false,
      promptNote: true,
    },
  },
  {
    id: 'tpl-food-swiggy',
    title: 'Food — Swiggy',
    description: 'Debit SMS mentioning Swiggy — assigns Food category.',
    sampleSms:
      'INR 220.50 debited. UPI-SWIGGY-ORDER@ybl. Paid to SWIGGY.',
    rule: {
      name: 'Food — Swiggy',
      enabled: true,
      bodyPattern: 'swiggy',
      transactionType: 'expense',
      categoryId: 'food',
      accountId: 'checking-main',
      noteTemplate: '{merchant}',
      promptCategory: false,
      promptAccount: false,
      promptNote: true,
    },
  },
  {
    id: 'tpl-shopping-amazon',
    title: 'Shopping — Amazon',
    description: 'Online shopping debits mentioning Amazon.',
    sampleSms:
      'Rs.1,299.00 debited from A/c **1234. UPI/AMAZON PAY. Ref 9988776655.',
    rule: {
      name: 'Shopping — Amazon',
      enabled: true,
      bodyPattern: 'amazon',
      transactionType: 'expense',
      categoryId: 'shopping',
      accountId: 'credit-card',
      noteTemplate: '{merchant}',
      promptCategory: false,
      promptAccount: false,
      promptNote: true,
    },
  },
  {
    id: 'tpl-imps-neft',
    title: 'IMPS / NEFT',
    description: 'Bank transfer debits via IMPS or NEFT keywords.',
    sampleSms:
      'Rs.5,000.00 debited from A/c **1234. IMPS/123456789012 to RENT PAYMENT.',
    rule: {
      name: 'IMPS / NEFT transfer',
      enabled: true,
      bodyPattern: 'imps',
      transactionType: 'expense',
      accountId: 'checking-main',
      noteTemplate: '{merchant}',
      promptCategory: true,
      promptAccount: true,
      promptNote: true,
    },
  },
  {
    id: 'tpl-catch-all',
    title: 'Any debit (fallback)',
    description:
      'Lowest priority catch-all for any “debited” SMS. Place at the bottom of your rule list.',
    sampleSms: 'Rs.100.00 debited from your account. Available balance updated.',
    rule: {
      name: 'Any debit (fallback)',
      enabled: true,
      bodyPattern: 'debited',
      transactionType: 'expense',
      accountId: 'checking-main',
      noteTemplate: '{merchant}',
      promptCategory: true,
      promptAccount: true,
      promptNote: true,
    },
  },
];

export function templateToDraftRule(
  template: ExtractionRuleTemplate,
): Omit<ExtractionRule, 'id'> {
  return {
    ...template.rule,
    priority: 0,
  };
}
