import { Skeleton } from "@/components/ui/skeleton"

export default function ServicesLoading() {
  return (
    <div className="animate-in fade-in duration-500">
      {/* Header Skeleton matches the header in Components/admin/services-list.tsx */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48 md:h-10" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-10 w-full sm:w-40 rounded-lg" />
      </div>

      {/* Services Grid Skeletons match ServiceCard in components/admin/service-card.tsx */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Dynamic Icon placeholder */}
                <Skeleton className="h-10 w-10 rounded-lg" />
                {/* Service Name placeholder */}
                <Skeleton className="h-6 w-32 rounded-md" />
              </div>
            </div>
            
            <div className="grid gap-3">
              {/* Price row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3.5 w-3.5 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-4 w-20 rounded-md" />
              </div>
              
              {/* Duration row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3.5 w-3.5 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-4 w-12 rounded-md" />
              </div>
              
              {/* Description rows */}
              <div className="mt-2 space-y-1.5 line-clamp-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
