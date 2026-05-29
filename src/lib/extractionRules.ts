import type { ExtractionRule, PendingUpiImport, PendingUpiImportAction } from '../store/types';

type MatchInput = {
  sender: string;
  body: string;
  merchant: string;
  type: 'expense' | 'income';
};

function includesPattern(text: string, pattern?: string) {
  if (!pattern?.trim()) return true;
  return text.toLowerCase().includes(pattern.trim().toLowerCase());
}

export function ruleMatchesInput(rule: ExtractionRule, input: MatchInput) {
  if (!rule.enabled) return false;

  if (rule.transactionType !== 'any' && rule.transactionType !== input.type) {
    return false;
  }

  if (!includesPattern(input.sender, rule.senderPattern)) return false;
  if (!includesPattern(input.body, rule.bodyPattern)) return false;
  if (rule.merchantPattern?.trim()) {
    const pattern = rule.merchantPattern.trim().toLowerCase();
    const inMerchant = input.merchant.toLowerCase().includes(pattern);
    const inBody = input.body.toLowerCase().includes(pattern);
    if (!inMerchant && !inBody) return false;
  }

  const hasPattern =
    Boolean(rule.senderPattern?.trim()) ||
    Boolean(rule.bodyPattern?.trim()) ||
    Boolean(rule.merchantPattern?.trim()) ||
    rule.transactionType !== 'any';

  return hasPattern;
}

export function findMatchingRule(
  input: MatchInput,
  rules: ExtractionRule[],
): ExtractionRule | null {
  const sorted = [...rules]
    .filter((rule) => rule.enabled)
    .sort((a, b) => a.priority - b.priority);

  return sorted.find((rule) => ruleMatchesInput(rule, input)) ?? null;
}

function applyNoteTemplate(template: string | undefined, merchant: string) {
  if (!template?.trim()) return merchant;
  return template.trim().replaceAll('{merchant}', merchant);
}

export function buildImportAction(
  input: MatchInput,
  rules: ExtractionRule[],
): PendingUpiImportAction {
  const matched = findMatchingRule(input, rules);

  const action: PendingUpiImportAction = {
    merchant: input.merchant,
    type: input.type,
    promptCategory: input.type === 'expense',
    promptAccount: true,
    promptNote: true,
  };

  if (!matched) return action;

  action.ruleId = matched.id;
  action.ruleName = matched.name;

  if (matched.categoryId) action.categoryId = matched.categoryId;
  if (matched.accountId) action.accountId = matched.accountId;
  action.merchant = applyNoteTemplate(matched.noteTemplate, input.merchant);
  if (matched.transactionType !== 'any') {
    action.type = matched.transactionType;
  }

  action.promptCategory = matched.promptCategory;
  action.promptAccount = matched.promptAccount;
  action.promptNote = matched.promptNote;

  return action;
}

export function enrichPendingImport(
  pending: Omit<PendingUpiImport, 'action'>,
  rules: ExtractionRule[],
): PendingUpiImport {
  return {
    ...pending,
    action: buildImportAction(
      {
        sender: pending.sender,
        body: pending.body,
        merchant: pending.merchant,
        type: pending.type,
      },
      rules,
    ),
  };
}

export function canAutoApplyImport(action: PendingUpiImportAction) {
  if (action.promptCategory || action.promptAccount || action.promptNote) return false;
  if (!action.accountId) return false;
  if (action.type === 'expense' && !action.categoryId) return false;
  return true;
}

export function describeRuleMatch(rule: ExtractionRule) {
  const parts: string[] = [];
  if (rule.senderPattern?.trim()) parts.push(`sender “${rule.senderPattern.trim()}”`);
  if (rule.bodyPattern?.trim()) parts.push(`message “${rule.bodyPattern.trim()}”`);
  if (rule.merchantPattern?.trim()) parts.push(`merchant “${rule.merchantPattern.trim()}”`);
  if (rule.transactionType !== 'any') parts.push(rule.transactionType);
  return parts.length > 0 ? parts.join(' · ') : 'Matches all SMS';
}
