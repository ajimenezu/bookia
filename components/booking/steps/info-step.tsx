"use client"

import { Dispatch, SetStateAction } from "react"

import { Loader2, Search, LogIn, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

interface ClientData {
  id: string
  name: string
  phone: string | null
}

interface ServiceData {
  id: string
  name: string
  price: number
  duration: number
  description: string | null
}

interface StaffData {
  id: string
  name: string
}

interface InfoStepProps {
  shopId: string
  initialClientName?: string
  loadingStaff: boolean
  t: any
  selectedServicesDetails: ServiceData[]
  formatPrice: (price: number) => string
  formatDuration: (minutes: number) => string
  selectedDate: Date | undefined
  selectedTime: string | null
  selectedBarber: string | null
  assignedAutoStaff: { id: string; name: string } | null
  barber: StaffData | undefined
  totalDuration: number
  totalPrice: number
  isAdmin: boolean
  clientType: "registered" | "unregistered"
  setClientType: Dispatch<SetStateAction<"registered" | "unregistered">>
  setSelectedClientId: Dispatch<SetStateAction<string | null>>
  setClientName: Dispatch<SetStateAction<string>>
  setClientPhone: Dispatch<SetStateAction<string>>
  clients: ClientData[]
  clientSearch: string
  setClientSearch: Dispatch<SetStateAction<string>>
  selectedClientId: string | null
  clientName: string
  clientPhone: string
  touched: { name: boolean; phone: boolean }
  setTouched: Dispatch<SetStateAction<{ name: boolean; phone: boolean }>>
  bookingError: string | null
  handleConfirm: () => void
  setSelectedTime: Dispatch<SetStateAction<string | null>>
  isPending: boolean
  handleAuthRedirect: (type: 'login' | 'register') => void
}

export function InfoStep({
  shopId,
  initialClientName,
  loadingStaff,
  t,
  selectedServicesDetails,
  formatPrice,
  formatDuration,
  selectedDate,
  selectedTime,
  selectedBarber,
  assignedAutoStaff,
  barber,
  totalDuration,
  totalPrice,
  isAdmin,
  clientType,
  setClientType,
  setSelectedClientId,
  setClientName,
  setClientPhone,
  clients,
  clientSearch,
  setClientSearch,
  selectedClientId,
  clientName,
  clientPhone,
  touched,
  setTouched,
  bookingError,
  handleConfirm,
  setSelectedTime,
  isPending,
  handleAuthRedirect
}: InfoStepProps) {
  return (
    <section className="animate-in fade-in slide-in-from-right-4 duration-500 px-4 sm:px-6">
      <h2 className="mb-6 text-xl font-black text-foreground tracking-tight">Tus datos</h2>

      {initialClientName && (
        <div className="mb-6 p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black text-sm shadow-lg shadow-primary/20">
            {initialClientName.charAt(0)}
          </div>
          <div className="text-sm">
            <p className="font-bold text-foreground">¡Hola, {initialClientName.split(' ')[0]}!</p>
            <p className="text-muted-foreground font-medium">Hemos pre-completado tus datos.</p>
          </div>
        </div>
      )}

      {loadingStaff ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-3xl border border-dashed border-border/80 bg-muted/5">
          <Loader2 className="h-10 w-10 animate-spin text-primary opacity-40" />
          <span className="mt-4 text-sm font-bold text-muted-foreground/60 uppercase tracking-widest text-center">Asignando {t.staffGender === "f" ? "una" : "un"} {t.staff.toLowerCase()}...</span>
        </div>
      ) : (
        <>
          {/* Summary Card */}
          <div className="mb-8 rounded-3xl border border-border shadow-2xl shadow-black/5 bg-card overflow-hidden">
            <div className="bg-primary/5 px-4 sm:px-6 py-4 border-b border-primary/10">
              <h3 className="text-[10px] uppercase font-black text-primary tracking-[0.2em]">Resumen de tu {t.appointment.toLowerCase()}</h3>
            </div>
            <div className="p-4 sm:p-6 space-y-5">
              <div className="space-y-3">
                <p className="text-[10px] uppercase font-black text-muted-foreground/50 tracking-widest">{t.servicePlural}</p>
                <div className="space-y-2">
                  {selectedServicesDetails.map(s => (
                    <div key={s.id} className="flex justify-between items-center group">
                      <span className="font-bold text-card-foreground">{s.name}</span>
                      <span className="font-black text-primary">{formatPrice(s.price)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-border/60">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-black text-muted-foreground/50 tracking-widest">Fecha</p>
                  <p className="font-bold text-card-foreground">
                    {selectedDate?.toLocaleDateString("es-ES", { day: "numeric", month: "long" })}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-black text-muted-foreground/50 tracking-widest">Hora</p>
                  <p className="font-black text-primary text-xl tracking-tighter">{selectedTime}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-black text-muted-foreground/50 tracking-widest">{t.staff}</p>
                  <p className="font-bold text-card-foreground">
                    {selectedBarber === "auto" ? assignedAutoStaff?.name : barber?.name}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-black text-muted-foreground/50 tracking-widest">Duración</p>
                  <p className="font-bold text-card-foreground">{formatDuration(totalDuration)}</p>
                </div>
              </div>

              <div className="mt-4 pt-5 border-t-2 border-dashed border-border/80 flex justify-between items-center">
                <span className="font-black text-sm uppercase tracking-[0.1em] text-muted-foreground">Total a pagar</span>
                <span className="text-3xl font-black text-primary tracking-tighter">{formatPrice(totalPrice)}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {isAdmin ? (
              <Tabs value={clientType} onValueChange={(v: any) => {
                setClientType(v);
                if (v === 'unregistered') {
                  setSelectedClientId(null);
                  setClientName("");
                  setClientPhone("");
                }
              }}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="registered">{t.client} {t.clientGender === "f" ? "Registrada" : "Registrado"}</TabsTrigger>
                  <TabsTrigger value="unregistered">{t.client} {t.clientGender === "f" ? "Nueva" : "Nuevo"}</TabsTrigger>
                </TabsList>
                <TabsContent value="registered" className="mt-4 space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={`Buscar ${t.client.toLowerCase()} por nombre o teléfono...`}
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="pl-9 bg-card"
                    />
                  </div>
                  <div className="max-h-[200px] overflow-y-auto space-y-2 border border-border rounded-xl p-2 bg-card">
                    {clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()) || (c.phone && c.phone.includes(clientSearch))).map(client => (
                      <button
                        key={client.id}
                        onClick={() => {
                          setSelectedClientId(client.id);
                          setClientName(client.name);
                          setClientPhone(client.phone || "");
                        }}
                        className={cn(
                          "w-full text-left p-3 rounded-lg flex flex-col transition-colors cursor-pointer border",
                          selectedClientId === client.id ? "bg-primary/5 border-primary" : "hover:bg-muted/50 border-transparent bg-transparent"
                        )}
                      >
                        <span className="font-semibold text-sm text-foreground">{client.name}</span>
                        {client.phone && <span className="text-xs text-muted-foreground">{client.phone}</span>}
                      </button>
                    ))}
                    {clients.length === 0 && (
                      <div className="p-4 text-center text-sm text-muted-foreground">No hay {t.clientPlural.toLowerCase()}</div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="unregistered" className="mt-4 space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor={`admin-name-${shopId}`} className={touched.name && !clientName.trim() ? "text-sm text-destructive" : "text-sm text-foreground"}>Nombre completo *</Label>
                    <Input
                      id={`admin-name-${shopId}`}
                      placeholder="Ej: Juan Pérez"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
                      className={touched.name && !clientName.trim() ? "bg-card border-destructive focus-visible:ring-destructive" : "bg-card"}
                    />
                    {touched.name && !clientName.trim() && (
                      <p className="text-xs text-destructive">El nombre es requerido</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`admin-phone-${shopId}`} className={touched.phone && !clientPhone.trim() ? "text-sm text-destructive" : "text-sm text-foreground"}>Teléfono (WhatsApp) *</Label>
                    <Input
                      id={`admin-phone-${shopId}`}
                      placeholder="+506 8888 8888"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      onBlur={() => setTouched(prev => ({ ...prev, phone: true }))}
                      className={touched.phone && !clientPhone.trim() ? "bg-card border-destructive focus-visible:ring-destructive" : "bg-card"}
                    />
                    {touched.phone && !clientPhone.trim() && (
                      <p className="text-xs text-destructive">El teléfono es requerido</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <>
                <div className="space-y-1">
                  <Label htmlFor={`name-${shopId}`} className={touched.name && !clientName.trim() ? "text-sm text-destructive" : "text-sm text-foreground"}>Nombre completo *</Label>
                  <Input
                    id={`name-${shopId}`}
                    placeholder="Ej: Juan Pérez"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
                    className={touched.name && !clientName.trim() ? "bg-card border-destructive focus-visible:ring-destructive" : "bg-card"}
                  />
                  {touched.name && !clientName.trim() && (
                    <p className="text-xs text-destructive">El nombre es requerido</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`phone-${shopId}`} className={touched.phone && !clientPhone.trim() ? "text-sm text-destructive" : "text-sm text-foreground"}>Teléfono (WhatsApp){!isAdmin && " *"}</Label>
                  <Input
                    id={`phone-${shopId}`}
                    placeholder="+506 8888 8888"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    onBlur={() => setTouched(prev => ({ ...prev, phone: true }))}
                    className={touched.phone && !clientPhone.trim() && !isAdmin ? "bg-card border-destructive focus-visible:ring-destructive" : "bg-card"}
                  />
                  {touched.phone && !clientPhone.trim() && !isAdmin && (
                    <p className="text-xs text-destructive">El teléfono es requerido</p>
                  )}
                </div>
              </>
            )}

            {bookingError && (
              <p className="text-sm text-destructive">{bookingError}</p>
            )}

            <Button
              className="mt-4 h-14 w-full rounded-2xl text-base font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
              onClick={() => {
                setTouched({ name: true, phone: true })
                handleConfirm()
              }}
              disabled={(isAdmin && clientType === 'registered' && !selectedClientId) || !clientName || (!isAdmin && !clientPhone) || (isAdmin && clientType === 'unregistered' && !clientPhone) || isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {t.bookingVerb}...
                </>
              ) : (
                `Confirmar ${t.appointment}`
              )}
            </Button>
            <Button
              variant="outline"
              className="w-full h-12 rounded-2xl font-bold uppercase tracking-widest text-xs border-border/60"
              onClick={() => { setSelectedTime(null) }}
            >
              Volver
            </Button>

            {!initialClientName && !isAdmin && (
              <div className="mt-6 p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-4">
                <div className="text-center space-y-1">
                  <p className="text-sm font-bold text-foreground">¿Quieres guardar {t.appointmentGender === "f" ? "esta" : "este"} {t.appointment.toLowerCase()}?</p>
                  <p className="text-xs text-muted-foreground">Accede a tu cuenta para no volver a escribir tus datos.</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1 h-10 rounded-lg text-xs gap-2 bg-background hover:bg-background/80"
                    onClick={() => handleAuthRedirect('login')}
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    Iniciar sesión
                  </Button>
                  <Button
                    variant="secondary"
                    className="flex-1 h-10 rounded-lg text-xs gap-2 bg-background hover:bg-background/80"
                    onClick={() => handleAuthRedirect('register')}
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Registrarse
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  )
}
