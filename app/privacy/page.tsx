import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Shield, Lock, Eye, Database, Bell, UserCheck, Cookie, Server } from "lucide-react"
import { BrandMark } from "@/components/landing/brand-mark"

export const metadata: Metadata = {
  title: "Política de Privacidad — BookIA",
  description: "Política de Privacidad y Tratamiento de Datos Personales de la plataforma BookIA.",
}

export default function PrivacyPage() {
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
            <Shield className="h-3.5 w-3.5" />
            Protección de Datos
          </div>
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">
            Política de Privacidad
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            Última actualización: <span className="font-semibold text-foreground">{lastUpdated}</span>
          </p>
        </div>

        <div className="mt-10 space-y-10 text-muted-foreground leading-relaxed font-normal">
          {/* Intro Box */}
          <div className="rounded-3xl border border-border bg-card/60 p-6 md:p-8 backdrop-blur-sm space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Tu Privacidad es Nuestra Prioridad
            </h2>
            <p className="text-sm md:text-base">
              En BookIA (operado por ExcaliTech), nos tomamos muy en serio la privacidad y la protección de los datos personales de nuestros usuarios y clientes de los negocios registrados. Esta Política explica detalladamente qué información recopilamos, cómo la utilizamos, con quién la compartimos y cuáles son tus derechos.
            </p>
          </div>

          {/* Section 1 */}
          <section className="space-y-4 pt-4 border-t border-border/60">
            <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-black text-primary">1</span>
              Información que Recopilamos
            </h2>
            <p className="text-sm md:text-base">
              Recopilamos la información estrictamente necesaria para prestar nuestros servicios de gestión de reservas y administración de negocios:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm md:text-base">
              <li>
                <strong className="text-foreground">Datos de Clientes:</strong> Nombre completo, correo electrónico, número telefónico (WhatsApp) y detalles de las citas agendadas (servicios seleccionados, fecha, hora y notas adicionales).
              </li>
              <li>
                <strong className="text-foreground">Datos del Negocio y Personal:</strong> Nombre de la empresa, dirección física, coordenadas geográficas, teléfono de contacto, redes sociales, horarios de atención, nombres de miembros del personal e historial operativo.
              </li>
              <li>
                <strong className="text-foreground">Datos Técnicos y de Uso:</strong> Dirección IP, tipo de navegador, sistema operativo, tokens de sesión y métricas anónimas de navegación.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-4 pt-4 border-t border-border/60">
            <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-black text-primary">2</span>
              Uso de la Información
            </h2>
            <p className="text-sm md:text-base">
              Utilizamos los datos recopilados para los siguientes fines:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm md:text-base">
              <li>Facilitar el agendamiento, confirmación y recordatorio de citas entre clientes y negocios.</li>
              <li>Enviar notificaciones operativas vía correo electrónico (mediante Resend) o mensajes de confirmación.</li>
              <li>Permitir la administración de usuarios, perfiles y autenticación segura mediante Supabase.</li>
              <li>Mejorar el rendimiento, la estabilidad y la experiencia de usuario de la Plataforma.</li>
              <li>Atender solicitudes de soporte técnico o demostraciones del sistema.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-4 pt-4 border-t border-border/60">
            <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-black text-primary">3</span>
              Compartición de Datos con Terceros Procesadores
            </h2>
            <p className="text-sm md:text-base">
              No vendemos ni alquilamos tus datos personales a terceros. Únicamente compartimos datos con proveedores de infraestructura esenciales que cumplen con estándares de privacidad y seguridad:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm md:text-base">
              <li>
                <strong className="text-foreground">Supabase Inc.:</strong> Proveedor de base de datos PostgreSQL cifrada y servicio de autenticación de usuarios.
              </li>
              <li>
                <strong className="text-foreground">Resend Inc.:</strong> Plataforma para el procesamiento y entrega de correos electrónicos transaccionales.
              </li>
              <li>
                <strong className="text-foreground">Google Maps API (Google LLC):</strong> Servicio para renderizar mapas y direccionar hacia la ubicación del negocio.
              </li>
              <li>
                <strong className="text-foreground">Vercel Inc.:</strong> Infraestructura de hospedaje web y analítica agregada no identificable.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-4 pt-4 border-t border-border/60">
            <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-black text-primary">4</span>
              Seguridad y Retención de Datos
            </h2>
            <p className="text-sm md:text-base">
              Implementamos medidas de seguridad técnicas y organizativas, incluyendo cifrado SSL/TLS en tránsito y políticas de control de acceso estricto en nuestra base de datos. Los datos se conservan mientras la cuenta esté activa o según sea necesario para cumplir con obligaciones operativas o legales.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-4 pt-4 border-t border-border/60">
            <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-black text-primary">5</span>
              Derechos del Usuario (ARCO)
            </h2>
            <p className="text-sm md:text-base">
              Como titular de tus datos personales, tienes derecho a:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm md:text-base">
              <li><strong className="text-foreground">Acceso:</strong> Solicitar conocer qué datos personales mantenemos sobre ti.</li>
              <li><strong className="text-foreground">Rectificación:</strong> Actualizar o corregir información inexacta desde tu perfil o solicitar su edición.</li>
              <li><strong className="text-foreground">Eliminación (&quot;Derecho al Olvido&quot;):</strong> Solicitar la supresión de tus datos de nuestros sistemas.</li>
              <li><strong className="text-foreground">Revocación:</strong> Retirar el consentimiento otorgado previamente para el procesamiento de datos.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-4 pt-4 border-t border-border/60">
            <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-black text-primary">6</span>
              Cookies y Almacenamiento Local
            </h2>
            <p className="text-sm md:text-base">
              BookIA utiliza cookies esenciales para la gestión de la sesión de autenticación (Supabase Auth) y el mantenimiento de tu estado en la aplicación. No empleamos cookies invasivas de rastreo de terceros con fines publicitarios.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-4 pt-4 border-t border-border/60">
            <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-black text-primary">7</span>
              Contacto de Privacidad
            </h2>
            <p className="text-sm md:text-base">
              Si deseas ejercer tus derechos de privacidad o realizar cualquier consulta sobre esta Política, puedes dirigirte al equipo de soporte de ExcaliTech / BookIA a través de los canales oficiales de contacto de la plataforma.
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
