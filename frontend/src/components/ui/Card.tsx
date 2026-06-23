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
  accent?: 'petrol' | 'lavender' | 'gold' | 'red' | 'green';
}) {
  const accentClass =
    accent === 'lavender'
      ? 'text-lavender-600'
      : accent === 'gold'
        ? 'text-gold-600'
        : accent === 'red'
          ? 'text-red-600'
          : accent === 'green'
            ? 'text-emerald-600'
            : 'text-petrol-600';

  return (
    <div className="card p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className={clsx('mt-2 text-2xl font-semibold sm:text-3xl', accentClass)}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
