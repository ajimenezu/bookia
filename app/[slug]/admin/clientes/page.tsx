import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth-utils"
import { ClientSearch } from "@/components/admin/client-search"
import { CreateUserModal } from "@/components/admin/create-user-modal"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { ClientesContent } from "@/components/admin/clientes-content"
import { ClientesSkeleton } from "@/components/admin/clientes-skeleton"
import { getShopBySlug } from "@/lib/shop"

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ q?: string }>
}


export default async function ClientesPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const shop = await getShopBySlug(slug)
  if (!shop) notFound()

  const { shopId, isSuperAdmin, role, businessType } = await requireAdmin(shop.id)
  const { q } = await searchParams

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Clientes</h1>
          <p className="mt-1 text-muted-foreground italic text-sm">Gestiona la base de datos de tus clientes</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <ClientSearch placeholder="Buscar por nombre, email o teléfono..." />
          <CreateUserModal currentUserRole={role} isSuperAdmin={isSuperAdmin} shopId={shopId} />
        </div>
      </div>

      <Suspense key={q || 'all'} fallback={<ClientesSkeleton />}>
        <ClientesContent
          shopId={shopId}
          isSuperAdmin={isSuperAdmin}
          businessType={businessType}
          q={q}
        />
      </Suspense>
    </div>
  )
}
