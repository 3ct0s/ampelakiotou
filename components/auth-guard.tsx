"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { useRouter, usePathname } from 'next/navigation'

const publicRoutes = ['/login']

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session && !publicRoutes.includes(pathname)) {
        router.replace('/login')
      }
      setLoading(false)
    }
    checkSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && !publicRoutes.includes(pathname)) {
        router.replace('/login')
      }
      if (session && pathname === '/login') {
        router.replace('/')
      }
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [router, pathname])

  if (loading) return null
  return <>{children}</>
}
