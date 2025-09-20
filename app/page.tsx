"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { OrderDashboard } from '@/components/order-dashboard'

export default function Home() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let active = true
    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/login')
      } else if (active) {
        setChecking(false)
      }
    }
    run()
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace('/login')
    })
    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [router])

  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Επαλήθευση συνεδρίας...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <OrderDashboard />
    </main>
  )
}
