import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function GET(request: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  
  const requestUrl = new URL(request.url)
  const origin = requestUrl.origin
  
  revalidatePath("/", "layout")
  return redirect(`${origin}/login`)
}
