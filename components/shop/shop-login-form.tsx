"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Mail, Lock, AlertCircle, ArrowRight, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { signInToShop } from "@/app/auth/actions"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { BusinessType, getTerminology } from "@/lib/dictionaries"
import { getBusinessIcon } from "@/lib/business-icons"

interface ShopLoginFormProps {
  slug: string
  shopName: string
  businessType: BusinessType
  logoUrl?: string | null
}

export function ShopLoginForm({ slug, shopName, businessType, logoUrl }: ShopLoginFormProps) {
  const t = getTerminology(businessType)
  const BusinessIcon = getBusinessIcon(businessType)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  async function signInWithGoogle() {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/${slug}`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    // Email is already trimmed on the server, but let's be safe

    try {
      const result = await signInToShop(slug, formData)
      if (result?.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      if (result?.success && result?.redirectPath) {
        router.push(result.redirectPath)
      }
    } catch (err) {
      setError("Ha ocurrido un error inesperado. Intenta de nuevo.")
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/5 via-background to-background">
      <div className="w-full max-w-md space-y-8">
        {/* Shop branding */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={shopName} className="h-full w-full rounded-2xl object-cover" />
            ) : (
              <BusinessIcon className="h-8 w-8" />
            )}
          </div>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-foreground">
            {shopName}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ingresa a tu cuenta para gestionar tus {t.appointmentPlural.toLowerCase()}
          </p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit}>
          <Card className="border-border bg-card/50 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl">Iniciar Sesión</CardTitle>
              <CardDescription>
                Usa tu correo electrónico y contraseña para acceder.
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
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                    className="pl-10 pr-10 bg-background/50 border-border"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors outline-none cursor-pointer focus:ring-0"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
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
                    Iniciando sesión...
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    Acceder <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                )}
              </Button>

              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">O continuar con</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full bg-background/50 hover:bg-accent/50 transition-colors"
                onClick={signInWithGoogle}
                disabled={loading}
              >
                <svg className="h-4 w-4 mr-2 shrink-0" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                ¿No tienes una cuenta?{" "}
                <Link href={`/${slug}/register`} className="text-primary hover:underline font-semibold">
                  Regístrate
                </Link>
              </p>
            </CardFooter>
          </Card>
        </form>

        {/* Back to shop link */}
        <p className="text-center text-sm text-muted-foreground">
          <Link href={`/${slug}`} className="text-primary hover:underline">
            ← Volver a {shopName}
          </Link>
        </p>
      </div>
    </div>
  )
}
