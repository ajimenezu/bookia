import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSkeleton() {
  return (
    <div className="animate-in fade-in duration-500">
      {/* Stats Grid Skeleton */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
            <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-3 w-20 opacity-60" />
            </div>
          </div>
        ))}
      </div>

      {/* Appointments List Skeleton */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-muted/20">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-5 w-32" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <div className="divide-y divide-border">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4 flex-1">
                <Skeleton className="h-5 w-14 font-mono" />
                <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-60 opacity-60" />
                </div>
              </div>
              <div className="flex items-center gap-3 pl-14 sm:pl-0">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
