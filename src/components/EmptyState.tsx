import Button from './ui/Button';

type EmptyStateProps = {
  icon: string;
  title: string;
  description: string;
  action?: {
    label: string;
    to: string;
  };
};

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center py-8 px-4">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 border border-border">
        <span className="material-symbols-outlined text-[26px] text-muted">{icon}</span>
      </div>
      <div className="text-fg font-semibold">{title}</div>
      <div className="text-muted text-[13px] mt-1 max-w-[240px]">{description}</div>
      {action ? (
        <div className="mt-5">
          <Button to={action.to} size="sm">
            {action.label}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
