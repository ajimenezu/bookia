
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testGetPendingRequests(shopId) {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Everyone sees their own unnotified appointments
  const newAppointments = await prisma.appointment.findMany({
    where: { 
      shopId, 
      isNotified: false,
      // status: { not: "CANCELLED" }, // REMOVED
      startTime: { gte: thirtyDaysAgo }
    },
    include: { services: true }
  })

  console.log(`Found ${newAppointments.length} unnotified appointments for shop ${shopId}:`)
  newAppointments.forEach(app => {
    console.log(`- ID: ${app.id}, Status: ${app.status}, Time: ${app.startTime}`)
  })
}

// Using the shop ID for Vanity Studio from previous query
const VANITY_STUDIO_SHOP_ID = "clp8j9f8z000008l1a0j9g0j3" // I need to get the real ID

async function run() {
  const shop = await prisma.shop.findFirst({ where: { slug: 'vanity-studio' } })
  if (shop) {
    await testGetPendingRequests(shop.id)
  } else {
    console.log("Shop not found")
  }
}

run()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
