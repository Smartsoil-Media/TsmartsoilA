import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { createClient } from "@/lib/supabase/server"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { invitationId, email, role, token, farmName } = await request.json()

    if (!invitationId || !email || !token) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify the invitation belongs to the current user
    const { data: invitation, error: inviteError } = await supabase
      .from("farm_invitations")
      .select("farm_owner_id, email")
      .eq("id", invitationId)
      .single()

    if (inviteError || !invitation || invitation.farm_owner_id !== user.id) {
      return NextResponse.json({ error: "Invitation not found or unauthorized" }, { status: 403 })
    }

    // Create invitation acceptance URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL?.replace("/onboarding", "") || "http://localhost:3000"
    const acceptUrl = `${baseUrl}/invite/accept?token=${token}&email=${encodeURIComponent(email)}`

    // Send email
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "SmartSoil <onboarding@resend.dev>",
      to: email,
      subject: `You've been invited to join ${farmName || "a farm"} on SmartSoil`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Farm Invitation</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">SmartSoil</h1>
            </div>
            <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
              <h2 style="color: #111827; margin-top: 0;">You've been invited!</h2>
              <p style="color: #4b5563; font-size: 16px;">
                You've been invited to join <strong>${farmName || "a farm"}</strong> on SmartSoil as a <strong>${role}</strong>.
              </p>
              <p style="color: #4b5563; font-size: 16px;">
                SmartSoil is a farm management platform that helps you track livestock, manage paddocks, and coordinate tasks with your team.
              </p>
              <div style="text-align: center; margin: 40px 0;">
                <a href="${acceptUrl}" style="display: inline-block; background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Accept Invitation
                </a>
              </div>
              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                If you don't have a SmartSoil account yet, clicking the button above will create one for you. If you already have an account, you'll be added to the farm automatically.
              </p>
              <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                This invitation will expire in 30 days. If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="color: #6b7280; font-size: 12px; word-break: break-all; background: #f3f4f6; padding: 12px; border-radius: 4px;">
                ${acceptUrl}
              </p>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
              <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            </div>
          </body>
        </html>
      `,
      text: `
You've been invited to join ${farmName || "a farm"} on SmartSoil as a ${role}.

SmartSoil is a farm management platform that helps you track livestock, manage paddocks, and coordinate tasks with your team.

Accept your invitation by clicking this link:
${acceptUrl}

If you don't have a SmartSoil account yet, clicking the link will create one for you. If you already have an account, you'll be added to the farm automatically.

This invitation will expire in 30 days.

If you didn't expect this invitation, you can safely ignore this email.
      `,
    })

    if (error) {
      console.error("Resend error:", error)
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error sending invitation email:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

