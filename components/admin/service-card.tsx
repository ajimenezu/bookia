import { Scissors, Clock, DollarSign } from "lucide-react"
import { cn } from "@/lib/utils"

interface ServiceCardProps {
  name: string
  price: number | string
  duration: number | string
  description?: string | null
  isPreview?: boolean
  className?: string
}

export function ServiceCard({
  name,
  price,
  duration,
  description,
  isPreview = false,
  className
}: ServiceCardProps) {
  // Format price if it's a number
  const formattedPrice = typeof price === 'number' 
    ? `₡${price.toLocaleString("es-CR")}` 
    : price || "₡0"

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 transition-all",
        !isPreview && "hover:border-primary/50 hover:shadow-sm",
        isPreview && "opacity-60 grayscale-[0.5]",
        className
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Scissors className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold text-card-foreground line-clamp-1">
            {name || "Nombre del Servicio"}
          </h3>
        </div>
      </div>

      <div className="grid gap-3">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-3.5 w-3.5" /> Precio
          </span>
          <span className="font-semibold text-primary">
            {formattedPrice}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" /> Duración
          </span>
          <span className="font-medium text-card-foreground">
            {duration || "0"} min
          </span>
        </div>
        {description && (
          <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}
