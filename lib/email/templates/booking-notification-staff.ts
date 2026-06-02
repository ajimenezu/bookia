import type { EmailTheme } from "../theme"

export interface BookingNotificationStaffTemplateData {
  shop: {
    name: string
    slug: string
    logoUrl: string | null
  }
  customer: {
    name: string
    phone: string | null
    email: string | null
  }
  appointment: {
    startTime: Date
    endTime: Date
    services: Array<{ name: string; duration: number; price: number }>
    staffName: string | null
    totalPrice: number
  }
  siteUrl: string
  theme: EmailTheme
  actionType?: "CREATED" | "UPDATED" | "CANCELLED"
}

const dateFmt = new Intl.DateTimeFormat("es-CR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
})

const timeFmt = new Intl.DateTimeFormat("es-CR", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
  timeZone: "UTC",
})

const moneyFmt = new Intl.NumberFormat("es-CR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export function renderBookingNotificationStaff(d: BookingNotificationStaffTemplateData): {
  subject: string
  html: string
  text: string
} {
  const { shop, customer, appointment, siteUrl, theme } = d
  const dateStr = dateFmt.format(appointment.startTime)
  const startStr = timeFmt.format(appointment.startTime)
  const endStr = timeFmt.format(appointment.endTime)
  const totalDuration = appointment.services.reduce((acc, s) => acc + s.duration, 0)
  const adminUrl = `${siteUrl}/${shop.slug}/admin/citas`

  const actionType = d.actionType || "CREATED"
  
  let subjectPrefix = "Nueva cita"
  if (actionType === "UPDATED") subjectPrefix = "Cita Actualizada"
  if (actionType === "CANCELLED") subjectPrefix = "Cita Cancelada"

  const subject = `${subjectPrefix} en ${shop.name} — ${dateStr}, ${startStr}`

  const servicesRowsHtml = appointment.services
    .map(
      (s) => `
        <tr>
          <td style="padding:6px 0;color:#374151">${escapeHtml(s.name)}</td>
          <td style="padding:6px 0;color:#6b7280;text-align:right">$${moneyFmt.format(s.price)}</td>
        </tr>`
    )
    .join("")

  const phoneLine = customer.phone
    ? `<div style="font-size:14px;color:#374151;margin-top:4px">📱 <a href="tel:${escapeHtml(customer.phone)}" style="color:#0070f3;text-decoration:none">${escapeHtml(customer.phone)}</a></div>`
    : ""
  const emailLine = customer.email
    ? `<div style="font-size:14px;color:#374151;margin-top:4px">✉️ <a href="mailto:${escapeHtml(customer.email)}" style="color:#0070f3;text-decoration:none">${escapeHtml(customer.email)}</a></div>`
    : ""

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 0">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
          <tr>
            <td style="padding:0;line-height:0;font-size:0">
              <div style="height:4px;background:${theme.accentStrip};line-height:4px;font-size:0">&nbsp;</div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 16px;border-bottom:1px solid #e5e7eb;background:${actionType === 'CANCELLED' ? '#fee2e2' : actionType === 'UPDATED' ? '#e0f2fe' : '#fef3c7'}">
              <div style="font-size:11px;color:${actionType === 'CANCELLED' ? '#991b1b' : actionType === 'UPDATED' ? '#0369a1' : '#92400e'};text-transform:uppercase;letter-spacing:.1em;font-weight:700;margin-bottom:4px">
                ${
                  actionType === "CREATED"
                    ? "Nueva reserva"
                    : actionType === "UPDATED"
                    ? "Reserva actualizada"
                    : "Reserva cancelada"
                }
              </div>
              <div style="display:flex;align-items:center;gap:12px">
                ${
                  shop.logoUrl
                    ? `<img src="${escapeHtml(shop.logoUrl)}" alt="${escapeHtml(shop.name)}" style="height:32px;border-radius:6px;vertical-align:middle;margin-right:8px" />`
                    : ""
                }
                <h1 style="margin:0;font-size:18px;color:#111827;display:inline-block;vertical-align:middle">${escapeHtml(shop.name)}</h1>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px">
              <div style="background:#f9fafb;border-radius:8px;padding:16px 20px;margin-bottom:20px">
                <div style="font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Cliente</div>
                <div style="font-size:16px;color:#111827;font-weight:600">${escapeHtml(customer.name)}</div>
                ${phoneLine}
                ${emailLine}
              </div>

              <div style="background:#f9fafb;border-radius:8px;padding:16px 20px;margin-bottom:20px">
                <div style="font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Fecha y hora</div>
                <div style="font-size:16px;color:#111827;font-weight:600;text-transform:capitalize">${escapeHtml(dateStr)}</div>
                <div style="font-size:15px;color:#374151;margin-top:6px">${escapeHtml(startStr)} – ${escapeHtml(endStr)} (${totalDuration} min)</div>
                ${
                  appointment.staffName
                    ? `<div style="font-size:14px;color:#6b7280;margin-top:8px">Asignado a: <strong style="color:#374151">${escapeHtml(appointment.staffName)}</strong></div>`
                    : ""
                }
              </div>

              <div style="margin-bottom:20px">
                <div style="font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">Servicios</div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:15px">
                  ${servicesRowsHtml}
                  <tr>
                    <td style="padding:10px 0 0;border-top:1px solid #e5e7eb;color:#111827;font-weight:600">Total</td>
                    <td style="padding:10px 0 0;border-top:1px solid #e5e7eb;color:#111827;font-weight:600;text-align:right">$${moneyFmt.format(appointment.totalPrice)}</td>
                  </tr>
                </table>
              </div>

              <div style="text-align:center;margin-top:24px">
                <a href="${escapeHtml(adminUrl)}" style="display:inline-block;background:${theme.primary};color:${theme.primaryFg};padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">
                  Ver en panel
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 32px;background:#f9fafb;text-align:center;font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb">
              Notificación automática de Bookia.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const text = [
    actionType === "CREATED"
      ? `Nueva reserva en ${shop.name}`
      : actionType === "UPDATED"
      ? `Reserva actualizada en ${shop.name}`
      : `Reserva cancelada en ${shop.name}`,
    ``,
    `Cliente: ${customer.name}`,
    customer.phone ? `Teléfono: ${customer.phone}` : null,
    customer.email ? `Email: ${customer.email}` : null,
    ``,
    `Fecha: ${dateStr}`,
    `Hora: ${startStr} – ${endStr} (${totalDuration} min)`,
    appointment.staffName ? `Asignado a: ${appointment.staffName}` : null,
    ``,
    `Servicios:`,
    ...appointment.services.map((s) => `  - ${s.name} ($${moneyFmt.format(s.price)})`),
    `Total: $${moneyFmt.format(appointment.totalPrice)}`,
    ``,
    `Ver en panel: ${adminUrl}`,
  ]
    .filter((l) => l !== null)
    .join("\n")

  return { subject, html, text }
}
