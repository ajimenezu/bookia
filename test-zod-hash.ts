import { z } from "zod"

const schema = z.string().url()
console.log("With hash:", schema.safeParse("https://example.com/test #1.png").success)
console.log("With question mark:", schema.safeParse("https://example.com/test ?1.png").success)
