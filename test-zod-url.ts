import { z } from "zod"

const schema = z.string().url()
console.log("With brackets:", schema.safeParse("https://example.com/test[1].png").success)
console.log("With spaces:", schema.safeParse("https://example.com/test name.png").success)
console.log("With plus:", schema.safeParse("https://example.com/test+name.png").success)
console.log("With parens:", schema.safeParse("https://example.com/test(1).png").success)
