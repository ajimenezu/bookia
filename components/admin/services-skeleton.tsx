import { Skeleton } from "@/components/ui/skeleton"

export function ServicesSkeleton() {
  return (
    <div className="animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48 md:h-10" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-10 w-full sm:w-40 rounded-lg" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-6 w-32 rounded-md" />
              </div>
            </div>
            
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3.5 w-3.5 rounded-full opacity-50" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-4 w-20 rounded-md bg-primary/10" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3.5 w-3.5 rounded-full opacity-50" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-4 w-12 rounded-md" />
              </div>
              
              <div className="mt-2 space-y-1.5 line-clamp-2">
                <Skeleton className="h-3 w-full opacity-60" />
                <Skeleton className="h-3 w-3/4 opacity-40" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
