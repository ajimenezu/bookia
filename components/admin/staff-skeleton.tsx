import { Skeleton } from "@/components/ui/skeleton"

export function StaffSkeleton() {
  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="h-9 w-40 mb-2" />
          <Skeleton className="h-4 w-64 opacity-70" />
        </div>
        <Skeleton className="h-10 w-36 rounded-md" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm"
          >
            {/* Header skeleton */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Skeleton className="h-16 w-16 shrink-0 rounded-2xl bg-primary/10" />
                  <Skeleton className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-card" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-3 w-20 opacity-60" />
                </div>
              </div>
              <Skeleton className="h-6 w-16 rounded-lg" />
            </div>

            {/* Stats skeleton */}
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2 p-3 rounded-xl border border-border/40 bg-muted/5">
                  <Skeleton className="h-3 w-20 opacity-50" />
                  <Skeleton className="h-6 w-8" />
                </div>
                <div className="flex flex-col gap-2 p-3 rounded-xl border border-border/40 bg-muted/5">
                  <Skeleton className="h-3 w-20 opacity-50" />
                  <Skeleton className="h-6 w-8" />
                </div>
              </div>
            </div>

            {/* Bottom action skeleton */}
            <div className="mt-6 pt-5 border-t border-border/60">
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
