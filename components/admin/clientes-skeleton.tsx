import { Skeleton } from "@/components/ui/skeleton"

export function ClientesSkeleton() {
  return (
    <div className="animate-in fade-in duration-500">
      {/* Table skeleton */}
      <div className="hidden rounded-xl border border-border bg-card md:block overflow-hidden">
        <div className="border-b border-border bg-muted/30 px-5 py-3 flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="divide-y divide-border">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3 w-1/4">
                <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-12 rounded-full" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile cards skeleton */}
      <div className="grid gap-3 md:hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="pt-3 border-t border-border flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
