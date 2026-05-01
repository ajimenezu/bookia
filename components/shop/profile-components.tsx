"use client"

import { useState } from "react"
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  MapPin, 
  ChevronRight, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  History,
  RotateCcw,
  Trash2,
  ExternalLink
} from "lucide-react"
import { AppointmentStatus } from "@prisma/client"
import Link from "next/link"
import { cancelAppointmentByCustomer } from "@/app/[slug]/profile/actions"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { EditProfileModal } from "./edit-profile-modal"

interface UserData {
  name: string | null
  email: string
  phone: string | null
}

interface AppointmentData {
  id: string
  startTime: Date
  endTime: Date
  status: AppointmentStatus
  serviceName: string
  staffName: string | null
  shopName: string
  shopSlug: string
  price: number | null
}

export function ProfileHeader({ user, shopSlug }: { user: UserData, shopSlug: string }) {
  return (
    <div className="glass-card overflow-hidden rounded-[2.5rem] p-8 md:p-12 mb-10 relative">
      <div className="absolute top-0 right-0 h-64 w-64 bg-primary/5 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3" />
      
      <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 relative z-10">
        <div className="h-32 w-32 rounded-3xl bg-primary text-primary-foreground flex items-center justify-center text-4xl font-black shadow-2xl shadow-primary/30">
          {user.name?.charAt(0) || <User className="h-16 w-16" />}
        </div>
        
        <div className="flex-1 text-center md:text-left space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="text-4xl font-black tracking-tight text-foreground">{user.name || "Usuario"}</h1>
            <EditProfileModal user={user as any} shopSlug={shopSlug} />
          </div>
          <div className="flex flex-wrap justify-center md:justify-start gap-6 text-muted-foreground font-medium">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <span>{user.email}</span>
            </div>
            {user.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span>{user.phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const config = {
    [AppointmentStatus.PENDING]: { color: "bg-amber-500/10 text-amber-500 border-amber-500/20", label: "Pendiente", icon: Clock },
    [AppointmentStatus.CONFIRMED]: { color: "bg-blue-500/10 text-blue-500 border-blue-500/20", label: "Confirmada", icon: CheckCircle2 },
    [AppointmentStatus.COMPLETED]: { color: "bg-success/10 text-success border-success/20", label: "Completada", icon: CheckCircle2 },
    [AppointmentStatus.CANCELLED]: { color: "bg-destructive/10 text-destructive border-destructive/20", label: "Cancelada", icon: XCircle },
    [AppointmentStatus.NO_SHOW]: { color: "bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20", label: "No asistió", icon: AlertCircle },
  }

  const { color, label, icon: Icon } = config[status]

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border", color)}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  )
}

export function AppointmentCard({ appointment, currentShopSlug }: { appointment: AppointmentData, currentShopSlug: string }) {
  const [isCancelling, setIsCancelling] = useState(false)
  const isUpcoming = new Date(appointment.startTime) > new Date() && 
                     (appointment.status === AppointmentStatus.PENDING || appointment.status === AppointmentStatus.CONFIRMED)
  
  const handleCancel = async () => {
    if (!confirm("¿Estás seguro de que deseas cancelar esta cita?")) return
    
    setIsCancelling(true)
    const result = await cancelAppointmentByCustomer({ appointmentId: appointment.id, shopSlug: currentShopSlug })
    setIsCancelling(false)
    
    if (result.success) {
      toast.success("Cita cancelada correctamente")
    } else {
      toast.error(result.error)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-CR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(new Date(date))
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("es-CR", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(date))
  }

  return (
    <div className="group relative flex flex-col gap-6 rounded-[2rem] border border-border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-2xl hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
            <MapPin className="h-3 w-3" />
            {appointment.shopName}
          </div>
          <h3 className="text-xl font-black text-foreground">{appointment.serviceName}</h3>
          {appointment.staffName && (
            <p className="text-sm font-bold text-muted-foreground">Con {appointment.staffName}</p>
          )}
        </div>
        <StatusBadge status={appointment.status} />
      </div>

      <div className="flex flex-wrap items-center gap-6 py-4 border-y border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Calendar className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Fecha</span>
            <span className="text-sm font-black capitalize">{formatDate(appointment.startTime)}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Clock className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Hora</span>
            <span className="text-sm font-black uppercase">{formatTime(appointment.startTime)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        {appointment.price && (
          <div className="text-lg font-black text-primary">
            {new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC" }).format(appointment.price).replace("CRC", "₡")}
          </div>
        )}
        
        <div className="flex items-center gap-2 ml-auto">
          {isUpcoming ? (
            <button
              onClick={handleCancel}
              disabled={isCancelling}
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 text-xs font-black uppercase tracking-widest text-destructive transition-all hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Cancelar
            </button>
          ) : (
            <Link
              href={`/${appointment.shopSlug}/schedule?service=${appointment.serviceName}`}
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 text-xs font-black uppercase tracking-widest text-primary transition-all hover:bg-primary hover:text-primary-foreground"
            >
              <RotateCcw className="h-4 w-4" />
              Reagendar
            </Link>
          )}
          
          <Link
            href={`/${appointment.shopSlug}`}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted/20 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
            title="Ir al negocio"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 animate-in fade-in duration-1000">
      <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-muted/50 text-muted-foreground">
        <History className="h-12 w-12 opacity-20" />
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-black text-foreground">No tienes citas aún</h3>
        <p className="max-w-xs text-muted-foreground font-medium">
          Cuando agendes tu primera cita, aparecerá aquí para que puedas gestionarla.
        </p>
      </div>
    </div>
  )
}

export function AppointmentList({ 
  appointments, 
  currentShopSlug 
}: { 
  appointments: AppointmentData[], 
  currentShopSlug: string 
}) {
  const sorted = [...appointments].sort((a, b) => 
    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  )

  if (sorted.length === 0) return <EmptyState />

  return (
    <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
      {sorted.map((app) => (
        <AppointmentCard key={app.id} appointment={app} currentShopSlug={currentShopSlug} />
      ))}
    </div>
  )
}
