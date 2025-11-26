"use client"

import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import type { Mob } from "@/types/dashboard"
import { useMobs } from "@/hooks/use-mobs"

interface UseMobHandlersProps {
  userId: string | null
  selectedMob: Mob | null
  setSelectedMob: (mob: Mob | null) => void
  setMobs: React.Dispatch<React.SetStateAction<Mob[]>>
  setShowAddLambsModal: (show: boolean) => void
  setShowMarkSoldModal: (show: boolean) => void
  setShowRegisterLossModal: (show: boolean) => void
  setShowLambingWorksheet: (show: boolean) => void
  setShowAddSheepModal: (show: boolean) => void
  setShowAddMobModal: (show: boolean) => void
  setEditingMob: (mob: Mob | null) => void
  editingMob: Mob | null
  fetchMobs: () => Promise<void>
  fetchGrazingEvents: () => Promise<void>
  onMobDeleted?: (mobName: string) => void // Callback for when mob is permanently deleted
  onMobMoved?: (details: { mobName: string; oldPaddockName: string; newPaddockName: string; daysInPaddock: number }) => void
  getPaddockName?: (paddockId: string | null, paddocks: any[]) => string
  paddocks?: any[]
  grazingEvents?: any[]
}

export function useMobHandlers({
  userId,
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
  fetchMobs,
  fetchGrazingEvents,
  onMobDeleted,
  onMobMoved,
  getPaddockName,
  paddocks = [],
  grazingEvents = [],
}: UseMobHandlersProps) {
  const supabase = createClient()
  const { updateMob, moveMob, createMob } = useMobs(userId)

  const handleDeleteMob = async (mobId: string, hardDelete = false) => {
    try {
      // Get mob name before deletion for confirmation message
      // Try selectedMob first, then editingMob, then query from database
      let mobName = selectedMob?.name || editingMob?.name
      if (!mobName) {
        // Get from database as fallback
        const { data } = await supabase.from("mobs").select("name").eq("id", mobId).single()
        mobName = data?.name || "mob"
      }

      if (hardDelete) {
        // Hard delete: Remove all associated data
        // Delete tasks that reference this mob
        const { error: tasksError } = await supabase.from("tasks").delete().eq("related_mob_id", mobId)
        if (tasksError) throw tasksError

        // Delete animals associated with this mob
        const { error: animalsError } = await supabase.from("animals").delete().eq("mob_id", mobId)
        if (animalsError) throw animalsError

        // Delete mob events
        const { error: eventsError } = await supabase.from("mob_events").delete().eq("mob_id", mobId)
        if (eventsError) throw eventsError

        // Delete grazing events
        const { error: grazingError } = await supabase.from("grazing_events").delete().eq("mob_id", mobId)
        if (grazingError) throw grazingError

        // Finally delete the mob itself
        const { error: mobError } = await supabase.from("mobs").delete().eq("id", mobId)
        if (mobError) throw mobError

        toast.success(`Mob "${mobName}" was permanently removed.`)
        
        // Call callback to handle navigation/UI updates
        if (onMobDeleted) {
          onMobDeleted(mobName)
        }
      } else {
        // Soft delete: Archive mob but keep all data
        const { error } = await supabase.from("mobs").update({ status: "archived" }).eq("id", mobId)
        if (error) throw error

        toast.success("Mob archived successfully. All sales and purchase data has been preserved.")
      }

      await fetchMobs()
      await fetchGrazingEvents()
      setSelectedMob(null)
      setShowAddMobModal(false)
    } catch (error) {
      console.error("Error deleting mob:", error)
      toast.error("Failed to delete mob")
    }
  }

  const handleAddLambs = async (quantity: number, notes: string) => {
    if (!selectedMob) return

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        toast.error("You must be logged in")
        return
      }

      const { error: eventError } = await supabase.from("mob_events").insert({
        user_id: user.id,
        mob_id: selectedMob.id,
        event_type: "birth",
        quantity: quantity,
        event_date: new Date().toISOString(),
        notes: notes || null,
      })

      if (eventError) {
        console.error("Error creating birth event:", eventError)
        toast.error("Failed to create birth event")
        return
      }

      const newSize = selectedMob.size + quantity
      const { error: updateError } = await supabase.from("mobs").update({ size: newSize }).eq("id", selectedMob.id)

      if (updateError) {
        console.error("Error updating mob size:", updateError)
        toast.error("Failed to update mob size")
        return
      }

      setMobs((prev) =>
        prev.map((m) =>
          m.id === selectedMob.id
            ? {
                ...m,
                size: newSize,
              }
            : m,
        ),
      )

      setSelectedMob((prev) => (prev ? { ...prev, size: newSize } : null))
      setShowAddLambsModal(false)
      toast.success(`Successfully added ${quantity} lambs`)
    } catch (error) {
      console.error("Error adding lambs:", error)
      toast.error("Failed to add lambs")
    }
  }

  const handleMarkSold = async (quantity: number, pricePerHead: number | null, buyerName: string, notes: string) => {
    if (!selectedMob) return

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        toast.error("You must be logged in")
        return
      }

      if (quantity > selectedMob.size) {
        toast.error(`Cannot sell ${quantity} head. Only ${selectedMob.size} available.`)
        return
      }

      const totalPrice = pricePerHead ? pricePerHead * quantity : null
      const newSize = selectedMob.size - quantity

      const { error: eventError } = await supabase.from("mob_events").insert({
        user_id: user.id,
        mob_id: selectedMob.id,
        event_type: "sale",
        quantity: quantity,
        event_date: new Date().toISOString(),
        price_per_head: pricePerHead,
        total_price: totalPrice,
        buyer_name: buyerName || null,
        notes: notes || null,
      })

      if (eventError) {
        console.error("Error creating sale event:", eventError)
        toast.error("Failed to create sale event")
        return
      }

      const { error: updateError } = await supabase.from("mobs").update({ size: newSize }).eq("id", selectedMob.id)

      if (updateError) {
        console.error("Error updating mob size:", updateError)
        toast.error("Failed to update mob size")
        return
      }

      setMobs((prev) =>
        prev.map((m) =>
          m.id === selectedMob.id
            ? {
                ...m,
                size: newSize,
              }
            : m,
        ),
      )

      setSelectedMob((prev) => (prev ? { ...prev, size: newSize } : null))
      setShowMarkSoldModal(false)
      toast.success(`Successfully marked ${quantity} as sold`)
    } catch (error) {
      console.error("Error marking as sold:", error)
      toast.error("Failed to mark as sold")
    }
  }

  const handleRegisterLoss = async (quantity: number, lossReason: string, notes: string) => {
    if (!selectedMob) return

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        toast.error("You must be logged in")
        return
      }

      const { error: eventError } = await supabase.from("mob_events").insert({
        user_id: user.id,
        mob_id: selectedMob.id,
        event_type: "death",
        quantity: quantity,
        event_date: new Date().toISOString(),
        loss_reason: lossReason || null,
        notes: notes || null,
      })

      if (eventError) {
        console.error("Error creating death event:", eventError)
        toast.error("Failed to create death event")
        return
      }

      const newSize = selectedMob.size - quantity
      const { error: updateError } = await supabase.from("mobs").update({ size: newSize }).eq("id", selectedMob.id)

      if (updateError) {
        console.error("Error updating mob size:", updateError)
        toast.error("Failed to update mob size")
        return
      }

      setMobs((prev) =>
        prev.map((m) =>
          m.id === selectedMob.id
            ? {
                ...m,
                size: newSize,
              }
            : m,
        ),
      )

      setSelectedMob((prev) => (prev ? { ...prev, size: newSize } : null))
      setShowRegisterLossModal(false)
      toast.success(`Successfully registered ${quantity} losses`)
    } catch (error) {
      console.error("Error registering loss:", error)
      toast.error("Failed to register loss")
    }
  }

  const handleSaveLambs = async (lambs: Array<{ tagNumber: string; liveWeight: string; notes: string }>) => {
    if (!selectedMob) return

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error("You must be logged in")
        return
      }

      // Insert individual animals
      const animalsToInsert = lambs.map((lamb) => ({
        mob_id: selectedMob.id,
        user_id: user.id,
        tag_number: lamb.tagNumber || null,
        live_weight: lamb.liveWeight ? Number.parseFloat(lamb.liveWeight) : null,
        notes: lamb.notes || null,
        birth_date: new Date().toISOString(),
      }))

      const { error: animalsError } = await supabase.from("animals").insert(animalsToInsert)

      if (animalsError) throw animalsError

      // Update mob size
      const { error: mobError } = await supabase
        .from("mobs")
        .update({ size: selectedMob.size + lambs.length })
        .eq("id", selectedMob.id)

      if (mobError) throw mobError

      // Create mob event
      const { error: eventError } = await supabase.from("mob_events").insert({
        mob_id: selectedMob.id,
        user_id: user.id,
        event_type: "birth",
        quantity: lambs.length,
        notes: `Added ${lambs.length} lambs with individual tracking`,
      })

      if (eventError) throw eventError

      toast.success(`Successfully added ${lambs.length} lambs`)
      setShowLambingWorksheet(false)
      setSelectedMob(null)
      await fetchMobs()
    } catch (error) {
      console.error("Error adding lambs:", error)
      toast.error("Failed to add lambs")
    }
  }

  const handleAddSheep = async (data: {
    quantity: number
    age: string
    avgWeight: string
    condition: string
    pricePerHead: string
    notes: string
  }) => {
    if (!selectedMob) return

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error("You must be logged in")
        return
      }

      // Update mob size
      const { error: mobError } = await supabase
        .from("mobs")
        .update({ size: selectedMob.size + data.quantity })
        .eq("id", selectedMob.id)

      if (mobError) throw mobError

      // Create mob event with purchase details
      const totalPrice = data.pricePerHead ? Number.parseFloat(data.pricePerHead) * data.quantity : null
      const eventNotes = [
        data.notes,
        data.age && `Age: ${data.age}`,
        data.avgWeight && `Avg Weight: ${data.avgWeight}kg`,
        data.condition && `Condition: ${data.condition}`,
      ]
        .filter(Boolean)
        .join(" | ")

      const { error: eventError } = await supabase.from("mob_events").insert({
        mob_id: selectedMob.id,
        user_id: user.id,
        event_type: "purchase",
        quantity: data.quantity,
        price_per_head: data.pricePerHead ? Number.parseFloat(data.pricePerHead) : null,
        total_price: totalPrice,
        notes: eventNotes,
      })

      if (eventError) throw eventError

      const purchaseDate = new Date().toISOString()
      const ageAtPurchase = data.age ? Number.parseFloat(data.age) : null
      const animalRecords = Array.from({ length: data.quantity }, (_, index) => ({
        mob_id: selectedMob.id,
        user_id: user.id,
        tag_number: null,
        birth_date: null,
        purchase_date: purchaseDate,
        age_at_purchase: ageAtPurchase,
        live_weight: data.avgWeight ? Number.parseFloat(data.avgWeight) : null,
        notes: data.notes || null,
        status: "active",
      }))

      const { error: animalsError } = await supabase.from("animals").insert(animalRecords)

      if (animalsError) {
        console.error("Error creating animal records:", animalsError)
        toast.warning(`Added ${data.quantity} sheep, but individual tracking may be incomplete`)
      } else {
        toast.success(`Successfully added ${data.quantity} sheep with individual tracking`)
      }

      setShowAddSheepModal(false)
      setSelectedMob(null)
      await fetchMobs()
    } catch (error) {
      console.error("Error adding sheep:", error)
      toast.error("Failed to add sheep")
    }
  }

  const handleSaveMob = async (
    mobData: {
      name: string
      livestock_type: string
      size: number
      notes: string
      paddock_id: string | null
      age?: string
      avgWeight?: string
      condition?: string
      pricePerHead?: string
    },
    editingMob: Mob | null
  ) => {
    if (!userId) return

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error("You must be logged in")
        return
      }

      if (editingMob) {
        // Update existing mob
        const success = await updateMob(editingMob.id, {
          name: mobData.name,
          livestock_type: mobData.livestock_type,
          size: mobData.size,
          notes: mobData.notes || null,
          current_paddock_id: mobData.paddock_id,
        })

        if (!success) {
          toast.error("Failed to update mob")
          return
        }

        // Handle paddock change
        if (mobData.paddock_id !== editingMob.current_paddock_id) {
          const moveSuccess = await moveMob(editingMob.id, editingMob.current_paddock_id, mobData.paddock_id)
          if (moveSuccess) {
            await fetchGrazingEvents()
          }
        }

        toast.success("Mob updated successfully")
      } else {
        // Create new mob
        const newMob = await createMob({
          name: mobData.name,
          livestock_type: mobData.livestock_type,
          size: mobData.size,
          notes: mobData.notes || null,
          paddock_id: mobData.paddock_id,
        })

        if (!newMob) {
          toast.error("Failed to create mob")
          return
        }

        // If purchase details are provided, create mob_event and animal records
        const hasPurchaseDetails = mobData.age || mobData.avgWeight || mobData.condition || mobData.pricePerHead

        if (hasPurchaseDetails) {
          // Create mob event with purchase details
          const totalPrice = mobData.pricePerHead ? Number.parseFloat(mobData.pricePerHead) * mobData.size : null
          const eventNotes = [
            mobData.notes,
            mobData.age && `Age: ${mobData.age}`,
            mobData.avgWeight && `Avg Weight: ${mobData.avgWeight}kg`,
            mobData.condition && `Condition: ${mobData.condition}`,
          ]
            .filter(Boolean)
            .join(" | ")

          const { error: eventError } = await supabase.from("mob_events").insert({
            mob_id: newMob.id,
            user_id: user.id,
            event_type: "purchase",
            quantity: mobData.size,
            price_per_head: mobData.pricePerHead ? Number.parseFloat(mobData.pricePerHead) : null,
            total_price: totalPrice,
            notes: eventNotes || null,
            event_date: new Date().toISOString(),
          })

          if (eventError) {
            console.error("Error creating purchase event:", eventError)
            // Don't fail the whole operation, just log the error
          }

          // Create animal records
          const purchaseDate = new Date().toISOString()
          const ageAtPurchase = mobData.age ? Number.parseFloat(mobData.age) : null
          const animalRecords = Array.from({ length: mobData.size }, (_, index) => ({
            mob_id: newMob.id,
            user_id: user.id,
            tag_number: null,
            birth_date: null,
            purchase_date: purchaseDate,
            age_at_purchase: ageAtPurchase,
            live_weight: mobData.avgWeight ? Number.parseFloat(mobData.avgWeight) : null,
            notes: mobData.notes || null,
            status: "active",
          }))

          const { error: animalsError } = await supabase.from("animals").insert(animalRecords)

          if (animalsError) {
            console.error("Error creating animal records:", animalsError)
            // Don't fail the whole operation, just log the error
          }
        }

        toast.success("Mob created successfully")
        await fetchGrazingEvents()
      }

      await fetchMobs()
      setShowAddMobModal(false)
      setEditingMob(null)
    } catch (error) {
      console.error("Error saving mob:", error)
      toast.error("An error occurred while saving the mob")
    }
  }

  const handleMovePaddock = async (newPaddockId: string) => {
    if (!selectedMob) return

    try {
      const oldPaddockId = selectedMob.current_paddock_id
      
      // Calculate days in previous paddock before moving
      let daysInPaddock = 0
      if (oldPaddockId) {
        const currentEvent = grazingEvents.find(
          (e) => e.mob_id === selectedMob.id && e.paddock_id === oldPaddockId && e.moved_out_at === null
        )
        if (currentEvent) {
          const movedInDate = new Date(currentEvent.moved_in_at)
          const now = new Date()
          const diffTime = Math.abs(now.getTime() - movedInDate.getTime())
          daysInPaddock = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        }
      }

      const success = await moveMob(selectedMob.id, oldPaddockId, newPaddockId)
      if (success) {
        // Update mob's current_paddock_id
        const { error } = await supabase
          .from("mobs")
          .update({ current_paddock_id: newPaddockId })
          .eq("id", selectedMob.id)

        if (error) throw error

        setMobs((prev) =>
          prev.map((m) =>
            m.id === selectedMob.id
              ? {
                  ...m,
                  current_paddock_id: newPaddockId,
                }
              : m,
          ),
        )

        setSelectedMob((prev) => (prev ? { ...prev, current_paddock_id: newPaddockId } : null))
        await fetchGrazingEvents()
        await fetchMobs()
        
        // Get paddock names for confirmation modal
        const oldPaddockName = getPaddockName
          ? getPaddockName(oldPaddockId, paddocks)
          : paddocks.find((p) => p.id === oldPaddockId)?.name || "Unknown Paddock"
        const newPaddockName = getPaddockName
          ? getPaddockName(newPaddockId, paddocks)
          : paddocks.find((p) => p.id === newPaddockId)?.name || "Unknown Paddock"
        
        // Show confirmation modal
        if (onMobMoved && oldPaddockId) {
          onMobMoved({
            mobName: selectedMob.name,
            oldPaddockName,
            newPaddockName,
            daysInPaddock,
          })
        }
      } else {
        toast.error("Failed to move mob")
      }
    } catch (error) {
      console.error("Error moving mob:", error)
      toast.error("Failed to move mob")
    }
  }

  const handleMobClick = (mob: Mob) => {
    setSelectedMob(mob)
  }

  const handleTrackTreatment = (mob: Mob) => {
    // TODO: Implement treatment tracking
    toast.info(`Treatment tracking for ${mob.name} - Coming soon`)
  }

  const handleLogObservation = (mob: Mob) => {
    // TODO: Implement observation logging
    toast.info(`Observation logging for ${mob.name} - Coming soon`)
  }

  return {
    handleDeleteMob,
    handleAddLambs,
    handleMarkSold,
    handleRegisterLoss,
    handleSaveLambs,
    handleAddSheep,
    handleSaveMob,
    handleMovePaddock,
    handleMobClick,
    handleTrackTreatment,
    handleLogObservation,
  }
}

