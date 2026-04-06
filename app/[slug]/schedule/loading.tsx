import { ChevronLeft } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Generic Navbar Skeleton */}
      <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
          <div className="h-8 w-32 animate-pulse rounded-md bg-secondary/60"></div>
          <div className="h-8 w-8 animate-pulse rounded-full bg-secondary/60"></div>
        </div>
      </nav>

      <main className="flex-1 pb-20">
        <div className="mx-auto max-w-5xl px-4 pt-6 animate-in fade-in duration-500">
          {/* Volver al inicio Link Skeleton */}
          <div className="group inline-flex items-center gap-1 mb-6 text-sm">
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            <div className="h-4 w-28 animate-pulse rounded bg-secondary/50"></div>
          </div>

          <div className="mx-auto max-w-lg">
            {/* BookingFlow Skeleton */}
            <div className="space-y-6">
              {/* Stepper skeleton */}
              <div className="flex items-center justify-between px-2 mb-8">
                <div className="h-8 w-8 animate-pulse flex-shrink-0 rounded-full bg-primary/20"></div>
                <div className="flex-1 border-t-2 border-border/50 mx-2"></div>
                <div className="h-8 w-8 animate-pulse flex-shrink-0 rounded-full bg-secondary/50"></div>
                <div className="flex-1 border-t-2 border-border/50 mx-2"></div>
                <div className="h-8 w-8 animate-pulse flex-shrink-0 rounded-full bg-secondary/50"></div>
              </div>

              {/* Card skeleton */}
              <div className="rounded-xl border border-border bg-card shadow-sm">
                <div className="flex flex-col space-y-1.5 p-6">
                  <div className="h-6 w-1/2 animate-pulse rounded bg-secondary/50"></div>
                  <div className="h-4 w-3/4 animate-pulse rounded bg-secondary/30 mt-2"></div>
                </div>
                <div className="p-6 pt-0 space-y-3">
                  <div className="h-16 w-full animate-pulse rounded-lg bg-secondary/20 border border-border/50"></div>
                  <div className="h-16 w-full animate-pulse rounded-lg bg-secondary/20 border border-border/50"></div>
                  <div className="h-16 w-full animate-pulse rounded-lg bg-secondary/20 border border-border/50"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
