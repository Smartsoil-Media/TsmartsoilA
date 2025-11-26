"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Trash2 } from "lucide-react"
import { toast } from "sonner"

export function DangerZoneTab() {
  const router = useRouter()
  const supabase = createClient()
  const [isResetting, setIsResetting] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const handleResetAccount = async () => {
    setIsResetting(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error("You must be logged in to reset your account")
        return
      }

      // Delete all user data in the correct order (respecting foreign key constraints)
      // Order matters: delete child records first, then parent records

      // 1. Delete animals (references mobs)
      const { error: animalsError } = await supabase.from("animals").delete().eq("user_id", user.id)
      if (animalsError) {
        console.error("Error deleting animals:", animalsError)
        throw animalsError
      }

      // 2. Delete mob_events (references mobs)
      const { error: mobEventsError } = await supabase
        .from("mob_events")
        .delete()
        .eq("user_id", user.id)
      if (mobEventsError) {
        console.error("Error deleting mob_events:", mobEventsError)
        // Continue even if this fails (table might not exist in all setups)
      }

      // 3. Delete grazing_events (references mobs and paddocks)
      const { error: grazingEventsError } = await supabase
        .from("grazing_events")
        .delete()
        .eq("user_id", user.id)
      if (grazingEventsError) {
        console.error("Error deleting grazing_events:", grazingEventsError)
        throw grazingEventsError
      }

      // 4. Delete task_paddocks (junction table, references tasks and paddocks)
      // First get all task IDs for this user
      const { data: userTasks } = await supabase
        .from("tasks")
        .select("id")
        .eq("user_id", user.id)

      if (userTasks && userTasks.length > 0) {
        const taskIds = userTasks.map((t) => t.id)
        const { error: taskPaddocksError } = await supabase
          .from("task_paddocks")
          .delete()
          .in("task_id", taskIds)
        if (taskPaddocksError) {
          console.error("Error deleting task_paddocks:", taskPaddocksError)
          // Continue - might be handled by CASCADE
        }
      }

      // 5. Delete tasks
      const { error: tasksError } = await supabase.from("tasks").delete().eq("user_id", user.id)
      if (tasksError) {
        console.error("Error deleting tasks:", tasksError)
        throw tasksError
      }

      // 6. Delete mobs (references paddocks, but we'll handle that)
      const { error: mobsError } = await supabase.from("mobs").delete().eq("user_id", user.id)
      if (mobsError) {
        console.error("Error deleting mobs:", mobsError)
        throw mobsError
      }

      // 7. Delete infrastructure
      const { error: infrastructureError } = await supabase
        .from("infrastructure")
        .delete()
        .eq("user_id", user.id)
      if (infrastructureError) {
        console.error("Error deleting infrastructure:", infrastructureError)
        throw infrastructureError
      }

      // 8. Delete paddocks (last, as other tables might reference it)
      const { error: paddocksError } = await supabase.from("paddocks").delete().eq("user_id", user.id)
      if (paddocksError) {
        console.error("Error deleting paddocks:", paddocksError)
        throw paddocksError
      }

      // 9. Delete profile (so user goes through onboarding again)
      // First verify profile exists
      const { data: existingProfile } = await supabase.from("profiles").select("id").eq("id", user.id).single()
      
      if (existingProfile) {
        const { error: profileError, data: deletedData } = await supabase
          .from("profiles")
          .delete()
          .eq("id", user.id)
          .select()
        
        if (profileError) {
          console.error("Error deleting profile:", profileError)
          // If it's a policy error, provide helpful message
          if (profileError.message?.includes("policy") || profileError.message?.includes("permission")) {
            toast.error("Cannot delete profile: Missing DELETE policy. Please run scripts/021_add_profiles_delete_policy.sql in Supabase SQL Editor.")
            throw new Error("Missing DELETE policy for profiles table")
          }
          throw profileError
        }
        
        // Verify deletion succeeded
        const { data: verifyProfile } = await supabase.from("profiles").select("id").eq("id", user.id).single()
        if (verifyProfile) {
          console.error("Profile still exists after deletion attempt")
          toast.error("Profile deletion may have failed. Please check database permissions.")
        }
      }

      toast.success("Account data reset successfully!")
      setShowConfirmDialog(false)

      // Force a hard refresh to clear any cached data
      window.location.href = "/dashboard"
    } catch (error: any) {
      console.error("Error resetting account:", error)
      toast.error(`Failed to reset account: ${error.message || "Unknown error"}`)
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          Danger Zone
        </h2>
        <p className="text-gray-600 mt-1">Irreversible and destructive actions</p>
      </div>

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            These actions are irreversible. Please proceed with caution.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showConfirmDialog ? (
            <>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Reset Account</h3>
                <p className="text-sm text-gray-600 mb-4">
                  This will permanently delete all your data including:
                </p>
                <ul className="text-sm text-gray-600 list-disc list-inside space-y-1 mb-4">
                  <li>All paddocks and their boundaries</li>
                  <li>All livestock mobs and their records</li>
                  <li>All tasks and assignments</li>
                  <li>All infrastructure markers</li>
                  <li>All grazing events and history</li>
                  <li>All animal records</li>
                  <li>Your profile information</li>
                </ul>
                <p className="text-sm text-gray-600 mb-4">
                  You will be redirected to the dashboard where a welcome tutorial will guide you through setup again. This action cannot be undone.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => setShowConfirmDialog(true)}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Reset Account
              </Button>
            </>
          ) : (
            <>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Are you absolutely sure?</AlertTitle>
                <AlertDescription>
                  This action cannot be undone. This will permanently delete all your farm
                  data including your profile. You will need to complete the welcome tutorial again.
                </AlertDescription>
              </Alert>
              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  onClick={handleResetAccount}
                  disabled={isResetting}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {isResetting ? "Resetting..." : "Yes, Reset My Account"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmDialog(false)}
                  disabled={isResetting}
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

