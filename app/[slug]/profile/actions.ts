"use server"

import { z } from "zod"
import prisma from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { AppointmentStatus } from "@prisma/client"

const cancelSchema = z.object({
  appointmentId: z.string().min(1),
  shopSlug: z.string().min(1),
})

export async function cancelAppointmentByCustomer(rawData: unknown) {
  const validated = cancelSchema.safeParse(rawData)
  if (!validated.success) {
    return { success: false, error: "Datos de cancelación inválidos" }
  }

  const { appointmentId, shopSlug } = validated.data
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Debes iniciar sesión para cancelar una cita." }
  }

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { shop: true }
    })

    if (!appointment) {
      return { success: false, error: "Cita no encontrada." }
    }

    // Security: Ensure the appointment belongs to the logged-in user
    if (appointment.customerId !== user.id) {
      return { success: false, error: "No tienes permiso para cancelar esta cita." }
    }
    
    // Security: Ensure the appointment belongs to the current shop
    if (appointment.shop.slug !== shopSlug) {
      return { success: false, error: "Esta cita no pertenece a este negocio." }
    }

    // Security: Check if the appointment is already cancelled or completed
    if (appointment.status === AppointmentStatus.CANCELLED) {
      return { success: false, error: "Esta cita ya está cancelada." }
    }
    
    if (appointment.status === AppointmentStatus.COMPLETED) {
      return { success: false, error: "No puedes cancelar una cita que ya ha sido completada." }
    }

    // Policy: Prevent cancellation of past appointments or too close to start time
    const now = new Date()
    const startTime = new Date(appointment.startTime)
    
    if (startTime < now) {
      return { success: false, error: "No puedes cancelar una cita pasada." }
    }

    const diffInHours = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60)
    if (diffInHours < 2) {
      return { success: false, error: "Las citas deben cancelarse con al menos 2 horas de anticipación." }
    }

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: AppointmentStatus.CANCELLED }
    })

    revalidatePath(`/${shopSlug}/profile`)
    
    return { success: true }
  } catch (error) {
    console.error("Error cancelling appointment:", error)
    return { success: false, error: "Ocurrió un error al intentar cancelar la cita." }
  }
}

const profileSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  phone: z.string().min(8, "El teléfono debe tener al menos 8 caracteres"),
  shopSlug: z.string().min(1),
})

export async function updateUserProfile(rawData: unknown) {
  const validated = profileSchema.safeParse(rawData)
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0].message }
  }

  const { name, phone, shopSlug } = validated.data
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Debes iniciar sesión para actualizar tu perfil." }
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { name, phone }
    })

    revalidatePath(`/${shopSlug}/profile`)
    return { success: true }
  } catch (error) {
    console.error("Error updating profile:", error)
    return { success: false, error: "Ocurrió un error al intentar actualizar el perfil." }
  }
}

