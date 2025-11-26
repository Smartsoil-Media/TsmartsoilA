"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Mail, Users } from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export default function Page() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email")
  const inviteToken = searchParams.get("invite_token")
  const [invitationDetails, setInvitationDetails] = useState<{
    farmName: string
    inviterName: string
    role: string
  } | null>(null)
  const [loadingInvitation, setLoadingInvitation] = useState(false)

  useEffect(() => {
    if (inviteToken && email) {
      loadInvitationDetails()
    }
  }, [inviteToken, email])

  async function loadInvitationDetails() {
    if (!inviteToken || !email) return

    setLoadingInvitation(true)
    try {
      const response = await fetch(
        `/api/invitation-details?token=${inviteToken}&email=${encodeURIComponent(email)}`
      )

      if (response.ok) {
        const data = await response.json()
        setInvitationDetails(data)
      }
    } catch (err) {
      console.error("Error loading invitation details:", err)
    } finally {
      setLoadingInvitation(false)
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
                    <CardTitle className="text-2xl">Check your email</CardTitle>
                    <CardDescription className="mt-1">
                      Verify your email to join {invitationDetails.farmName}
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
                    After you verify your email, you'll automatically be added to the farm.
                  </p>
                </div>
              </>
            ) : (
              <>
                <CardTitle className="text-2xl">Check your email</CardTitle>
                <CardDescription>We've sent you a confirmation link to verify your email address</CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {email && (
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm font-medium">Email sent to:</p>
                  <p className="text-sm text-muted-foreground">{email}</p>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Click the link in the email to complete your registration. If you don't see the email, check your spam
                folder.
              </p>
              {invitationDetails && (
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                  <p className="text-xs text-muted-foreground">
                    <strong>Note:</strong> Once you verify your email, you'll be automatically added to{" "}
                    {invitationDetails.farmName} and can start using SmartSoil.
                  </p>
                </div>
              )}
              <Button asChild className="w-full">
                <Link href={inviteToken && email ? `/auth/login?token=${inviteToken}&email=${encodeURIComponent(email)}` : "/auth/login"}>
                  Go to Login
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
