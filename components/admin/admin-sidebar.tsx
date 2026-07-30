"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, CalendarDays, Users, Wrench, UserRound, Menu, X, LogOut, Bell, Settings, User, ExternalLink, ChevronDown, Bug } from "lucide-react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { signOut } from "@/app/auth/actions"
import { Terminology, BusinessType } from "@/lib/dictionaries"
import { getPendingRequests } from "@/app/[slug]/admin/staff/actions"
import { ApprovalSidePanel } from "./approval-side-panel"
import { getBusinessIcon } from "@/lib/business-icons"
import { ReportBugModal } from "./report-bug-modal"
import { getShopUrl } from "@/lib/domain"

export function AdminSidebar({
  children,
  terminology: t,
  shopSlug,
  shopId,
  businessType,
  user,
}: {
  children: React.ReactNode,
  terminology: Terminology,
  shopSlug: string | null,
  shopId?: string,
  businessType?: BusinessType,
  user?: {
    name?: string | null
    email?: string | null
  } | null
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
    { href: `/admin`, label: "Dashboard", icon: LayoutDashboard },
    { href: `/admin/citas`, label: t.appointmentPlural, icon: CalendarDays },
    { href: `/admin/clientes`, label: t.clientPlural, icon: Users },
    { href: `/admin/servicios`, label: t.servicePlural, icon: Wrench },
    { href: `/admin/staff`, label: t.staffPlural, icon: UserRound },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      {/* Persistent Top Bar (Mobile Header + Desktop Top Bar) */}
      <header className="fixed inset-x-0 top-0 z-10 flex h-16 items-center border-b border-sidebar-border bg-sidebar/80 backdrop-blur-lg px-6 shadow-sm lg:left-64">
        <div className={cn("flex flex-1 items-center justify-between gap-4 transition-opacity duration-200", mobileOpen && "opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto")}>
          <Link href={`/admin`} className="flex items-center gap-2.5 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <BusinessIcon className="h-4 w-4" />
            </div>
            <span className="font-bold text-sidebar-foreground tracking-tight">Bookia</span>
          </Link>
          
          <div className="flex items-center gap-2.5 ml-auto">
            {shopId && (
              <button
                onClick={() => setIsPanelOpen(true)}
                className="relative p-2.5 rounded-full hover:bg-muted/10 transition-colors cursor-pointer active:scale-95"
              >
                <Bell className="h-5 w-5 text-sidebar-foreground/70 transition-colors" />
                {pendingCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-primary text-[10px] font-bold text-primary-foreground rounded-full flex items-center justify-center border-2 border-sidebar shadow-sm animate-in zoom-in duration-300">
                    {pendingCount}
                  </span>
                )}
              </button>
            )}

            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full p-1.5 transition-all hover:bg-muted/10 outline-hidden group cursor-pointer">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shadow-xs transition-transform group-active:scale-95">
                      {user.name?.charAt(0) || <User className="h-4 w-4" />}
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180 hidden sm:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl shadow-2xl border-sidebar-border bg-sidebar">
                  <DropdownMenuLabel className="font-normal px-3 py-3">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-bold text-foreground">{user.name}</p>
                      <p className="text-[10px] font-medium text-muted-foreground truncate max-w-[200px]">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-sidebar-border mx-1" />
                  <DropdownMenuItem asChild>
                    <Link href={`/profile`} className="cursor-pointer rounded-lg py-2.5 font-medium text-sm hover:bg-sidebar-accent">
                      <User className="mr-3 h-4 w-4 text-primary" />
                      <span>Mi perfil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={shopSlug ? getShopUrl(shopSlug) : "/"} className="cursor-pointer rounded-lg py-2.5 font-medium text-sm hover:bg-sidebar-accent">
                      <ExternalLink className="mr-3 h-4 w-4 text-primary" />
                      <span>{t.viewBusiness || "Ver tienda"}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-sidebar-border mx-1" />
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer rounded-lg py-2.5 font-medium text-sm"
                    onClick={async () => await signOut("/")}
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    <span>Cerrar sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="text-sidebar-foreground h-10 w-10 active:scale-95 transition-transform lg:hidden"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-[2px] transition-all duration-300 lg:hidden animate-in fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out lg:translate-x-0 lg:w-64",
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-6 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 shrink-0">
              <BusinessIcon className="h-4.5 w-4.5" />
            </div>
            <span className="text-xl font-bold text-sidebar-foreground tracking-tight truncate">Bookia</span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(false)}
              className="lg:hidden h-10 w-10 text-sidebar-foreground/50 hover:text-sidebar-foreground"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
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

        <div className="mt-auto border-t border-sidebar-border p-5">
          {shopSlug && (
            <div className="flex flex-col gap-1.5">
              <ReportBugModal>
                <button
                  className={cn(
                    "w-full flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all active:scale-[0.98]",
                    "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground cursor-pointer text-left"
                  )}
                >
                  <Bug className="h-5 w-5 opacity-70" />
                  Reportar Problema
                </button>
              </ReportBugModal>

              <Link
              href={`/admin/configuracion`}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all active:scale-[0.98]",
                pathname === `/admin/configuracion`
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
                <Settings className="h-5 w-5 opacity-70" />
                Configuración
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col pt-16 lg:pl-64 overflow-x-hidden">
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
          onRequestsChange={setPendingRequests}
        />
      )}
    </div>
  )
}
