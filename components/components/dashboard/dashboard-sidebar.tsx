"use client"

import { LayoutDashboard, Users, FileText, Building2, Settings, LogOut, Map } from "lucide-react"
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar"

interface DashboardSidebarProps {
  activeTab: "overview" | "livestock" | "tasks" | "infrastructure" | "edit"
  onTabChange: (tab: "overview" | "livestock" | "tasks" | "infrastructure" | "edit") => void
  onSettingsClick: () => void
  onLogout: () => void
  profileName?: string
  locationConfirmed?: boolean
}

export function DashboardSidebar({
  activeTab,
  onTabChange,
  onSettingsClick,
  onLogout,
  profileName,
  locationConfirmed = true,
}: DashboardSidebarProps) {
  const menuItems = [
    {
      id: "overview" as const,
      label: "Overview",
      icon: LayoutDashboard,
    },
    {
      id: "livestock" as const,
      label: "Livestock",
      icon: Users,
    },
    {
      id: "tasks" as const,
      label: "Tasks",
      icon: FileText,
    },
    {
      id: "infrastructure" as const,
      label: "Infrastructure",
      icon: Building2,
    },
    {
      id: "edit" as const,
      label: "Edit Map",
      icon: Map,
    },
  ]

  return (
    <Sidebar collapsible="icon" variant="inset" className="border-r border-sidebar-border/50 backdrop-blur-xl bg-sidebar/95">
      <SidebarHeader className="border-b border-sidebar-border/50 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary text-white font-bold text-lg shadow-lg glow-green transition-transform hover:scale-105">
            S
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm text-gradient">SmartSoil</span>
            {profileName && <span className="text-xs text-muted-foreground/70 font-medium">{profileName}</span>}
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider px-2 mb-2">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                const isDisabled = !locationConfirmed && item.id !== "overview"
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => {
                        if (!isDisabled) {
                          onTabChange(item.id)
                        }
                      }}
                      isActive={isActive}
                      disabled={isDisabled}
                      tooltip={isDisabled ? "Complete setup to unlock this feature" : item.label}
                      className={`transition-all duration-200 ${isDisabled
                          ? "opacity-50 cursor-not-allowed grayscale"
                          : isActive
                            ? "bg-gradient-to-r from-primary/20 to-primary/10 text-primary font-semibold shadow-sm border-l-2 border-primary glow-green"
                            : "hover:bg-accent/70 text-muted-foreground hover:text-foreground hover:border-l-2 hover:border-primary/30"
                        }`}
                    >
                      <Icon className={`h-4 w-4 transition-transform ${isActive ? "scale-110" : ""}`} />
                      <span className="font-medium">{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/50 px-2 py-3">
        <SidebarMenu className="space-y-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={onSettingsClick}
              tooltip="Settings"
              className="hover:bg-accent/50 transition-all duration-200"
            >
              <Settings className="h-4 w-4" />
              <span className="font-medium">Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={onLogout}
              tooltip="Sign Out"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-200 font-medium"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

