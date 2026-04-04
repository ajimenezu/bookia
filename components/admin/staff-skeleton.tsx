import { Skeleton } from "@/components/ui/skeleton"

export function StaffSkeleton() {
  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <Skeleton className="h-9 w-40 mb-2" />
        <Skeleton className="h-5 w-56 opacity-70" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-6"
          >
            {/* Header skeleton */}
            <div className="mb-5 flex items-center gap-4">
              <Skeleton className="h-14 w-14 shrink-0 rounded-full bg-primary/10" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-40 opacity-60" />
              </div>
            </div>

            {/* Stats skeleton */}
            <div className="grid gap-4">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex justify-between items-center">
                  <Skeleton className="h-4 w-24 opacity-50" />
                  <Skeleton className="h-5 w-8 rounded-full" />
                </div>
              ))}
              <div className="mt-2 border-t border-border pt-4">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-28 opacity-50" />
                  <Skeleton className="h-7 w-24 bg-primary/10" />
                </div>
              </div>
            </div>

            {/* Status badge skeleton */}
            <div className="mt-5 flex justify-end">
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
