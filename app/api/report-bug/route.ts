import { NextResponse } from "next/server"
import { getAdminUser } from "@/lib/auth-utils"
import { z } from "zod"

const bugReportSchema = z.object({
  url: z.string().min(1, "URL requerida"),
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  metadata: z.object({
    userAgent: z.string().optional(),
    timestamp: z.string().optional(),
  }).optional(),
  imageUrls: z.array(z.string().url()).optional(),
})

export async function POST(req: Request) {
  try {
    const adminUser = await getAdminUser()

    if (!adminUser || !adminUser.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    if (!["SUPER_ADMIN", "OWNER", "STAFF"].includes(adminUser.role)) {
      return NextResponse.json({ error: "No tienes permisos para realizar esta acción" }, { status: 403 })
    }

    const rawBody = await req.json()
    const parsed = bugReportSchema.safeParse(rawBody)

    if (!parsed.success) {
      return NextResponse.json({ error: "Datos de formulario inválidos", details: parsed.error.format() }, { status: 400 })
    }

    const { url, title, description, metadata, imageUrls } = parsed.data

    const githubPat = process.env.GITHUB_PAT
    if (!githubPat) {
      console.error("GITHUB_PAT no está configurado")
      return NextResponse.json({ error: "Configuración del servidor incompleta" }, { status: 500 })
    }

    // Prepare Markdown body
    let issueBody = `**URL:** ${url}\n\n**Descripción:**\n${description}\n\n`
    
    if (imageUrls && imageUrls.length > 0) {
      issueBody += `**Archivos Adjuntos:**\n`
      imageUrls.forEach((imgUrl: string) => {
        issueBody += `![Imagen Adjunta](${imgUrl})\n`
      })
      issueBody += `\n`
    }

    issueBody += `---\n**Metadata del Sistema:**\n`
    issueBody += `- **Usuario:** ${adminUser.user.email} (${adminUser.role})\n`
    issueBody += `- **Fecha:** ${new Date(metadata?.timestamp || Date.now()).toLocaleString()}\n`
    issueBody += `- **User Agent:** ${metadata?.userAgent || "Desconocido"}\n`

    const repoOwner = "excalitech"
    const repoName = "booking-demo"

    const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/issues`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${githubPat}`,
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: `[Bug Report] ${title}`,
        body: issueBody,
        labels: ["beta-feedback"]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Error from GitHub API:", errorText)
      return NextResponse.json({ error: "Error al crear el issue en GitHub" }, { status: response.status })
    }

    const responseData = await response.json()

    return NextResponse.json({ success: true, issueUrl: responseData.html_url })

  } catch (error: any) {
    console.error("Error in report-bug route:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
