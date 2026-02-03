"use server"

import { createClient } from "../../../../../utils/supabase/server"

export async function getAvailableWorkshops() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Unauthorized" }

  try {
    // Get available workshops (upcoming and registration open)
    const { data: workshops, error } = await supabase
      .from('events')
      .select(`
        *,
        event_participants(user_id)
      `)
      .eq('mode', 'workshop')
      .in('status', ['upcoming', 'registration_open'])
      .gte('registration_deadline', new Date().toISOString())
      .order('start_date', { ascending: true })

    if (error) {
      console.error('Get available workshops error:', error)
      return { success: false, error: "Failed to fetch workshops" }
    }

    // Get registration counts separately
    const workshopIds = workshops.map(w => w.id)
    const { data: registrationCounts } = await supabase
      .from('event_participants')
      .select('event_id', { count: 'exact' })
      .in('event_id', workshopIds)

    // Process workshops to include registration info
    const processedWorkshops = await Promise.all(workshops.map(async (workshop) => {
      // Get registration count for this workshop
      const { count } = await supabase
        .from('event_participants')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', workshop.id)

      const isRegistered = workshop.event_participants.some((p: any) => p.user_id === user.id)
      
      return {
        ...workshop,
        registration_count: count || 0,
        is_registered: isRegistered
      }
    }))

    return {
      success: true,
      data: {
        workshops: processedWorkshops
      }
    }

  } catch (error: any) {
    console.error('Get available workshops error:', error)
    return { success: false, error: "Failed to fetch workshops" }
  }
}

export async function getMyWorkshops() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Unauthorized" }

  try {
    // Get workshops the user is registered for
    const { data: registrations, error } = await supabase
      .from('event_participants')
      .select(`
        id,
        attended,
        registered_at,
        events!inner(
          id,
          title,
          description,
          banner_url,
          start_date,
          end_date,
          status,
          category
        )
      `)
      .eq('user_id', user.id)
      .eq('events.mode', 'workshop')
      .order('registered_at', { ascending: false })

    if (error) {
      console.error('Get my workshops error:', error)
      return { success: false, error: "Failed to fetch your workshops" }
    }

    // Process the data
    const workshops = registrations.map(reg => ({
      ...reg.events,
      attended: reg.attended,
      registered_at: reg.registered_at
    }))

    return {
      success: true,
      data: {
        workshops
      }
    }

  } catch (error: any) {
    console.error('Get my workshops error:', error)
    return { success: false, error: "Failed to fetch your workshops" }
  }
}

export async function registerForWorkshop(workshopId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Unauthorized" }

  try {
    // Get workshop details
    const { data: workshop, error: workshopError } = await supabase
      .from('events')
      .select('max_participants, registration_deadline, status, title')
      .eq('id', workshopId)
      .eq('mode', 'workshop')
      .single()

    if (workshopError || !workshop) {
      return { success: false, error: "Workshop not found" }
    }

    // Check if already registered
    const { data: existing } = await supabase
      .from('event_participants')
      .select('id')
      .eq('event_id', workshopId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      return { success: false, error: "Already registered for this workshop" }
    }

    // Check capacity
    const { count } = await supabase
      .from('event_participants')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', workshopId)

    if ((count || 0) >= workshop.max_participants) {
      return { success: false, error: "Workshop is full" }
    }

    // Check deadline
    if (new Date(workshop.registration_deadline) < new Date()) {
      return { success: false, error: "Registration deadline has passed" }
    }

    // Check status
    if (workshop.status === "completed") {
      return { success: false, error: "Workshop has already been completed" }
    }

    // Get user profile for name and email
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    // Register user
    const { error: registerError } = await supabase
      .from('event_participants')
      .insert({
        event_id: workshopId,
        user_id: user.id,
        status: 'registered'
      })

    if (registerError) {
      console.error('Registration error:', registerError)
      return { success: false, error: "Failed to register for workshop" }
    }

    return { success: true, message: "Registration successful!" }

  } catch (error: any) {
    console.error('Register for workshop error:', error)
    return { success: false, error: "Failed to register for workshop" }
  }
}