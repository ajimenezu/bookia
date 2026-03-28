import { Scissors, DollarSign, TrendingUp, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import prisma from "@/lib/prisma"
import { ServiceCard } from "@/components/admin/service-card"
import { requireAdmin } from "@/lib/auth-utils"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function ServiciosPage({ params }: PageProps) {
  const { slug } = await params
  const shop = await prisma.shop.findFirst({ where: { slug } })
  if (!shop) notFound()

  const { shopId, isSuperAdmin } = await requireAdmin(shop.id)

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const monthlyAppointments = await prisma.appointment.findMany({
    where: { AND: [isSuperAdmin ? {} : { shopId }, { status: "COMPLETED" }, { startTime: { gte: startOfMonth } }] },
    include: { service: true }
  })

  const totalBookings = monthlyAppointments.length
  const totalRevenueValue = monthlyAppointments.reduce((sum: number, app: any) => sum + (app.service?.price || 0), 0)
  const totalRevenue = new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(totalRevenueValue).replace("CRC", "₡")

  const services = await prisma.service.findMany({
    where: isSuperAdmin ? {} : { shopId },
    orderBy: { createdAt: "desc" },
    include: { shop: true }
  }) as any[]

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Servicios</h1>
          <p className="mt-1 text-muted-foreground">Gestiona los servicios de tu negocio</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href={`/${slug}/admin/servicios/nuevo`}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Servicio
          </Link>
        </Button>
      </div>
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Ingreso total (este mes)</p>
            <p className="text-2xl font-bold text-card-foreground">{totalRevenue}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Reservas totales (este mes)</p>
            <p className="text-2xl font-bold text-card-foreground">{totalBookings}</p>
          </div>
        </div>
      </div>
      {services.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 text-muted-foreground">
            <Scissors className="h-10 w-10" />
          </div>
          <h3 className="mt-4 text-xl font-semibold text-foreground">No hay servicios</h3>
          <p className="mt-2 max-w-sm text-muted-foreground">Aún no has creado ningún servicio.</p>
          <Button asChild className="mt-6">
            <Link href={`/${slug}/admin/servicios/nuevo`}>
              <Plus className="mr-2 h-4 w-4" /> Agregar primer servicio
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service: any) => (
            <ServiceCard key={service.id} name={service.name} price={service.price} duration={service.duration} description={service.description} />
          ))}
        </div>
      )}
    </div>
  )
}
