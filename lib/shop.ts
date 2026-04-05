import { cache } from "react"
import prisma from "./prisma"

/**
 * Gets a shop by its unique slug.
 * deduplicated via react.cache for the current request.
 */
export const getShopBySlug = cache(async (slug: string) => {
  return prisma.shop.findFirst({
    where: { slug }
  })
})

/**
 * Gets a shop by its unique ID.
 * deduplicated via react.cache for the current request.
 */
export const getShopById = cache(async (id: string) => {
  return prisma.shop.findUnique({
    where: { id }
  })
})
