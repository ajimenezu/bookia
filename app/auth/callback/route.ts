import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import prisma from "@/lib/prisma"
import { getRedirectPath } from "@/lib/auth-utils"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next")

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user && user.email) {
        const name = user.user_metadata?.full_name || user.email.split("@")[0]
        const phone = user.user_metadata?.phone || null

        // Ensure user exists in Prisma DB to satisfy all foreign key constraints
        const dbUser = await prisma.user.upsert({
          where: { id: user.id },
          update: {}, // Preserve custom user information if they already exist
          create: {
            id: user.id,
            email: user.email,
            name,
            phone,
          },
          include: { 
            memberships: { 
              include: { 
                shop: {
                  select: { id: true, slug: true }
                } 
              } 
            } 
          }
        })

        // Extract potential shop slug from 'next' parameter (e.g., "/slug" -> "slug")
        const shopSlugFromNext = next ? next.split("/").filter(Boolean)[0] : undefined

        // Determine destination route based on role/membership hierarchy
        let redirectPath = await getRedirectPath(dbUser, shopSlugFromNext)
        
        // If 'next' was provided and points to something else (like a specific subpage), 
        // we might want to respect it, but prioritize admin redirect for admins.
        if (next && next !== `/${shopSlugFromNext}` && redirectPath === `/${shopSlugFromNext}`) {
          redirectPath = next
        }
        
        return NextResponse.redirect(`${origin}${redirectPath}`)
      }
    }
  }

  // Authentication exchange failed or missing code parameter
  return NextResponse.redirect(`${origin}/login?error=Autenticación+con+Google+fallida`)
}
