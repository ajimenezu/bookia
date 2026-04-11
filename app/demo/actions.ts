"use server"

import prisma from "@/lib/prisma"
import { z } from "zod"

const businessTypes = [
  "BARBERIA",
  "SALON_BELLEZA",
  "SPA",
  "CLINICA",
  "ESTETICA",
  "UÑAS",
  "FISIOTERAPIA",
  "VETERINARIA",
  "OTRO",
] as const

const teamSizes = ["1-3", "4-10", "11-25", "25+"] as const

const demoSchema = z.object({
  companyName: z.string().trim().min(2, "La empresa es requerida"),
  contactName: z.string().trim().min(2, "El nombre de contacto es requerido"),
  email: z.string().trim().email("Correo invalido"),
  phone: z.string().trim().min(8, "El telefono es requerido"),
  businessType: z.enum(businessTypes),
  customBusinessType: z.string().trim().min(2).optional(),
  teamSize: z.enum(teamSizes, { message: "El tamaño del equipo es requerido" }),
  notes: z.string().trim().max(1000).optional(),
}).superRefine((data, context) => {
  if (data.businessType === "OTRO" && !data.customBusinessType) {
    context.addIssue({
      code: "custom",
      path: ["customBusinessType"],
      message: "Indica qué tipo de negocio tienes",
    })
  }

  if (data.businessType !== "OTRO" && data.customBusinessType) {
    context.addIssue({
      code: "custom",
      path: ["customBusinessType"],
      message: "Solo usa este campo si seleccionaste Otro",
    })
  }
})

function getDefaultScheduledFor() {
  const scheduledFor = new Date()
  scheduledFor.setDate(scheduledFor.getDate() + 1)
  scheduledFor.setHours(10, 0, 0, 0)
  return scheduledFor
}

export async function createDemoRequest(rawData: unknown) {
  const validated = demoSchema.safeParse(rawData)
  if (!validated.success) {
    return { success: false, error: "Datos de demo invalidos" }
  }

  const scheduledFor = getDefaultScheduledFor()

  await prisma.demoRequest.create({
    data: {
      companyName: validated.data.companyName,
      contactName: validated.data.contactName,
      email: validated.data.email,
      phone: validated.data.phone,
      businessType: validated.data.businessType,
      customBusinessType: validated.data.customBusinessType?.trim() || null,
      teamSize: validated.data.teamSize,
      scheduledFor,
      notes: validated.data.notes?.trim() || null,
    },
  })

  return { success: true }
}
