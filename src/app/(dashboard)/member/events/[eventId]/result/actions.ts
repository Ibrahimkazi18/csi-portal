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

  // Get event details
  const { data: event, error: eventError } = await supabase.from("events").select("*").eq("id", eventId).single()

  if (eventError || !event) {
    return { success: false, error: "Event not found" }
  }

  // Check if user participated in this event
  const { data: participation, error: participationError } = await supabase
    .from("event_registrations")
    .select(`
      id,
      registration_type,
      user_id,
      team_id,
      teams(
        team_members(member_id)
      )
    `)
    .eq("event_id", eventId)

  if (participationError) {
    return { success: false, error: "Failed to check participation" }
  }

  // Check if current user participated
  const userParticipated = participation?.some((reg: any) => {
    if (reg.registration_type === "individual") {
      return reg.user_id === user.id
    } else if (reg.registration_type === "team" && reg.teams) {
      return reg.teams.team_members?.some((member: any) => member.member_id === user.id)
    }
    return false
  })

  if (!userParticipated) {
    return { success: false, error: "You did not participate in this event" }
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

  return {
    success: true,
    data: {
      event,
      rounds: rounds || [],
      registrations: registrations || [],
      winners: winners || [],
    },
  }
}