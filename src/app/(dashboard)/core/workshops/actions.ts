"use server"

import { createClient } from "../../../../../utils/supabase/server"
import { revalidatePath } from "next/cache"

export async function getWorkshops() {
  const supabase = await createClient()
  
  // Check authentication
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { success: false, error: "Not authenticated" }
  }

  // Check if user is core team member
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'core') {
    return { success: false, error: "Unauthorized: Core team access required" }
  }

  try {
    // Get workshops with registration counts
    const { data: workshops, error: workshopsError } = await supabase
      .from('events')
      .select(`
        *,
        workshop_hosts(count),
        event_participants(count)
      `)
      .eq('mode', 'workshop')
      .order('created_at', { ascending: false })

    if (workshopsError) {
      console.error('Workshops fetch error:', workshopsError)
      return { success: false, error: "Failed to fetch workshops" }
    }

    // Process the data to include counts
    const processedWorkshops = workshops.map(workshop => ({
      ...workshop,
      registration_count: workshop.event_participants?.[0]?.count || 0,
      hosts_count: workshop.workshop_hosts?.[0]?.count || 0
    }))

    return {
      success: true,
      data: {
        workshops: processedWorkshops
      }
    }

  } catch (error) {
    console.error('Get workshops error:', error)
    return {
      success: false,
      error: "Failed to fetch workshops"
    }
  }
}

export async function deleteWorkshop(workshopId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Unauthorized" }

  // Check if user is core team member with delete permissions
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, member_role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'core') {
    return { success: false, error: "Unauthorized: Core team access required" }
  }

  // Only President can delete workshops (as per specification)
  if (profile.member_role !== 'president') {
    return { success: false, error: "Only President can delete workshops" }
  }

  try {
    // Get workshop to check if it can be deleted
    const { data: workshop } = await supabase
      .from("events")
      .select("status, title")
      .eq("id", workshopId)
      .eq("mode", "workshop")
      .single()

    if (!workshop) {
      return { success: false, error: "Workshop not found" }
    }

    // Check if workshop has started (additional safety check)
    if (workshop.status === "completed") {
      return { success: false, error: "Cannot delete completed workshop" }
    }

    // Delete related data first (foreign key constraints)
    await supabase.from("workshop_hosts").delete().eq("event_id", workshopId)
    await supabase.from("event_participants").delete().eq("event_id", workshopId)
    await supabase.from("event_audit_logs").delete().eq("event_id", workshopId)

    // Delete the workshop
    const { error: deleteError } = await supabase
      .from("events")
      .delete()
      .eq("id", workshopId)

    if (deleteError) {
      return { success: false, error: deleteError.message }
    }

    revalidatePath("/core/workshops")

    return { success: true, message: "Workshop deleted successfully" }

  } catch (error: any) {
    console.error('Delete workshop error:', error)
    return { success: false, error: "Failed to delete workshop" }
  }
}