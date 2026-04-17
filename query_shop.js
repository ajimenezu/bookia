const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const shop = await prisma.shop.findFirst({ where: { name: "Vanity Studio" } })
  console.log("SHOP:", shop)
  
  if (shop) {
    const members = await prisma.shopMember.findMany({
      where: { shopId: shop.id },
      include: { user: true }
    })
    console.log("MEMBERS:", JSON.stringify(members, null, 2))
  }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect())
