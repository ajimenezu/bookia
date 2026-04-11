import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Mail } from "lucide-react"

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Demo confirmada | BookIA" }
}

export default function DemoThanksPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-10 md:px-6 md:py-14">
      <div className="mx-auto max-w-3xl">
        <Card className="border-border bg-card/80 shadow-2xl shadow-primary/5">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <CardTitle className="text-3xl">Tu demo quedó agendada</CardTitle>
            <CardDescription className="text-base">
              Recibimos tu solicitud. Nuestro equipo te contactará pronto para confirmar la sesión.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <Mail className="h-4 w-4 text-primary" />
                Confirmaremos tu demo por correo y WhatsApp.
              </div>
              <p className="mt-2">Si no ves nuestra respuesta, revisa también tu bandeja de spam.</p>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:justify-center">
              <Button asChild className="rounded-full px-6">
                <Link href="/">Volver al inicio</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full px-6">
                <Link href="/demo">Agendar otra demo</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
