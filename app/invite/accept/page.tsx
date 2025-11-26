"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AcceptInvitationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const email = searchParams.get("email")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<"checking" | "accepting" | "success" | "error">("checking")
  const supabase = createClient()

  useEffect(() => {
    if (!token || !email) {
      setError("Invalid invitation link. Missing token or email.")
      setStatus("error")
      setLoading(false)
      return
    }

    checkAndAcceptInvitation()
  }, [token, email])

  async function checkAndAcceptInvitation() {
    if (!token || !email) return

    try {
      // Check if user is logged in
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        // User not logged in - redirect to sign up with invitation token
        router.push(`/auth/sign-up?invite_token=${token}&email=${encodeURIComponent(email)}`)
        return
      }

      // User is logged in - accept invitation
      setStatus("accepting")

      // Check if user has a profile, create one if not
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single()

      if (!existingProfile) {
        // Create a basic profile for the user
        const displayName = user.email?.split("@")[0] || "User"
        await supabase.from("profiles").upsert({
          id: user.id,
          name: displayName,
          display_name: displayName,
          farm_location: "", // Not required for team members
          enterprise_type: "Livestock", // Default value
          animal_type: null,
          crop_type: null,
          bio: null,
        }, { onConflict: "id" })
      }

      // Call the accept invitations function
      const { error: acceptError } = await supabase.rpc("accept_invitations_for_user")

      if (acceptError) {
        throw acceptError
      }

      // Verify invitation was accepted
      const { data: invitation, error: inviteError } = await supabase
        .from("farm_invitations")
        .select("status, farm_owner_id")
        .eq("token", token)
        .eq("email", email)
        .single()

      if (inviteError || !invitation) {
        throw new Error("Invitation not found")
      }

      if (invitation.status === "accepted") {
        setStatus("success")
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } else {
        throw new Error("Invitation could not be accepted")
      }
    } catch (err) {
      console.error("Error accepting invitation:", err)
      setError(err instanceof Error ? err.message : "Failed to accept invitation")
      setStatus("error")
    } finally {
      setLoading(false)
    }
  }

  if (loading || status === "checking" || status === "accepting") {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Accepting Invitation</CardTitle>
              <CardDescription>Please wait while we process your invitation...</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (status === "success") {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-green-600">Invitation Accepted!</CardTitle>
              <CardDescription>You've been successfully added to the farm.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Redirecting you to the dashboard...
              </p>
              <Button onClick={() => router.push("/dashboard")} className="w-full">
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-destructive">Error</CardTitle>
            <CardDescription>Unable to accept invitation</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push("/auth/login")} className="flex-1">
                Go to Login
              </Button>
              <Button onClick={() => router.push("/dashboard")} className="flex-1">
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

