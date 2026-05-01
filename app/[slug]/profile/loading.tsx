import { Skeleton } from "@/components/ui/skeleton"

export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar skeleton (simplified) */}
      <div className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-24 rounded-xl" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-6 py-12">
        {/* Header Skeleton */}
        <div className="glass-card overflow-hidden rounded-[2.5rem] p-8 md:p-12 mb-10">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <Skeleton className="h-32 w-32 rounded-3xl" />
            <div className="flex-1 space-y-4 w-full">
              <Skeleton className="h-10 w-3/4 md:w-1/2 mx-auto md:mx-0" />
              <div className="flex flex-wrap justify-center md:justify-start gap-6">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
        </div>

        {/* History Header Skeleton */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="hidden sm:block h-10 w-24 rounded-full" />
          </div>
          
          {/* Appointment Cards Skeletons */}
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col gap-6 rounded-[2rem] border border-border bg-card p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <div className="flex gap-6 py-4 border-y border-border/50">
                  <Skeleton className="h-10 w-1/2" />
                  <Skeleton className="h-10 w-1/3" />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <Skeleton className="h-6 w-24" />
                  <div className="flex gap-2">
                    <Skeleton className="h-10 w-24 rounded-xl" />
                    <Skeleton className="h-10 w-10 rounded-xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
