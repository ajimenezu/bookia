"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Mail, Lock, AlertCircle, ArrowRight, Scissors, User, Phone, Eye, EyeOff, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { signUpToShop } from "@/app/auth/actions"
import Link from "next/link"

interface ShopSignUpFormProps {
  slug: string
  shopName: string
  logoUrl?: string | null
}

export function ShopSignUpForm({ slug, shopName, logoUrl }: ShopSignUpFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwords, setPasswords] = useState({ password: "", confirm: "" })
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [touched, setTouched] = useState({ name: false, email: false, phone: false })

  const isMatch = passwords.password.length > 0 && passwords.password === passwords.confirm
  const hasTypedConfirm = passwords.confirm.length > 0

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      setLoading(false)
      return
    }

    try {
      const result = await signUpToShop(slug, formData)
      
      if (result?.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      if (result?.success) {
        setSuccess(true)
        // If Supabase requires email verification, we might want to show a message instead of redirecting
        // For now, let's assume we can redirect or show success
        setTimeout(() => {
          router.push(`/${slug}/login`)
        }, 2000)
      }
    } catch (err) {
      setError("Error inesperado al crear la cuenta. Intenta de nuevo.")
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <Card className="w-full max-w-md border-border bg-card/50 backdrop-blur-sm shadow-xl text-center p-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Mail className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl mb-2">¡Cuenta creada!</CardTitle>
          <CardDescription className="text-base">
            Tu cuenta ha sido creada exitosamente. 
            <br />
            Redirigiendo al inicio de sesión...
          </CardDescription>
        </Card>
      </div>
    )
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
            Crea tu cuenta para gestionar tus citas
          </p>
        </div>

        {/* Signup form */}
        <form onSubmit={handleSubmit}>
          <Card className="border-border bg-card/50 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl">Registrarse</CardTitle>
              <CardDescription>
                Completa tus datos para empezar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="name" className={touched.name && !name.trim() ? "text-destructive" : ""}>Nombre Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Juan Pérez"
                    required
                    disabled={loading}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
                    className={`pl-10 bg-background/50 border-border ${touched.name && !name.trim() ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  />
                </div>
                {touched.name && !name.trim() && (
                  <p className="text-xs text-destructive">El nombre es requerido</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="email" className={touched.email && !email.trim() ? "text-destructive" : ""}>Correo Electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="tu@email.com"
                    required
                    disabled={loading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                    className={`pl-10 bg-background/50 border-border ${touched.email && !email.trim() ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  />
                </div>
                {touched.email && !email.trim() && (
                  <p className="text-xs text-destructive">El correo electrónico es requerido</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="phone" className={touched.phone && !phone.trim() ? "text-destructive" : ""}>Teléfono (WhatsApp)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+506 8888 8888"
                    required
                    disabled={loading}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onBlur={() => setTouched(prev => ({ ...prev, phone: true }))}
                    className={`pl-10 bg-background/50 border-border ${touched.phone && !phone.trim() ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  />
                </div>
                {touched.phone && !phone.trim() && (
                  <p className="text-xs text-destructive">El teléfono es requerido</p>
                )}
              </div>

              <div className="space-y-1">
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
                    value={passwords.password}
                    onChange={(e) => setPasswords({ ...passwords, password: e.target.value })}
                    className="pl-10 pr-10 bg-background/50 border-border"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors outline-none cursor-pointer focus:ring-0"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    className={`pl-10 pr-20 bg-background/50 border-border transition-colors ${
                      hasTypedConfirm ? (isMatch ? "border-green-500/50" : "border-destructive/50") : ""
                    }`}
                  />
                  <div className="absolute right-3 top-3 flex items-center gap-2">
                    {hasTypedConfirm && (
                      isMatch ? (
                        <Check className="h-4 w-4 text-green-500 animate-in zoom-in duration-200" />
                      ) : (
                        <X className="h-4 w-4 text-destructive animate-in zoom-in duration-200" />
                      )
                    )}
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-muted-foreground hover:text-foreground transition-colors outline-none cursor-pointer focus:ring-0"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
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
                    Creando cuenta...
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    Crear Cuenta <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                )}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                ¿Ya tienes una cuenta?{" "}
                <Link href={`/${slug}/login`} className="text-primary hover:underline font-semibold">
                  Inicia sesión
                </Link>
              </p>
            </CardFooter>
          </Card>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          <Link href={`/${slug}`} className="text-primary hover:underline">
            ← Volver a {shopName}
          </Link>
        </p>
      </div>
    </div>
  )
}
