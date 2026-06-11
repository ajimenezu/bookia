import { createClient } from "@supabase/supabase-js"
import { z } from "zod"
import * as dotenv from "dotenv"

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const { data: { publicUrl } } = supabase.storage
  .from("bug-reports")
  .getPublicUrl("test.png")

console.log("publicUrl:", publicUrl)

const schema = z.string().url()
const result = schema.safeParse(publicUrl)
console.log("is valid url:", result.success)

if (!result.success) {
  console.error(result.error)
}

