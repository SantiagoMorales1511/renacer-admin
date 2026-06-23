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

  return (
    <div className="card p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className={clsx('mt-2 text-2xl font-semibold sm:text-3xl', accentClass)}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
