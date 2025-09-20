"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff } from "lucide-react"
import Image from "next/image"
import { supabase } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  })
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { username, password } = loginData
    const { error } = await supabase.auth.signInWithPassword({
      email: username,
      password,
    })
    if (error) {
      alert('Αποτυχία σύνδεσης: ' + error.message)
      return
    }
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-border/50">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 w-fit">
            <Image
              src="/logo.png"
              alt="Εταιρικό Λογότυπο"
              width={120}
              height={120}
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Σύνδεση</h1>
          <p className="text-muted-foreground">Εισάγετε τα στοιχεία σας για να συνδεθείτε</p>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  Όνομα Χρήστη (Email)
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Εισάγετε το όνομα χρήστη"
                  value={loginData.username}
                  onChange={(e) => setLoginData((prev) => ({ ...prev, username: e.target.value }))}
                  className="bg-input border-border focus:ring-ring"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Κωδικός Πρόσβασης
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Εισάγετε τον κωδικό πρόσβασης"
                    value={loginData.password}
                    onChange={(e) => setLoginData((prev) => ({ ...prev, password: e.target.value }))}
                    className="bg-input border-border focus:ring-ring pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3"
              >
                Σύνδεση
              </Button>
            </div>

            <div className="text-center">
              <Button variant="link" className="text-sm text-muted-foreground hover:text-primary">
                Ξεχάσατε τον κωδικό σας;
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
