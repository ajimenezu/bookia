"use server"

import { z } from "zod"

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
