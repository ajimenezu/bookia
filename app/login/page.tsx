"use client"

import { useState } from "react"
import { CalendarDays, Mail, Lock, AlertCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { signIn } from "@/app/auth/actions"

import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    
    try {
      const result = await signIn(formData)
      if (result?.success) {
        router.push(result.redirectPath || "/")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Credenciales inválidas")
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <CalendarDays className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-foreground">
            Bienvenido a BookIA
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Ingresa a tu cuenta para gestionar tu negocio
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="border-border bg-card/50 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl">Iniciar Sesión</CardTitle>
              <CardDescription>
                Usa tu correo electrónico y contraseña para acceder al panel.
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
                    className="pl-10 bg-background/50 border-border focus:ring-primary"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    disabled={loading}
                    className="pl-10 bg-background/50 border-border focus:ring-primary"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive animate-in fade-in zoom-in duration-200">
                  <AlertCircle className="h-4 w-4" />
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
            </CardFooter>
          </Card>
        </form>
        
        <p className="text-center text-sm text-muted-foreground">
          ¿No tienes una cuenta?{" "}
          <span className="font-semibold text-primary hover:underline cursor-pointer">
            Contacta a soporte
          </span>
        </p>
      </div>
    </div>
  )
}
