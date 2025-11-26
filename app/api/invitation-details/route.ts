import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get("token")
    const email = searchParams.get("email")

    if (!token || !email) {
      return NextResponse.json({ error: "Missing token or email" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get invitation details (this should be readable without auth for pending invitations)
    const { data: invitation, error: inviteError } = await supabase
      .from("farm_invitations")
      .select("farm_owner_id, role")
      .eq("token", token)
      .eq("email", email)
      .eq("status", "pending")
      .single()

    if (inviteError || !invitation) {
      return NextResponse.json({ error: "Invitation not found or invalid" }, { status: 404 })
    }

    // Get farm owner profile to get their name and farm name
    // Use a database function to get profile info (bypasses RLS)
    const { data: profileData, error: profileError } = await supabase.rpc("get_invitation_profile_info", {
      owner_id: invitation.farm_owner_id,
    })

    if (profileError || !profileData) {
      // If function doesn't exist or fails, return basic info
      return NextResponse.json({
        farmName: "the farm",
        inviterName: "A farm owner",
        role: invitation.role,
      })
    }

    const profile = profileData as { display_name: string | null; name: string | null }

    return NextResponse.json({
      farmName: profile.display_name || profile.name || "the farm",
      inviterName: profile.display_name || profile.name || "A farm owner",
      role: invitation.role,
    })
  } catch (error) {
    console.error("Error fetching invitation details:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

