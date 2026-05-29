import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { upsertExtractionRule } from '../store/appSlice';
import type { ExtractionRule, ExtractionTransactionType } from '../store/types';
import Button from './ui/Button';

type RuleDraft = Pick<
  ExtractionRule,
  | 'name'
  | 'enabled'
  | 'senderPattern'
  | 'bodyPattern'
  | 'merchantPattern'
  | 'transactionType'
  | 'categoryId'
  | 'accountId'
  | 'noteTemplate'
  | 'promptCategory'
  | 'promptAccount'
  | 'promptNote'
>;

type ExtractionRuleFormProps = {
  rule?: ExtractionRule;
  /** Pre-fill from a UPI SMS template (new rule only) */
  draft?: RuleDraft;
  onSaved: () => void;
  onCancel: () => void;
};

function initialFromSource(rule?: ExtractionRule, draft?: RuleDraft): RuleDraft {
  const source = rule ?? draft;
  return {
    name: source?.name ?? '',
    enabled: source?.enabled ?? true,
    senderPattern: source?.senderPattern ?? '',
    bodyPattern: source?.bodyPattern ?? '',
    merchantPattern: source?.merchantPattern ?? '',
    transactionType: source?.transactionType ?? 'any',
    categoryId: source?.categoryId ?? '',
    accountId: source?.accountId ?? '',
    noteTemplate: source?.noteTemplate ?? '{merchant}',
    promptCategory: source?.promptCategory ?? false,
    promptAccount: source?.promptAccount ?? false,
    promptNote: source?.promptNote ?? true,
  };
}

