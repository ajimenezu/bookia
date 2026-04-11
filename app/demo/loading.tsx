export default function Loading() {
  return (
    <div className="min-h-screen bg-background px-4 py-8 md:px-6 md:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card/70 px-4 py-3 backdrop-blur-sm md:px-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-xl bg-secondary/60" />
            <div className="space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-secondary/60" />
              <div className="h-3 w-32 animate-pulse rounded bg-secondary/40" />
            </div>
          </div>
          <div className="hidden h-8 w-40 animate-pulse rounded-full bg-secondary/40 md:block" />
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-border bg-card/80 p-6 md:p-8">
              <div className="mb-8 flex items-center gap-3">
                <div className="h-10 w-10 animate-pulse rounded-full bg-primary/20" />
                <div className="h-px flex-1 bg-border" />
                <div className="h-10 w-10 animate-pulse rounded-full bg-secondary/50" />
              </div>
              <div className="space-y-4">
                <div className="h-8 w-2/3 animate-pulse rounded bg-secondary/60" />
                <div className="h-4 w-full animate-pulse rounded bg-secondary/30" />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="h-12 animate-pulse rounded-xl bg-secondary/20" />
                  <div className="h-12 animate-pulse rounded-xl bg-secondary/20" />
                </div>
                <div className="h-12 animate-pulse rounded-xl bg-secondary/20" />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="h-12 animate-pulse rounded-xl bg-secondary/20" />
                  <div className="h-12 animate-pulse rounded-xl bg-secondary/20" />
                </div>
                <div className="flex justify-end">
                  <div className="h-10 w-32 animate-pulse rounded-full bg-secondary/40" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border bg-card/80 p-6">
              <div className="h-6 w-24 animate-pulse rounded bg-secondary/60" />
              <div className="mt-4 space-y-3">
                <div className="h-12 animate-pulse rounded-2xl bg-secondary/30" />
                <div className="h-12 animate-pulse rounded-2xl bg-secondary/30" />
                <div className="h-12 animate-pulse rounded-2xl bg-secondary/30" />
                <div className="h-12 animate-pulse rounded-2xl bg-secondary/30" />
                <div className="h-12 animate-pulse rounded-2xl bg-secondary/30" />
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card/70 p-6">
              <div className="h-6 w-36 animate-pulse rounded bg-secondary/60" />
              <div className="mt-4 space-y-3">
                <div className="h-4 w-full animate-pulse rounded bg-secondary/30" />
                <div className="h-4 w-11/12 animate-pulse rounded bg-secondary/30" />
                <div className="h-4 w-10/12 animate-pulse rounded bg-secondary/30" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
