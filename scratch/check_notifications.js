
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const unnotified = await prisma.appointment.findMany({
    where: { isNotified: false },
    include: {
      shop: { select: { name: true, slug: true } },
      staff: { select: { name: true } }
    }
  })

  console.log(`Found ${unnotified.length} unnotified appointments:`)
  unnotified.forEach(app => {
    console.log(`- ID: ${app.id}, Shop: ${app.shop.name} (${app.shop.slug}), Staff: ${app.staff?.name || 'Unassigned'}, Time: ${app.startTime}, Status: ${app.status}`)
  })
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
