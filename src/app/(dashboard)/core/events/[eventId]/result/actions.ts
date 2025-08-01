"use server"

import { createClient } from "../../../../../../../utils/supabase/server"

export async function getEventResults(eventId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: "User not authenticated" }
  }

  // Check if user is core team member
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError || !profile || profile.role !== "core") {
    return { success: false, error: "Access denied. Core team members only." }
  }

  // Get event details
  const { data: event, error: eventError } = await supabase.from("events").select("*").eq("id", eventId).single()

  if (eventError || !event) {
    return { success: false, error: "Event not found" }
  }

  // Get event rounds
  const { data: rounds, error: roundsError } = await supabase
    .from("event_rounds")
    .select("*")
    .eq("event_id", eventId)
    .order("round_number", { ascending: true })

  if (roundsError) {
    return { success: false, error: "Failed to fetch event rounds" }
  }

  // Get all registrations
  const { data: registrations, error: regError } = await supabase
    .from("event_registrations")
    .select(`
      id,
      registration_type,
      status,
      user_id,
      team_id,
      teams(
        id,
        name,
        leader_id,
        team_members(
          member_id,
          profiles(full_name, email)
        )
      ),
      profiles(full_name, email)
    `)
    .eq("event_id", eventId)

  if (regError) {
    return { success: false, error: "Failed to fetch registrations" }
  }

  // Get event winners
  const { data: winners, error: winnersError } = await supabase
    .from("event_winners")
    .select(`
      id,
      position,
      team_id,
      user_id,
      teams(
        name,
        team_members(
          profiles(full_name)
        )
      ),
      profiles(full_name)
    `)
    .eq("event_id", eventId)
    .order("position", { ascending: true })

  if (winnersError) {
    return { success: false, error: "Failed to fetch winners" }
  }

  // Get event progress for additional insights
  const { data: progress, error: progressError } = await supabase
    .from("event_progress")
    .select("*")
    .eq("event_id", eventId)

  return {
    success: true,
    data: {
      event,
      rounds: rounds || [],
      registrations: registrations || [],
      winners: winners || [],
      progress: progress || [],
    },
  }
}
