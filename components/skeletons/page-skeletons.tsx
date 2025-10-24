import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton, SkeletonButton, SkeletonTable } from '@/components/ui/skeleton';

/**
 * Generic page header skeleton
 */
export function PageHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <SkeletonButton className="h-10 w-32" />
    </div>
  );
}

/**
 * Generic filter card skeleton
 */
export function FilterCardSkeleton({ fields = 3 }: { fields?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-24" />
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: fields }).map((_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Table page skeleton (bookings, payments, etc.)
 */
export function TablePageSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <FilterCardSkeleton />
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <SkeletonTable rows={rows} columns={6} />
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-48" />
        <div className="flex gap-2">
          <SkeletonButton />
          <Skeleton className="h-4 w-32" />
          <SkeletonButton />
        </div>
      </div>
    </div>
  );
}

/**
 * Dashboard skeleton with stats and charts
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>

      {/* Recent activity table */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <SkeletonTable rows={5} columns={5} />
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Detail page skeleton (booking detail, payment detail, etc.)
 */
export function DetailPageSkeleton() {
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

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main content */}
        <div className="md:col-span-2 space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="flex justify-between items-center">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Form page skeleton
 */
export function FormPageSkeleton({ sections = 2, fieldsPerSection = 6 }: { sections?: number; fieldsPerSection?: number }) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
      </div>

      {Array.from({ length: sections }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Form fields */}
            {Array.from({ length: fieldsPerSection }).map((_, j) => (
              <div key={j} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}

            {/* Action buttons */}
            {i === sections - 1 && (
              <div className="flex gap-2 pt-4">
                <SkeletonButton className="w-24" />
                <SkeletonButton className="w-24" />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Settings page skeleton
 */
export function SettingsPageSkeleton() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />

      <div className="grid gap-6 md:grid-cols-4">
        {/* Sidebar navigation */}
        <Card className="md:col-span-1">
          <CardContent className="p-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </CardContent>
        </Card>

        {/* Settings content */}
        <div className="md:col-span-3 space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-6 w-12 rounded-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Profile page skeleton
 */
export function ProfilePageSkeleton() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="text-center space-y-2 w-full">
                <Skeleton className="h-6 w-32 mx-auto" />
                <Skeleton className="h-4 w-40 mx-auto" />
              </div>
              <SkeletonButton className="w-full" />
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="grid grid-cols-3 gap-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full col-span-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <SkeletonTable rows={3} columns={3} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
