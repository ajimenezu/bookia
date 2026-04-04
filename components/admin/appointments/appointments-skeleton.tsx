import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export function AppointmentsSkeleton({ view }: { view: "calendar" | "list" }) {
  if (view === "list") {
    return <ListSkeleton />
  }

  return <CalendarSkeleton />
}

export function ListSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card divide-y divide-border animate-in fade-in duration-500">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 w-full">
            {/* Date placeholder */}
            <div className="w-12 text-center space-y-1">
              <Skeleton className="h-3 w-8 mx-auto opacity-70" />
              <Skeleton className="h-5 w-6 mx-auto bg-primary/10" />
            </div>
            {/* Time placeholder */}
            <Skeleton className="h-5 w-12 shrink-0 bg-primary/20" />
            {/* Customer & Service Info placeholder */}
            <div className="space-y-2 flex-1 max-w-[240px]">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-3/4 opacity-60" />
            </div>
          </div>
          <div className="pl-16 sm:pl-0">
            {/* Status Badge placeholder */}
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function CalendarSkeleton() {
  return (
    <div className="animate-in fade-in duration-500">
      {/* Desktop Skeleton */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-border bg-card">
        <div className="grid min-w-[840px] grid-cols-7">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={`header-${i}`} className={cn("border-b border-border px-3 py-3 text-center", i < 6 && "border-r border-border")}>
              <Skeleton className="h-3 w-10 mx-auto mb-2 opacity-70" />
              <Skeleton className="h-6 w-6 mx-auto bg-primary/10" />
            </div>
          ))}
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={`col-${i}`} className={cn("min-h-[400px] p-2 space-y-2", i < 6 && "border-r border-border")}>
              {i % 2 === 0 ? (
                <>
                  <Skeleton className="h-24 w-full rounded-lg bg-secondary/20" />
                  {i === 2 && <Skeleton className="h-24 w-full rounded-lg bg-secondary/20" />}
                </>
              ) : (
                <div className="py-4 text-center">
                  <Skeleton className="h-3 w-12 mx-auto opacity-30" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Skeleton */}
      <div className="md:hidden space-y-3">
        {/* Day selector skeleton */}
        <div className="mb-4 flex items-center justify-between rounded-xl border border-border bg-card px-2 py-2">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div className="flex items-center gap-1.5 px-0.5">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-9 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>

        {/* Selected day content skeleton */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/20">
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-11 rounded-lg" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-8" />
              </div>
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                <Skeleton className="h-5 w-12 bg-primary/10" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24 opacity-60" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
