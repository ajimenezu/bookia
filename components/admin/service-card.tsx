import { Edit2, Clock, DollarSign } from "lucide-react"
import { cn } from "@/lib/utils"
import { BusinessType } from "@/lib/dictionaries"
import { Badge } from "@/components/ui/badge"
import { getBusinessIcon } from "@/lib/business-icons"

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
  const ServiceIcon = getBusinessIcon(businessType)

  return (
    <div
      onClick={!isPreview ? onClick : undefined}
      className={cn(
        "group relative rounded-2xl border border-border bg-card p-6 transition-all text-left shadow-sm h-full flex flex-col",
        !isPreview && onClick && "cursor-pointer hover:border-primary/50 hover:shadow-xl hover:-translate-y-1 active:scale-[0.98]",
        isPreview && "opacity-80 grayscale-[0.2]",
        className
      )}
    >
      {!isPreview && onClick && (
        <div className="absolute right-5 top-5 opacity-0 transition-opacity group-hover:opacity-100 flex gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm backdrop-blur-sm border border-primary/10">
            <Edit2 className="h-4 w-4" />
          </div>
        </div>
      )}

      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-inner">
          <ServiceIcon className="h-7 w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-bold text-card-foreground line-clamp-2 tracking-tight transition-colors group-hover:text-primary">
            {name || "Nombre del Servicio"}
          </h3>
          <div className="flex items-center gap-1.5 mt-1 text-primary/80">
            <DollarSign className="h-3.5 w-3.5" />
            <span className="text-lg font-black tracking-tighter">{formattedPrice}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 grid gap-3 pt-4 border-t border-border/60 content-start">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-muted-foreground font-medium">
            <Clock className="h-4 w-4" /> Duración
          </span>
          <Badge variant="secondary" className="font-black rounded-lg px-2.5 py-0.5 border border-border/50">
            {duration || "0"} min
          </Badge>
        </div>
        {description && (
          <div className="mt-2 space-y-1">
            <p className="text-[10px] uppercase font-black text-muted-foreground/50 tracking-widest">Descripción</p>
            <p className="text-sm text-muted-foreground/80 leading-relaxed whitespace-pre-wrap">
              {description}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
