"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Loader2, Save, Store, Clock, Phone, MapPin } from "lucide-react"
import { updateShopConfig, updateShopSchedules } from "@/app/[slug]/admin/configuracion/actions"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ShopConfigContentProps {
  shopId: string
  initialShop: any
  initialSchedules: any[]
}

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]

export function ShopConfigContent({ shopId, initialShop, initialSchedules }: ShopConfigContentProps) {
  const [isPending, startTransition] = useTransition()
  
  // Shop Info State
  const [shopInfo, setShopInfo] = useState({
    name: initialShop.name || "",
    description: initialShop.description || "",
    whatsappPhone: initialShop.whatsappPhone || "",
    address: initialShop.address || "",
  })

  // Schedule State
  const [schedules, setSchedules] = useState(
    DAYS.map((_, i) => {
      const existing = initialSchedules.find(s => s.dayOfWeek === i)
      return existing || { dayOfWeek: i, openTime: "08:00", closeTime: "20:00", slotDuration: 30, isOpen: true }
    })
  )

  const handleSaveInfo = async () => {
    startTransition(async () => {
      try {
        const result = await updateShopConfig(shopId, shopInfo)
        if (result.success) toast.success("Información del negocio actualizada")
      } catch (error: any) {
        toast.error(error.message || "Error al actualizar")
      }
    })
  }

  const handleSaveSchedule = async () => {
    startTransition(async () => {
      try {
        const result = await updateShopSchedules(shopId, schedules)
        if (result.success) toast.success("Horario general actualizado")
      } catch (error: any) {
        toast.error(error.message || "Error al actualizar")
      }
    })
  }

  const updateDay = (dayIndex: number, data: any) => {
    setSchedules(prev => prev.map((s, i) => i === dayIndex ? { ...s, ...data } : s))
  }

  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="mb-8 p-1 bg-muted/20 border border-border/50 rounded-xl">
        <TabsTrigger value="general" className="rounded-lg gap-2">
          <Store className="h-4 w-4" /> General
        </TabsTrigger>
        <TabsTrigger value="schedule" className="rounded-lg gap-2">
          <Clock className="h-4 w-4" /> Horario del Negocio
        </TabsTrigger>
      </TabsList>

      <TabsContent value="general">
        <Card className="border-border/50 shadow-xl overflow-hidden glass-card">
          <CardHeader>
            <CardTitle>Perfil del Negocio</CardTitle>
            <CardDescription>Información pública que verán tus clientes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Negocio</Label>
                <div className="relative">
                  <Store className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="name" 
                    value={shopInfo.name} 
                    onChange={e => setShopInfo(prev => ({ ...prev, name: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">WhatsApp de Reservas</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="phone" 
                    value={shopInfo.whatsappPhone} 
                    onChange={e => setShopInfo(prev => ({ ...prev, whatsappPhone: e.target.value }))}
                    className="pl-10"
                    placeholder="+506 8888 8888"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Dirección Física</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="address" 
                  value={shopInfo.address} 
                  onChange={e => setShopInfo(prev => ({ ...prev, address: e.target.value }))}
                  className="pl-10"
                  placeholder="San José, Costa Rica..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea 
                id="description" 
                value={shopInfo.description} 
                onChange={e => setShopInfo(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Cuenta un poco sobre tu negocio..."
                className="min-h-[120px] resize-none"
              />
            </div>
          </CardContent>
          <CardFooter className="bg-muted/10 border-t border-border/50 py-4">
            <Button onClick={handleSaveInfo} disabled={isPending} className="ml-auto gap-2">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar Cambios
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="schedule">
        <Card className="border-border/50 shadow-xl glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Horario General</CardTitle>
                <CardDescription>Define las horas maestras en las que tu negocio abre sus puertas.</CardDescription>
              </div>
              <Badge variant="outline" className="h-fit">Horario Maestro</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              {schedules.map((day, idx) => (
                <div key={idx} className={cn(
                  "flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border/50 transition-all",
                  day.isOpen ? "bg-card shadow-sm" : "bg-muted/30 opacity-70"
                )}>
                  <div className="flex items-center gap-4 mb-4 sm:mb-0">
                    <div className="flex flex-col">
                      <span className="font-bold text-base">{DAYS[idx]}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Switch 
                          checked={day.isOpen} 
                          onCheckedChange={checked => updateDay(idx, { isOpen: checked })}
                        />
                        <span className="text-xs text-muted-foreground">{day.isOpen ? "Abierto" : "Cerrado"}</span>
                      </div>
                    </div>
                  </div>

                  {day.isOpen && (
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="grid gap-1.5">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Apertura</Label>
                        <Input 
                          type="time" 
                          className="h-9 text-sm"
                          value={day.openTime} 
                          onChange={e => updateDay(idx, { openTime: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-1.5">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Cierre</Label>
                        <Input 
                          type="time" 
                          className="h-9 text-sm"
                          value={day.closeTime} 
                          onChange={e => updateDay(idx, { closeTime: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-1.5">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Turnos</Label>
                        <select 
                          className="h-9 px-3 rounded-md border border-input bg-background text-sm"
                          value={day.slotDuration}
                          onChange={e => updateDay(idx, { slotDuration: parseInt(e.target.value) })}
                        >
                          <option value="15">Cada 15 min</option>
                          <option value="30">Cada 30 min</option>
                          <option value="45">Cada 45 min</option>
                          <option value="60">Cada 1 hora</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="bg-muted/10 border-t border-border/50 py-4">
            <Button onClick={handleSaveSchedule} disabled={isPending} className="ml-auto gap-2">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar Horario General
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
