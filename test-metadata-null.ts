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

console.log("metadata is null:", bugReportSchema.safeParse({url: "http://example.com", title: "abc", description: "abcdefghij", metadata: null}).success)
