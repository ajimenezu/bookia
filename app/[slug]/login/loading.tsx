import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/5 via-background to-background">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <Skeleton className="h-16 w-16 rounded-2xl shadow-lg shadow-primary/20" />
          <Skeleton className="mt-6 h-10 w-3/4 max-w-[200px]" />
          <Skeleton className="mt-2 h-5 w-1/2 max-w-[150px]" />
        </div>
        <div className="w-full space-y-8 rounded-2xl border border-border bg-card/50 p-8 backdrop-blur-sm shadow-xl">
          <div className="space-y-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <Skeleton className="h-10 w-full rounded-lg mt-4" />
          </div>
        </div>
      </div>
    </div>
  )
}
