import { Scissors, Clock, DollarSign, Edit2, Sparkles, Flower2, Stethoscope, Sparkle } from "lucide-react"
import { cn } from "@/lib/utils"
import { BusinessType } from "@/lib/dictionaries"

interface ServiceCardProps {
  name: string
  price: number | string
  duration: number | string
  description?: string | null
  businessType?: BusinessType
  isPreview?: boolean
  className?: string
  onClick?: () => void
}

export function ServiceCard({
  name,
  price,
  duration,
  description,
  businessType = "BARBERIA",
  isPreview = false,
  className,
  onClick
}: ServiceCardProps) {
  // Format price if it's a number
  const formattedPrice = typeof price === 'number' 
    ? `₡${price.toLocaleString("es-CR")}` 
    : price || "₡0"

  // Select icon based on business type
  const ServiceIcon = (() => {
    switch (businessType) {
      case "BARBERIA": return Scissors
      case "SALON_BELLEZA": return Sparkles
      case "SPA": return Flower2
      case "CLINICA": return Stethoscope
      default: return Sparkle
    }
  })()

  return (
    <div
      onClick={!isPreview ? onClick : undefined}
      className={cn(
        "group relative rounded-xl border border-border bg-card p-5 transition-all text-left",
        !isPreview && onClick && "cursor-pointer hover:border-primary/50 hover:shadow-md active:scale-[0.98]",
        isPreview && "opacity-80 grayscale-[0.2]",
        className
      )}
    >
      {!isPreview && onClick && (
        <div className="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm backdrop-blur-sm">
            <Edit2 className="h-4 w-4" />
          </div>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
            <ServiceIcon className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold text-card-foreground line-clamp-1 group-hover:text-primary transition-colors">
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
