"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, Sparkles, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { createDemoRequest } from "@/app/demo/actions"
import { trackCtaClick } from "@/lib/analytics"
import { BrandMark } from "@/components/landing/brand-mark"

type BusinessOption = {
  value: string
  label: string
}

const businessTypes: BusinessOption[] = [
  { value: "BARBERIA", label: "Barbería" },
  { value: "SALON_BELLEZA", label: "Salón de belleza" },
  { value: "SPA", label: "Spa" },
  { value: "CLINICA", label: "Clínica" },
  { value: "ESTETICA", label: "Estética facial" },
  { value: "UÑAS", label: "Uñas / Nail studio" },
  { value: "FISIOTERAPIA", label: "Fisioterapia" },
  { value: "VETERINARIA", label: "Veterinaria" },
  { value: "OTRO", label: "Otro" },
]

const teamSizes = [
  { value: "1-3", label: "1 - 3 personas" },
  { value: "4-10", label: "4 - 10 personas" },
  { value: "11-25", label: "11 - 25 personas" },
  { value: "25+", label: "Más de 25 personas" },
] as const

type Step = 1 | 2
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function DemoScheduler() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [companyName, setCompanyName] = useState("")
  const [contactName, setContactName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [businessType, setBusinessType] = useState<string>("")
  const [customBusinessType, setCustomBusinessType] = useState("")
  const [teamSize, setTeamSize] = useState<string>("")
  const [notes, setNotes] = useState("")
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const isOtherBusinessType = businessType === "OTRO"
  const selectedBusinessTypeLabel =
    businessTypes.find((type) => type.value === businessType)?.label ?? "Barbería"
  const selectedTeamSizeLabel =
    teamSizes.find((size) => size.value === teamSize)?.label ?? "Pendiente"
  const summaryBusinessType = isOtherBusinessType
    ? customBusinessType.trim() || "Otro"
    : businessType
      ? selectedBusinessTypeLabel
      : "Pendiente"

  const canContinueStep1 =
    companyName.trim().length >= 2 &&
    contactName.trim().length >= 2 &&
    businessType.length > 0 &&
    (!isOtherBusinessType || customBusinessType.trim().length >= 2)

  const canSubmit =
    canContinueStep1 &&
    emailPattern.test(email.trim()) &&
    phone.trim().length > 0 &&
    teamSize.length > 0

  const companyNameError =
    touched.companyName && companyName.trim().length < 2
      ? "Ingresa el nombre de la empresa"
      : null
  const contactNameError =
    touched.contactName && contactName.trim().length < 2
      ? "Ingresa el nombre de contacto"
      : null
  const businessTypeError =
    touched.businessType && businessType.length === 0
      ? "Selecciona el tipo de negocio"
      : null
  const customBusinessTypeError =
    isOtherBusinessType && touched.customBusinessType && customBusinessType.trim().length < 2
      ? "Indica qué tipo de negocio tienes"
      : null
  const teamSizeError =
    touched.teamSize && teamSize.length === 0
      ? "Selecciona el tamaño del equipo"
      : null
  const emailError = touched.email
    ? email.trim().length === 0
      ? "Ingresa el correo electrónico"
      : !emailPattern.test(email.trim())
        ? "Ingresa un correo electrónico válido"
        : null
    : null
  const phoneError =
    touched.phone && phone.trim().length === 0
      ? "Ingresa el teléfono"
      : null

  function markStepOneAsTouched() {
    setTouched((prev) => ({
      ...prev,
      companyName: true,
      contactName: true,
      businessType: true,
      customBusinessType: isOtherBusinessType,
      teamSize: true,
    }))
  }

  function markStepTwoAsTouched() {
    setTouched((prev) => ({
      ...prev,
      email: true,
      phone: true,
    }))
  }

  async function handleSubmit() {
    markStepTwoAsTouched()
    if (!canSubmit) {
      setError("Completa los campos obligatorios antes de enviar")
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await createDemoRequest({
        companyName,
        contactName,
        email,
        phone,
        businessType,
        customBusinessType: isOtherBusinessType ? customBusinessType : undefined,
        teamSize,
        notes: notes.trim() || undefined,
      })

      if (!result.success) {
        setError(result.error || "No pudimos agendar tu demo")
        return
      }

      trackCtaClick("schedule-demo", "demo")
      router.push("/demo/gracias")
    })
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 md:px-6 md:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card/70 px-4 py-3 backdrop-blur-sm md:px-6">
          <div className="flex items-center gap-3">
            <BrandMark className="h-10 w-10 rounded-xl" size={40} />
            <div>
              <p className="text-sm font-semibold text-foreground">BookIA</p>
              <p className="text-xs text-muted-foreground">Agenda una demo con nuestro equipo</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver al inicio
            </Link>
            <div className="hidden items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary md:flex">
              <Sparkles className="h-3.5 w-3.5" />
              Demo guiada de 30 min
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-border bg-card/80 p-6 shadow-2xl shadow-primary/5 backdrop-blur-sm md:p-8">
              <div className="mb-8 flex items-center gap-3">
                {[1, 2].map((item) => (
                  <div
                    key={item}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                      step >= item
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground",
                    )}
                  >
                    {item}
                  </div>
                ))}
                <div className="h-px flex-1 bg-border" />
              </div>

              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                      Agendar una demo personalizada
                    </h1>
                    <p className="mt-3 max-w-2xl text-muted-foreground">
                      Cuéntanos sobre tu negocio para preparar una demo enfocada en tu operación real.
                    </p>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Nombre de la empresa <span className="text-destructive">*</span></Label>
                      <Input
                        id="companyName"
                        value={companyName}
                        onChange={(event) => setCompanyName(event.target.value)}
                        onBlur={() => setTouched((prev) => ({ ...prev, companyName: true }))}
                        placeholder="BookIA Studio"
                        required
                        aria-invalid={Boolean(companyNameError)}
                        className={companyNameError ? "border-destructive" : undefined}
                      />
                      {companyNameError ? <p className="text-xs text-destructive">{companyNameError}</p> : null}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactName">Nombre de contacto <span className="text-destructive">*</span></Label>
                      <Input
                        id="contactName"
                        value={contactName}
                        onChange={(event) => setContactName(event.target.value)}
                        onBlur={() => setTouched((prev) => ({ ...prev, contactName: true }))}
                        placeholder="María López"
                        required
                        aria-invalid={Boolean(contactNameError)}
                        className={contactNameError ? "border-destructive" : undefined}
                      />
                      {contactNameError ? <p className="text-xs text-destructive">{contactNameError}</p> : null}
                    </div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="businessType">Tipo de negocio <span className="text-destructive">*</span></Label>
                      <Select
                        value={businessType}
                        onValueChange={(value) => {
                          setBusinessType(value)
                          setTouched((prev) => ({ ...prev, businessType: true }))
                          if (value !== "OTRO") {
                            setCustomBusinessType("")
                          }
                        }}
                      >
                        <SelectTrigger id="businessType" className="w-full">
                          <SelectValue placeholder="Selecciona una opción" />
                        </SelectTrigger>
                        <SelectContent>
                          {businessTypes.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {businessTypeError ? <p className="text-xs text-destructive">{businessTypeError}</p> : null}
                    </div>
                    {isOtherBusinessType ? (
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="customBusinessType">¿Qué tipo de negocio tienes? <span className="text-destructive">*</span></Label>
                        <Input
                          id="customBusinessType"
                          value={customBusinessType}
                          onChange={(event) => setCustomBusinessType(event.target.value)}
                          onBlur={() => setTouched((prev) => ({ ...prev, customBusinessType: true }))}
                          placeholder="Ej. Academia, centro odontológico, gimnasio..."
                          required
                          aria-invalid={Boolean(customBusinessTypeError)}
                          className={customBusinessTypeError ? "border-destructive" : undefined}
                        />
                        {customBusinessTypeError ? <p className="text-xs text-destructive">{customBusinessTypeError}</p> : null}
                      </div>
                    ) : null}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="teamSize">Tamaño del equipo <span className="text-destructive">*</span></Label>
                      <Select
                        value={teamSize}
                        onValueChange={(value) => {
                          setTeamSize(value)
                          setTouched((prev) => ({ ...prev, teamSize: true }))
                        }}
                      >
                        <SelectTrigger id="teamSize" className="w-full">
                          <SelectValue placeholder="Selecciona una opción" />
                        </SelectTrigger>
                        <SelectContent>
                          {teamSizes.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {teamSizeError ? <p className="text-xs text-destructive">{teamSizeError}</p> : null}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={() => {
                        markStepOneAsTouched()
                        if (!canContinueStep1) return
                        setStep(2)
                      }}
                      className="rounded-full px-6"
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                      Confirma tus datos de contacto
                    </h2>
                    <p className="mt-2 text-muted-foreground">
                      Solo necesitamos email, teléfono y un comentario opcional para preparar la demo.
                    </p>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email">Correo electrónico <span className="text-destructive">*</span></Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                        placeholder="tu@email.com"
                        required
                        aria-invalid={Boolean(emailError)}
                        className={emailError ? "border-destructive" : undefined}
                      />
                      {emailError ? <p className="text-xs text-destructive">{emailError}</p> : null}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono / WhatsApp <span className="text-destructive">*</span></Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        onBlur={() => setTouched((prev) => ({ ...prev, phone: true }))}
                        placeholder="+506 8888 8888"
                        required
                        aria-invalid={Boolean(phoneError)}
                        className={phoneError ? "border-destructive" : undefined}
                      />
                      {phoneError ? <p className="text-xs text-destructive">{phoneError}</p> : null}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Qué te gustaría ver en la demo</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      placeholder="Por ejemplo: agendamiento, recordatorios, reportes, etc."
                      className="min-h-28"
                    />
                  </div>

                  {error ? (
                    <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      {error}
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between gap-3">
                    <Button type="button" variant="outline" className="rounded-full px-6" onClick={() => setStep(1)}>
                      Volver
                    </Button>
                    <Button
                      type="button"
                      className="rounded-full px-6"
                      onClick={handleSubmit}
                      disabled={!canSubmit || isPending}
                    >
                      {isPending ? "Agendando..." : "Agendar demo"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <Card className="border-border bg-card/80 shadow-2xl shadow-primary/5">
              <CardHeader>
                <CardTitle>Resumen</CardTitle>
                <CardDescription>Lo que recibiremos antes de confirmar tu demo.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                  <span className="text-muted-foreground">Empresa</span>
                  <span className="font-medium text-foreground">{companyName || "Pendiente"}</span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                  <span className="text-muted-foreground">Tipo</span>
                  <span className="font-medium text-foreground">{summaryBusinessType}</span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                  <span className="text-muted-foreground">Equipo</span>
                  <span className="font-medium text-foreground">{selectedTeamSizeLabel}</span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium text-foreground truncate">{email || "Pendiente"}</span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                  <span className="text-muted-foreground">Teléfono</span>
                  <span className="font-medium text-foreground">{phone || "Pendiente"}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/70">
              <CardHeader>
                <CardTitle>Qué verás en la demo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                  Flujo de reservas end-to-end
                </div>
                <div className="flex items-start gap-3">
                  <Users className="mt-0.5 h-4 w-4 text-primary" />
                  Gestión de equipo y disponibilidad
                </div>
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
                  Automatizaciones y panel de control
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
