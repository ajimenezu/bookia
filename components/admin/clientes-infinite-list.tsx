"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { ClientesTable } from "./clientes-table"
import { ClientesListMobile } from "./clientes-list-mobile"
import { getClients } from "@/app/[slug]/admin/clientes/actions"
import { Loader2 } from "lucide-react"

interface ClientesInfiniteListProps {
  initialClients: any[]
  shopId: string
  businessType: string
  q?: string
  terminology: any
}

export function ClientesInfiniteList({ 
  initialClients, 
  shopId, 
  businessType, 
  q, 
  terminology 
}: ClientesInfiniteListProps) {
  const [clients, setClients] = useState(initialClients)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialClients.length === 10)
  const [isLoading, setIsLoading] = useState(false)
  const observerTarget = useRef<HTMLDivElement>(null)

  // Reset state when search query changes
  useEffect(() => {
    setClients(initialClients)
    setPage(1)
    setHasMore(initialClients.length === 10)
  }, [initialClients])

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    const nextPage = page + 1
    
    try {
      const result = await getClients(shopId, nextPage, 10, q)
      if (result.success && result.data) {
        const newClients = result.data
        if (newClients.length < 10) {
          setHasMore(false)
        }
        setClients(prev => [...prev, ...newClients])
        setPage(nextPage)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error("Error loading more clients:", error)
      setHasMore(false)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, hasMore, page, shopId, q])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [loadMore, hasMore, isLoading])

  return (
    <>
      <ClientesTable 
        clients={clients} 
        shopId={shopId} 
        businessType={businessType} 
        terminology={terminology} 
      />

      <ClientesListMobile 
        clients={clients} 
        shopId={shopId} 
        businessType={businessType} 
        terminology={terminology} 
      />

      {/* Sentinel for infinite scroll */}
      <div ref={observerTarget} className="h-10 w-full flex items-center justify-center mt-4">
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground animate-in fade-in duration-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs font-bold uppercase tracking-widest">Cargando más...</span>
          </div>
        )}
      </div>
    </>
  )
}
