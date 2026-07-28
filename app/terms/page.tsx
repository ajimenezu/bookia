import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, ShieldCheck, FileText, Lock, Scale, Building2, UserCheck, AlertTriangle } from "lucide-react"
import { BrandMark } from "@/components/landing/brand-mark"

export const metadata: Metadata = {
  title: "Términos del Servicio — BookIA",
  description: "Términos y Condiciones de uso de la plataforma BookIA para negocios y usuarios.",
}

export default function TermsPage() {
  const lastUpdated = "28 de julio de 2026"

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <BrandMark className="h-8 w-8 rounded-xl shadow-md shadow-primary/20" />
            <span className="text-xl font-extrabold tracking-tight">BookIA</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-6 py-12 md:py-16">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
            <FileText className="h-3.5 w-3.5" />
            Documento Legal
          </div>
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">
            Términos y Condiciones del Servicio
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            Última actualización: <span className="font-semibold text-foreground">{lastUpdated}</span>
          </p>
        </div>

        <div className="mt-10 space-y-10 text-muted-foreground leading-relaxed font-normal">
          {/* Intro Box */}
          <div className="rounded-3xl border border-border bg-card/60 p-6 md:p-8 backdrop-blur-sm space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Bienvenido a BookIA
            </h2>
            <p className="text-sm md:text-base">
              Por favor, lee detenidamente estos Términos del Servicio antes de acceder o utilizar la plataforma BookIA (en adelante, la &quot;Plataforma&quot;), operada por ExcaliTech. Al registrar una cuenta, gestionar un establecimiento o realizar la reserva de una cita, aceptas quedar vinculados legalmente por las condiciones aquí descritas.
            </p>
          </div>

          {/* Section 1 */}
          <section className="space-y-4 pt-4 border-t border-border/60">
            <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-black text-primary">1</span>
              Definiciones Principales
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-sm md:text-base">
              <li>
                <strong className="text-foreground">Plataforma:</strong> El software como servicio (SaaS) BookIA, incluyendo sus aplicaciones web, portales de subdominio, API e infraestructura asociada.
              </li>
              <li>
                <strong className="text-foreground">Establecimiento / Negocio:</strong> Aquellos negocios prestadores de servicios (barberías, salones de belleza, spas, clínicas, etc.) que crean un perfil en BookIA para gestionar sus servicios y agendar citas.
              </li>
              <li>
                <strong className="text-foreground">Cliente / Usuario:</strong> Cualquier persona física que interactúa con la Plataforma para buscar, agendar o gestionar citas con un Establecimiento.
              </li>
              <li>
                <strong className="text-foreground">Personal / Staff:</strong> Empleados o colaboradores autorizados vinculados a un Establecimiento para prestar servicios.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-4 pt-4 border-t border-border/60">
            <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-black text-primary">2</span>
              Naturaleza del Servicio e Intermediación
            </h2>
            <p className="text-sm md:text-base">
              BookIA proporciona herramientas tecnológicas para facilitar la reserva de citas y la administración operativa de Establecimientos.
            </p>
            <p className="text-sm md:text-base">
              <strong className="text-foreground">Importante:</strong> BookIA actúa exclusivamente como intermediario tecnológico. La prestación del servicio profesional (corte de cabello, tratamiento estético, consulta médica o cualquier otro), su calidad, puntualidad y cobro directo corresponden íntegra y exclusivamente al Establecimiento seleccionado.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-4 pt-4 border-t border-border/60">
            <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-black text-primary">3</span>
              Cuentas de Usuario y Registro
            </h2>
            <div className="space-y-3 text-sm md:text-base">
              <p>
                Para acceder a determinadas funciones (como la administración del negocio o el historial de citas), se requiere crear una cuenta mediante correo electrónico/contraseña o mediante proveedores de autenticación de terceros (como Google OAuth).
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Eres responsable de mantener la confidencialidad de tus credenciales de acceso.</li>
                <li>Debes proporcionar información veraz, exacta y actualizada durante el registro.</li>
                <li>Debes notificar inmediatamente cualquier uso no autorizado de tu cuenta o brecha de seguridad.</li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-4 pt-4 border-t border-border/60">
            <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-black text-primary">4</span>
              Reservas, Recordatorios y Cancelaciones
            </h2>
            <div className="space-y-3 text-sm md:text-base">
              <p>
                Al realizar una reserva en BookIA:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Aceptas recibir notificaciones transaccionales vía correo electrónico (a través de nuestro proveedor procesador Resend) y/o mensajes de WhatsApp relacionados con la confirmación, modificación o recordatorio de tu cita.
                </li>
                <li>
                  Las políticas de cancelación y reprogramación de citas están sujetas a los términos específicos establecidos por cada Establecimiento.
                </li>
                <li>
                  El usuario se compromete a acudir puntualmente a sus citas agendadas o a cancelarlas con la debida antelación si no pudiere asistir.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-4 pt-4 border-t border-border/60">
            <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-black text-primary">5</span>
              Uso Aceptable de la Plataforma
            </h2>
            <p className="text-sm md:text-base">
              Queda estrictamente prohibido:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm md:text-base">
              <li>Utilizar la Plataforma para fines ilícitos, engañosos o no autorizados.</li>
              <li>Generar reservas falsas o malintencionadas que perjudiquen la disponibilidad de los negocios.</li>
              <li>Intentar vulnerar, descompilar o realizar ingeniería inversa sobre el código fuente de la Plataforma.</li>
              <li>Ingresar datos falsos de contacto o suplantar la identidad de otras personas.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-4 pt-4 border-t border-border/60">
            <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-black text-primary">6</span>
              Propiedad Intelectual
            </h2>
            <p className="text-sm md:text-base">
              Todos los derechos de propiedad intelectual sobre el diseño, software, marcas, logotipos de BookIA y tecnología subyacente son propiedad exclusiva de ExcaliTech. Los logotipos, marcas y contenidos cargados por cada Establecimiento son propiedad de sus respectivos titulares, concediendo a BookIA una licencia no exclusiva para mostrarlos dentro del portal correspondiente.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-4 pt-4 border-t border-border/60">
            <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-black text-primary">7</span>
              Servicios e Integraciones de Terceros
            </h2>
            <p className="text-sm md:text-base">
              Para su correcto funcionamiento, BookIA integra herramientas y servicios de proveedores confiables, tales como:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm md:text-base">
              <li><strong className="text-foreground">Supabase:</strong> Para autenticación segura y almacenamiento en base de datos.</li>
              <li><strong className="text-foreground">Resend:</strong> Para el envío de correos de confirmación y notificaciones.</li>
              <li><strong className="text-foreground">Google Maps JS API:</strong> Para la visualización de la ubicación geográfica de los negocios.</li>
              <li><strong className="text-foreground">Vercel:</strong> Para la infraestructura de hospedaje y análisis de rendimiento web.</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section className="space-y-4 pt-4 border-t border-border/60">
            <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-black text-primary">8</span>
              Limitación de Responsabilidad
            </h2>
            <p className="text-sm md:text-base">
              BookIA se esfuerza por mantener la plataforma disponible 24/7 y libre de errores. No obstante, el servicio se proporciona &quot;tal cual&quot; (&quot;as is&quot;) sin garantías explícitas de disponibilidad ininterrumpida. BookIA no será responsable por pérdidas indirectas, lucro cesante o imprevistos derivados de fallas de conexión o deficiencias en los servicios prestados directamente por los Establecimientos.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-4 pt-4 border-t border-border/60">
            <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-black text-primary">9</span>
              Modificaciones y Contacto
            </h2>
            <p className="text-sm md:text-base">
              Nos reservamos el derecho de modificar estos Términos en cualquier momento. La fecha de última actualización al inicio de este documento reflejará los cambios aplicados. Si tienes dudas o consultas sobre estos Términos, puedes contactarnos a través de los canales oficiales de soporte de ExcaliTech / BookIA.
            </p>
          </section>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-border/80 bg-card py-8 text-center text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} BookIA (ExcaliTech). Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}
