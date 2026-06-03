"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Lock, AlertCircle, ArrowRight, Eye, EyeOff, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { updatePasswordForShop } from "@/app/[slug]/update-password/actions"
import { BusinessType } from "@/lib/dictionaries"
import { getBusinessIcon } from "@/lib/business-icons"

interface ShopUpdatePasswordFormProps {
  slug: string
  shopName: string
  businessType: BusinessType
  logoUrl?: string | null
}

export function ShopUpdatePasswordForm({ slug, shopName, businessType, logoUrl }: ShopUpdatePasswordFormProps) {
  const BusinessIcon = getBusinessIcon(businessType)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwords, setPasswords] = useState({ password: "", confirm: "" })

  const isMatch = passwords.password.length > 0 && passwords.password === passwords.confirm
  const hasTypedConfirm = passwords.confirm.length > 0

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    try {
      const result = await updatePasswordForShop(slug, formData)
      if (result?.error) {
        setError(result.error)
        setLoading(false)
        return
      }
      if (result?.success && result?.redirectPath) {
        router.push(result.redirectPath)
      }
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
          <p className="mt-2 text-sm text-muted-foreground">Crea una nueva contraseña</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="border-border bg-card/50 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl">Nueva contraseña</CardTitle>
              <CardDescription>
                Mínimo 8 caracteres, con al menos una mayúscula y un número.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
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
                      hasTypedConfirm ? (isMatch ? "border-success/50" : "border-destructive/50") : ""
                    }`}
                  />
                  <div className="absolute right-3 top-3 flex items-center gap-2">
                    {hasTypedConfirm && (
                      isMatch ? (
                        <Check className="h-4 w-4 text-success animate-in zoom-in duration-200" />
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
            <CardFooter>
              <Button type="submit" className="w-full group" disabled={loading || !isMatch}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Guardando...
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    Guardar contraseña <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  )
}
