import type { EmailTheme } from "../theme"

export interface BookingConfirmationTemplateData {
  shop: {
    name: string
    slug: string
    logoUrl: string | null
    address: string | null
    whatsappPhone: string | null
  }
  customer: { name: string }
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
  timeZone: "America/Costa_Rica",
})

const timeFmt = new Intl.DateTimeFormat("es-CR", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
  timeZone: "America/Costa_Rica",
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

export function renderBookingConfirmation(d: BookingConfirmationTemplateData): {
  subject: string
  html: string
  text: string
} {
  const { shop, customer, appointment, siteUrl, theme } = d
  const dateStr = dateFmt.format(appointment.startTime)
  const startStr = timeFmt.format(appointment.startTime)
  const endStr = timeFmt.format(appointment.endTime)
  const totalDuration = appointment.services.reduce((acc, s) => acc + s.duration, 0)
  const shopUrl = `${siteUrl}/${shop.slug}`

  const actionType = d.actionType || "CREATED"
  
  let subjectPrefix = ""
  if (actionType === "UPDATED") subjectPrefix = "Actualización: "
  if (actionType === "CANCELLED") subjectPrefix = "Cancelación: "

  const subject = `${subjectPrefix}Tu cita en ${shop.name} — ${dateStr}, ${startStr}`

  const servicesRowsHtml = appointment.services
    .map(
      (s) => `
        <tr>
          <td style="padding:8px 0;color:#374151">${escapeHtml(s.name)}</td>
          <td style="padding:8px 0;color:#6b7280;text-align:right">$${moneyFmt.format(s.price)}</td>
        </tr>`
    )
    .join("")

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
            <td style="padding:32px 32px 16px;text-align:center;border-bottom:1px solid #e5e7eb">
              ${
                shop.logoUrl
                  ? `<img src="${escapeHtml(shop.logoUrl)}" alt="${escapeHtml(shop.name)}" style="height:56px;border-radius:8px;margin-bottom:12px" />`
                  : ""
              }
              <h1 style="margin:0;font-size:20px;color:#111827">${escapeHtml(shop.name)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px">
              <p style="margin:0 0 8px;font-size:16px;color:#111827">Hola ${escapeHtml(customer.name)},</p>
              <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.5">
                ${
                  actionType === "CREATED"
                    ? "Tu cita ha sido confirmada. Aquí están los detalles:"
                    : actionType === "UPDATED"
                    ? "Tu cita ha sido actualizada. Aquí están los detalles:"
                    : "Tu cita ha sido cancelada. A continuación, los detalles que tenías agendados:"
                }
              </p>

              <div style="background:#f9fafb;border-radius:8px;padding:16px 20px;margin-bottom:20px">
                <div style="font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Fecha</div>
                <div style="font-size:16px;color:#111827;font-weight:600;text-transform:capitalize">${escapeHtml(dateStr)}</div>
                <div style="font-size:15px;color:#374151;margin-top:6px">${escapeHtml(startStr)} – ${escapeHtml(endStr)} (${totalDuration} min)</div>
                ${
                  appointment.staffName
                    ? `<div style="font-size:14px;color:#6b7280;margin-top:8px">Con: <strong style="color:#374151">${escapeHtml(appointment.staffName)}</strong></div>`
                    : ""
                }
              </div>

              <div style="margin-bottom:20px">
                <div style="font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">Servicios</div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:15px">
                  ${servicesRowsHtml}
                  <tr>
                    <td style="padding:12px 0 0;border-top:1px solid #e5e7eb;color:#111827;font-weight:600">Total</td>
                    <td style="padding:12px 0 0;border-top:1px solid #e5e7eb;color:#111827;font-weight:600;text-align:right">$${moneyFmt.format(appointment.totalPrice)}</td>
                  </tr>
                </table>
              </div>

              ${
                shop.address
                  ? `<div style="font-size:14px;color:#374151;margin-bottom:8px"><strong>Ubicación:</strong> ${escapeHtml(shop.address)}</div>`
                  : ""
              }
              ${
                shop.whatsappPhone
                  ? `<div style="font-size:14px;color:#374151;margin-bottom:24px"><strong>WhatsApp:</strong> ${escapeHtml(shop.whatsappPhone)}</div>`
                  : ""
              }

              <div style="text-align:center;margin-top:24px">
                <a href="${escapeHtml(shopUrl)}" style="display:inline-block;background:${theme.primary};color:${theme.primaryFg};padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">
                  Ver mis citas
                </a>
              </div>

              <p style="margin:32px 0 0;font-size:13px;color:#6b7280;line-height:1.5;text-align:center">
                ¿Necesitas reagendar o cancelar? Contáctanos por WhatsApp o visita ${escapeHtml(shop.name)}.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;background:#f9fafb;text-align:center;font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb">
              Enviado por Bookia en nombre de ${escapeHtml(shop.name)}.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const text = [
    `Hola ${customer.name},`,
    ``,
    actionType === "CREATED"
      ? `Tu cita en ${shop.name} ha sido confirmada.`
      : actionType === "UPDATED"
      ? `Tu cita en ${shop.name} ha sido actualizada.`
      : `Tu cita en ${shop.name} ha sido cancelada.`,
    ``,
    `Fecha: ${dateStr}`,
    `Hora: ${startStr} – ${endStr} (${totalDuration} min)`,
    appointment.staffName ? `Con: ${appointment.staffName}` : null,
    ``,
    `Servicios:`,
    ...appointment.services.map((s) => `  - ${s.name} ($${moneyFmt.format(s.price)})`),
    `Total: $${moneyFmt.format(appointment.totalPrice)}`,
    ``,
    shop.address ? `Ubicación: ${shop.address}` : null,
    shop.whatsappPhone ? `WhatsApp: ${shop.whatsappPhone}` : null,
    ``,
    `Ver mis citas: ${shopUrl}`,
  ]
    .filter((l) => l !== null)
    .join("\n")

  return { subject, html, text }
}