export default function ExtractionRuleForm({
  rule,
  draft,
  onSaved,
  onCancel,
}: ExtractionRuleFormProps) {
  const dispatch = useAppDispatch();
  const { categories, accounts } = useAppSelector((state) => state.app);
  const [saving, setSaving] = useState(false);
  const formKey = rule?.id ?? draft?.name ?? 'blank';

  const [name, setName] = useState(() => initialFromSource(rule, draft).name);
  const [enabled, setEnabled] = useState(() => initialFromSource(rule, draft).enabled);
  const [senderPattern, setSenderPattern] = useState(
    () => initialFromSource(rule, draft).senderPattern ?? '',
  );
  const [bodyPattern, setBodyPattern] = useState(
    () => initialFromSource(rule, draft).bodyPattern ?? '',
  );
  const [merchantPattern, setMerchantPattern] = useState(
    () => initialFromSource(rule, draft).merchantPattern ?? '',
  );
  const [transactionType, setTransactionType] = useState<ExtractionTransactionType>(
    () => initialFromSource(rule, draft).transactionType,
  );
  const [categoryId, setCategoryId] = useState(
    () => initialFromSource(rule, draft).categoryId ?? '',
  );
  const [accountId, setAccountId] = useState(
    () => initialFromSource(rule, draft).accountId ?? '',
  );
  const [noteTemplate, setNoteTemplate] = useState(
    () => initialFromSource(rule, draft).noteTemplate ?? '',
  );
  const [promptCategory, setPromptCategory] = useState(
    () => initialFromSource(rule, draft).promptCategory,
  );
  const [promptAccount, setPromptAccount] = useState(
    () => initialFromSource(rule, draft).promptAccount,
  );
  const [promptNote, setPromptNote] = useState(() => initialFromSource(rule, draft).promptNote);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setSaving(true);
    const result = await dispatch(
      upsertExtractionRule({
        id: rule?.id,
        name: trimmedName,
        enabled,
        senderPattern,
        bodyPattern,
        merchantPattern,
        transactionType,
        categoryId: categoryId || undefined,
        accountId: accountId || undefined,
        noteTemplate,
        promptCategory,
        promptAccount,
        promptNote,
      }),
    );
    setSaving(false);

    if (upsertExtractionRule.fulfilled.match(result)) onSaved();
  };

  return (
    <form key={formKey} onSubmit={handleSubmit} className="px-4 pb-4 flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="rule-name" className="text-fg text-[13px] font-medium">
          Rule name
        </label>
        <input
          id="rule-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. HDFC UPI debits"
          className="input-field"
          required
        />
      </div>

      <label className="flex items-center justify-between gap-3 cursor-pointer">
        <span className="text-fg text-[14px]">Enabled</span>
        <input
          type="checkbox"
          className="h-5 w-5 accent-brand"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
        />
      </label>

      <div>
        <h3 className="section-label mb-2">Match SMS when</h3>
        <p className="text-subtle text-[12px] mb-3">
          Leave fields empty to ignore them. All filled fields must match.
        </p>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <label htmlFor="sender-pattern" className="text-fg text-[13px] font-medium">
              Sender contains
            </label>
            <input
              id="sender-pattern"
              value={senderPattern}
              onChange={(event) => setSenderPattern(event.target.value)}
              placeholder="e.g. HDFCBK"
              className="input-field"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="body-pattern" className="text-fg text-[13px] font-medium">
              Message contains
            </label>
            <input
              id="body-pattern"
              value={bodyPattern}
              onChange={(event) => setBodyPattern(event.target.value)}
              placeholder="e.g. debited"
              className="input-field"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="merchant-pattern" className="text-fg text-[13px] font-medium">
              Payee or SMS text contains
            </label>
            <input
              id="merchant-pattern"
              value={merchantPattern}
              onChange={(event) => setMerchantPattern(event.target.value)}
              placeholder="e.g. Zomato"
              className="input-field"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="tx-type" className="text-fg text-[13px] font-medium">
              Transaction type
            </label>
            <select
              id="tx-type"
              value={transactionType}
              onChange={(event) =>
                setTransactionType(event.target.value as ExtractionTransactionType)
              }
              className="input-field"
            >
              <option value="any">Any</option>
              <option value="expense">Expense only</option>
              <option value="income">Income only</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="section-label mb-2">Then apply</h3>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <label htmlFor="rule-category" className="text-fg text-[13px] font-medium">
              Category
            </label>
            <select
              id="rule-category"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className="input-field"
            >
              <option value="">None</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="rule-account" className="text-fg text-[13px] font-medium">
              Account
            </label>
            <select
              id="rule-account"
              value={accountId}
              onChange={(event) => setAccountId(event.target.value)}
              className="input-field"
            >
              <option value="">None</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="note-template" className="text-fg text-[13px] font-medium">
              Note template
            </label>
            <input
              id="note-template"
              value={noteTemplate}
              onChange={(event) => setNoteTemplate(event.target.value)}
              placeholder="{merchant} or Groceries"
              className="input-field"
            />
            <p className="text-subtle text-[12px]">
              Use {'{merchant}'} for the parsed payee from the SMS.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="section-label mb-2">When prompting me</h3>
        <p className="text-subtle text-[12px] mb-3">
          Turn on to always ask for a field, even when a default is set above.
        </p>
        <div className="flex flex-col gap-3">
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <span className="text-fg text-[14px]">Always ask for category</span>
            <input
              type="checkbox"
              className="h-5 w-5 accent-brand"
              checked={promptCategory}
              onChange={(event) => setPromptCategory(event.target.checked)}
            />
          </label>
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <span className="text-fg text-[14px]">Always ask for account</span>
            <input
              type="checkbox"
              className="h-5 w-5 accent-brand"
              checked={promptAccount}
              onChange={(event) => setPromptAccount(event.target.checked)}
            />
          </label>
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <span className="text-fg text-[14px]">Always ask for note</span>
            <input
              type="checkbox"
              className="h-5 w-5 accent-brand"
              checked={promptNote}
              onChange={(event) => setPromptNote(event.target.checked)}
            />
          </label>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" fullWidth disabled={saving}>
          {saving ? 'Saving…' : rule ? 'Update rule' : 'Add rule'}
        </Button>
      </div>
    </form>
  );
}
