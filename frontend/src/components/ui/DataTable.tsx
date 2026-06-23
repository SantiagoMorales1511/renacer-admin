import { ReactNode } from 'react';
import clsx from 'clsx';

export interface DataColumn<T> {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center';
  hideOnMobile?: boolean;
  primary?: boolean;
}

const SHOW_TABLE = { sm: 'hidden sm:block', md: 'hidden md:block', lg: 'hidden lg:block' };
const SHOW_CARDS = { sm: 'sm:hidden', md: 'md:hidden', lg: 'lg:hidden' };

function alignClass(align?: 'left' | 'right' | 'center') {
  return align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty = 'Sin registros.',
  breakpoint = 'sm',
}: {
  columns: DataColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  empty?: string;
  breakpoint?: 'sm' | 'md' | 'lg';
}) {
  if (rows.length === 0) {
    return <div className="card px-4 py-10 text-center text-sm text-muted">{empty}</div>;
  }

  const primary = columns.find((c) => c.primary) ?? columns[0];
  const rest = columns.filter((c) => c !== primary && !c.hideOnMobile);

  return (
    <>
      <div className={clsx('card overflow-hidden', SHOW_TABLE[breakpoint])}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-canvas/50 text-left">
                {columns.map((c, i) => (
                  <th
                    key={i}
                    className={clsx(
                      'whitespace-nowrap px-4 py-3 font-medium text-muted',
                      alignClass(c.align),
                    )}
                  >
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40">
              {rows.map((row) => (
                <tr key={rowKey(row)} className="transition-colors hover:bg-canvas/40">
                  {columns.map((c, i) => (
                    <td
                      key={i}
                      className={clsx('px-4 py-3 align-middle', alignClass(c.align), c.className)}
                    >
                      {c.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={clsx('space-y-2.5', SHOW_CARDS[breakpoint])}>
        {rows.map((row) => (
          <div key={rowKey(row)} className="card p-4">
            <div className="mb-2.5 min-w-0 text-sm font-medium text-ink">{primary.cell(row)}</div>
            <dl className="space-y-1.5 text-sm">
              {rest.map((c, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <dt className="shrink-0 text-xs text-muted">{c.header}</dt>
                  <dd className="min-w-0 text-right text-ink">{c.cell(row)}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </>
  );
}
