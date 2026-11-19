import React from 'react';
import { cn } from '../../utils/formatters';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Skeleton com shimmer horizontal sutil em GPU (Seção 2.E — sem animate-pulse agressivo).
 */
export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => (
  <div
    aria-hidden="true"
    className={cn('skeleton-shimmer rounded', className)}
    {...props}
  />
);

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className,
}) => {
  const widths = ['w-full', 'w-11/12', 'w-4/5', 'w-2/3', 'w-3/4'];
  return (
    <div className={cn('space-y-2', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-3', i === lines - 1 ? 'w-1/2' : widths[i % widths.length])} />
      ))}
    </div>
  );
};

export const SkeletonMetric: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('rounded-lg border border-line bg-surface p-5', className)} aria-hidden="true">
    <Skeleton className="h-3 w-24" />
    <Skeleton className="mt-4 h-8 w-28" />
    <Skeleton className="mt-4 h-3 w-36" />
  </div>
);

export const SkeletonCard: React.FC<{ className?: string; lines?: number }> = ({
  className,
  lines = 4,
}) => (
  <div className={cn('rounded-lg border border-line bg-surface', className)} aria-hidden="true">
    <div className="border-b border-line px-5 py-3.5">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-2 h-3 w-64" />
    </div>
    <div className="p-5">
      <SkeletonText lines={lines} />
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; columns?: number; className?: string }> = ({
  rows = 6,
  columns = 5,
  className,
}) => (
  <div
    className={cn('overflow-hidden rounded-lg border border-line bg-surface', className)}
    aria-hidden="true"
  >
    <div className="flex h-10 items-center gap-6 border-b border-line bg-paper px-4">
      {Array.from({ length: columns }).map((_, c) => (
        <Skeleton key={c} className={cn('h-2', c === 0 ? 'w-32' : 'w-16')} />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, r) => (
      <div
        key={r}
        className="flex h-11 items-center gap-6 border-b border-line px-4 last:border-b-0"
      >
        {Array.from({ length: columns }).map((_, c) => (
          <Skeleton
            key={c}
            className={cn('h-3', c === 0 ? 'w-40' : c === columns - 1 ? 'w-12' : 'w-20')}
          />
        ))}
      </div>
    ))}
  </div>
);

export const LoadingAnnouncement: React.FC<{ label?: string }> = ({
  label = 'Carregando dados…',
}) => (
  <span role="status" aria-live="polite" className="sr-only">
    {label}
  </span>
);
