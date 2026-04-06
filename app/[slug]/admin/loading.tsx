import { DashboardSkeleton } from "@/components/admin/dashboard-skeleton"

export default function Loading() {
  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-secondary/50" />
        <div className="mt-2 h-4 w-64 animate-pulse rounded-lg bg-secondary/30" />
      </div>
      <DashboardSkeleton />
    </div>
  )
}
