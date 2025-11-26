"use client"

import type React from "react"
import { Suspense } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Mail } from "lucide-react"

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignUpPageInner />
    </Suspense>
  )
}

function SignUpPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get("invite_token")
  const inviteEmail = searchParams.get("email")
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [invitationDetails, setInvitationDetails] = useState<{
    farmName: string
    inviterName: string
    role: string
  } | null>(null)
  const [loadingInvitation, setLoadingInvitation] = useState(false)

  // Load invitation details if token is present
  useEffect(() => {
    if (inviteToken && inviteEmail) {
      loadInvitationDetails()
      setEmail(inviteEmail) // Auto-fill email
    }
  }, [inviteToken, inviteEmail])

  async function loadInvitationDetails() {
    if (!inviteToken || !inviteEmail) return

    setLoadingInvitation(true)
    try {
      // Use API route to fetch invitation details (bypasses RLS)
      const response = await fetch(
        `/api/invitation-details?token=${inviteToken}&email=${encodeURIComponent(inviteEmail)}`
      )

      if (!response.ok) {
        console.error("Could not load invitation details")
        return
      }

      const data = await response.json()
      setInvitationDetails(data)
    } catch (err) {
      console.error("Error loading invitation details:", err)
    } finally {
      setLoadingInvitation(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: inviteToken 
            ? `${window.location.origin}/invite/accept?token=${inviteToken}&email=${encodeURIComponent(email)}`
            : process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
        },
      })
      if (error) throw error

      // Check if email confirmation is required
      if (data?.user?.identities?.length === 0) {
        setError("An account with this email already exists")
      } else {
        // If user was created and we have a name (from invitation), create a basic profile
        if (data?.user && name.trim() && inviteToken) {
          try {
            // Create a basic profile for the invited user
            // Use minimal required fields - they'll see the farm owner's data anyway
            const { error: profileError } = await supabase.from("profiles").upsert({
              id: data.user.id,
              name: name.trim(),
              display_name: name.trim(),
              farm_location: "", // Not required for team members
              enterprise_type: "Livestock", // Default value
              animal_type: null,
              crop_type: null,
              bio: null,
            }, { onConflict: "id" })

            if (profileError) {
              console.error("Error creating profile:", profileError)
              // Don't fail the sign-up if profile creation fails - it can be created later
            }
          } catch (profileErr) {
            console.error("Error creating profile:", profileErr)
            // Don't fail the sign-up if profile creation fails
          }
        }

        // Redirect to success page with invitation token if present
        // The email confirmation link will handle accepting the invitation
        if (inviteToken) {
          router.push(`/auth/sign-up-success?email=${encodeURIComponent(email)}&invite_token=${inviteToken}`)
        } else {
          router.push(`/auth/sign-up-success?email=${encodeURIComponent(email)}`)
        }
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
            {invitationDetails ? (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">You're Invited!</CardTitle>
                    <CardDescription className="mt-1">
                      Join {invitationDetails.farmName} on SmartSoil
                    </CardDescription>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">{invitationDetails.inviterName}</span> invited you to join{" "}
                    <span className="font-semibold">{invitationDetails.farmName}</span> as a{" "}
                    <span className="font-semibold capitalize">{invitationDetails.role}</span>.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Create your account to accept the invitation and start collaborating.
                  </p>
                </div>
              </>
            ) : loadingInvitation ? (
              <>
                <CardTitle className="text-2xl">Loading Invitation...</CardTitle>
                <CardDescription>Please wait while we load your invitation details</CardDescription>
              </>
            ) : (
              <>
                <CardTitle className="text-2xl">Sign Up</CardTitle>
                <CardDescription>Create a new account to get started</CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp}>
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
                    disabled={!!inviteEmail} // Disable if email came from invitation
                  />
                  {inviteEmail && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      This email was provided in your invitation
                    </p>
                  )}
                </div>
                {invitationDetails && (
                  <div className="grid gap-2">
                    <Label htmlFor="name">Your Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      This is how you'll appear to the farm owner
                    </p>
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Password must be at least 6 characters</p>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full gradient-primary hover:opacity-90" disabled={isLoading || loadingInvitation}>
                  {isLoading ? "Creating account..." : invitationDetails ? "Accept Invitation & Sign Up" : "Sign Up"}
                </Button>
                <div className="text-center text-sm">
                  Already have an account?{" "}
                  <Link 
                    href={inviteToken && inviteEmail ? `/auth/login?token=${inviteToken}&email=${encodeURIComponent(inviteEmail)}` : "/auth/login"} 
                    className="underline underline-offset-4"
                  >
                    Login
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
