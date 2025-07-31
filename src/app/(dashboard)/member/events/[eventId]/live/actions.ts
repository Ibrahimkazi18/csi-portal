"use server"

import { createClient } from "../../../../../../../utils/supabase/server"

/**
 * Get live event data for members (read-only view)
 * Shows current progress, rounds, and their team's status
 */
export async function getMemberLiveEventData(eventId: string) {
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

  // Get event rounds
  const { data: rounds, error: roundsError } = await supabase
    .from("event_rounds")
    .select("*")
    .eq("event_id", eventId)
    .order("round_number", { ascending: true })

  if (roundsError) {
    return { success: false, error: "Failed to fetch rounds" }
  }

  // Get current event progress (all participants)
  const { data: progress, error: progressError } = await supabase
    .from("event_progress")
    .select(`
      id,
      team_id,
      user_id,
      round_id,
      moved_at,
      eliminated,
      eliminated_at,
      teams(id, name, leader_id),
      profiles(full_name, email),
      event_rounds(id, title, round_number)
    `)
    .eq("event_id", eventId)
    .order("moved_at", { ascending: false })

  if (progressError) {
    return { success: false, error: "Failed to fetch progress" }
  }

  // Get user's team/registration info
  const { data: userRegistration, error: regError } = await supabase
    .from("event_registrations")
    .select(`
      id,
      registration_type,
      team_id,
      user_id,
      teams(
        id,
        name,
        leader_id,
        team_members(
          member_id,
          profiles(full_name, email)
        )
      )
    `)
    .eq("event_id", eventId)
    .or(`user_id.eq.${user.id},teams.team_members.member_id.eq.${user.id}`)
    .single()

  // Get event winners if event is completed
  let winners = null
  if (event.status === "completed") {
    const { data: winnersData, error: winnersError } = await supabase
      .from("event_winners")
      .select(`
        id,
        position,
        team_id,
        user_id,
        teams(name, team_members(profiles(full_name))),
        profiles(full_name, email)
      `)
      .eq("event_id", eventId)
      .order("position", { ascending: true })

    if (!winnersError) winners = winnersData
  }

  // Get tournament points if applicable
  let tournamentPoints = null
  if (event.is_tournament && event.status === "completed") {
    const { data: pointsData, error: pointsError } = await supabase
      .from("tournament_points")
      .select(`
        id,
        points,
        reason,
        team_id,
        user_id,
        teams(name),
        profiles(full_name)
      `)
      .eq("event_id", eventId)
      .order("points", { ascending: false })

    if (!pointsError) tournamentPoints = pointsData
  }

  return {
    success: true,
    data: {
      event,
      rounds: rounds || [],
      progress: progress || [],
      userRegistration: regError ? null : userRegistration,
      winners: winners || [],
      tournamentPoints: tournamentPoints || [],
    },
  }
}

/**
 * Get user's current status in the event
 * Returns their current round, elimination status, etc.
 */
export async function getUserEventStatus(eventId: string) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: "User not authenticated" }
  }

  // Get user's registration
  const { data: registration, error: regError } = await supabase
    .from("event_registrations")
    .select(`
      id,
      registration_type,
      team_id,
      user_id,
      teams(id, name)
    `)
    .eq("event_id", eventId)
    .or(`user_id.eq.${user.id},teams.team_members.member_id.eq.${user.id}`)
    .single()

  if (regError || !registration) {
    return { success: false, error: "Not registered for this event" }
  }

  // Get current progress
  const { data: progress, error: progressError } = await supabase
    .from("event_progress")
    .select(`
      id,
      round_id,
      moved_at,
      eliminated,
      eliminated_at,
      event_rounds(id, title, round_number)
    `)
    .eq("event_id", eventId)
    .eq(
      registration.registration_type === "team" ? "team_id" : "user_id",
      registration.registration_type === "team" ? registration.team_id : registration.user_id,
    )
    .order("moved_at", { ascending: false })
    .limit(1)
    .single()

  return {
    success: true,
    data: {
      registration,
      currentProgress: progressError ? null : progress,
    },
  }
}

/**
 * Get event results and rankings
 * Shows final standings, points, and achievements
 */
export async function getEventResults(eventId: string) {
  const supabase = await createClient()

  // Get event details
  const { data: event, error: eventError } = await supabase.from("events").select("*").eq("id", eventId).single()

  if (eventError || !event) {
    return { success: false, error: "Event not found" }
  }

  // Get winners
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
          profiles(full_name, email)
        )
      ),
      profiles(full_name, email)
    `)
    .eq("event_id", eventId)
    .order("position", { ascending: true })

  // Get tournament points if applicable
  let tournamentPoints = null
  if (event.is_tournament) {
    const { data: pointsData, error: pointsError } = await supabase
      .from("tournament_points")
      .select(`
        id,
        points,
        reason,
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
      .order("points", { ascending: false })

    if (!pointsError) tournamentPoints = pointsData
  }

  // Get all participants for participation list
  const { data: participants, error: participantsError } = await supabase
    .from("event_registrations")
    .select(`
      id,
      registration_type,
      team_id,
      user_id,
      teams(
        name,
        team_members(
          profiles(full_name, email)
        )
      ),
      profiles(full_name, email)
    `)
    .eq("event_id", eventId)
    .eq("status", "registered")

  return {
    success: true,
    data: {
      event,
      winners: winnersError ? [] : winners,
      tournamentPoints: tournamentPoints || [],
      participants: participantsError ? [] : participants,
    },
  }
}
