import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function StatusBadge({ status, children, className }: { status: string; children?: React.ReactNode; className?: string }) {
  const statusMap: Record<string, { label: string; className: string }> = {
    COMPLETED: { label: "Completada", className: "bg-success/15 text-success border-success/30" },
    CONFIRMED: { label: "Confirmada", className: "bg-primary/15 text-primary border-primary/30" },
    PENDING: { label: "Pendiente", className: "bg-secondary/15 text-secondary border-secondary/30" },
    CANCELLED: { label: "Cancelada", className: "bg-destructive/15 text-destructive border-destructive/30" },
  }

  const config = statusMap[status] || { label: status, className: "" }

  return (
    <Badge className={cn("text-[10px] sm:text-xs flex items-center gap-1 px-2 py-0.5", config.className, className)} variant={statusMap[status] ? undefined : "secondary"}>
      {config.label}
      {children}
    </Badge>
  )
}
