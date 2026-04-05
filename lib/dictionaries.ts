export type BusinessType = "BARBERIA" | "SALON_BELLEZA" | "SPA" | "CLINICA"

export interface Terminology {
  staff: string
  staffPlural: string
  client: string
  clientPlural: string
  service: string
  servicePlural: string
  appointment: string
  appointmentPlural: string
  newStaff: string
  newClient: string
  newService: string
  newAppointment: string
  dashboardDesc: string
}

export const DICTIONARIES: Record<BusinessType, Terminology> = {
  BARBERIA: {
    staff: "Barbero",
    staffPlural: "Barberos",
    client: "Cliente",
    clientPlural: "Clientes",
    service: "Servicio",
    servicePlural: "Servicios",
    appointment: "Cita",
    appointmentPlural: "Citas",
    newStaff: "Nuevo Barbero",
    newClient: "Nuevo Cliente",
    newService: "Nuevo Servicio",
    newAppointment: "Nueva Cita",
    dashboardDesc: "Resumen de tu barbería hoy"
  },
  SALON_BELLEZA: {
    staff: "Estilista",
    staffPlural: "Estilistas",
    client: "Cliente",
    clientPlural: "Clientes",
    service: "Tratamiento",
    servicePlural: "Tratamientos",
    appointment: "Reserva",
    appointmentPlural: "Reservas",
    newStaff: "Nuevo Estilista",
    newClient: "Nuevo Cliente",
    newService: "Nuevo Tratamiento",
    newAppointment: "Nueva Reserva",
    dashboardDesc: "Resumen de tu salón hoy"
  },
  SPA: {
    staff: "Terapeuta",
    staffPlural: "Terapeutas",
    client: "Huésped",
    clientPlural: "Huéspedes",
    service: "Sesión",
    servicePlural: "Sesiones",
    appointment: "Cita",
    appointmentPlural: "Citas",
    newStaff: "Nuevo Terapeuta",
    newClient: "Nuevo Huésped",
    newService: "Nueva Sesión",
    newAppointment: "Nueva Cita",
    dashboardDesc: "Resumen de tu SPA hoy"
  },
  CLINICA: {
    staff: "Especialista",
    staffPlural: "Especialistas",
    client: "Paciente",
    clientPlural: "Pacientes",
    service: "Consulta",
    servicePlural: "Consultas",
    appointment: "Turno",
    appointmentPlural: "Turnos",
    newStaff: "Nuevo Especialista",
    newClient: "Nuevo Paciente",
    newService: "Nueva Consulta",
    newAppointment: "Nuevo Turno",
    dashboardDesc: "Resumen de tu clínica hoy"
  }
}

import { cache } from "react"

export const getTerminology = cache((businessType: BusinessType = "BARBERIA"): Terminology => {
  return DICTIONARIES[businessType] || DICTIONARIES.BARBERIA
})
