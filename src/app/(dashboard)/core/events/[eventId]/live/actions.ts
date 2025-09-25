"use server"

import { createClient } from "../../../../../../../utils/supabase/server"


function generateSecret(len = 32) {
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let out = ""
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)]
  return out
}

/**
 * Used to display the live event management board
 */
export async function getLiveEventData(eventId: string) {
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

  // Get all registered teams
  const { data: registrations, error: regError } = await supabase
    .from("event_registrations")
    .select(`
      id,
      team_id,
      user_id,
      registration_type,
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
    .eq("status", "registered")

  if (regError) {
    return { success: false, error: "Failed to fetch registrations" }
  }

  // Get current event progress
  const { data: progress, error: progressError } = await supabase
    .from("event_progress")
    .select(`
      id,
      team_id,
      user_id,
      round_id,
      moved_at,
      eliminated,
      position,
      teams(id, name),
      profiles(full_name, email),
      event_rounds(id, title, round_number)
    `)
    .eq("event_id", eventId)

  if (progressError) {
    return { success: false, error: "Failed to fetch progress" }
  }

  // Get event winners if event is completed
  const { data: winners, error: winnersError } = await supabase
    .from("event_winners")
    .select(`
      id,
      position,
      team_id,
      user_id,
      teams(name),
      profiles(full_name, email)
    `)
    .eq("event_id", eventId)
    .order("position", { ascending: true })

  return {
    success: true,
    data: {
      event,
      rounds: rounds || [],
      registrations: registrations || [],
      progress: progress || [],
      winners: winners || [],
    },
  }
}

/**
 * Move a team/participant to the next round
 * Creates new progress entry and removes old one
 */
export async function moveToNextRound({
  eventId,
  teamId,
  userId,
  fromRoundId,
  toRoundId,
}: {
  eventId: string
  teamId?: string
  userId?: string
  fromRoundId: string | null
  toRoundId: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: "User not authenticated" }
  }

  // Validate that the target round exists
  const { data: targetRound, error: roundError } = await supabase
    .from("event_rounds")
    .select("id, round_number")
    .eq("id", toRoundId)
    .eq("event_id", eventId)
    .single()

  if (roundError || !targetRound) {
    return { success: false, error: "Invalid target round" }
  }

  // Remove existing progress entry if moving from a round
  if (fromRoundId) {
    await supabase
      .from("event_progress")
      .delete()
      .match({
        event_id: eventId,
        round_id: fromRoundId,
        ...(teamId ? { team_id: teamId } : { user_id: userId }),
      })
  }

  // Insert new progress entry
  const { error: insertError } = await supabase.from("event_progress").insert({
    event_id: eventId,
    round_id: toRoundId,
    team_id: teamId || null,
    user_id: userId || null,
    moved_at: new Date().toISOString(),
    eliminated: false,
  })

  if (insertError) {
    return { success: false, error: insertError.message }
  }

  return { success: true, message: "Moved to next round successfully" }
}

/**
 * Eliminate a team/participant from the event
 * Marks them as eliminated in their current round
 */
export async function eliminateParticipant({
  eventId,
  teamId,
  userId,
  roundId,
}: {
  eventId: string
  teamId?: string
  userId?: string
  roundId: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: "User not authenticated" }
  }

  // Update progress to mark as eliminated
  const { error } = await supabase
    .from("event_progress")
    .update({
      eliminated: true,
      eliminated_at: new Date().toISOString(),
    })
    .match({
      event_id: eventId,
      round_id: roundId,
      ...(teamId ? { team_id: teamId } : { user_id: userId }),
    })

  if (error) {
    return { success: false, error: error.message }
  }

  // Fetch event to see if it's a tournament
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("is_tournament, tournament_id")
    .eq("id", eventId)
    .single()

  if (eventError || !event.is_tournament || !teamId) {
    return { success: true, message: "Participant eliminated successfully" }
  }

  // Deduct 50 points from tournament_points
  const { data: existingPoints, error: pointsFetchError } = await supabase
    .from("tournament_points")
    .select("id, points, losses")
    .eq("team_id", teamId)
    .eq("tournament_id", event.tournament_id)
    .maybeSingle()

  if (pointsFetchError) {
    console.error("Failed to fetch tournament points for deduction", pointsFetchError)
    return { success: true, message: "Participant eliminated, but point deduction failed" }
  }

  if (existingPoints) {
    await supabase
      .from("tournament_points")
      .update({
        points: existingPoints.points - 50,
        losses: (existingPoints.losses || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingPoints.id)
  } else {
    await supabase
      .from("tournament_points")
      .insert({
        tournament_id: event.tournament_id,
        team_id: teamId,
        points: -50,
        matches_played: 1,
        losses: 1,
        wins: 0,
        updated_at: new Date().toISOString(),
      })
  }

  return { success: true, message: "Participant eliminated and points deducted" }
}

export async function setEventWinners({
  eventId,
  winners,
}: {
  eventId: string
  winners: Array<{
    position: number
    teamId?: string
    userId?: string
  }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: "User not authenticated" }
  }

  // Clear existing winners
  await supabase.from("event_winners").delete().eq("event_id", eventId)

  // Insert new winners
  const winnerEntries = winners.map((winner) => ({
    event_id: eventId,
    position: winner.position,
    team_id: winner.teamId || null,
    user_id: winner.userId || null,
    created_at: new Date().toISOString(),
  }))

  const { error } = await supabase.from("event_winners").insert(winnerEntries)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, message: "Winners set successfully" }
}

/**
 * Complete the event and calculate tournament points if applicable
 * Marks event as completed and assigns points based on final positions
 */
export async function completeEvent(eventId: string) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: "User not authenticated" }
  }

  // Get event details
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single()

  if (eventError || !event) {
    return { success: false, error: "Event not found" }
  }

  // Mark event as completed
  const { error: updateError } = await supabase
    .from("events")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", eventId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  // If it's a tournament, calculate and assign points
  if (event.is_tournament) {
    const response = await calculateTournamentPoints(event)

    if(!response?.success) {
      return { sccess: false, message: "Failed to add points" }
    }
  }

  return { success: true, message: "Event completed successfully" }
}

/**
 * Calculate tournament points based on final positions and rounds reached
 * Internal function called by completeEvent
 */
async function calculateTournamentPoints(
  event: {    
    id: any;
    is_tournament: any;
    type: any;
    tournament_id: any;
  }) {

  const supabase = await createClient()

  // Get winners with their positions
  const { data: winners, error: winnersError } = await supabase
    .from("event_winners")
    .select("position, team_id, user_id")
    .eq("event_id", event.id)

  if (winnersError) return { success : false, message: "Failed to get event winners" };

  const winnerTeamIds = new Set(winners.map(w => w.team_id));

  // Get all participants and their highest round reached
  const { data: progress, error: progressError } = await supabase
    .from("event_progress")
    .select(`
      team_id,
      user_id,
      event_rounds(round_number)
    `)
    .eq("event_id", event.id)
    .eq("eliminated", false)

  if (progressError) return { success : false, message: "Failed to get event progress" }

  // Points system
  const positionPoints = { 1: 100, 2: 75, 3: 50 } // Winner positions
  const roundPoints = { 1: 10, 2: 20, 3: 30, 4: 40 } // Round progression

  // Assign points based on rounds reached for non-winners
  for (const participant of progress || []) {
    const teamId = participant.team_id;
    const roundNumber = (participant as any).event_rounds?.round_number || 1;

    const isWinner = winnerTeamIds.has(teamId);
    const winnerData = winners.find(w => w.team_id === teamId);
    const basePoints = isWinner
      ? positionPoints[winnerData?.position as 1 | 2 | 3] || 25
      : roundPoints[roundNumber as keyof typeof roundPoints] || 5;

    const updateFields: any = {
      points: basePoints,
      matches_played: 1,
      updated_at: new Date().toISOString(),
    };

    if (isWinner) {
      updateFields.wins = 1;
    } else {
      updateFields.losses = 1;
    }

    const { data: existingRow, error: fetchError } = await supabase
      .from("tournament_points")
      .select("id, points, matches_played, wins, losses")
      .eq("team_id", teamId)
      .eq("tournament_id", event.tournament_id)
      .maybeSingle();

    if (fetchError) continue;

  
    if (existingRow) {
      const { error: updateError } = await supabase
        .from("tournament_points")
        .update({
          points: existingRow.points + updateFields.points,
          matches_played: (existingRow.matches_played || 0) + 1,
          wins: (existingRow.wins || 0) + (updateFields.wins || 0),
          losses: (existingRow.losses || 0) + (updateFields.losses || 0),
          updated_at: updateFields.updated_at,
        })
        .eq("id", existingRow.id);

      if (updateError) console.error("Failed to update tournament points", updateError);
    } else {
      const { error: insertError } = await supabase
        .from("tournament_points")
        .insert({
          tournament_id: event.tournament_id,
          team_id: teamId,
          points: updateFields.points,
          matches_played: 1,
          wins: updateFields.wins || 0,
          losses: updateFields.losses || 0,
          updated_at: updateFields.updated_at,
        });

      if (insertError) console.error("Failed to insert tournament points", insertError);
    }
  }

  return { success: true, message: "Tournament points calculated successfully" };
}

/**
 * Reset event progress (for testing or corrections)
 * Clears all progress and winners, sets status back to ongoing
 */
export async function resetEventProgress(eventId: string) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: "User not authenticated" }
  }

  // Clear progress
  await supabase.from("event_progress").delete().eq("event_id", eventId)

  // Clear winners
  await supabase.from("event_winners").delete().eq("event_id", eventId)

  // Clear tournament points
  await supabase.from("tournament_points").delete().eq("event_id", eventId)

  // Reset event status
  const { error } = await supabase
    .from("events")
    .update({
      status: "ongoing",
      completed_at: null,
    })
    .eq("id", eventId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, message: "Event progress reset successfully" }
}
