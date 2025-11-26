"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2, ArrowRight } from "lucide-react"

interface FarmNameFormModalProps {
  onSubmit: (farmName: string) => void
  currentFarmName?: string
}

export function FarmNameFormModal({ onSubmit, currentFarmName }: FarmNameFormModalProps) {
  const [farmName, setFarmName] = useState(currentFarmName || "")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (farmName.trim()) {
      onSubmit(farmName.trim())
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md shadow-xl border">
        <CardHeader className="text-center pb-3">
          <div className="flex justify-center mb-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl font-semibold text-foreground mb-1">What's your farm name?</CardTitle>
          <CardDescription className="text-sm">
            Give your farm a name to personalize your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="farmName">Farm Name</Label>
              <Input
                id="farmName"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                placeholder="e.g., Green Valley Farm"
                className="w-full"
                autoFocus
              />
            </div>
            <Button
              type="submit"
              disabled={!farmName.trim()}
              className="w-full bg-primary hover:bg-primary/90 gap-2"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

