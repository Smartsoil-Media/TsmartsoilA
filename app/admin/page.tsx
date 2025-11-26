"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, UserPlus, Shield, Eye, Users, Mail, Clock, X, RotateCw } from "lucide-react"

type FarmMember = {
  id: string
  member_user_id: string
  role: string
  created_at: string
  member_email?: string
  member_display_name?: string
}

type FarmInvitation = {
  id: string
  email: string
  role: string
  status: string
  created_at: string
  expires_at: string
  invited_by: string
}

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<FarmMember[]>([])
  const [invitations, setInvitations] = useState<FarmInvitation[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [farmOwnerId, setFarmOwnerId] = useState<string | null>(null)
  const [isFarmOwner, setIsFarmOwner] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("viewer")
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState("")

  const supabase = createClient()

  useEffect(() => {
    checkAuthAndLoadMembers()
  }, [])

  async function checkAuthAndLoadMembers() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      setCurrentUserId(user.id)

      // Check if user is a team member or farm owner
      const { data: membership } = await supabase
        .from("farm_members")
        .select("farm_owner_id, role")
        .eq("member_user_id", user.id)
        .neq("role", "owner")
        .limit(1)
        .single()

      if (membership) {
        // User is a team member - use the farm owner's ID
        setFarmOwnerId(membership.farm_owner_id)
        setIsFarmOwner(false)
        await Promise.all([loadFarmMembers(membership.farm_owner_id), loadInvitations(membership.farm_owner_id)])
      } else {
        // User is a farm owner - use their own ID
        setFarmOwnerId(user.id)
        setIsFarmOwner(true)
        await Promise.all([loadFarmMembers(user.id), loadInvitations(user.id)])
      }
    } catch (error) {
      console.error("Error checking auth:", error)
      router.push("/auth/login")
    } finally {
      setLoading(false)
    }
  }

  async function loadFarmMembers(userId: string) {
    try {
      // Get current user's email from auth
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      const { data: membersData, error } = await supabase
        .from("farm_members")
        .select("*")
        .eq("farm_owner_id", userId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Supabase error loading farm members:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        throw error
      }

      if (!membersData) {
        console.warn("No members data returned, setting empty array")
        setMembers([])
        return
      }

      const membersWithDetails = await Promise.all(
        (membersData || []).map(async (member) => {
          // Get profile data (display_name, name) - use maybeSingle() to handle missing profiles
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("display_name, name")
            .eq("id", member.member_user_id)
            .maybeSingle()

          if (profileError) {
            console.warn(`Error fetching profile for user ${member.member_user_id}:`, profileError)
          }

          // Get email - try database function first, fallback to current user's auth email
          let email = "Unknown"
          
          // For current user, use email from auth session
          if (member.member_user_id === currentUser?.id) {
            email = currentUser.email || "Unknown"
          } else {
            // For other users, try to get email via database function
            try {
              const { data: userEmail, error: emailError } = await supabase.rpc("get_user_email", {
                user_id: member.member_user_id,
              })
              if (!emailError && userEmail) {
                email = userEmail
              } else if (emailError) {
                console.warn(`Could not fetch email for user ${member.member_user_id}:`, emailError)
              }
            } catch (err) {
              // Function might not exist yet - user needs to run the SQL script
              console.log("Could not fetch email for user. Make sure to run scripts/025_get_user_email_function.sql")
            }
          }

          // Determine display name with proper fallback
          // For team members, prefer 'name' (personal name) over 'display_name' (farm name)
          // But if name is empty/null, fall back to display_name, then email, then "Unknown User"
          let displayName = "Unknown User"
          if (profileData) {
            // Use name if it exists and is not empty, otherwise use display_name
            if (profileData.name && profileData.name.trim()) {
              displayName = profileData.name
            } else if (profileData.display_name && profileData.display_name.trim()) {
              displayName = profileData.display_name
            } else if (email && email !== "Unknown") {
              // Fall back to email if no name is set
              displayName = email.split("@")[0] // Use part before @ as display name
            }
          } else if (email && email !== "Unknown") {
            // If no profile data but we have email, use email
            displayName = email.split("@")[0]
          }

          return {
            ...member,
            member_email: email,
            member_display_name: displayName,
          }
        }),
      )

      setMembers(membersWithDetails)
    } catch (error) {
      console.error("Error loading farm members:", error)
      // Log more details about the error
      if (error instanceof Error) {
        console.error("Error message:", error.message)
        console.error("Error stack:", error.stack)
      }
      // Set empty array on error so UI doesn't break
      setMembers([])
    }
  }

  async function loadInvitations(userId: string) {
    try {
      // First verify we have a valid user session
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()
      
      if (authError) {
        console.error("Auth error:", authError)
        setInvitations([])
        return
      }
      
      if (!user) {
        console.warn("No user session found when loading invitations")
        setInvitations([])
        return
      }

      console.log("Loading invitations for userId:", userId, "auth.uid():", user.id)

      // Try a simple query first to test RLS
      const { data: invitationsData, error, status, statusText } = await supabase
        .from("farm_invitations")
        .select("*")
        .eq("farm_owner_id", userId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
      
      console.log("Query result:", { 
        hasData: !!invitationsData, 
        dataLength: invitationsData?.length || 0,
        hasError: !!error,
        error,
        status,
        statusText
      })

      if (error) {
        // Log the raw error object first
        console.error("Raw Supabase error:", error)
        console.error("Error type:", typeof error)
        console.error("Error keys:", Object.keys(error || {}))
        console.error("Error stringified:", JSON.stringify(error, null, 2))
        
        // Try to extract error info in multiple ways
        const errorInfo = {
          message: error?.message || "Unknown error",
          details: error?.details || null,
          hint: error?.hint || null,
          code: error?.code || null,
          toString: String(error),
        }
        console.error("Supabase error loading invitations:", errorInfo)
        
        // Check if table doesn't exist
        if (errorInfo.message?.includes("does not exist") || errorInfo.code === "42P01" || errorInfo.message?.includes("relation") || errorInfo.message?.includes("table")) {
          console.warn("⚠️ farm_invitations table may not exist. Please run the SQL script: scripts/026_create_farm_invitations_table.sql")
        }
        
        // Set empty array on error so UI doesn't break
        setInvitations([])
        return
      }

      setInvitations(invitationsData || [])
    } catch (error) {
      console.error("Exception loading invitations:", error)
      console.error("Exception type:", typeof error)
      console.error("Exception string:", String(error))
      if (error instanceof Error) {
        console.error("Error message:", error.message)
        console.error("Error stack:", error.stack)
      }
      // Set empty array on error so UI doesn't break
      setInvitations([])
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!isFarmOwner || !farmOwnerId) return
    if (!confirm("Are you sure you want to remove this member?")) return

    try {
      const { error } = await supabase.from("farm_members").delete().eq("id", memberId)

      if (error) throw error

      setMembers(members.filter((m) => m.id !== memberId))
      await loadFarmMembers(farmOwnerId)
    } catch (error) {
      console.error("Error removing member:", error)
      alert("Failed to remove member. Please try again.")
    }
  }

  async function handleUpdateRole(memberId: string, newRole: string) {
    if (!isFarmOwner || !farmOwnerId) return
    
    try {
      const { error } = await supabase.from("farm_members").update({ role: newRole }).eq("id", memberId)

      if (error) throw error

      setMembers(members.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)))
      await loadFarmMembers(farmOwnerId)
    } catch (error) {
      console.error("Error updating role:", error)
      alert("Failed to update role. Please try again.")
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  async function handleInviteMember() {
    if (!inviteEmail || !farmOwnerId || !isFarmOwner) return

    setInviting(true)
    setInviteError("")

    try {
      // Check if email is already a member
      const existingMember = members.find((m) => m.member_email?.toLowerCase() === inviteEmail.toLowerCase())
      if (existingMember) {
        setInviteError("This user is already a member of your farm.")
        setInviting(false)
        return
      }

      // Check if there's already a pending invitation
      const existingInvitation = invitations.find(
        (inv) => inv.email.toLowerCase() === inviteEmail.toLowerCase() && inv.status === "pending",
      )
      if (existingInvitation) {
        setInviteError("An invitation has already been sent to this email address.")
        setInviting(false)
        return
      }

      // Check member count (3 free members, then paid)
      const activeMemberCount = members.filter((m) => m.role !== "owner").length
      if (activeMemberCount >= 3) {
        // Show warning but allow invitation (billing will be handled later)
        const proceed = confirm(
          `You currently have ${activeMemberCount} team members. Additional members beyond 3 may incur charges. Do you want to continue?`
        )
        if (!proceed) {
          setInviting(false)
          return
        }
      }

      // Check if user already exists in the system
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", inviteEmail) // This won't work, we need to check auth.users differently
        .single()

      // Try to get user by email from auth (we'll need a function for this)
      // For now, create invitation regardless - it will be accepted when they sign up
      // Get farm name for email
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, name")
        .eq("id", farmOwnerId)
        .single()
      
      const farmName = profile?.display_name || profile?.name || "the farm"

      // Create invitation
      const { data: newInvitation, error: insertError } = await supabase
        .from("farm_invitations")
        .insert({
        farm_owner_id: farmOwnerId,
          email: inviteEmail.toLowerCase().trim(),
        role: inviteRole,
        invited_by: farmOwnerId,
          status: "pending",
      })
        .select()
        .single()

      if (insertError) {
        // Check if it's a unique constraint error
        if (insertError.code === "23505") {
          setInviteError("An invitation has already been sent to this email address.")
        } else {
        throw insertError
      }
        setInviting(false)
        return
      }

      // Send invitation email
      if (newInvitation) {
        try {
          const response = await fetch("/api/send-invitation", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              invitationId: newInvitation.id,
              email: inviteEmail.toLowerCase().trim(),
              role: inviteRole,
              token: newInvitation.token,
              farmName: farmName,
            }),
          })

          if (!response.ok) {
            const errorData = await response.json()
            console.error("Failed to send invitation email:", errorData)
            // Don't fail the whole operation if email fails - invitation is still created
          }
        } catch (emailError) {
          console.error("Error sending invitation email:", emailError)
          // Don't fail the whole operation if email fails - invitation is still created
        }
      }

      // If user exists, try to add them directly
      // Check if user exists via database function
      let existingUser = null
      try {
        const { data: userId, error: rpcError } = await supabase.rpc("get_user_id_by_email", {
          user_email: inviteEmail.toLowerCase().trim(),
        })
        if (!rpcError && userId) {
          existingUser = userId
        }
      } catch (err) {
        // Function might not exist yet, that's okay - invitation will be accepted when they sign up
        console.log("Could not check if user exists:", err)
      }

      if (existingUser) {
        // User exists, add them directly and mark invitation as accepted
        const { error: addMemberError } = await supabase.from("farm_members").insert({
          farm_owner_id: farmOwnerId,
          member_user_id: existingUser,
          role: inviteRole,
          invited_by: farmOwnerId,
        })

        if (!addMemberError) {
          // Update invitation status
          await supabase
            .from("farm_invitations")
            .update({ status: "accepted", accepted_at: new Date().toISOString() })
            .eq("email", inviteEmail.toLowerCase().trim())
            .eq("farm_owner_id", farmOwnerId)
        }
      }

      if (farmOwnerId) {
        await Promise.all([loadFarmMembers(farmOwnerId), loadInvitations(farmOwnerId)])
      }

      setShowInviteModal(false)
      setInviteEmail("")
      setInviteRole("viewer")
      setInviteError("")
    } catch (error) {
      console.error("Error inviting member:", error)
      setInviteError(`Failed to send invitation: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setInviting(false)
    }
  }

  async function handleCancelInvitation(invitationId: string) {
    if (!confirm("Are you sure you want to cancel this invitation?")) return

    try {
      const { error } = await supabase
        .from("farm_invitations")
        .update({ status: "cancelled" })
        .eq("id", invitationId)

      if (error) throw error

      await loadInvitations(currentUserId!)
    } catch (error) {
      console.error("Error cancelling invitation:", error)
      alert("Failed to cancel invitation. Please try again.")
    }
  }

  async function handleResendInvitation(invitationId: string) {
    if (!isFarmOwner || !farmOwnerId) return
    
    try {
      // Get invitation details
      const { data: invitation, error: fetchError } = await supabase
        .from("farm_invitations")
        .select("*")
        .eq("id", invitationId)
        .single()

      if (fetchError || !invitation) {
        throw new Error("Invitation not found")
      }

      // Update expires_at to extend the invitation
      const { error } = await supabase
        .from("farm_invitations")
        .update({
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          updated_at: new Date().toISOString(),
        })
        .eq("id", invitationId)

      if (error) throw error

      // Get farm name for email
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, name")
        .eq("id", farmOwnerId)
        .single()
      
      const farmName = profile?.display_name || profile?.name || "the farm"

      // Resend email
      const response = await fetch("/api/send-invitation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invitationId: invitation.id,
          email: invitation.email,
          role: invitation.role,
          token: invitation.token,
          farmName: farmName,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to send email")
      }

      alert("Invitation has been resent.")
      await loadInvitations(farmOwnerId)
    } catch (error) {
      console.error("Error resending invitation:", error)
      alert(`Failed to resend invitation: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  function getRoleIcon(role: string) {
    switch (role) {
      case "owner":
        return <Shield className="h-4 w-4 text-primary" />
      case "admin":
        return <Shield className="h-4 w-4 text-primary/80" />
      case "member":
        return <Users className="h-4 w-4 text-primary/70" />
      case "viewer":
        return <Eye className="h-4 w-4 text-muted-foreground" />
      default:
        return <Users className="h-4 w-4 text-muted-foreground" />
    }
  }

  function getRoleBadgeColor(role: string) {
    switch (role) {
      case "owner":
        return "bg-primary/20 text-primary border border-primary/30"
      case "admin":
        return "bg-primary/15 text-primary/90 border border-primary/25"
      case "member":
        return "bg-primary/10 text-primary/80 border border-primary/20"
      case "viewer":
        return "bg-muted text-muted-foreground border border-border"
      default:
        return "bg-muted text-muted-foreground border border-border"
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gradient">SmartSoil</h1>
            <p className="text-sm text-muted-foreground">
              Farm Team Management
              {!isFarmOwner && <span className="ml-2 text-xs">(View Only)</span>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard")}
              className="border-border hover:bg-accent"
            >
              Back to Dashboard
            </Button>
            <Button variant="outline" onClick={handleSignOut} className="border-border hover:bg-accent">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Team Members</h2>
              <p className="text-muted-foreground mt-1">
                Manage who has access to your farm data
                {members.length > 0 && (
                  <span className="ml-2 text-xs">
                    ({members.filter((m) => m.role !== "owner").length} member{members.filter((m) => m.role !== "owner").length !== 1 ? "s" : ""})
                  </span>
                )}
              </p>
            </div>
            {isFarmOwner && (
              <Button onClick={() => setShowInviteModal(true)} className="gradient-primary hover:opacity-90">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            )}
          </div>

          <Card className="overflow-hidden border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Added
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                        <p className="text-lg font-medium text-foreground">No team members yet</p>
                        <p className="text-sm mt-1">Add members to share your farm data with your team</p>
                      </td>
                    </tr>
                  ) : (
                    members.map((member) => (
                      <tr key={member.id} className="hover:bg-accent/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                              <span className="text-primary font-medium text-sm">
                                {member.member_display_name?.charAt(0).toUpperCase() || "?"}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-foreground">{member.member_display_name}</div>
                              {member.member_user_id === currentUserId && (
                                <div className="text-xs text-muted-foreground">(You)</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-foreground">{member.member_email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getRoleIcon(member.role)}
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(member.role)}`}
                            >
                              {member.role}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {new Date(member.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {member.role !== "owner" && isFarmOwner && (
                            <div className="flex items-center justify-end gap-2">
                              <Select value={member.role} onValueChange={(value) => handleUpdateRole(member.id, value)}>
                                <SelectTrigger className="w-[120px] border-border bg-background">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="member">Member</SelectItem>
                                  <SelectItem value="viewer">Viewer</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveMember(member.id)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          {!isFarmOwner && (
                            <span className="text-xs text-muted-foreground">View only</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {invitations.length > 0 && (
            <Card className="mt-6 overflow-hidden border-border bg-card">
              <div className="p-6 border-b border-border">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Pending Invitations ({invitations.length})
                </h3>
                <p className="text-sm text-muted-foreground mt-1">Invitations waiting to be accepted</p>
              </div>
              <div className="divide-y divide-border">
                {invitations.map((invitation) => {
                  const expiresDate = new Date(invitation.expires_at)
                  const daysUntilExpiry = Math.ceil((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  
                  return (
                    <div key={invitation.id} className="p-6 hover:bg-accent/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                              <Mail className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-foreground">{invitation.email}</span>
                                <span
                                  className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(invitation.role)}`}
                                >
                                  {invitation.role}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Sent {new Date(invitation.created_at).toLocaleDateString()}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  Expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? "s" : ""}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {isFarmOwner && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResendInvitation(invitation.id)}
                              className="text-foreground hover:bg-accent"
                            >
                              <RotateCw className="h-4 w-4 mr-1" />
                              Resend
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelInvitation(invitation.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        {!isFarmOwner && (
                          <span className="text-xs text-muted-foreground">View only</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          <Card className="mt-6 p-6 border-border bg-card">
            <h3 className="font-semibold text-foreground mb-3">Role Permissions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-foreground">Owner</p>
                  <p className="text-xs text-muted-foreground">Full access and control</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary/80 mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-foreground">Admin</p>
                  <p className="text-xs text-muted-foreground">Can manage data and members</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-primary/70 mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-foreground">Member</p>
                  <p className="text-xs text-muted-foreground">Can view and edit data</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Eye className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-foreground">Viewer</p>
                  <p className="text-xs text-muted-foreground">Read-only access</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join your farm. They'll be added automatically when they sign up or accept the invitation.
              {members.filter((m) => m.role !== "owner").length >= 3 && (
                <span className="block mt-2 text-xs text-muted-foreground">
                  Note: You have {members.filter((m) => m.role !== "owner").length} team members. Additional members may incur charges.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="member@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                disabled={inviting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole} disabled={inviting}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin - Can manage data and members</SelectItem>
                  <SelectItem value="member">Member - Can view and edit data</SelectItem>
                  <SelectItem value="viewer">Viewer - Read-only access</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {inviteError && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded text-sm">
                {inviteError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowInviteModal(false)
                setInviteEmail("")
                setInviteRole("viewer")
                setInviteError("")
              }}
              disabled={inviting}
              className="border-border"
            >
              Cancel
            </Button>
            <Button
              onClick={handleInviteMember}
              disabled={!inviteEmail || inviting}
              className="gradient-primary hover:opacity-90"
            >
              {inviting ? "Adding..." : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
