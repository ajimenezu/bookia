"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, CalendarDays, Users, Wrench, UserRound, Menu, X, LogOut, Bell, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { signOut } from "@/app/auth/actions"
import { Terminology, BusinessType } from "@/lib/dictionaries"
import { getPendingRequests } from "@/app/[slug]/admin/staff/actions"
import { ApprovalSidePanel } from "./approval-side-panel"
import { getBusinessIcon } from "@/lib/business-icons"

export function AdminSidebar({
  children,
  terminology: t,
  shopSlug,
  shopId,
  businessType,
}: {
  children: React.ReactNode,
  terminology: Terminology,
  shopSlug: string | null,
  shopId?: string,
  businessType?: BusinessType,
}) {
  const BusinessIcon = getBusinessIcon(businessType)
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [pendingRequests, setPendingRequests] = useState<{ schedules: any[], timeOff: any[], appointments: any[] }>({ schedules: [], timeOff: [], appointments: [] })
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  useEffect(() => {
    if (shopId) {
      getPendingRequests(shopId).then(data => {
        if (data) setPendingRequests(data as any)
      })
    }
  }, [shopId])

  const pendingCount = (pendingRequests?.schedules?.length || 0) + (pendingRequests?.timeOff?.length || 0) + (pendingRequests?.appointments?.length || 0)

  const navItems = [
    { href: `/${shopSlug}/admin`, label: "Dashboard", icon: LayoutDashboard },
    { href: `/${shopSlug}/admin/citas`, label: t.appointmentPlural, icon: CalendarDays },
    { href: `/${shopSlug}/admin/clientes`, label: t.clientPlural, icon: Users },
    { href: `/${shopSlug}/admin/servicios`, label: t.servicePlural, icon: Wrench },
    { href: `/${shopSlug}/admin/staff`, label: t.staffPlural, icon: UserRound },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile header */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b border-sidebar-border bg-sidebar/80 backdrop-blur-lg px-6 lg:hidden shadow-sm">
        <div className="flex items-center gap-4">
          <Link href={`/${shopSlug}/admin`} className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <BusinessIcon className="h-4 w-4" />
            </div>
            <span className="font-bold text-sidebar-foreground tracking-tight">BookIA</span>
          </Link>

          {shopId && (
            <button
              onClick={() => setIsPanelOpen(true)}
              className="relative p-2.5 rounded-full hover:bg-muted/10 transition-colors cursor-pointer active:scale-95"
            >
              <Bell className="h-5 w-5 text-sidebar-foreground/70 transition-colors" />
              {pendingCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-3.5 w-3.5 bg-primary text-[8px] font-bold text-primary-foreground rounded-full flex items-center justify-center border-2 border-sidebar animate-in zoom-in duration-300">
                  {pendingCount}
                </span>
              )}
            </button>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-sidebar-foreground h-10 w-10 active:scale-95 transition-transform"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-foreground/30 backdrop-blur-[2px] transition-all duration-300 lg:hidden animate-in fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out lg:translate-x-0 lg:w-64",
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <BusinessIcon className="h-4.5 w-4.5" />
            </div>
            <span className="text-xl font-bold text-sidebar-foreground tracking-tight">BookIA</span>
            
            {shopId && (
              <button
                onClick={() => setIsPanelOpen(true)}
                className="relative ml-2 p-2 rounded-full hover:bg-muted/10 transition-colors cursor-pointer active:scale-95 group"
              >
                <Bell className="h-5 w-5 text-sidebar-foreground/70 transition-colors group-hover:text-sidebar-foreground" />
                {pendingCount > 0 && (
                  <span className="absolute top-1 right-1 h-3.5 w-3.5 bg-primary text-[8px] font-bold text-primary-foreground rounded-full flex items-center justify-center border-2 border-sidebar animate-in zoom-in duration-300">
                    {pendingCount}
                  </span>
                )}
              </button>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden h-8 w-8 text-sidebar-foreground/50 hover:text-sidebar-foreground"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <ul className="grid gap-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all active:scale-[0.98]",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
                        : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5", isActive ? "opacity-100" : "opacity-70")} />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="mt-auto border-t border-sidebar-border p-5 space-y-3">
          {shopSlug && (
            <Link
              href={`/${shopSlug}`}
              className="flex items-center justify-center gap-2 rounded-xl bg-sidebar-accent/50 border border-sidebar-border/50 px-4 py-3 text-sm font-semibold text-sidebar-foreground transition-all hover:bg-sidebar-accent cursor-pointer active:scale-[0.98]"
            >
              Ver página pública
            </Link>
          )}
          {shopSlug && (
            <Link
              href={`/${shopSlug}/admin/configuracion`}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3.5 rounded-xl px-4 py-2.5 text-sm font-medium text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all cursor-pointer"
            >
              <Settings className="h-5 w-5 opacity-70" />
              Configuración
            </Link>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start gap-3.5 rounded-xl px-4 py-2.5 text-sm font-medium text-sidebar-foreground/50 hover:bg-destructive/10 hover:text-destructive cursor-pointer transition-colors"
            onClick={async () => await signOut(shopSlug ? `/${shopSlug}` : "/login")}
          >
            <LogOut className="h-5 w-5 opacity-70" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col pt-16 lg:pl-64 lg:pt-0 overflow-x-hidden">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
          {children}
        </main>
      </div>

      {shopId && (
        <ApprovalSidePanel
          shopId={shopId}
          open={isPanelOpen}
          onOpenChange={setIsPanelOpen}
          initialRequests={pendingRequests}
        />
      )}
    </div>
  )
}
