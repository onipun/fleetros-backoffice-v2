import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Base skeleton component for loading states
 * Uses pulse animation for better perceived performance
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}

/**
 * Skeleton for text lines with realistic proportions
 */
export function SkeletonText({ 
  lines = 1, 
  className = '' 
}: { 
  lines?: number; 
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{
            width: i === lines - 1 && lines > 1 ? '80%' : '100%',
          }}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton for avatar/circular images
 */
export function SkeletonAvatar({ 
  size = 'md', 
  className = '' 
}: { 
  size?: 'sm' | 'md' | 'lg'; 
  className?: string;
}) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  return (
    <Skeleton className={cn('rounded-full', sizeClasses[size], className)} />
  );
}

/**
 * Skeleton for buttons
 */
export function SkeletonButton({ 
  className = '' 
}: { 
  className?: string;
}) {
  return <Skeleton className={cn('h-10 w-24 rounded-md', className)} />;
}

/**
 * Skeleton for cards
 */
export function SkeletonCard({ 
  className = '' 
}: { 
  className?: string;
}) {
  return (
    <div className={cn('rounded-lg border bg-card p-6', className)}>
      <div className="space-y-4">
        <Skeleton className="h-6 w-3/4" />
        <SkeletonText lines={3} />
        <div className="flex gap-2">
          <SkeletonButton />
          <SkeletonButton />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for table rows
 */
export function SkeletonTableRow({ 
  columns = 4 
}: { 
  columns?: number;
}) {
  return (
    <div className="flex items-center gap-4 py-4 border-b">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
  );
}

/**
 * Skeleton for table
 */
export function SkeletonTable({ 
  rows = 5, 
  columns = 4 
}: { 
  rows?: number; 
  columns?: number;
}) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonTableRow key={i} columns={columns} />
      ))}
    </div>
  );
}
