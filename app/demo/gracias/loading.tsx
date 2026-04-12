export default function Loading() {
  return (
    <div className="min-h-screen bg-background px-4 py-10 md:px-6 md:py-14">
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card/80 p-6 shadow-2xl shadow-primary/5 md:p-8">
        <div className="mx-auto h-14 w-14 animate-pulse rounded-full bg-primary/10" />
        <div className="mx-auto mt-4 h-8 w-64 animate-pulse rounded bg-secondary/60" />
        <div className="mx-auto mt-3 h-4 w-80 animate-pulse rounded bg-secondary/30" />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="h-20 animate-pulse rounded-2xl bg-secondary/20" />
          <div className="h-20 animate-pulse rounded-2xl bg-secondary/20" />
          <div className="h-20 animate-pulse rounded-2xl bg-secondary/20" />
          <div className="h-20 animate-pulse rounded-2xl bg-secondary/20" />
        </div>
        <div className="mt-6 h-20 animate-pulse rounded-2xl bg-secondary/20" />
        <div className="mt-8 flex justify-center gap-3">
          <div className="h-10 w-36 animate-pulse rounded-full bg-secondary/40" />
          <div className="h-10 w-36 animate-pulse rounded-full bg-secondary/30" />
        </div>
      </div>
    </div>
  )
}
