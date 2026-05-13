"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { StaffScheduleDialog } from "./staff-schedule-dialog"
import { StaffDetailSheet } from "./staff-detail-sheet"
import { Role } from "@prisma/client"
import { cn } from "@/lib/utils"

interface StaffStats {
  name: string
  initials: string
  specialty: string
  status: string
  isActive: boolean
  todayAppointments: number
  weekAppointments: number
}

interface StaffMemberCardProps {
  shopId: string
  staffId: string
  isOwner: boolean
  currentUserRole: Role
  currentUserId: string
  isSuperAdmin: boolean
  schedules: any[]
  timeOff: any[]
  stats: StaffStats
  terminology: any
  businessType: string
}

export function StaffMemberCard({
  shopId,
  staffId,
  isOwner,
  currentUserRole,
  currentUserId,
  isSuperAdmin,
  schedules,
  timeOff,
  stats,
  terminology: t,
  businessType
}: StaffMemberCardProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  return (
    <>
      <div 
        className={cn(
          "rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden cursor-pointer",
          !stats.isActive && "opacity-75 grayscale-[0.5]"
        )}
        onClick={() => setIsSheetOpen(true)}
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className={cn(
                "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-black border shadow-inner transition-all duration-500",
                stats.isActive 
                  ? "bg-primary/10 text-primary border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground" 
                  : "bg-muted text-muted-foreground border-border"
              )}>
                {stats.initials}
              </div>
              <div className={cn(
                "absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-card shadow-sm",
                stats.isActive ? "bg-success" : "bg-muted-foreground"
              )} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-card-foreground tracking-tight group-hover:text-primary transition-colors">
                {stats.name}
              </h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stats.specialty}</p>
            </div>
          </div>
          <Badge className={cn(
            "h-fit rounded-lg px-2.5 py-1 font-bold text-[10px] uppercase tracking-wider",
            stats.isActive 
              ? "bg-success/15 text-success border-success/30 hover:bg-success/20" 
              : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
          )}>
            {stats.isActive ? "Activo" : "Inactivo"}
          </Badge>
        </div>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 text-sm bg-muted/5 p-3 rounded-xl border border-border/40">
              <span className="text-[10px] uppercase font-black text-muted-foreground/50 tracking-wider">{t.appointmentPlural} hoy</span>
              <span className="font-black text-lg text-card-foreground">{stats.todayAppointments}</span>
            </div>
            <div className="flex flex-col gap-1 text-sm bg-muted/5 p-3 rounded-xl border border-border/40">
              <span className="text-[10px] uppercase font-black text-muted-foreground/50 tracking-wider">{t.appointmentPlural} semana</span>
              <span className="font-black text-lg text-card-foreground">{stats.weekAppointments}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-border/60" onClick={(e) => e.stopPropagation()}>
          <StaffScheduleDialog
            shopId={shopId}
            staffId={staffId}
            staffName={stats.name}
            initialSchedules={schedules}
            initialTimeOff={timeOff}
            isOwner={isOwner}
          />
        </div>
      </div>

      <StaffDetailSheet 
        staffId={staffId}
        shopId={shopId}
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        currentUserRole={currentUserRole}
        currentUserId={currentUserId}
        isSuperAdmin={isSuperAdmin}
        businessType={businessType}
      />
    </>
  )
}
