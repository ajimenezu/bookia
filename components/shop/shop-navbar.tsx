"use client"

import Link from "next/link"
import Image from "next/image"
import {
  ChevronDown,
  LogOut,
  User,
  LayoutDashboard,
} from "lucide-react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { signOut } from "@/app/auth/actions"
import { BusinessType, getTerminology } from "@/lib/dictionaries"
import { getBusinessIcon } from "@/lib/business-icons"

interface ShopNavbarProps {
  shop: {
    id: string
    name: string
    slug: string
    businessType: BusinessType
    logoUrl?: string | null
  }
  user?: {
    name?: string | null
  } | null
  role?: string | null
  showScheduleButton?: boolean
}

export function ShopNavbar({ shop, user, role, showScheduleButton = true }: ShopNavbarProps) {
  const t = getTerminology(shop.businessType)
  const BusinessIcon = getBusinessIcon(shop.businessType)
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link href={`/${shop.slug}`} className="flex items-center gap-2.5 hover:opacity-90 transition-all active:scale-95">
          {shop.logoUrl ? (
            <Image
              src={shop.logoUrl}
              alt={shop.name}
              width={38}
              height={38}
              className="rounded-xl object-cover shadow-sm bg-muted"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <BusinessIcon className="h-5 w-5" />
            </div>
          )}
          <span className="text-xl font-black text-foreground tracking-tight">{shop.name}</span>
        </Link>
        <div className="flex items-center gap-3 sm:gap-6">
          {!user && (
            <Link
              href={`/${shop.slug}/login`}
              id="nav-login-btn"
              className="px-3 py-2 text-sm font-bold text-muted-foreground transition-colors hover:text-primary uppercase tracking-widest text-[10px]"
            >
              Iniciar sesión
            </Link>
          )}

          {showScheduleButton && (
            <Link
              href={`/${shop.slug}/schedule`}
              id="nav-book-btn"
              className="rounded-xl bg-primary px-5 py-2.5 text-xs font-black uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
            >
              {t.bookVerb}
            </Link>
          )}

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 rounded-full px-1.5 py-1 transition-all hover:bg-muted/50 outline-hidden group border border-transparent hover:border-border cursor-pointer">
                  <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black text-xs shadow-lg shadow-primary/20 transition-transform group-active:scale-90">
                    {user.name?.charAt(0) || <User className="h-5 w-5" />}
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl shadow-2xl">
                <DropdownMenuLabel className="font-normal px-3 py-3">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-black text-foreground">{user.name}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Mi cuenta</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="mx-1" />
                {(role === "SUPER_ADMIN" || role === "OWNER" || role === "STAFF") && (
                  <DropdownMenuItem asChild>
                    <Link href={`/${shop.slug}/admin`} className="cursor-pointer rounded-lg py-2.5 font-bold text-sm">
                      <LayoutDashboard className="mr-3 h-4 w-4 text-primary" />
                      <span>Panel administrativo</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive cursor-pointer rounded-lg py-2.5 font-bold text-sm"
                  onClick={() => signOut(`/${shop.slug}`)}
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  <span>Salir</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  )
}
