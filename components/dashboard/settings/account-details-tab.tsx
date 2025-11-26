"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useProfile } from "@/hooks/use-profile"
import { toast } from "sonner"
import { User } from "lucide-react"

export function AccountDetailsTab() {
  const supabase = createClient()
  const { profile, farmOwnerProfile, refetch: refetchProfile } = useProfile()
  const [saving, setSaving] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
  // Determine if user is a team member (not a farm owner)
  const isTeamMember = !!farmOwnerProfile

  const [formData, setFormData] = useState({
    name: "",
    display_name: "",
    farm_location: "",
    enterprise_type: "",
    animal_type: "",
    crop_type: "",
    bio: "",
  })

  // Get current user ID
  useEffect(() => {
    async function getUserId() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    getUserId()
  }, [supabase])

  // Initialize form data from profile
  // For team members: use farm owner's data for farm fields, own data for name
  // For farm owners: use their own data
  useEffect(() => {
    if (profile) {
      if (isTeamMember && farmOwnerProfile) {
        // Team member: use farm owner's data for farm fields, own name
        setFormData({
          name: profile.name || "",
          display_name: farmOwnerProfile.display_name || "",
          farm_location: farmOwnerProfile.farm_location || "",
          enterprise_type: farmOwnerProfile.enterprise_type || "",
          animal_type: farmOwnerProfile.animal_type || "",
          crop_type: farmOwnerProfile.crop_type || "",
          bio: farmOwnerProfile.bio || "",
        })
      } else {
        // Farm owner: use their own data
        setFormData({
          name: profile.name || "",
          display_name: profile.display_name || "",
          farm_location: profile.farm_location || "",
          enterprise_type: profile.enterprise_type || "",
          animal_type: profile.animal_type || "",
          crop_type: profile.crop_type || "",
          bio: profile.bio || "",
        })
      }
    }
  }, [profile, farmOwnerProfile, isTeamMember])

  const handleSave = async () => {
    setSaving(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error("You must be logged in")
        return
      }

      // For team members, only allow updating their name
      // For farm owners, allow updating all fields
      const updateData: any = isTeamMember
        ? {
            name: formData.name,
          }
        : {
            name: formData.name,
            display_name: formData.display_name,
            farm_location: formData.farm_location,
            enterprise_type: formData.enterprise_type,
            animal_type: formData.enterprise_type === "Cropping" ? null : formData.animal_type || null,
            crop_type: formData.enterprise_type === "Livestock" ? null : formData.crop_type || null,
            bio: formData.bio || null,
          }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id)

      if (error) {
        console.error("Error saving account details:", error)
        toast.error("Failed to save account details")
        return
      }

      toast.success(isTeamMember ? "Name updated successfully" : "Account details saved successfully")
      await refetchProfile()
      
      // Force a page reload for team members to update their name everywhere
      // This ensures the admin page and other places show the updated name
      if (isTeamMember) {
        // Small delay to ensure the database update is complete
        setTimeout(() => {
          window.location.reload()
        }, 500)
      }
    } catch (error) {
      console.error("Error saving account details:", error)
      toast.error("An error occurred while saving account details")
    } finally {
      setSaving(false)
    }
  }

  const showAnimalType = formData.enterprise_type === "Livestock" || formData.enterprise_type === "Mixed"
  const showCropType = formData.enterprise_type === "Cropping" || formData.enterprise_type === "Mixed"

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <User className="h-6 w-6" />
          Account Details
        </h2>
        <p className="text-gray-600 mt-1">Manage your farm profile information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Farm Information</CardTitle>
          <CardDescription>
            {isTeamMember
              ? "Farm details are managed by the farm owner. You can only update your personal name."
              : "Update your farm details and profile information"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Smith"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">Your personal name</p>
          </div>

          {!isTeamMember && (
            <>
              <div className="space-y-2">
                <Label htmlFor="display_name">Farm Name</Label>
                <Input
                  id="display_name"
                  type="text"
                  placeholder="Green Valley Farm"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="farm_location">Farm Location</Label>
                <Input
                  id="farm_location"
                  type="text"
                  placeholder="123 Farm Road, Rural County, State"
                  value={formData.farm_location}
                  onChange={(e) => setFormData({ ...formData, farm_location: e.target.value })}
                />
                <p className="text-sm text-muted-foreground">This helps us center your map view</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="enterprise_type">Enterprise Type</Label>
                <Select
                  value={formData.enterprise_type}
                  onValueChange={(value) => setFormData({ ...formData, enterprise_type: value })}
                >
                  <SelectTrigger id="enterprise_type">
                    <SelectValue placeholder="Select your farm type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Livestock">Livestock</SelectItem>
                    <SelectItem value="Cropping">Cropping</SelectItem>
                    <SelectItem value="Mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {showAnimalType && (
                <div className="space-y-2">
                  <Label htmlFor="animal_type">Animal Type</Label>
                  <Input
                    id="animal_type"
                    type="text"
                    placeholder="e.g., Cattle, Sheep, Poultry"
                    value={formData.animal_type}
                    onChange={(e) => setFormData({ ...formData, animal_type: e.target.value })}
                  />
                </div>
              )}

              {showCropType && (
                <div className="space-y-2">
                  <Label htmlFor="crop_type">Crop Type</Label>
                  <Input
                    id="crop_type"
                    type="text"
                    placeholder="e.g., Wheat, Corn, Soybeans"
                    value={formData.crop_type}
                    onChange={(e) => setFormData({ ...formData, crop_type: e.target.value })}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="bio">About Your Farm</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about your farming operation..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-sm text-muted-foreground">
                  {formData.bio.length} characters
                </p>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : isTeamMember ? "Save Name" : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

