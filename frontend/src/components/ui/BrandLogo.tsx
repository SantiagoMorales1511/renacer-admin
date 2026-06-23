import clsx from 'clsx';

const SIZES = {
  sm: 'max-h-14',
  md: 'max-h-24',
  lg: 'max-h-36',
} as const;

export function BrandLogo({
  size = 'md',
  className,
}: {
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        'inline-flex items-center justify-center',
        'dark:rounded-xl dark:bg-white/95 dark:p-2 dark:shadow-sm',
        className,
      )}
    >
      <img
        src="/logo-renacer.png"
        alt="Renacer"
        className={clsx('h-auto w-auto max-w-full object-contain', SIZES[size])}
      />
    </div>
  );
}
