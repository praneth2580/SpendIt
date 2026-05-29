import type { Category } from '../store/types';

type ColorToken = Category['color'];

export const categoryStyles: Record<
  ColorToken,
  { bg: string; border: string; text: string; bar: string; ring: string }
> = {
  primary: {
    bg: 'bg-brand-muted',
    border: 'border-brand/25',
    text: 'text-brand',
    bar: 'bg-brand',
    ring: 'ring-brand/30',
  },
  secondary: {
    bg: 'bg-success-muted',
    border: 'border-success/25',
    text: 'text-success',
    bar: 'bg-success',
    ring: 'ring-success/30',
  },
  tertiary: {
    bg: 'bg-[color-mix(in_srgb,var(--accent-violet)_14%,transparent)]',
    border: 'border-accent-violet/25',
    text: 'text-accent-violet',
    bar: 'bg-accent-violet',
    ring: 'ring-accent-violet/30',
  },
};

export const iconColorStyles = {
  white: {
    bg: 'bg-surface-2',
    border: 'border-border',
    hover: 'group-hover:bg-elevated',
    text: 'text-fg',
  },
  primary: {
    bg: 'bg-brand-muted',
    border: 'border-brand/25',
    hover: 'group-hover:bg-brand-muted',
    text: 'text-brand',
  },
  secondary: {
    bg: 'bg-success-muted',
    border: 'border-success/25',
    hover: 'group-hover:bg-success-muted',
    text: 'text-success',
  },
  tertiary: {
    bg: 'bg-[color-mix(in_srgb,var(--accent-violet)_14%,transparent)]',
    border: 'border-accent-violet/25',
    hover: 'group-hover:bg-[color-mix(in_srgb,var(--accent-violet)_20%,transparent)]',
    text: 'text-accent-violet',
  },
} as const;
