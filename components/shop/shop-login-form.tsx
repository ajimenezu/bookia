"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Mail, Lock, AlertCircle, ArrowRight, Scissors, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { signInToShop } from "@/app/auth/actions"
import Link from "next/link"

interface ShopLoginFormProps {
  slug: string
  shopName: string
  logoUrl?: string | null
}

export function ShopLoginForm({ slug, shopName, logoUrl }: ShopLoginFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

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
              <Scissors className="h-8 w-8" />
            )}
          </div>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-foreground">
            {shopName}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ingresa a tu cuenta para gestionar tus citas
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
