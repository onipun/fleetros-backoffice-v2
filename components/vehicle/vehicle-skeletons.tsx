import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton, SkeletonButton } from '@/components/ui/skeleton';

/**
 * Skeleton for vehicle card in grid view
 * Matches the actual vehicle card layout for seamless transition
 */
export function VehicleCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      {/* Image skeleton */}
      <Skeleton className="w-full h-48 sm:h-56 md:h-48 lg:h-52" />
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 space-y-2">
            {/* Title */}
            <Skeleton className="h-6 w-3/4" />
            {/* Subtitle */}
            <Skeleton className="h-4 w-2/3" />
          </div>
          {/* Status badge */}
          <Skeleton className="h-6 w-20 rounded-md ml-2" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2 pt-0">
        {/* Details grid */}
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-2 pt-4">
          <SkeletonButton className="flex-1" />
          <SkeletonButton className="flex-1" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for vehicle grid (multiple cards)
 */
export function VehicleGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <VehicleCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for vehicle detail page
 */
export function VehicleDetailSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="flex gap-2">
          <SkeletonButton />
          <SkeletonButton />
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Images section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32" />
              <SkeletonButton className="h-9" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Main image */}
            <Skeleton className="aspect-video w-full rounded-lg" />
            
            {/* Thumbnail gallery */}
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-md" />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Details sections */}
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-5 w-32" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for vehicle list page
 */
export function VehicleListSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <SkeletonButton className="h-10 w-32" />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        </CardContent>
      </Card>

      {/* Vehicle grid */}
      <VehicleGridSkeleton count={10} />

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2">
        <SkeletonButton />
        <Skeleton className="h-4 w-32" />
        <SkeletonButton />
      </div>
    </div>
  );
}

/**
 * Skeleton for vehicle form
 */
export function VehicleFormSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Form fields */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          
          {/* Textarea */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-32 w-full" />
          </div>

          {/* Submit buttons */}
          <div className="flex gap-2">
            <SkeletonButton className="w-24" />
            <SkeletonButton className="w-24" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
