"use client"

import { useState } from "react"
import { Mail, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { requestPasswordReset } from "@/app/[slug]/forgot-password/actions"
import Link from "next/link"
import { BusinessType } from "@/lib/dictionaries"
import { getBusinessIcon } from "@/lib/business-icons"

interface ShopForgotPasswordFormProps {
  slug: string
  shopName: string
  businessType: BusinessType
  logoUrl?: string | null
}

export function ShopForgotPasswordForm({ slug, shopName, businessType, logoUrl }: ShopForgotPasswordFormProps) {
  const BusinessIcon = getBusinessIcon(businessType)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    try {
      const result = await requestPasswordReset(slug, formData)
      if (result?.error) {
        setError(result.error)
        setLoading(false)
        return
      }
      setSent(true)
    } catch {
      setError("Error inesperado. Intenta de nuevo.")
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/5 via-background to-background">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={shopName} className="h-full w-full rounded-2xl object-cover" />
            ) : (
              <BusinessIcon className="h-8 w-8" />
            )}
          </div>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-foreground">{shopName}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Recupera el acceso a tu cuenta</p>
        </div>

        {sent ? (
          <Card className="border-border bg-card/50 backdrop-blur-sm shadow-xl text-center p-8">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl mb-2">Revisa tu correo</CardTitle>
            <CardDescription className="text-base">
              Si tu correo está registrado, te enviamos un enlace para restablecer la contraseña.
              <br />
              Revisa también la carpeta de spam.
            </CardDescription>
            <div className="mt-6">
              <Link href={`/login`} className="text-sm text-primary hover:underline font-semibold">
                ← Volver al inicio de sesión
              </Link>
            </div>
          </Card>
        ) : (
          <form onSubmit={handleSubmit}>
            <Card className="border-border bg-card/50 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl">¿Olvidaste tu contraseña?</CardTitle>
                <CardDescription>
                  Ingresa tu correo y te enviaremos un enlace para crear una nueva.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="tu@email.com"
                      required
                      disabled={loading}
                      className="pl-10 bg-background/50 border-border"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive animate-in fade-in zoom-in duration-200">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full group" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Enviando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      Enviar enlace <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  )}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  <Link href={`/login`} className="text-primary hover:underline font-semibold">
                    ← Volver al inicio de sesión
                  </Link>
                </p>
              </CardFooter>
            </Card>
          </form>
        )}
      </div>
    </div>
  )
}
