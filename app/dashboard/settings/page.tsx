"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { useProfile } from "@/hooks/use-profile"
import { ArrowLeft, Map, User, Shield, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { MapSettingsTab } from "@/components/dashboard/settings/map-settings-tab"
import { AccountDetailsTab } from "@/components/dashboard/settings/account-details-tab"
import { PrivacyDataTab } from "@/components/dashboard/settings/privacy-data-tab"
import { DangerZoneTab } from "@/components/dashboard/settings/danger-zone-tab"

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const { profile } = useProfile()
  
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/auth/login")
      toast.success("Signed out successfully")
    } catch (error) {
      console.error("Error signing out:", error)
      toast.error("Failed to sign out")
    }
  }

  return (
    <SidebarProvider>
      <DashboardSidebar
        activeTab="overview"
        onTabChange={() => {}}
        onSettingsClick={() => {}}
        onLogout={handleSignOut}
        profileName={profile?.display_name || ""}
      />
      <SidebarInset>
        <div className="flex flex-col h-screen">
          <div className="border-b px-6 py-4 flex items-center gap-4">
            <SidebarTrigger />
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>

          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-white">Settings</h1>
                <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
              </div>

              <Tabs defaultValue="map" className="w-full">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:w-auto lg:inline-flex">
                  <TabsTrigger value="map" className="gap-2">
                    <Map className="h-4 w-4" />
                    <span className="hidden sm:inline">Map Settings</span>
                    <span className="sm:hidden">Map</span>
                  </TabsTrigger>
                  <TabsTrigger value="account" className="gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Account Details</span>
                    <span className="sm:hidden">Account</span>
                  </TabsTrigger>
                  <TabsTrigger value="privacy" className="gap-2">
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline">Privacy & Data</span>
                    <span className="sm:hidden">Privacy</span>
                  </TabsTrigger>
                  <TabsTrigger value="danger" className="gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="hidden sm:inline">Danger Zone</span>
                    <span className="sm:hidden">Danger</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="map" className="mt-6">
                  <MapSettingsTab />
                </TabsContent>

                <TabsContent value="account" className="mt-6">
                  <AccountDetailsTab />
                </TabsContent>

                <TabsContent value="privacy" className="mt-6">
                  <PrivacyDataTab />
                </TabsContent>

                <TabsContent value="danger" className="mt-6">
                  <DangerZoneTab />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
