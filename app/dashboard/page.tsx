"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { LocationConfirmationModal } from "@/components/location-confirmation-modal"
import { PaddockDetailsModal } from "@/components/paddock-details-modal"
import { AddMobModal } from "@/components/add-mob-modal"
import { AddTaskModal } from "@/components/add-task-modal"
import { Users } from "lucide-react"
import { InfrastructureDetailsModal } from "@/components/infrastructure-details-modal"
import Link from "next/link"

// Import livestock event modals
import { AddLambsModal } from "@/components/add-lambs-modal"
import { MarkSoldModal } from "@/components/mark-sold-modal"
import { RegisterLossModal } from "@/components/register-loss-modal"

import { LambingWorksheetModal } from "@/components/lambing-worksheet-modal"
import { AddSheepModal } from "@/components/add-sheep-modal"

import { toast } from "sonner"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"

// Import types
import type { MapboxMap } from "@/types/mapbox"
import type {
  Profile,
  Paddock,
  Mob,
  GrazingEvent,
  Task,
  Infrastructure,
  WeatherData,
  RainfallData,
  ActiveTab,
  MapViewMode,
  DrawingMode,
} from "@/types/dashboard"

// Import constants
import { SQUARE_METERS_TO_HECTARES } from "@/lib/constants/dashboard"

// Import hooks
import { useProfile } from "@/hooks/use-profile"
import { useWeather } from "@/hooks/use-weather"
import { useMobEvents } from "@/hooks/use-mob-events"
import { useGrazing } from "@/hooks/use-grazing"
import { usePaddocks } from "@/hooks/use-paddocks"
import { useMobs } from "@/hooks/use-mobs"
import { useTasks } from "@/hooks/use-tasks"
import { useInfrastructure } from "@/hooks/use-infrastructure"
import { useTeamMembers } from "@/hooks/use-team-members"
import { useTaskHandlers } from "@/hooks/use-task-handlers"
import { useCommonHandlers } from "@/hooks/use-common-handlers"
import { useMobHandlers } from "@/hooks/use-mob-handlers"
import { usePaddockHandlers } from "@/hooks/use-paddock-handlers"
import { useInfrastructureHandlers } from "@/hooks/use-infrastructure-handlers"
import { useMapbox } from "@/hooks/use-mapbox"
import { useFarmOwner } from "@/hooks/use-farm-owner"

// Import utilities
import { getOffspringName, getPaddockName } from "@/lib/utils/dashboard"

