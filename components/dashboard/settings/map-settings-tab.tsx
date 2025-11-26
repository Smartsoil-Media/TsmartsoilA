"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useProfile } from "@/hooks/use-profile"
import { toast } from "sonner"
import { PADDOCK_TYPE_COLORS, PADDOCK_TYPE_LABELS } from "@/lib/constants/dashboard"
import { Map, ChevronDown } from "lucide-react"

export function MapSettingsTab() {
  const supabase = createClient()
  const { profile, refetch: refetchProfile } = useProfile()
  
  // Initialize colors from profile or defaults
  const [paddockColors, setPaddockColors] = useState<Record<string, string>>(() => {
    if (profile?.paddock_type_colors) {
      return { ...PADDOCK_TYPE_COLORS, ...profile.paddock_type_colors }
    }
    return { ...PADDOCK_TYPE_COLORS }
  })
  const [savingColors, setSavingColors] = useState(false)
  const [isColorsOpen, setIsColorsOpen] = useState(false)
  const [showPaddockNames, setShowPaddockNames] = useState(true)
  const [savingDisplaySettings, setSavingDisplaySettings] = useState(false)

  // Update colors when profile changes
  useEffect(() => {
    if (profile?.paddock_type_colors) {
      setPaddockColors({ ...PADDOCK_TYPE_COLORS, ...profile.paddock_type_colors })
    } else {
      setPaddockColors({ ...PADDOCK_TYPE_COLORS })
    }
  }, [profile])

  // Initialize display settings from profile
  useEffect(() => {
    if (profile?.map_settings?.show_paddock_names !== undefined) {
      setShowPaddockNames(profile.map_settings.show_paddock_names)
    } else {
      setShowPaddockNames(true) // Default to showing names
    }
  }, [profile])

  const handleColorChange = (type: string, color: string) => {
    setPaddockColors((prev) => ({ ...prev, [type]: color }))
  }

  const handleSaveColors = async () => {
    setSavingColors(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error("You must be logged in")
        setSavingColors(false)
        return
      }

      // Only save colors that differ from defaults
      const customColors: Record<string, string> = {}
      Object.keys(PADDOCK_TYPE_COLORS).forEach((type) => {
        if (paddockColors[type] !== PADDOCK_TYPE_COLORS[type]) {
          customColors[type] = paddockColors[type]
        }
      })

      const colorsToSave = Object.keys(customColors).length > 0 ? customColors : null

      const { error } = await supabase
        .from("profiles")
        .update({ paddock_type_colors: colorsToSave })
        .eq("id", user.id)

      if (error) {
        console.error("Error saving colors:", error)
        toast.error(`Failed to save color preferences: ${error.message || "Unknown error"}`)
        setSavingColors(false)
        return
      }

      toast.success("Successfully changed the colours!")
      await refetchProfile()
      // Close the color picker after successful save
      setIsColorsOpen(false)
    } catch (error: any) {
      console.error("Error saving colors:", error)
      toast.error(`An error occurred while saving colors: ${error?.message || "Unknown error"}`)
    } finally {
      setSavingColors(false)
    }
  }

  const handleResetColors = () => {
    setPaddockColors({ ...PADDOCK_TYPE_COLORS })
  }

  const handleSaveDisplaySettings = async () => {
    setSavingDisplaySettings(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error("You must be logged in")
        return
      }

      const currentMapSettings = profile?.map_settings || {}
      const updatedMapSettings = {
        ...currentMapSettings,
        show_paddock_names: showPaddockNames,
      }

      const { error } = await supabase
        .from("profiles")
        .update({ map_settings: updatedMapSettings })
        .eq("id", user.id)

      if (error) {
        console.error("Error saving display settings:", error)
        toast.error("Failed to save display settings")
        return
      }

      toast.success("Display settings saved successfully")
      refetchProfile()
    } catch (error) {
      console.error("Error saving display settings:", error)
      toast.error("An error occurred while saving display settings")
    } finally {
      setSavingDisplaySettings(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Map className="h-6 w-6" />
          Map Settings
        </h2>
        <p className="text-gray-600 mt-1">Customize your map display preferences</p>
      </div>

      <Card>
        <Collapsible open={isColorsOpen} onOpenChange={setIsColorsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Paddock Type Colors</CardTitle>
                  <CardDescription>
                    Customize the default colors for each paddock type. These colors will be used for new paddocks.
                  </CardDescription>
                </div>
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                    isColorsOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.keys(PADDOCK_TYPE_COLORS).map((type) => (
                  <div key={type} className="flex items-center gap-3">
                    <Label htmlFor={`color-${type}`} className="w-32 font-medium">
                      {PADDOCK_TYPE_LABELS[type]}
                    </Label>
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="color"
                        id={`color-${type}`}
                        value={paddockColors[type] || PADDOCK_TYPE_COLORS[type]}
                        onChange={(e) => handleColorChange(type, e.target.value)}
                        className="h-10 w-20 rounded border border-border cursor-pointer"
                      />
                      <span className="text-sm text-muted-foreground font-mono">
                        {paddockColors[type] || PADDOCK_TYPE_COLORS[type]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <Button onClick={handleSaveColors} disabled={savingColors}>
                  {savingColors ? "Saving..." : "Save Colors"}
                </Button>
                <Button variant="outline" onClick={handleResetColors}>
                  Reset to Defaults
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Map Display Options</CardTitle>
          <CardDescription>
            Control what information is displayed on the map
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show_paddock_names" className="text-base font-medium">
                Display Paddock Names
              </Label>
              <p className="text-sm text-muted-foreground">
                Show or hide paddock names on the map
              </p>
            </div>
            <Switch
              id="show_paddock_names"
              checked={showPaddockNames}
              onCheckedChange={async (checked) => {
                setShowPaddockNames(checked)
                // Auto-save when toggled
                setSavingDisplaySettings(true)
                try {
                  const {
                    data: { user },
                  } = await supabase.auth.getUser()

                  if (!user) {
                    toast.error("You must be logged in")
                    return
                  }

                  const currentMapSettings = profile?.map_settings || {}
                  const updatedMapSettings = {
                    ...currentMapSettings,
                    show_paddock_names: checked,
                  }

                  const { error } = await supabase
                    .from("profiles")
                    .update({ map_settings: updatedMapSettings })
                    .eq("id", user.id)

                  if (error) {
                    console.error("Error saving display settings:", error)
                    toast.error("Failed to save display settings")
                    // Revert the toggle on error
                    setShowPaddockNames(!checked)
                    return
                  }

                  toast.success("Display settings saved")
                  refetchProfile()
                } catch (error) {
                  console.error("Error saving display settings:", error)
                  toast.error("An error occurred while saving display settings")
                  // Revert the toggle on error
                  setShowPaddockNames(!checked)
                } finally {
                  setSavingDisplaySettings(false)
                }
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

