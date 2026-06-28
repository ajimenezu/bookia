import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import prisma from "@/lib/prisma"
import { getRedirectPath } from "@/lib/auth-utils"
import { getSubdomain, getShopUrl } from "@/lib/domain"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  // Shop context comes from the subdomain the callback lands on, not a path param.
  // NOTE: build the redirect base from the Host header, NOT `url.origin` —
  // `request.url` reports the internal server origin (localhost), losing the
  // subdomain, which would bounce the user to the apex.
  const host = request.headers.get("host")
  const shopSlug = getSubdomain(host) ?? undefined
  const base = shopSlug
    ? getShopUrl(shopSlug)
    : `${url.protocol}//${host ?? url.host}`

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

        let currentUserState = dbUser
        if (shopSlug) {
          const shop = await prisma.shop.findUnique({
            where: { slug: shopSlug },
            select: { id: true }
          })

          if (shop) {
            // Check if user already has a membership for this shop
            const hasMembership = dbUser.memberships.some(m => m.shop?.id === shop.id)
            if (!hasMembership) {
              await prisma.shopMember.upsert({
                where: {
                  userId_shopId: {
                    userId: user.id,
                    shopId: shop.id,
                  }
                },
                update: {}, // Preserve existing role if created concurrently
                create: {
                  userId: user.id,
                  shopId: shop.id,
                  role: "CUSTOMER",
                }
              })

              // Refetch user state to ensure getRedirectPath has the updated memberships
              const refreshedUser = await prisma.user.findUnique({
                where: { id: user.id },
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
              if (refreshedUser) {
                currentUserState = refreshedUser
              }
            }
          }
        }

        // Destination is root-relative; `base` is the shop's subdomain.
        const redirectPath = await getRedirectPath(currentUserState, shopSlug)

        return NextResponse.redirect(`${base}${redirectPath}`)
      }
    }
  }

  // Authentication exchange failed or missing code parameter
  return NextResponse.redirect(`${base}/login?error=Autenticación+con+Google+fallida`)
}
