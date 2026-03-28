"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Scissors, LayoutDashboard, CalendarDays, Users, Wrench, UserRound, Menu, X, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { signOut } from "@/app/auth/actions"
import { Terminology } from "@/lib/dictionaries"

export function AdminSidebar({ 
  children,
  terminology: t,
  shopSlug,
}: { 
  children: React.ReactNode,
  terminology: Terminology,
  shopSlug: string | null,
}) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

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
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-sidebar-border bg-sidebar px-4 lg:hidden">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Scissors className="h-3.5 w-3.5" />
          </div>
          <span className="font-bold text-sidebar-foreground">BookIA</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)} className="text-sidebar-foreground">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/50 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Scissors className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold text-sidebar-foreground">BookIA</span>
        </div>

        <nav className="flex-1 px-3 py-4">
          <ul className="grid gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-primary"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon className="h-4.5 w-4.5" />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="border-t border-sidebar-border p-4 space-y-2">
          {shopSlug && (
            <Link
              href={`/${shopSlug}`}
              className="flex items-center justify-center gap-2 rounded-lg bg-sidebar-accent px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/80 cursor-pointer"
            >
              Ver página pública
            </Link>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive cursor-pointer"
            onClick={async () => await signOut(shopSlug ? `/${shopSlug}` : "/login")}
          >
            <LogOut className="h-4.5 w-4.5" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col pt-14 lg:pl-64 lg:pt-0">
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
