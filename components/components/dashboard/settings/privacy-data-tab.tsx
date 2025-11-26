"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Shield } from "lucide-react"

export function PrivacyDataTab() {
  // Cosmetic toggles - no backend functionality yet
  const [privacySettings, setPrivacySettings] = useState({
    share_paddocks: false,
    share_livestock: false,
    share_grazing_history: false,
    share_infrastructure: false,
    share_tasks: false,
    share_location: false,
    share_profile: false,
  })

  const handleToggle = (key: keyof typeof privacySettings) => {
    setPrivacySettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Privacy & Data
        </h2>
        <p className="text-gray-600 mt-1">Control what data you share with other farmers</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Sharing Preferences</CardTitle>
          <CardDescription>
            Choose which information you want to share with other farmers in the community. These settings are currently cosmetic and will be implemented in a future update.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="share_paddocks" className="text-base font-medium">
                  Share Paddock Boundaries
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow other farmers to see your paddock boundaries and types
                </p>
              </div>
              <Switch
                id="share_paddocks"
                checked={privacySettings.share_paddocks}
                onCheckedChange={() => handleToggle("share_paddocks")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="share_livestock" className="text-base font-medium">
                  Share Livestock Data
                </Label>
                <p className="text-sm text-muted-foreground">
                  Share information about your livestock mobs, counts, and types
                </p>
              </div>
              <Switch
                id="share_livestock"
                checked={privacySettings.share_livestock}
                onCheckedChange={() => handleToggle("share_livestock")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="share_grazing_history" className="text-base font-medium">
                  Share Grazing History
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow others to see your grazing patterns and history
                </p>
              </div>
              <Switch
                id="share_grazing_history"
                checked={privacySettings.share_grazing_history}
                onCheckedChange={() => handleToggle("share_grazing_history")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="share_infrastructure" className="text-base font-medium">
                  Share Infrastructure Locations
                </Label>
                <p className="text-sm text-muted-foreground">
                  Show the location of your farm infrastructure (sheds, dams, etc.)
                </p>
              </div>
              <Switch
                id="share_infrastructure"
                checked={privacySettings.share_infrastructure}
                onCheckedChange={() => handleToggle("share_infrastructure")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="share_tasks" className="text-base font-medium">
                  Share Task Information
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow others to see your farm tasks and activities
                </p>
              </div>
              <Switch
                id="share_tasks"
                checked={privacySettings.share_tasks}
                onCheckedChange={() => handleToggle("share_tasks")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="share_location" className="text-base font-medium">
                  Share Farm Location
                </Label>
                <p className="text-sm text-muted-foreground">
                  Share your general farm location (not exact coordinates)
                </p>
              </div>
              <Switch
                id="share_location"
                checked={privacySettings.share_location}
                onCheckedChange={() => handleToggle("share_location")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="share_profile" className="text-base font-medium">
                  Share Profile Information
                </Label>
                <p className="text-sm text-muted-foreground">
                  Share your enterprise type, farm bio, and other profile details
                </p>
              </div>
              <Switch
                id="share_profile"
                checked={privacySettings.share_profile}
                onCheckedChange={() => handleToggle("share_profile")}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

