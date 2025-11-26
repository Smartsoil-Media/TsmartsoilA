"use client"

import type React from "react"
import { Suspense } from "react"
import Link from "next/link"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageInner />
    </Suspense>
  )
}

function LoginPageInner() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Check if there's an invitation token in the URL
  useEffect(() => {
    const token = searchParams.get("token")
    const inviteEmail = searchParams.get("email")
    
    if (token && inviteEmail) {
      // Redirect to the accept page which will handle the invitation
      router.replace(`/invite/accept?token=${token}&email=${encodeURIComponent(inviteEmail)}`)
    }
  }, [searchParams, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      
      // Check if there's an invitation token to accept
      const token = searchParams.get("token")
      const inviteEmail = searchParams.get("email")
      
      if (token && inviteEmail) {
        // Redirect to accept invitation page
        router.push(`/invite/accept?token=${token}&email=${encodeURIComponent(inviteEmail)}`)
      } else {
      router.push("/protected")
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        // Check if it's a network/connection error
        if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
          setError("Unable to connect to the server. Please check your internet connection and ensure Supabase is configured correctly.")
        } else if (error.message.includes("Missing Supabase environment variables")) {
          setError("Server configuration error. Please contact support.")
        } else {
          setError(error.message)
        }
      } else {
        setError("An unexpected error occurred. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Login</CardTitle>
            <CardDescription>Enter your email and password to login</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
                <div className="text-center text-sm">
                  {"Don't have an account? "}
                  <Link href="/auth/sign-up" className="underline underline-offset-4">
                    Sign up
                  </Link>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
