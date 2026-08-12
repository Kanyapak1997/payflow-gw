import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/misc'

/** Shown while a lazily-loaded route chunk is fetched. */
export function RouteFallback() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading page">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="p-5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-3 h-8 w-24" />
            <Skeleton className="mt-2.5 h-4 w-40" />
          </Card>
        ))}
      </div>
      <Card className="p-5">
        <Skeleton className="h-5 w-40" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-full" />
          ))}
        </div>
      </Card>
    </div>
  )
}
