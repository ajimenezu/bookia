import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="h-9 w-32 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>

      {/* Week Navigation Skeleton */}
      <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
        </div>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-9 w-10" />
      </div>

      {/* Content area skeleton (Calendar/List placeholder) */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border bg-muted/30">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="border-r border-border p-3 last:border-0">
              <Skeleton className="h-4 w-12 mx-auto mb-1" />
              <Skeleton className="h-6 w-8 mx-auto" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 h-[600px] divide-x divide-border">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="p-2 space-y-4">
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
