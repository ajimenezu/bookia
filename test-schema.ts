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

const rawBody = {
  url: "http://localhost:3000/admin",
  title: "Test title",
  description: "Test description 123",
  metadata: {
    userAgent: "Mozilla/5.0",
    timestamp: new Date().toISOString()
  },
  imageUrls: []
}

const parsed = bugReportSchema.safeParse(rawBody)
console.log(JSON.stringify(parsed, null, 2))
