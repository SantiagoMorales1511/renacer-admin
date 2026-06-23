import { ReactNode } from 'react';
import clsx from 'clsx';

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('card p-5', className)}>{children}</div>;
}

export function StatTile({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: 'petrol' | 'sky' | 'gold' | 'red' | 'green';
}) {
  const accentClass =
    accent === 'sky'
      ? 'text-sky-600 dark:text-sky-400'
      : accent === 'gold'
        ? 'text-gold-600 dark:text-gold-400'
        : accent === 'red'
          ? 'text-red-600 dark:text-red-400'
          : accent === 'green'
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-petrol-600 dark:text-petrol-400';

  const tintClass =
    accent === 'sky'
      ? 'from-sky-50/90 via-surface to-surface dark:from-sky-500/10 dark:via-surface dark:to-surface-tint'
      : accent === 'gold'
        ? 'from-amber-50/80 via-surface to-surface dark:from-gold-500/10 dark:via-surface dark:to-surface-tint'
        : accent === 'red'
          ? 'from-red-50/80 via-surface to-surface dark:from-red-500/10 dark:via-surface dark:to-surface-tint'
          : accent === 'green'
            ? 'from-emerald-50/80 via-surface to-surface dark:from-emerald-500/10 dark:via-surface dark:to-surface-tint'
            : 'from-petrol-50/80 via-periwinkle-50/40 to-surface dark:from-petrol-500/10 dark:via-brand-900/20 dark:to-surface-tint';

  return (
    <div className={clsx('card relative overflow-hidden p-5', `bg-gradient-to-br ${tintClass}`)}>
      <div
        className={clsx(
          'absolute left-0 top-0 h-full w-1 rounded-full',
          accent === 'sky'
            ? 'bg-sky-300 dark:bg-sky-500/50'
            : accent === 'gold'
              ? 'bg-gold-400 dark:bg-gold-500/50'
              : accent === 'red'
                ? 'bg-red-300 dark:bg-red-500/50'
                : accent === 'green'
                  ? 'bg-emerald-300 dark:bg-emerald-500/50'
                  : 'bg-gradient-to-b from-petrol-400 to-periwinkle-300 dark:from-petrol-500/60 dark:to-periwinkle-400/40',
        )}
      />
      <div className="pl-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className={clsx('mt-2 text-2xl font-semibold sm:text-3xl', accentClass)}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      </div>
    </div>
  );
}
