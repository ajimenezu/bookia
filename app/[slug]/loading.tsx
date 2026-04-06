import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Navbar Skeleton */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
        </div>
      </nav>

      {/* Hero Skeleton */}
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-4 py-20 text-center">
          <Skeleton className="mx-auto mb-6 h-12 w-3/4 max-w-2xl md:h-16" />
          <Skeleton className="mx-auto mb-10 h-6 w-1/2 max-w-lg" />
          <div className="mx-auto flex justify-center gap-4">
            <Skeleton className="h-12 w-40 rounded-full" />
            <Skeleton className="h-12 w-40 rounded-full" />
          </div>
        </section>

        {/* Content Pulse */}
        <section className="mx-auto max-w-5xl px-4 py-20">
          <div className="grid gap-8 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-6">
                <Skeleton className="mb-4 h-12 w-12 rounded-xl" />
                <Skeleton className="mb-3 h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-2/3" />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
