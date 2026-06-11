import { z } from "zod"

const urlSchema = z.string().url()
console.log("Without space:", urlSchema.safeParse("https://example.com/test.png").success)
console.log("With space:", urlSchema.safeParse("https://example.com/test name.png").success)
console.log("With space at end:", urlSchema.safeParse("https://example.com/test.png ").success)