// Import dashboard components
import { MobDetailsView } from "@/components/dashboard/mob-details-view"
import { PaddockDetailsView } from "@/components/dashboard/paddock-details-view"
import { InfrastructureDetailsView } from "@/components/dashboard/infrastructure-details-view"
import { InfrastructureTab } from "@/components/dashboard/infrastructure-tab"
import { TasksTab } from "@/components/dashboard/tasks-tab"
import { OverviewTab } from "@/components/dashboard/overview-tab"
import { LivestockTab } from "@/components/dashboard/livestock-tab"
import { EditMapTab } from "@/components/dashboard/edit-map-tab"
import { MapView } from "@/components/dashboard/map-view"
import { MovePaddockModal } from "@/components/dashboard/move-paddock-modal"
import { MoveConfirmationModal } from "@/components/move-confirmation-modal"
import { WelcomeTutorialModal } from "@/components/dashboard/welcome-tutorial-modal"
import { PinConfirmationModal } from "@/components/dashboard/pin-confirmation-modal"
import { FarmNameFormModal } from "@/components/dashboard/farm-name-form-modal"
import { PaddockDrawingTutorial } from "@/components/dashboard/paddock-drawing-tutorial"

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const mapContainer = useRef<HTMLDivElement>(null)

  // Use custom hooks
  const { profile, displayProfile, loading, showAddressPrompt, setShowAddressPrompt, updateLocation, dismissPrompt, refetch: refetchProfile } = useProfile()
  const { weather, weatherLoading, weatherError, rainfallData, rainfallLoading } = useWeather(
    displayProfile?.latitude || null,
    displayProfile?.longitude || null
  )

  const [showLocationModal, setShowLocationModal] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [showPinPrompt, setShowPinPrompt] = useState(false)
  const [pinLocation, setPinLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [showPinConfirmation, setShowPinConfirmation] = useState(false)
  const [showFarmNameForm, setShowFarmNameForm] = useState(false)
  const [showPaddockTutorial, setShowPaddockTutorial] = useState(false)
  const [paddocks, setPaddocks] = useState<Paddock[]>([])
  const [infrastructurePinMode, setInfrastructurePinMode] = useState(false)
  const [pendingFeature, setPendingFeature] = useState<{ feature: any; area: number } | null>(null)
  const [showPaddockModal, setShowPaddockModal] = useState(false)
  const [editingPaddock, setEditingPaddock] = useState<Paddock | null>(null)
  const [selectedPaddock, setSelectedPaddock] = useState<Paddock | null>(null)
  const [selectedMob, setSelectedMob] = useState<Mob | null>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview")
  const [mobs, setMobs] = useState<Mob[]>([])
  const [showAddMobModal, setShowAddMobModal] = useState(false)
  const [editingMob, setEditingMob] = useState<Mob | null>(null)
  const [grazingEvents, setGrazingEvents] = useState<GrazingEvent[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [showAddTaskModal, setShowAddTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [taskPaddockIds, setTaskPaddockIds] = useState<string[]>([])
  const [infrastructure, setInfrastructure] = useState<Infrastructure[]>([])
  const [selectedInfrastructure, setSelectedInfrastructure] = useState<Infrastructure | null>(null)
  const [showInfrastructureModal, setShowInfrastructureModal] = useState(false)
  const [editingInfrastructure, setEditingInfrastructure] = useState<Infrastructure | null>(null)
  const [highlightedPaddockIds, setHighlightedPaddockIds] = useState<string[]>([])
  const [pendingInfrastructureGeometry, setPendingInfrastructureGeometry] = useState<any>(null)
  const [showMoveConfirmation, setShowMoveConfirmation] = useState(false)
  const [moveConfirmationDetails, setMoveConfirmationDetails] = useState<{
    mobName: string
    oldPaddockName: string
    newPaddockName: string
    daysInPaddock: number
  } | null>(null)
  const [mapViewMode, setMapViewMode] = useState<MapViewMode>("default")
  const [mapHeightPercent, setMapHeightPercent] = useState<number | null>(null)
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  
  // Map filter state
  const [showOnlyPaddocksWithTasks, setShowOnlyPaddocksWithTasks] = useState(false)
  const [selectedPaddockTypes, setSelectedPaddockTypes] = useState<string[]>([
    "pasture",
    "cropping",
    "mixed",
    "native_bush",
    "wetland",
    "agroforestry",
    "other",
  ])

  // Use mob events hook
  const {
    mobEvents,
    loadingMobEvents,
    mobAnimals,
    loadingAnimals,
    calculateAge,
    calculateMobAnalytics,
  } = useMobEvents(selectedMob?.id || null)

  // Get current user ID and determine farm owner ID
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  useEffect(() => {
    const getUserId = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    getUserId()
  }, [])

  // Determine the farm owner ID - if user is a team member, use farm owner's ID
  const { farmOwnerId, loading: loadingFarmOwner } = useFarmOwner(currentUserId)

  // Use farmOwnerId for all data hooks (this will be the owner's ID for team members)
  const { paddocks: paddocksData, fetchPaddocks: refetchPaddocks, createPaddock, updatePaddock, deletePaddock } = usePaddocks(farmOwnerId)
  const { mobs: mobsData, grazingEvents: grazingEventsData, fetchMobs: refetchMobs } = useMobs(farmOwnerId)
  const { tasks: tasksData, fetchTasks: refetchTasks, fetchTaskPaddocks, createTask, updateTask, toggleTaskStatus, deleteTask } = useTasks(farmOwnerId)
  const { infrastructure: infrastructureData, fetchInfrastructure: refetchInfrastructure, createInfrastructure, updateInfrastructure } = useInfrastructure(farmOwnerId)
  const { teamMembers: teamMembersData } = useTeamMembers(farmOwnerId)

  // Sync hook data with local state
  useEffect(() => {
    const paddocksWithArea = paddocksData.map((paddock) => ({
      ...paddock,
      area_hectares: paddock.area ? paddock.area / SQUARE_METERS_TO_HECTARES : 0,
    }))
    setPaddocks(paddocksWithArea as Paddock[])
  }, [paddocksData])

  useEffect(() => {
    setMobs(mobsData as Mob[])
  }, [mobsData])

  useEffect(() => {
    setGrazingEvents(grazingEventsData as GrazingEvent[])
  }, [grazingEventsData])

  useEffect(() => {
    setTasks(tasksData as Task[])
  }, [tasksData])

  useEffect(() => {
    const convertedInfrastructure = infrastructureData.map((item) => ({
      ...item,
      capacity: item.capacity ? Number.parseFloat(item.capacity) : undefined,
    }))
    setInfrastructure(convertedInfrastructure as Infrastructure[])
  }, [infrastructureData])

  useEffect(() => {
    setTeamMembers(teamMembersData)
  }, [teamMembersData])

  // Fetch task paddock IDs when editing a task
  useEffect(() => {
    if (editingTask && fetchTaskPaddocks) {
      fetchTaskPaddocks(editingTask.id).then((ids) => {
        setTaskPaddockIds(ids)
      })
    } else {
      setTaskPaddockIds([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingTask?.id])

  // Use grazing hook
  const {
    getGrazingStatus,
    getDaysSinceLastGrazed,
    getDaysInPaddock,
    calculateDSE,
    calculatePaddockDSE,
    calculateStockingRate,
  } = useGrazing(mobs, grazingEvents)

  const [showAddLambsModal, setShowAddLambsModal] = useState(false)
  const [showLambingWorksheet, setShowLambingWorksheet] = useState(false)
  const [showAddSheepModal, setShowAddSheepModal] = useState(false)
  const [showMarkSoldModal, setShowMarkSoldModal] = useState(false)
  const [showRegisterLossModal, setShowRegisterLossModal] = useState(false)
  const [showTrackTreatmentModal, setShowTrackTreatmentModal] = useState(false)
  const [showLogObservationModal, setShowLogObservationModal] = useState(false)

  const [showMovePaddockModal, setShowMovePaddockModal] = useState(false)

  // Use handler hooks
  const { handleSaveTask, handleDeleteTask, handleToggleTaskStatus } = useTaskHandlers({
    editingTask,
    setEditingTask,
    setShowAddTaskModal,
    createTask,
    updateTask,
    toggleTaskStatus,
    deleteTask,
  })

  // Create temporary ref for map that will be updated after useMapbox
  const mapRefForHandlers = useRef<MapboxMap | null>(null)

  const { handleLocationConfirm, handleSignOut, handleSettings, handleCloseModal } = useCommonHandlers({
    updateLocation,
    setShowLocationModal,
    map: mapRefForHandlers,
  })

  const {
    handleDeleteMob,
    handleAddLambs,
    handleMarkSold,
    handleRegisterLoss,
    handleSaveLambs,
    handleAddSheep,
    handleSaveMob,
    handleMovePaddock,
    handleMobClick: handleMobClickFromHook,
    handleTrackTreatment,
    handleLogObservation,
  } = useMobHandlers({
    userId: farmOwnerId,
    selectedMob,
    setSelectedMob,
    setMobs,
    setShowAddLambsModal,
    setShowMarkSoldModal,
    setShowRegisterLossModal,
    setShowLambingWorksheet,
    setShowAddSheepModal,
    setShowAddMobModal,
    setEditingMob,
    editingMob,
    fetchMobs: refetchMobs,
    fetchGrazingEvents: async () => {
      // Grazing events are already fetched by useMobs hook
      // This is a no-op for now, but kept for compatibility
    },
    onMobDeleted: (mobName) => {
      // Switch to livestock tab after permanent deletion
      setActiveTab("livestock")
    },
    onMobMoved: (details) => {
      setMoveConfirmationDetails(details)
      setShowMoveConfirmation(true)
    },
    getPaddockName,
    paddocks,
    grazingEvents,
  })

  // Paddock handlers - simplified without draw control
  const handlePaddockDetailsConfirm = async (details: { name: string; color: string; type: string; tree_species?: string | null }) => {
    if (!farmOwnerId || !pendingFeature) return

    const newPaddock = await createPaddock({
      name: details.name,
      geometry: pendingFeature.feature,
      area: pendingFeature.area,
      color: details.color,
      type: details.type,
      tree_species: details.tree_species || null,
    })

    if (newPaddock) {
      await refetchPaddocks()
      setShowPaddockModal(false)
      setPendingFeature(null)
      toast.success("Paddock created successfully")
    } else {
      toast.error("Failed to create paddock")
    }
  }

  const handlePaddockDetailsCancel = () => {
    setShowPaddockModal(false)
    setPendingFeature(null)
  }

  const handleDeletePaddock = async () => {
    // TODO: Implement delete handler
  }

  const handleEditPaddock = () => {
    // TODO: Implement edit handler
  }

  // Create callback handlers for map interactions
  const handlePaddockClick = useCallback(
    (paddock: Paddock) => {
      setSelectedPaddock(paddock)
      setSelectedMob(null)
      setSelectedInfrastructure(null)
    },
    [setSelectedPaddock, setSelectedMob, setSelectedInfrastructure]
  )

  // Use handleMobClick from hook for map interactions
  const handleMobClickForMap = useCallback(
    (mob: Mob) => {
      handleMobClickFromHook(mob)
      setSelectedPaddock(null)
      setSelectedInfrastructure(null)
    },
    [handleMobClickFromHook, setSelectedPaddock, setSelectedInfrastructure]
  )

  const handleInfrastructureClick = useCallback(
    (infrastructure: Infrastructure) => {
      setSelectedInfrastructure(infrastructure)
      setSelectedPaddock(null)
      setSelectedMob(null)
    },
    [setSelectedInfrastructure, setSelectedPaddock, setSelectedMob]
  )

  // Infrastructure handlers - simplified without draw control
  const handleInfrastructurePinDrop = useCallback((lat: number, lng: number) => {
    // Create a Point geometry for the infrastructure
    const pointGeometry = {
      type: "Point" as const,
      coordinates: [lng, lat] as [number, number],
    }
    setPendingInfrastructureGeometry(pointGeometry)
    setShowInfrastructureModal(true)
  }, [])

  const handleSaveInfrastructure = async (data: {
    name: string
    type: string
    capacity?: number
    condition: string
    notes?: string
  }) => {
    if (!farmOwnerId) {
      toast.error("User not found")
      return
    }

    try {
      if (editingInfrastructure) {
        // Update existing infrastructure
        const success = await updateInfrastructure(editingInfrastructure.id, {
          name: data.name,
          type: data.type,
          capacity: data.capacity?.toString() || null,
          condition: data.condition,
          notes: data.notes || null,
        })

        if (success) {
          toast.success("Infrastructure updated successfully")
          await refetchInfrastructure()
          setShowInfrastructureModal(false)
          setEditingInfrastructure(null)
          setPendingInfrastructureGeometry(null)
          setInfrastructurePinMode(false)
        } else {
          toast.error("Failed to update infrastructure")
        }
      } else {
        // Create new infrastructure - need geometry from pin drop
        if (!pendingInfrastructureGeometry) {
          toast.error("Please drop a pin on the map first")
          return
        }

        const newInfrastructure = await createInfrastructure({
          name: data.name,
          type: data.type,
          geometry: pendingInfrastructureGeometry,
          area: 0, // Points have no area
          capacity: data.capacity?.toString() || null,
          condition: data.condition,
          notes: data.notes || null,
        })

        if (newInfrastructure) {
          toast.success("Infrastructure created successfully")
          await refetchInfrastructure()
          setShowInfrastructureModal(false)
          setEditingInfrastructure(null)
          setPendingInfrastructureGeometry(null)
          setInfrastructurePinMode(false)
        } else {
          toast.error("Failed to create infrastructure")
        }
      }
    } catch (error) {
      toast.error("An error occurred while saving the infrastructure")
    }
  }

  const handleDeleteInfrastructure = async (id: string) => {
    // TODO: Implement infrastructure delete
  }

  // Edit map handlers
  const handleEditMapPaddockCreate = useCallback((feature: any, area: number) => {
    // Open modal to get paddock details
    setPendingFeature({ feature, area })
    setShowPaddockModal(true)
  }, [])

  const handleEditMapPaddockUpdate = useCallback(async (paddockId: string, updates: { geometry: any; area: number }) => {
    if (!farmOwnerId) return
    const success = await updatePaddock(paddockId, updates)
    if (success) {
      await refetchPaddocks()
      toast.success("Paddock updated successfully")
    } else {
      toast.error("Failed to update paddock")
    }
  }, [farmOwnerId, updatePaddock, refetchPaddocks])

  const handleEditMapPaddockDelete = useCallback(async (paddockId: string) => {
    if (!farmOwnerId) return
    const success = await deletePaddock(paddockId)
    if (success) {
      await refetchPaddocks()
      toast.success("Paddock deleted successfully")
    } else {
      toast.error("Failed to delete paddock")
    }
  }, [farmOwnerId, deletePaddock, refetchPaddocks])

  // Function to highlight paddocks temporarily
  const highlightPaddocks = useCallback((paddockIds: string[]) => {
    if (paddockIds.length === 0) return

    // Ensure map is visible (not collapsed) when highlighting
    if (mapViewMode === "collapsed") {
      setMapViewMode("default")
    }

    setHighlightedPaddockIds(paddockIds)

    // Clear highlight after 6 seconds with fade
    setTimeout(() => {
      setHighlightedPaddockIds([])
    }, 6000)
  }, [mapViewMode])

  const handlePinDrop = useCallback(async (lat: number, lng: number) => {
    // Store pin location and show confirmation modal
    setPinLocation({ lat, lng })
    setShowPinPrompt(false)
    setShowPinConfirmation(true)
  }, [])

  const handlePinConfirmation = async (confirmed: boolean) => {
    if (!confirmed || !pinLocation) {
      // User said no, allow them to drop pin again
      setPinLocation(null)
      setShowPinConfirmation(false)
      setShowPinPrompt(true)
      return
    }

    // User confirmed - show farm name form
    setShowPinConfirmation(false)
    setShowFarmNameForm(true)
  }

  const handleFarmNameSubmit = async (farmName: string) => {
    if (!pinLocation) return

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Update profile with confirmed location, pin coordinates, and farm name
      const { error } = await supabase
        .from("profiles")
        .update({
          latitude: pinLocation.lat,
          longitude: pinLocation.lng,
          location_confirmed: true,
          display_name: farmName,
        })
        .eq("id", user.id)

      if (error) {
        toast.error("Failed to save farm information")
        return
      }

      setShowFarmNameForm(false)
      toast.success("Farm location confirmed!")
      await refetchProfile()

      // Show paddock drawing tutorial
      setShowPaddockTutorial(true)
    } catch (error) {
      toast.error("Failed to save farm information")
    }
  }

  // Use mapbox hook - always call it (Rules of Hooks), but it won't initialize on edit tab
  const { map, mapReady, styleLoaded, mapboxLoaded } = useMapbox({
    mapContainer,
    profile: displayProfile,
    paddocks,
    mobs,
    infrastructure,
    selectedPaddock,
    selectedMob,
    selectedInfrastructure,
    infrastructurePinMode,
    mapViewMode,
    highlightedPaddockIds,
    showPinPrompt,
    pinLocation,
    onPaddockClick: handlePaddockClick,
    onMobClick: handleMobClickForMap,
    onInfrastructureClick: handleInfrastructureClick,
    onPinDrop: handlePinDrop,
    onInfrastructurePinDrop: handleInfrastructurePinDrop,
    activeTab, // Pass activeTab so hook can skip initialization on edit tab
    showPaddockNames: displayProfile?.map_settings?.show_paddock_names !== false, // Default to true if not set
    showOnlyPaddocksWithTasks,
    selectedPaddockTypes,
    tasks,
    fetchTaskPaddocks,
  })

  // Update ref for handlers after useMapbox hook
  useEffect(() => {
    mapRefForHandlers.current = map.current
  }, [map])

  // Tutorial disabled for development
  // Show tutorial ONLY if no profile exists at all
  // Once profile exists, use pin prompt instead (even if location not confirmed)
  useEffect(() => {
    // Disable tutorial for now
    setShowTutorial(false)
    
    if (!loading) {
      // Profile exists - show pin prompt if needed
      if (displayProfile) {
        if (displayProfile.latitude && displayProfile.longitude && !displayProfile.location_confirmed && !pinLocation) {
          setShowPinPrompt(true)
        } else {
          setShowPinPrompt(false)
        }
      }
    }
  }, [displayProfile, loading, pinLocation])

  const handleTutorialComplete = async (latitude: number, longitude: number, address: string) => {
    // If no profile exists, create one first
    if (!profile) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        // Create a basic profile with minimal data (location_confirmed = false until pin is dropped)
        const { error: createError } = await supabase.from("profiles").insert({
          id: user.id,
          name: user.email?.split("@")[0] || "User",
          display_name: user.email?.split("@")[0] || "User",
          farm_location: address,
          latitude,
          longitude,
          location_confirmed: false, // Don't confirm until pin is dropped
          enterprise_type: "Livestock",
          animal_type: null,
          crop_type: null,
          bio: null,
        })

        if (createError) {
          toast.error("Failed to create profile")
          return
        }
        // Refetch profile after creation
        await refetchProfile()
      } catch (error) {
        toast.error("Failed to complete setup")
        return
      }
    } else {
      // Update location but don't confirm yet (keep location_confirmed as false)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase
          .from("profiles")
          .update({
            latitude,
            longitude,
            farm_location: address,
            // Don't set location_confirmed to true - wait for pin drop
          })
          .eq("id", user.id)

        if (error) {
          toast.error("Failed to update location")
          return
        }
      } catch (error) {
        toast.error("Failed to update location")
        return
      }
    }

    // Close tutorial and show map with pin prompt
    setShowTutorial(false)
    toast.success("Now drop a pin on your exact farm location on the map")

    // Center map on the location (offset upward for top-middle positioning)
    if (map.current) {
      map.current.flyTo({
        center: [longitude, latitude - 0.0025],
        zoom: 15,
        duration: 2000,
      })
    }

    // Refetch profile to get updated location
    await refetchProfile()
  }

  return (
    <SidebarProvider>
      <DashboardSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSettingsClick={handleSettings}
        onLogout={handleSignOut}
        profileName={displayProfile?.display_name || ""}
        locationConfirmed={displayProfile?.location_confirmed || false}
      />
      <SidebarInset>
        <div className="h-screen flex flex-col">
          {showTutorial && (
            <WelcomeTutorialModal onComplete={handleTutorialComplete} />
          )}
          {showFarmNameForm && (
            <FarmNameFormModal
              onSubmit={handleFarmNameSubmit}
              currentFarmName={displayProfile?.display_name}
            />
          )}

          {showLocationModal && (
            <LocationConfirmationModal currentAddress={displayProfile?.farm_location || ""} onConfirm={handleLocationConfirm} />
          )}

          {showPaddockModal && (
            <PaddockDetailsModal
              defaultName={editingPaddock ? editingPaddock.name : `Paddock ${paddocks.length + 1}`}
              area={editingPaddock ? editingPaddock.area : 0}
              onConfirm={handlePaddockDetailsConfirm}
              onCancel={handlePaddockDetailsCancel}
              onDelete={editingPaddock ? handleDeletePaddock : undefined}
              paddock={editingPaddock}
            />
          )}

          {showAddMobModal && (
            <AddMobModal
              onClose={() => {
                setShowAddMobModal(false)
                setEditingMob(null)
              }}
              onSave={(mobData) => handleSaveMob(mobData, editingMob)}
              onDelete={editingMob ? (hardDelete?: boolean) => handleDeleteMob(editingMob.id, hardDelete) : undefined}
              paddocks={paddocks}
              mob={editingMob}
            />
          )}

          {showAddTaskModal && (
            <AddTaskModal
              onClose={() => {
                setShowAddTaskModal(false)
                setEditingTask(null)
                setTaskPaddockIds([])
              }}
              onSave={async (taskData) => {
                await handleSaveTask(taskData)
                refetchTasks() // Refresh tasks after save
              }}
              paddocks={paddocks}
              mobs={mobs}
              task={editingTask}
              teamMembers={teamMembers}
              taskPaddockIds={taskPaddockIds}
            />
          )}

          <InfrastructureDetailsModal
            isOpen={showInfrastructureModal}
            onClose={() => {
              setShowInfrastructureModal(false)
              setEditingInfrastructure(null)
              setPendingInfrastructureGeometry(null)
              // Exit infrastructure pin mode when closing modal
              setInfrastructurePinMode(false)
            }}
            onSave={handleSaveInfrastructure}
            infrastructure={editingInfrastructure}
          />

          <header className="border-b border-border/50 bg-background/95 backdrop-blur-xl z-10 sticky top-0 glass-dark">
            <div className="flex h-16 items-center gap-4 px-6">
              <SidebarTrigger className="transition-transform hover:scale-105 text-foreground hover:text-primary" />
              <div className="flex items-center gap-4 flex-1">
                <h1 className="text-xl font-bold text-gradient">Dashboard</h1>
              </div>
              <Link href="/admin">
                <Button variant="outline" size="sm" className="transition-all duration-200 hover:scale-105 hover:shadow-md border-border/50 hover:border-primary/50 hover:text-primary bg-card/50">
                  <Users className="h-4 w-4 mr-2" />
                  Team
                </Button>
              </Link>
            </div>
          </header>

          <div className="flex-1 relative overflow-hidden">
            {activeTab === "edit" ? (
              <EditMapTab
                profile={profile}
                paddocks={paddocks}
                infrastructure={infrastructure}
                onPaddockCreate={handleEditMapPaddockCreate}
                onPaddockUpdate={handleEditMapPaddockUpdate}
                onPaddockDelete={handleEditMapPaddockDelete}
                onInfrastructurePinDrop={handleInfrastructurePinDrop}
              />
            ) : (
              <>
                {/* Fullscreen map behind everything */}
                <MapView
                  mapContainer={mapContainer}
                  mapReady={mapReady}
                  styleLoaded={styleLoaded}
                  mapViewMode={mapViewMode}
                  showPinPrompt={showPinPrompt}
                  showPinConfirmation={showPinConfirmation}
                  showPaddockTutorial={showPaddockTutorial}
                  farmName={displayProfile?.display_name || ""}
                  onMapViewModeChange={setMapViewMode}
                  onMapHeightChange={setMapHeightPercent}
                  onPinDrop={handlePinDrop}
                  showOnlyPaddocksWithTasks={showOnlyPaddocksWithTasks}
                  selectedPaddockTypes={selectedPaddockTypes}
                  onShowOnlyPaddocksWithTasksChange={setShowOnlyPaddocksWithTasks}
                  onSelectedPaddockTypesChange={setSelectedPaddockTypes}
                  onResetFilters={() => {
                    setShowOnlyPaddocksWithTasks(false)
                    setSelectedPaddockTypes([
                      "pasture",
                      "cropping",
                      "mixed",
                      "native_bush",
                      "wetland",
                      "agroforestry",
                      "other",
                    ])
                  }}
                  onPinConfirm={handlePinConfirmation}
                  onPaddockTutorialComplete={() => setShowPaddockTutorial(false)}
                />

                {/* Content area overlaying from bottom */}
                <div
                  className="absolute bottom-0 left-0 right-0 bg-background overflow-y-auto transition-all duration-300 z-10"
                  style={{
                    height: mapHeightPercent !== null 
                      ? `${100 - mapHeightPercent}%` 
                      : mapViewMode === "fullscreen" 
                        ? "5%" 
                        : mapViewMode === "collapsed" 
                          ? "90%" 
                          : "55%"
                  }}
                >
                  <div className="p-6">
                    {selectedMob ? (
                      <MobDetailsView
                        mob={selectedMob}
                        paddocks={paddocks}
                        mobEvents={mobEvents}
                        mobAnimals={mobAnimals}
                        loadingMobEvents={loadingMobEvents}
                        loadingAnimals={loadingAnimals}
                        onClose={() => setSelectedMob(null)}
                        onEdit={() => {
                          setEditingMob(selectedMob)
                          setShowAddMobModal(true)
                        }}
                        onMovePaddock={() => setShowMovePaddockModal(true)}
                        onAddLambs={() => setShowAddLambsModal(true)}
                        onAddSheep={() => setShowAddSheepModal(true)}
                        onLambing={() => setShowLambingWorksheet(true)}
                        onMarkSold={() => setShowMarkSoldModal(true)}
                        onRegisterLoss={() => setShowRegisterLossModal(true)}
                        getDaysInPaddock={getDaysInPaddock}
                        calculateMobAnalytics={calculateMobAnalytics}
                        calculateAge={calculateAge}
                      />
                    ) : selectedPaddock ? (
                      <PaddockDetailsView
                        paddock={selectedPaddock}
                        tasks={tasks}
                        onClose={() => setSelectedPaddock(null)}
                        onEdit={handleEditPaddock}
                        onAddTask={() => {
                          setEditingTask(null)
                          setShowAddTaskModal(true)
                        }}
                        onEditTask={(task) => {
                          setEditingTask(task)
                          setShowAddTaskModal(true)
                        }}
                        onToggleTaskStatus={handleToggleTaskStatus}
                        getGrazingStatus={getGrazingStatus}
                        calculateStockingRate={calculateStockingRate}
                        calculatePaddockDSE={calculatePaddockDSE}
                      />
                    ) : selectedInfrastructure ? (
                      <InfrastructureDetailsView
                        infrastructure={selectedInfrastructure}
                        onClose={() => setSelectedInfrastructure(null)}
                        onEdit={() => {
                          setEditingInfrastructure(selectedInfrastructure)
                          setShowInfrastructureModal(true)
                        }}
                        onDelete={handleDeleteInfrastructure}
                      />
                    ) : (
                      <>
                        {activeTab === "infrastructure" ? (
                          <InfrastructureTab
                            infrastructure={infrastructure}
                            onDrawInfrastructure={() => {
                              // Infrastructure pin mode is now handled by the pin tool button in MapView
                              // This handler is kept for backward compatibility but can be removed
                            }}
                            onSelectInfrastructure={(item) => {
                              setSelectedInfrastructure(item)
                              setSelectedPaddock(null)
                              setSelectedMob(null)
                            }}
                            locationConfirmed={displayProfile?.location_confirmed || false}
                          />
                        ) : activeTab === "overview" ? (
                          profile ? (
                            <OverviewTab
                              profile={profile}
                              paddocks={paddocks}
                              tasks={tasks}
                              rainfallData={rainfallData}
                              rainfallLoading={rainfallLoading}
                              weather={weather}
                              weatherLoading={weatherLoading}
                              weatherError={weatherError}
                              onSetActiveTab={setActiveTab}
                              onEditTask={(task) => {
                                setEditingTask(task)
                                setShowAddTaskModal(true)
                              }}
                              onToggleTaskStatus={handleToggleTaskStatus}
                              onShowAddTaskModal={() => setShowAddTaskModal(true)}
                              fetchTaskPaddocks={fetchTaskPaddocks}
                              onHighlightPaddocks={highlightPaddocks}
                            />
                          ) : null
                        ) : activeTab === "livestock" ? (
                          <LivestockTab
                            mobs={mobs}
                            onShowAddMobModal={() => setShowAddMobModal(true)}
                            onMobClick={handleMobClickFromHook}
                            onShowLambingWorksheet={(mob) => {
                              setSelectedMob(mob)
                              setShowLambingWorksheet(true)
                            }}
                            onShowAddSheepModal={(mob) => {
                              setSelectedMob(mob)
                              setShowAddSheepModal(true)
                            }}
                            onShowMarkSoldModal={(mob) => {
                              setSelectedMob(mob)
                              setShowMarkSoldModal(true)
                            }}
                            onShowRegisterLossModal={(mob) => {
                              setSelectedMob(mob)
                              setShowRegisterLossModal(true)
                            }}
                            onShowTrackTreatmentModal={(mob) => {
                              setSelectedMob(mob)
                              setShowTrackTreatmentModal(true)
                            }}
                            onShowLogObservationModal={(mob) => {
                              setSelectedMob(mob)
                              setShowLogObservationModal(true)
                            }}
                            getPaddockName={(paddockId) => getPaddockName(paddockId, paddocks)}
                            getDaysInPaddock={getDaysInPaddock}
                            getOffspringName={getOffspringName}
                            locationConfirmed={displayProfile?.location_confirmed || false}
                          />
                        ) : activeTab === "tasks" ? (
                          <TasksTab
                            tasks={tasks}
                            paddocks={paddocks}
                            mobs={mobs}
                            teamMembers={teamMembers}
                            onAddTask={() => setShowAddTaskModal(true)}
                            onEditTask={(task) => {
                              setEditingTask(task)
                              setShowAddTaskModal(true)
                            }}
                            onToggleTaskStatus={handleToggleTaskStatus}
                            onDeleteTask={handleDeleteTask}
                            locationConfirmed={displayProfile?.location_confirmed || false}
                          />
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {showAddLambsModal && selectedMob && (
            <AddLambsModal mob={selectedMob} onSave={handleAddLambs} onCancel={() => setShowAddLambsModal(false)} />
          )}

          {showMarkSoldModal && selectedMob && (
            <MarkSoldModal mob={selectedMob} onSave={handleMarkSold} onCancel={() => setShowMarkSoldModal(false)} />
          )}

          {showRegisterLossModal && selectedMob && (
            <RegisterLossModal
              mob={selectedMob}
              onSave={handleRegisterLoss}
              onCancel={() => setShowRegisterLossModal(false)}
            />
          )}

          {showLambingWorksheet && selectedMob && (
            <LambingWorksheetModal
              mob={selectedMob}
              onSave={handleSaveLambs}
              onCancel={() => {
                setShowLambingWorksheet(false)
                setSelectedMob(null)
              }}
            />
          )}

          {showAddSheepModal && selectedMob && (
            <AddSheepModal
              mob={selectedMob}
              onSave={handleAddSheep}
              onCancel={() => {
                setShowAddSheepModal(false)
                setSelectedMob(null)
              }}
            />
          )}

          {showMovePaddockModal && selectedMob && (
            <MovePaddockModal
              isOpen={showMovePaddockModal}
              mob={selectedMob}
              paddocks={paddocks}
              onClose={() => setShowMovePaddockModal(false)}
              onMove={async (paddockId) => {
                await handleMovePaddock(paddockId)
                // Close the move modal after successful move
                setShowMovePaddockModal(false)
              }}
              getGrazingStatus={getGrazingStatus}
              getPaddockName={getPaddockName}
            />
          )}

          {showMoveConfirmation && moveConfirmationDetails && (
            <MoveConfirmationModal
              isOpen={showMoveConfirmation}
              mobName={moveConfirmationDetails.mobName}
              oldPaddockName={moveConfirmationDetails.oldPaddockName}
              newPaddockName={moveConfirmationDetails.newPaddockName}
              daysInPaddock={moveConfirmationDetails.daysInPaddock}
              onClose={() => {
                setShowMoveConfirmation(false)
                setMoveConfirmationDetails(null)
              }}
            />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider >
  )
}
