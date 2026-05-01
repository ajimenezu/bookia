
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function test() {
  try {
    const apps = await prisma.appointment.findMany({
      where: {
        shopId: "some-id", // Placeholder
        staffId: "00000000-0000-0000-0000-000000000000", // Valid UUID placeholder
        isNotified: false,
        status: { not: "CANCELLED" }
      }
    })
    console.log('Success:', apps.length)
  } catch (e) {
    console.error('Error:', e)
  } finally {
    await prisma.$disconnect()
  }
}

test()
