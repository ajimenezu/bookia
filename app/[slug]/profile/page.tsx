import { getAdminUser } from "@/lib/auth-utils"
import prisma from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { ShopNavbar } from "@/components/shop/shop-navbar"
import { ProfileHeader, AppointmentList } from "@/components/shop/profile-components"
import { Metadata } from "next"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const shop = await prisma.shop.findFirst({ where: { slug } })
  return {
    title: `Mi Perfil | ${shop?.name || "Bookia"}`,
    description: "Gestiona tus citas y datos personales.",
  }
}

export default async function ProfilePage({ params }: PageProps) {
  const { slug } = await params
  const shop = await prisma.shop.findFirst({
    where: { slug },
  })

  if (!shop) notFound()

  const account = await getAdminUser()
  if (!account?.user) {
    redirect(`/${slug}/login?returnUrl=/${slug}/profile`)
  }

  // Fetch full user details from Prisma
  const dbUser = await prisma.user.findUnique({
    where: { id: account.user.id },
  })

  if (!dbUser) {
    // This shouldn't happen for a logged-in user, but handle it
    redirect(`/${slug}/login`)
  }

  // Fetch appointments for this user in THIS shop
  const appointments = await prisma.appointment.findMany({
    where: { 
      customerId: dbUser.id,
      shopId: shop.id
    },
    include: {
      shop: { select: { name: true, slug: true } },
      staff: { select: { name: true } },
      services: { select: { name: true } },
      service: { select: { name: true } } // legacy support
    },
    orderBy: { startTime: "desc" }
  })

  const formattedAppointments = appointments.map(app => {
    const bookedServices = app.serviceDetails as any[] | null
    const serviceName = bookedServices?.length 
      ? bookedServices.map(s => s.name).join(", ")
      : (app.services[0]?.name || app.service?.name || "Servicio")

    return {
      id: app.id,
      startTime: app.startTime,
      endTime: app.endTime,
      status: app.status,
      serviceName,
      staffName: app.staff?.name || null,
      shopName: app.shop.name,
      shopSlug: app.shop.slug,
      price: app.priceAtBooking
    }
  })

  const userData = {
    name: dbUser.name || account.user.user_metadata?.full_name || "Usuario",
    email: dbUser.email,
    phone: dbUser.phone
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ShopNavbar 
        shop={shop as any} 
        user={{ name: userData.name, email: userData.email }} 
        role={account.role}
        showScheduleButton={true} 
      />

      <main className="mx-auto max-w-5xl px-6 py-12">
        <ProfileHeader user={userData} shopSlug={slug} />
        
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black tracking-tight">Historial de Citas</h2>
            <div className="hidden sm:flex h-10 items-center px-4 rounded-full bg-muted/50 border border-border text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {formattedAppointments.length} {formattedAppointments.length === 1 ? "Cita" : "Citas"} en total
            </div>
          </div>
          
          <AppointmentList 
            appointments={formattedAppointments} 
            currentShopSlug={slug} 
          />
        </div>
      </main>

      <footer className="mt-20 border-t border-border py-12 text-center text-sm font-medium text-muted-foreground">
        <p>© {new Date().getFullYear()} {shop.name}. Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}
