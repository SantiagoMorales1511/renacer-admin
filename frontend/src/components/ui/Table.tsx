import { ReactNode } from 'react';

export function Table({
  columns,
  children,
  empty,
}: {
  columns: string[];
  children: ReactNode;
  empty?: boolean;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              {columns.map((c) => (
                <th key={c} className="px-4 py-3 font-medium text-muted whitespace-nowrap">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">{children}</tbody>
        </table>
      </div>
      {empty && (
        <div className="px-4 py-10 text-center text-sm text-muted">Sin registros.</div>
      )}
    </div>
  );
}

export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-middle ${className ?? ''}`}>{children}</td>;
}
