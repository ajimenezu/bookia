"use client"

import { useState, useTransition, useEffect, useRef } from "react"
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
import { TimeSelect } from "@/components/ui/time-select"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { setOptions, importLibrary } from "@googlemaps/js-api-loader"

interface ShopConfigContentProps {
  shopId: string
  initialShop: any
  initialSchedules: any[]
}

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]

export function ShopConfigContent({ shopId, initialShop, initialSchedules }: ShopConfigContentProps) {
  const [isPending, startTransition] = useTransition()
  
  const defaultShopInfo = {
    name: initialShop.name || "",
    description: initialShop.description || "",
    whatsappPhone: initialShop.whatsappPhone || "",
    address: initialShop.address || "",
    latitude: initialShop.latitude ?? null,
    longitude: initialShop.longitude ?? null,
  }
  const [shopInfo, setShopInfo] = useState(defaultShopInfo)

  const defaultSchedules = DAYS.map((_, i) => {
    const existing = initialSchedules.find(s => s.dayOfWeek === i)
    return existing || { dayOfWeek: i, openTime: "08:00", closeTime: "20:00", slotDuration: 30, isOpen: true }
  })
  const [schedules, setSchedules] = useState(defaultSchedules)

  const isInfoDirty = JSON.stringify(shopInfo) !== JSON.stringify(defaultShopInfo)
  const isScheduleDirty = JSON.stringify(schedules) !== JSON.stringify(defaultSchedules)

  // Google Maps State & Refs
  const mapRef = useRef<HTMLDivElement>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const initializedRef = useRef(false)
  const [mapLoading, setMapLoading] = useState(true)

  useEffect(() => {
    if (initializedRef.current) return

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      setMapLoading(false)
      return
    }

    initializedRef.current = true

    setOptions({
      key: apiKey,
      v: "weekly",
      language: "es",
      libraries: ["places"],
    })

    Promise.all([
      importLibrary("maps"),
      importLibrary("marker"),
      importLibrary("places"),
      importLibrary("geocoding")
    ]).then(([mapsLib, markerLib, placesLib, geocodingLib]) => {
      setMapLoading(false)
      if (!mapRef.current) return

      const initialLat = initialShop.latitude ?? null
      const initialLng = initialShop.longitude ?? null
      const hasInitialCoords = initialLat !== null && initialLng !== null

      const defaultCenter = hasInitialCoords
        ? { lat: initialLat, lng: initialLng }
        : { lat: 9.9281, lng: -84.0907 } // Default: San José, Costa Rica

      const map = new mapsLib.Map(mapRef.current, {
        center: defaultCenter,
        zoom: hasInitialCoords ? 16 : 12,
        mapTypeControl: false,
        streetViewControl: false,
      })
      mapInstanceRef.current = map as any

      const marker = new markerLib.Marker({
        map: map as any,
        position: hasInitialCoords ? defaultCenter : undefined,
        draggable: true,
        animation: google.maps.Animation.DROP,
      })
      markerRef.current = marker as any

      const geocoder = new geocodingLib.Geocoder()

      // Update coordinates and reverse geocode on drag end
      marker.addListener("dragend", () => {
        const pos = marker.getPosition()
        if (pos) {
          const lat = pos.lat()
          const lng = pos.lng()
          setShopInfo(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng,
          }))

          geocoder.geocode({ location: { lat, lng } })
            .then((response) => {
              if (response.results && response.results[0]) {
                const formattedAddress = response.results[0].formatted_address
                setShopInfo(prev => ({
                  ...prev,
                  address: formattedAddress
                }))
              }
            })
            .catch((err) => console.error("Geocoder failed due to:", err))
        }
      })

      // Update coordinates and reverse geocode on map click
      map.addListener("click", (e: any) => {
        if (e.latLng) {
          const lat = e.latLng.lat()
          const lng = e.latLng.lng()
          marker.setPosition(e.latLng)
          setShopInfo(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng,
          }))

          geocoder.geocode({ location: { lat, lng } })
            .then((response) => {
              if (response.results && response.results[0]) {
                const formattedAddress = response.results[0].formatted_address
                setShopInfo(prev => ({
                  ...prev,
                  address: formattedAddress
                }))
              }
            })
            .catch((err) => console.error("Geocoder failed due to:", err))
        }
      })

      // Fallback to browser geolocation if store location is completely unset
      if (!hasInitialCoords && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userPos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            }
            map.setCenter(userPos)
            map.setZoom(14)
            // Leave marker empty/unset until explicitly chosen
          },
          () => {
            // Geolocation blocked or unavailable, retain standard view
          }
        )
      }

      // Initialize Places Autocomplete natively via DOM node
      const inputElement = document.getElementById("address") as HTMLInputElement
      if (inputElement) {
        const autocomplete = new placesLib.Autocomplete(inputElement, {
          componentRestrictions: { country: "cr" },
          fields: ["formatted_address", "geometry", "name"],
        })

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace()
          if (!place.geometry || !place.geometry.location) return

          const newLat = place.geometry.location.lat()
          const newLng = place.geometry.location.lng()
          const newAddress = place.formatted_address || place.name || ""

          map.setCenter(place.geometry.location)
          map.setZoom(16)
          marker.setPosition(place.geometry.location)

          setShopInfo(prev => ({
            ...prev,
            address: newAddress,
            latitude: newLat,
            longitude: newLng,
          }))
        })
      }
    }).catch((err: unknown) => {
      console.error("Error loading Google Maps API:", err)
      setMapLoading(false)
    })
  }, [initialShop.latitude, initialShop.longitude])

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
                <div className="relative flex items-center">
                  <Store className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                  <Input 
                    id="name" 
                    value={shopInfo.name} 
                    onChange={e => setShopInfo(prev => ({ ...prev, name: e.target.value }))}
                    style={{ paddingLeft: "2.5rem" }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">WhatsApp de Reservas</Label>
                <div className="relative flex items-center">
                  <Phone className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                  <Input 
                    id="phone" 
                    value={shopInfo.whatsappPhone} 
                    onChange={e => setShopInfo(prev => ({ ...prev, whatsappPhone: e.target.value }))}
                    style={{ paddingLeft: "2.5rem" }}
                    placeholder="+506 8888 8888"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Dirección Física e Integración de Mapa</Label>
                <div className="relative flex items-center">
                  <MapPin className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                  <Input 
                    id="address" 
                    value={shopInfo.address} 
                    onChange={e => setShopInfo(prev => ({ ...prev, address: e.target.value }))}
                    style={{ paddingLeft: "2.5rem" }}
                    placeholder="Escribe una ubicación en Costa Rica para autocompletar..."
                    onKeyDown={e => {
                      // Prevent form submission if user presses enter to choose a place suggestion
                      if (e.key === "Enter") e.preventDefault()
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Busca y selecciona una ubicación sugerida, o haz clic directamente sobre el mapa para fijar tu marcador.
                </p>
              </div>

              {/* Interactive Google Map container */}
              <div className="relative w-full h-[280px] rounded-xl overflow-hidden border border-border/50 shadow-inner bg-muted/10">
                {mapLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-sm z-10 animate-in fade-in duration-200">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground font-medium">Cargando mapa interactivo...</span>
                  </div>
                )}
                <div ref={mapRef} className="w-full h-full" />
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
            <Button onClick={handleSaveInfo} disabled={isPending || !isInfoDirty} className="ml-auto gap-2">
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
                      <TimeSelect
                        label="Apertura"
                        className="w-[140px]"
                        value={day.openTime}
                        onChange={(val) => updateDay(idx, { openTime: val })}
                      />
                      <TimeSelect
                        label="Cierre"
                        className="w-[140px]"
                        value={day.closeTime}
                        onChange={(val) => updateDay(idx, { closeTime: val })}
                      />
                      <div className="space-y-1.5 w-[160px]">
                        <Label className="text-xs">Turnos (Duración)</Label>
                        <Select
                          value={day.slotDuration.toString()}
                          onValueChange={(val) => updateDay(idx, { slotDuration: parseInt(val) })}
                        >
                          <SelectTrigger className="bg-background/50 backdrop-blur-sm">
                            <SelectValue placeholder="Duración" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">Cada 15 min</SelectItem>
                            <SelectItem value="30">Cada 30 min</SelectItem>
                            <SelectItem value="45">Cada 45 min</SelectItem>
                            <SelectItem value="60">Cada 1 hora</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="bg-muted/10 border-t border-border/50 py-4">
            <Button onClick={handleSaveSchedule} disabled={isPending || !isScheduleDirty} className="ml-auto gap-2">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar Horario General
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
