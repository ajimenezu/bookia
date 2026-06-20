import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { toCRDate, combineDateAndTime } from "@/lib/date-utils"
import { sendAppointmentReminderSafe } from "@/lib/whatsapp/send-appointment-reminder"

// Always run fresh; never cache a cron endpoint.
export const dynamic = "force-dynamic"

/** YYYY-MM-DD from a Date whose fields already represent the target wall time. */
function ymd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/**
 * Daily cron: sends a WhatsApp reminder for every appointment happening
 * TOMORROW (Costa Rica). Triggered by Vercel Cron (see vercel.json).
 *
 * Appointment times are stored as naive wall-time-in-UTC (see lib/date-utils:
 * combineDateAndTime / formatTime use timeZone "UTC"), so "tomorrow in CR" is a
 * UTC [start, end) window built from tomorrow's CR calendar date.
 *
 * Idempotent: only appointments with reminderSentAt = null are picked up, and
 * reminderSentAt is stamped only after a confirmed send — so duplicate runs or
 * retries never double-message a customer.
 */
export async function GET(request: Request) {
  // Auth: Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`.
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 })
  }
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Build tomorrow's CR window as [tomorrow 00:00, day-after 00:00) in stored UTC terms.
  const crNow = toCRDate(new Date())

  const tomorrow = new Date(crNow)
  tomorrow.setDate(crNow.getDate() + 1)

  const dayAfter = new Date(crNow)
  dayAfter.setDate(crNow.getDate() + 2)

  const start = combineDateAndTime(ymd(tomorrow), "00:00")
  const end = combineDateAndTime(ymd(dayAfter), "00:00")

  const appointments = await prisma.appointment.findMany({
    where: {
      startTime: { gte: start, lt: end },
      status: { in: ["PENDING", "CONFIRMED"] },
      reminderSentAt: null,
    },
    select: {
      id: true,
      startTime: true,
      customerName: true,
      customerPhone: true,
      customer: { select: { name: true, phone: true } },
      shop: { select: { id: true, name: true, whatsappRemindersEnabled: true } },
    },
  })

  let sent = 0
  let skipped = 0
  let failed = 0

  for (const appt of appointments) {
    const customerPhone = appt.customerPhone || appt.customer?.phone || null
    if (appt.shop.whatsappRemindersEnabled === false || !customerPhone) {
      skipped++
      continue
    }

    const ok = await sendAppointmentReminderSafe({
      shop: appt.shop,
      customerName: appt.customerName || appt.customer?.name || "Cliente",
      customerPhone,
      startTime: appt.startTime,
    })

    if (ok) {
      await prisma.appointment.update({
        where: { id: appt.id },
        data: { reminderSentAt: new Date() },
      })
      sent++
    } else {
      failed++
    }
  }

  return NextResponse.json({
    scanned: appointments.length,
    sent,
    skipped,
    failed,
    window: { start, end },
  })
}
