import { useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { deleteExtractionRule, reorderExtractionRules } from '../store/appSlice';
import { describeRuleMatch } from '../lib/extractionRules';
import {
  EXTRACTION_RULE_TEMPLATES,
  templateToDraftRule,
} from '../lib/extractionRuleTemplates';
import type { ExtractionRuleTemplate } from '../lib/extractionRuleTemplates';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import BottomSheet from '../components/BottomSheet';
import ExtractionRuleForm from '../components/ExtractionRuleForm';
import type { ExtractionRule } from '../store/types';

function actionSummary(rule: ExtractionRule, categoryName?: string, accountName?: string) {
  const parts: string[] = [];
  if (categoryName) parts.push(categoryName);
  if (accountName) parts.push(accountName);
  if (rule.noteTemplate?.trim()) parts.push(`note: ${rule.noteTemplate.trim()}`);
  const prompts: string[] = [];
  if (rule.promptCategory) prompts.push('category');
  if (rule.promptAccount) prompts.push('account');
  if (rule.promptNote) prompts.push('note');
  if (prompts.length > 0) parts.push(`ask: ${prompts.join(', ')}`);
  return parts.length > 0 ? parts.join(' · ') : 'No defaults — prompt only';
}

export default function ExtractionRulesSettings() {
  const dispatch = useAppDispatch();
  const { extractionRules, categories, accounts } = useAppSelector((state) => state.app);
  const [editingRule, setEditingRule] = useState<ExtractionRule | undefined>();
  const [draftFromTemplate, setDraftFromTemplate] = useState<
    ReturnType<typeof templateToDraftRule> | undefined
  >();
  const [showForm, setShowForm] = useState(false);

  const openCreate = () => {
    setEditingRule(undefined);
    setDraftFromTemplate(undefined);
    setShowForm(true);
  };

  const openFromTemplate = (template: ExtractionRuleTemplate) => {
    setEditingRule(undefined);
    setDraftFromTemplate(templateToDraftRule(template));
    setShowForm(true);
  };

  const openEdit = (rule: ExtractionRule) => {
    setEditingRule(rule);
    setDraftFromTemplate(undefined);
    setShowForm(true);
  };

  const moveRule = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= extractionRules.length) return;
    const ordered = [...extractionRules];
    const [item] = ordered.splice(index, 1);
    ordered.splice(nextIndex, 0, item);
    void dispatch(reorderExtractionRules(ordered.map((rule) => rule.id)));
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          to="/settings"
          className="inline-flex items-center gap-1 text-brand text-[13px] font-medium mb-3"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Settings
        </Link>
        <h1 className="page-title">Extraction rules</h1>
        <p className="text-muted text-[14px] mt-1">
          Match incoming SMS and set category, account, and what to ask when importing.
        </p>
      </div>

      <Card>
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-h2 font-semibold text-fg">How it works</h2>
          <Button size="sm" onClick={openCreate}>
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add rule
          </Button>
        </div>
        <p className="text-muted text-[13px] leading-relaxed">
          Rules are checked top to bottom. The first match wins. Set defaults for category and
          account, or enable &quot;Always ask&quot; to show that field when you confirm a
          transaction.
        </p>
      </Card>

      <Card>
        <h2 className="text-h2 font-semibold text-fg mb-1">UPI SMS templates</h2>
        <p className="text-muted text-[13px] mb-4">
          Common Indian bank / UPI formats. Tap to pre-fill a rule, then adjust patterns and
          defaults.
        </p>
        <div className="flex flex-col gap-3">
          {EXTRACTION_RULE_TEMPLATES.map((template) => (
            <div
              key={template.id}
              className="rounded-2xl border border-border bg-surface-2 p-3 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-fg font-medium text-[14px]">{template.title}</h3>
                  <p className="text-muted text-[12px] mt-1">{template.description}</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => openFromTemplate(template)}>
                  Use
                </Button>
              </div>
              <p className="text-subtle text-[11px] font-mono leading-relaxed line-clamp-2">
                {template.sampleSms}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-h2 font-semibold text-fg">Your rules</h2>
        <span className="text-muted text-[13px]">{extractionRules.length} active</span>
      </div>

      {extractionRules.length === 0 ? (
        <Card>
          <p className="text-muted text-[14px]">No rules yet.</p>
          <Button className="mt-4" onClick={openCreate}>
            Create your first rule
          </Button>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {extractionRules.map((rule, index) => {
            const category = categories.find((item) => item.id === rule.categoryId);
            const account = accounts.find((item) => item.id === rule.accountId);

            return (
              <Card key={rule.id} padding="md">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-fg font-semibold">{rule.name}</h3>
                      <span
                        className={clsx(
                          'text-[11px] px-2 py-0.5 rounded-full border',
                          rule.enabled
                            ? 'border-success/30 text-success bg-success-muted'
                            : 'border-border text-muted bg-surface-2',
                        )}
                      >
                        {rule.enabled ? 'On' : 'Off'}
                      </span>
                      <span className="text-subtle text-[11px]">Priority {rule.priority}</span>
                    </div>
                    <p className="text-muted text-[12px] mt-2">
                      <span className="text-subtle">If </span>
                      {describeRuleMatch(rule)}
                    </p>
                    <p className="text-fg text-[13px] mt-2">
                      <span className="text-subtle">Then </span>
                      {actionSummary(rule, category?.name, account?.name)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveRule(index, -1)}
                      className="h-8 w-8 rounded-lg border border-border text-muted disabled:opacity-30"
                      aria-label="Move up"
                    >
                      <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                    </button>
                    <button
                      type="button"
                      disabled={index === extractionRules.length - 1}
                      onClick={() => moveRule(index, 1)}
                      className="h-8 w-8 rounded-lg border border-border text-muted disabled:opacity-30"
                      aria-label="Move down"
                    >
                      <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                    </button>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="secondary" onClick={() => openEdit(rule)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void dispatch(deleteExtractionRule(rule.id))}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <BottomSheet
        open={showForm}
        title={editingRule ? 'Edit rule' : draftFromTemplate ? 'New rule from template' : 'New rule'}
        onClose={() => setShowForm(false)}
        maxWidthClassName="max-w-lg"
      >
        <ExtractionRuleForm
          rule={editingRule}
          draft={draftFromTemplate}
          onSaved={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
        />
      </BottomSheet>
    </div>
  );
}
