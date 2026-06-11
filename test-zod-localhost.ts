import { z } from "zod"

const schema = z.string().url()
console.log("Localhost:", schema.safeParse("http://localhost:3000/test.png").success)
console.log("Localhost without port:", schema.safeParse("http://localhost/test.png").success)
console.log("Supabase URL:", schema.safeParse("https://nwhkbqetanjseltemlxn.supabase.co/storage/v1/object/public/bug-reports/test.png").success)
