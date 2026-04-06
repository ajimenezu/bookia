"use client"

import Link from "next/link"
import Image from "next/image"
import {
  Scissors,
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

interface ShopNavbarProps {
  shop: {
    id: string
    name: string
    slug: string
    logoUrl?: string | null
  }
  user?: {
    name?: string | null
  } | null
  role?: string | null
  showScheduleButton?: boolean
}

export function ShopNavbar({ shop, user, role, showScheduleButton = true }: ShopNavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href={`/${shop.slug}`} className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          {shop.logoUrl ? (
            <Image
              src={shop.logoUrl}
              alt={shop.name}
              width={36}
              height={36}
              className="rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Scissors className="h-4 w-4" />
            </div>
          )}
          <span className="text-lg font-bold">{shop.name}</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          {!user && (
            <Link
              href={`/${shop.slug}/login`}
              id="nav-login-btn"
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Iniciar sesión
            </Link>
          )}

          {showScheduleButton && (
            <Link
              href={`/${shop.slug}/schedule`}
              id="nav-book-btn"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 flex items-center justify-center"
            >
              Reservar cita
            </Link>
          )}

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full px-2 py-1 transition-all hover:bg-muted/50 outline-hidden group border border-transparent hover:border-border cursor-pointer">
                  <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-bold shadow-sm transition-transform group-active:scale-95">
                    {user.name?.charAt(0) || <User className="h-4 w-4" />}
                  </div>
                  <span className="hidden md:block text-sm font-medium text-foreground">{user.name?.split(' ')[0]}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">Mi cuenta</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(role === "SUPER_ADMIN" || role === "OWNER" || role === "STAFF") && (
                  <DropdownMenuItem asChild>
                    <Link href={`/${shop.slug}/admin`} className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Panel administrativo</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive cursor-pointer"
                  onClick={() => signOut(`/${shop.slug}`)}
                >
                  <LogOut className="mr-2 h-4 w-4" />
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
