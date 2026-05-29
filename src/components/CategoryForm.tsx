import { useState } from 'react';
import clsx from 'clsx';
import { useAppDispatch } from '../store/hooks';
import { addCategory } from '../store/appSlice';
import type { Category } from '../store/types';
import { CATEGORY_ICON_OPTIONS, COLOR_OPTIONS } from '../lib/seed';
import { categoryStyles } from '../lib/styles';
import Button from './ui/Button';

type CategoryFormProps = {
  onCreated?: (categoryId: string) => void;
  onCancel?: () => void;
};

export default function CategoryForm({ onCreated, onCancel }: CategoryFormProps) {
  const dispatch = useAppDispatch();
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('500');
  const [icon, setIcon] = useState<string>(CATEGORY_ICON_OPTIONS[0]);
  const [color, setColor] = useState<Category['color']>('primary');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const parsedBudget = Number.parseFloat(budget);
    if (!trimmedName || !Number.isFinite(parsedBudget) || parsedBudget <= 0) return;

    setSaving(true);
    const result = await dispatch(
      addCategory({ name: trimmedName, budget: parsedBudget, icon, color }),
    );
    setSaving(false);

    if (addCategory.fulfilled.match(result)) {
      onCreated?.(result.payload.categoryId);
      setName('');
      setBudget('500');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4 pt-0">
      <div className="flex flex-col gap-2">
        <label htmlFor="category-name" className="text-fg text-[13px] font-medium">
          Name
        </label>
        <input
          id="category-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Groceries"
          className="input-field"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="category-budget" className="text-fg text-[13px] font-medium">
          Monthly budget
        </label>
        <input
          id="category-budget"
          type="number"
          min="1"
          step="1"
          value={budget}
          onChange={(event) => setBudget(event.target.value)}
          className="input-field"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-fg text-[13px] font-medium">Icon</span>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_ICON_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setIcon(option)}
              className={clsx(
                'h-10 w-10 rounded-xl border flex items-center justify-center transition-colors',
                icon === option
                  ? 'border-brand/40 bg-brand-muted'
                  : 'border-border bg-surface-2 hover:bg-elevated',
              )}
            >
              <span className="material-symbols-outlined text-[18px] text-muted">{option}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-fg text-[13px] font-medium">Color</span>
        <div className="flex gap-2">
          {COLOR_OPTIONS.map((option) => {
            const styles = categoryStyles[option];
            return (
              <button
                key={option}
                type="button"
                onClick={() => setColor(option)}
                className={clsx(
                  'flex-1 py-2 rounded-xl border text-[12px] font-medium capitalize transition-colors',
                  color === option
                    ? `${styles.border} ${styles.bg} text-fg`
                    : 'border-border text-muted hover:bg-surface-2',
                )}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        {onCancel ? (
          <Button type="button" variant="secondary" fullWidth onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" fullWidth disabled={saving || !name.trim()}>
          {saving ? 'Saving...' : 'Create category'}
        </Button>
      </div>
    </form>
  );
}
