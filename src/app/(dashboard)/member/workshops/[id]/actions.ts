"use server"

import { createClient } from "../../../../../../utils/supabase/server"

export async function getWorkshopDetails(workshopId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Unauthorized" }

  try {
    // Get workshop
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", workshopId)
      .eq("mode", "workshop")
      .single()

    if (eventError || !event) {
      return { success: false, error: "Workshop not found" }
    }

    // Get hosts
    const { data: hosts } = await supabase
      .from("workshop_hosts")
      .select("*")
      .eq("event_id", workshopId)

    // Check if user is registered
    const { data: registration } = await supabase
      .from("event_participants")
      .select("*")
      .eq("event_id", workshopId)
      .eq("user_id", user.id)
      .maybeSingle()

    // Get registration count
    const { count: registrationCount } = await supabase
      .from("event_participants")
      .select("*", { count: "exact", head: true })
      .eq("event_id", workshopId)

    const isRegistered = !!registration
    const isFull = (registrationCount || 0) >= event.max_participants
    const isPastDeadline = new Date(event.registration_deadline) < new Date()
    const canRegister = !isRegistered && !isFull && !isPastDeadline && event.status !== "completed"
    const canCancelRegistration = isRegistered && !isPastDeadline && event.status !== "completed"

    return {
      success: true,
      data: {
        event,
        hosts: hosts || [],
        isRegistered,
        registration,
        registrationCount: registrationCount || 0,
        canRegister,
        canCancelRegistration
      }
    }

  } catch (error: any) {
    console.error('Get workshop details error:', error)
    return { success: false, error: "Failed to fetch workshop details" }
  }
}

export async function registerForWorkshop(workshopId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Unauthorized" }

  try {
    // Get workshop
    const { data: event } = await supabase
      .from("events")
      .select("max_participants, registration_deadline, status")
      .eq("id", workshopId)
      .single()

    if (!event) {
      return { success: false, error: "Workshop not found" }
    }

    // Check if already registered
    const { data: existing } = await supabase
      .from("event_participants")
      .select("id")
      .eq("event_id", workshopId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (existing) {
      return { success: false, error: "Already registered" }
    }

    // Check capacity
    const { count } = await supabase
      .from("event_participants")
      .select("*", { count: "exact", head: true })
      .eq("event_id", workshopId)

    if ((count || 0) >= event.max_participants) {
      return { success: false, error: "Workshop is full" }
    }

    // Check deadline
    if (new Date(event.registration_deadline) < new Date()) {
      return { success: false, error: "Registration deadline has passed" }
    }

    // Check status
    if (event.status === "completed") {
      return { success: false, error: "Workshop has already been completed" }
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    // Register
    const { error } = await supabase
      .from("event_participants")
      .insert({
        event_id: workshopId,
        user_id: user.id,
        email: profile?.email || '',
        name: profile?.full_name || '',
        status: "registered",
        registered_at: new Date().toISOString()
      })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, message: "Registration successful!" }

  } catch (error: any) {
    console.error('Register for workshop error:', error)
    return { success: false, error: "Failed to register for workshop" }
  }
}

export async function cancelRegistration(workshopId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Unauthorized" }

  try {
    // Get workshop
    const { data: event } = await supabase
      .from("events")
      .select("registration_deadline, status")
      .eq("id", workshopId)
      .single()

    if (!event) {
      return { success: false, error: "Workshop not found" }
    }

    // Check deadline
    if (new Date(event.registration_deadline) < new Date()) {
      return { success: false, error: "Cannot cancel after registration deadline" }
    }

    // Check status
    if (event.status === "completed") {
      return { success: false, error: "Cannot cancel completed workshop" }
    }

    // Delete registration
    const { error } = await supabase
      .from("event_participants")
      .delete()
      .eq("event_id", workshopId)
      .eq("user_id", user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, message: "Registration cancelled" }

  } catch (error: any) {
    console.error('Cancel registration error:', error)
    return { success: false, error: "Failed to cancel registration" }
  }
}