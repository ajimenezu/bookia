"use client"

import { useState } from "react"
import { Clock, BadgeCent, Type, AlignLeft, Trash2, Loader2, Users, Tag, ChevronsUpDown, X, Check, Plus } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ServiceCard } from "@/components/admin/service-card"
import { createService, updateService, deleteService } from "@/app/[slug]/admin/servicios/actions"
import { toast } from "sonner"
import { BusinessType, getTerminology } from "@/lib/dictionaries"
import { getBusinessIcon } from "@/lib/business-icons"

interface ServiceFormProps {
  slug: string
  shopId?: string
  businessType?: BusinessType
  staffList: { id: string; name: string }[]
  categoriesList?: { id: string; name: string }[]
  initialData?: {
    id: string
    name: string
    description: string | null
    price: number
    duration: number
    isHidden?: boolean
    staffMembers?: { id: string }[]
    categories?: { id: string; name: string }[]
  }
  onSuccess?: () => void
}

export function ServiceForm({ slug, shopId, businessType = "BARBERIA", staffList, categoriesList = [], initialData, onSuccess }: ServiceFormProps) {
  const t = getTerminology(businessType)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const initialDuration = initialData?.duration || 30
  const initialHours = Math.floor(initialDuration / 60)
  const initialMinutes = initialDuration % 60

  const [previewData, setPreviewData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    price: initialData?.price?.toString() || "",
    hours: initialHours.toString(),
    minutes: initialMinutes.toString(),
    isHidden: initialData?.isHidden || false
  })

  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>(
    initialData?.staffMembers?.map(s => s.id) || []
  )

  const [openCategories, setOpenCategories] = useState(false)
  const [categorySearch, setCategorySearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    initialData?.categories?.[0]?.name || null
  )

  const filteredCategories = categoriesList
    .map(c => c.name)
    .filter(name => selectedCategory !== name)

  const getCategoryExamples = () => {
    switch (businessType) {
      case "BARBERIA": return "Ej. Cortes, Barba, Tratamientos"
      case "SALON_BELLEZA": return "Ej. Cabello, Uñas, Maquillaje"
      case "CLINICA": return "Ej. Fisioterapia, Cardiología, Odontología"
      case "SPA": return "Ej. Masajes, Faciales, Relajación"
      default: return "Ej. General, Especial, Premium"
    }
  }

  const isEditing = !!initialData

  const isValid = previewData.name.trim() !== "" && previewData.price !== "" && (previewData.hours !== "" || previewData.minutes !== "") && selectedStaffIds.length > 0 && selectedCategory !== null
  
  const hasChanges = isEditing 
    ? previewData.name !== (initialData?.name || "") ||
      previewData.description !== (initialData?.description || "") ||
      previewData.price !== (initialData?.price?.toString() || "") ||
      previewData.hours !== initialHours.toString() ||
      previewData.minutes !== initialMinutes.toString() ||
      previewData.isHidden !== (initialData?.isHidden || false) ||
      JSON.stringify(selectedStaffIds.sort()) !== JSON.stringify((initialData?.staffMembers?.map(s => s.id) || []).sort()) ||
      selectedCategory !== (initialData?.categories?.[0]?.name || null)
    : isValid

  // Selection of icon based on business type for the preview header
  const ServiceIcon = getBusinessIcon(businessType)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    const formData = new FormData(event.currentTarget)
    formData.set("slug", slug)
    if (shopId) {
      formData.set("shopId", shopId)
    }
    if (isEditing && initialData) {
      formData.set("id", initialData.id)
    }

    // Combine hours and minutes into total duration
    const totalMinutes = (Number(previewData.hours) * 60) + Number(previewData.minutes)
    formData.set("duration", totalMinutes.toString())
    
    // Append selected staff
    selectedStaffIds.forEach(id => formData.append("staffIds", id))

    // Append selected category
    if (selectedCategory) {
      formData.append("category", selectedCategory)
    }

    // Append isHidden
    if (previewData.isHidden) {
      formData.append("isHidden", "true")
    } else {
      formData.append("isHidden", "false")
    }

    try {
      if (isEditing) {
        const result = await updateService(formData)
        if (!result?.success) throw new Error(result?.error || "Error al actualizar")
        toast.success("Servicio actualizado correctamente")
      } else {
        const result = await createService(formData)
        if (!result?.success) throw new Error(result?.error || "Error al crear")
        toast.success("Servicio creado correctamente")
      }
      onSuccess?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Algo salió mal")
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!initialData) return
    if (!confirm("¿Estás seguro de que quieres eliminar este servicio?")) return

    setDeleting(true)
    try {
      await deleteService(initialData.id)
      toast.success("Servicio eliminado correctamente")
      onSuccess?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Algo salió mal")
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-10 py-4">
      <form onSubmit={handleSubmit} className="grid gap-8">
        <div className="grid gap-2.5">
          <Label htmlFor="name" className="flex items-center gap-2 font-medium text-sm text-foreground/80">
            <Type className="h-4 w-4 text-primary" /> Nombre
          </Label>
          <Input 
            id="name" 
            name="name" 
            placeholder="Ej. Corte de Cabello + Barba" 
            required 
            disabled={loading || deleting}
            value={previewData.name} 
            onChange={(e) => setPreviewData({ ...previewData, name: e.target.value })}
            className="h-11 bg-background border-border focus:ring-primary focus:border-primary transition-all shadow-xs"
          />
        </div>
        
        <div className="grid gap-2.5">
          <Label htmlFor="description" className="flex items-center gap-2 font-medium text-sm text-foreground/80">
            <AlignLeft className="h-4 w-4 text-primary" /> Descripción (Opcional)
          </Label>
          <Textarea 
            id="description" 
            name="description" 
            placeholder="Breve descripción..." 
            className="min-h-[120px] bg-background border-border focus:ring-primary focus:border-primary transition-all resize-none shadow-xs"
            disabled={loading || deleting} 
            value={previewData.description} 
            onChange={(e) => setPreviewData({ ...previewData, description: e.target.value })} 
          />
        </div>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="grid gap-2.5">
            <Label htmlFor="price" className="flex items-center gap-2 font-medium text-sm text-foreground/80">
              <BadgeCent className="h-4 w-4 text-primary" /> Precio
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-muted-foreground text-sm font-medium">₡</span>
              <Input 
                id="price" 
                name="price" 
                type="number" 
                step="1" 
                placeholder="15000" 
                required 
                className="pl-8 h-11 bg-background border-border focus:ring-primary focus:border-primary transition-all shadow-xs"
                disabled={loading || deleting} 
                value={previewData.price} 
                onChange={(e) => setPreviewData({ ...previewData, price: e.target.value })} 
              />
            </div>
          </div>
          
          <div className="grid gap-2.5">
            <Label className="flex items-center gap-2 font-medium text-sm text-foreground/80">
              <Clock className="h-4 w-4 text-primary" /> Duración estimada
            </Label>
            <div className="flex items-center gap-3">
              <div className="flex-1 space-y-1">
                <div className="relative">
                  <Input 
                    id="hours" 
                    type="number" 
                    min="0"
                    placeholder="0" 
                    required 
                    disabled={loading || deleting}
                    value={previewData.hours} 
                    onChange={(e) => setPreviewData({ ...previewData, hours: e.target.value })} 
                    className="h-11 bg-background border-border focus:ring-primary focus:border-primary transition-all shadow-xs pr-8"
                  />
                  <span className="absolute right-3 top-3 text-[10px] font-bold text-muted-foreground uppercase pointer-events-none">h</span>
                </div>
              </div>
              <div className="flex-1 space-y-1">
                <div className="relative">
                  <Input 
                    id="minutes" 
                    type="number" 
                    min="0"
                    max="59"
                    step="5"
                    placeholder="30" 
                    required 
                    disabled={loading || deleting}
                    value={previewData.minutes} 
                    onChange={(e) => setPreviewData({ ...previewData, minutes: e.target.value })} 
                    className="h-11 bg-background border-border focus:ring-primary focus:border-primary transition-all shadow-xs pr-10"
                  />
                  <span className="absolute right-3 top-3 text-[10px] font-bold text-muted-foreground uppercase pointer-events-none">min</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          <Label className="flex items-center gap-2 font-medium text-sm text-foreground/80">
            <Tag className="h-4 w-4 text-primary" /> Categoría
          </Label>
          <p className="text-xs text-muted-foreground mb-1">
            Cada {t.service.toLowerCase()} debe pertenecer a una sola categoría general. {getCategoryExamples()}
          </p>
          
          <Popover open={openCategories} onOpenChange={setOpenCategories}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={openCategories}
                className="w-full justify-between h-auto min-h-11 bg-background border-border hover:bg-background px-3"
                disabled={loading || deleting}
              >
                <div className="flex flex-wrap gap-1.5 py-1">
                  {!selectedCategory && (
                    <span className="text-muted-foreground font-normal">Seleccionar o crear categoría...</span>
                  )}
                  {selectedCategory && (
                    <Badge variant="secondary" className="px-1.5 flex items-center gap-1 rounded-md text-sm font-medium">
                      {selectedCategory}
                      <div
                        role="button"
                        tabIndex={0}
                        className="rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:bg-muted-foreground/20 p-0.5 cursor-pointer"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            setSelectedCategory(null)
                          }
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setSelectedCategory(null)
                        }}
                      >
                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                      </div>
                    </Badge>
                  )}
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <Command>
                <CommandInput 
                  placeholder="Buscar o crear categoría..." 
                  value={categorySearch}
                  onValueChange={setCategorySearch}
                />
                <CommandList>
                  <CommandEmpty className="py-2 px-4">
                    {categorySearch.trim() !== "" ? (
                      <button
                        type="button"
                        className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm cursor-pointer"
                        onClick={() => {
                          setSelectedCategory(categorySearch.trim())
                          setCategorySearch("")
                          setOpenCategories(false)
                        }}
                      >
                        <Plus className="inline mr-2 h-4 w-4" /> Crear "{categorySearch.trim()}"
                      </button>
                    ) : (
                      "Sin resultados."
                    )}
                  </CommandEmpty>
                  <CommandGroup>
                    {filteredCategories.map((category) => (
                      <CommandItem
                        key={category}
                        value={category}
                        onSelect={() => {
                          setSelectedCategory(category) // Use the exact case from existing
                          setCategorySearch("")
                          setOpenCategories(false)
                        }}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${selectedCategory === category ? "opacity-100" : "opacity-0"}`}
                        />
                        {category}
                      </CommandItem>
                    ))}
                    {categorySearch.trim() !== "" && !filteredCategories.some(c => c.toLowerCase() === categorySearch.trim().toLowerCase()) && selectedCategory?.toLowerCase() !== categorySearch.trim().toLowerCase() && (
                       <CommandItem
                         key={`create-${categorySearch}`}
                         value={categorySearch}
                         onSelect={() => {
                           setSelectedCategory(categorySearch.trim())
                           setCategorySearch("")
                           setOpenCategories(false)
                         }}
                         className="text-primary font-medium"
                       >
                         <Plus className="mr-2 h-4 w-4" /> Crear "{categorySearch.trim()}"
                       </CommandItem>
                    )}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <p className="text-xs text-destructive font-medium min-h-[20px] -mt-1">
          {!selectedCategory ? "Debes seleccionar una categoría." : ""}
        </p>

        <div className="grid gap-3">
          <Label className="flex items-center gap-2 font-medium text-sm text-foreground/80">
            <Users className="h-4 w-4 text-primary" /> {t.staffPlural}
          </Label>
          <div className="flex flex-wrap gap-2">
            {staffList.map((staff) => {
              const isSelected = selectedStaffIds.includes(staff.id)
              return (
                <button
                  key={staff.id}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      setSelectedStaffIds(selectedStaffIds.filter(id => id !== staff.id))
                    } else {
                      setSelectedStaffIds([...selectedStaffIds, staff.id])
                    }
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isSelected 
                      ? "bg-primary text-primary-foreground shadow-sm" 
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                  disabled={loading || deleting}
                >
                  {staff.name}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-destructive mt-1 font-medium min-h-[20px]">
            {selectedStaffIds.length === 0 ? `Debes seleccionar al menos un ${t.staff.toLowerCase()}.` : ""}
          </p>
        </div>

        <div className="flex flex-row items-center justify-between rounded-lg border border-border p-4 bg-muted/30">
          <div className="space-y-0.5">
            <Label className="text-base font-medium">Ocultar de la página pública</Label>
            <p className="text-sm text-muted-foreground">
              El servicio solo podrá ser agendado por administradores desde el panel.
            </p>
          </div>
          <Switch 
            checked={previewData.isHidden} 
            onCheckedChange={(checked) => setPreviewData({ ...previewData, isHidden: checked })} 
            disabled={loading || deleting}
          />
        </div>

        <div className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between border-t border-border/60">
          {isEditing && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleDelete} 
              disabled={loading || deleting}
              className="w-full sm:w-auto border-destructive/20 text-destructive hover:bg-destructive/10 hover:border-destructive transition-colors h-11"
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Eliminar
            </Button>
          )}
          <div className="flex flex-col gap-3 sm:flex-row sm:ml-auto w-full sm:w-auto">
            <Button 
              type="submit" 
              disabled={loading || deleting || !hasChanges} 
              className="w-full sm:w-auto px-8 h-11 font-semibold shadow-md active:scale-[0.98] transition-all"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Guardar Cambios" : "Crear Servicio"}
            </Button>
          </div>
        </div>
      </form>

      <div className="relative pt-10">
        <div className="absolute inset-x-0 top-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-border/60"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-4 text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/70 flex items-center gap-2">
            <ServiceIcon className="h-3.5 w-3.5 text-primary" /> Vista Previa
          </span>
        </div>
        <div className="mt-10 px-1">
          <ServiceCard 
            isPreview 
            businessType={businessType}
            name={previewData.name} 
            description={previewData.description}
            price={previewData.price ? `₡${Number(previewData.price).toLocaleString("es-CR")}` : "₡0"} 
            duration={((Number(previewData.hours) * 60) + Number(previewData.minutes)).toString()} 
          />
        </div>
      </div>
    </div>
  )
}
