"use server"

import { createClient } from "../../../../../utils/supabase/server"

// Create a new tournament
export async function createTournament(formData: {
  title: string
  description: string
  year: number
  start_date?: string
  end_date?: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) throw new Error("User not authenticated")

  // Check if user is core team member
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError || profile?.role !== "core") {
    throw new Error("Unauthorized: Only core team members can create tournaments")
  }

  const { data, error } = await supabase
    .from("tournaments")
    .insert({
      title: formData.title,
      description: formData.description,
      year: formData.year,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      status: "upcoming",
    })
    .select()
    .single()

  if (error) throw new Error("Failed to create tournament")

  return { success: true, data, message: "Tournament created successfully" }
}

// Update tournament status
export async function updateTournamentStatus(tournamentId: string, status: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) throw new Error("User not authenticated")

  // Check if user is core team member
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError || profile?.role !== "core") {
    throw new Error("Unauthorized: Only core team members can update tournaments")
  }

  const { error } = await supabase.from("tournaments").update({ status }).eq("id", tournamentId)

  if (error) throw new Error("Failed to update tournament status")

  return { success: true, message: `Tournament status updated to ${status}` }
}

// Start tournament (change status to registration_open)
export async function startTournament(tournamentId: string) {
  return updateTournamentStatus(tournamentId, "registration_open")
}

// Begin tournament (change status to ongoing)
export async function beginTournament(tournamentId: string) {
  return updateTournamentStatus(tournamentId, "ongoing")
}

// Complete tournament
export async function completeTournament(tournamentId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) throw new Error("User not authenticated")

  // Check if user is core team member
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError || profile?.role !== "core") {
    throw new Error("Unauthorized: Only core team members can complete tournaments")
  }

  // Update tournament status to completed
  const { error: tournamentError } = await supabase
    .from("tournaments")
    .update({ status: "completed" })
    .eq("id", tournamentId)

  if (tournamentError) throw new Error("Failed to complete tournament")

  // Deactivate all tournament teams
  const { data: tournamentTeams, error: teamsError } = await supabase
    .from("tournament_registrations")
    .select("team_id")
    .eq("tournament_id", tournamentId)

  if (teamsError) throw new Error("Failed to fetch tournament teams")

  if (tournamentTeams && tournamentTeams.length > 0) {
    const teamIds = tournamentTeams.map((t: any) => t.team_id)

    const { error: deactivateError } = await supabase.from("teams").update({ is_active: false }).in("id", teamIds)

    if (deactivateError) throw new Error("Failed to deactivate tournament teams")
  }

  return { success: true, message: "Tournament completed and teams deactivated" }
}

// Get all tournaments
export async function getAllTournaments() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) throw new Error("User not authenticated")

  // Check if user is core team member
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError || profile?.role !== "core") {
    throw new Error("Unauthorized: Only core team members can view all tournaments")
  }

  const { data, error } = await supabase
    .from("tournaments")
    .select(`
      *,
      tournament_registrations(count)
    `)
    .order("created_at", { ascending: false })

  if (error) return { success: false, message: "Failed to fetch tournaments" }

  return { success: true, data: data || [] }
}

// Get tournament details with registrations and points
export async function getTournamentDetails(tournamentId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) throw new Error("User not authenticated")

  // Check if user is core team member
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError || profile?.role !== "core") {
    throw new Error("Unauthorized: Only core team members can view tournament details")
  }

  // Get tournament
  const { data: tournament, error: tournamentError } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", tournamentId)
    .single()

  if (tournamentError || !tournament) {
    return { success: false, message: "Tournament not found" }
  }

  // Get registrations
  const { data: registrations, error: regError } = await supabase
    .from("tournament_registrations")
    .select(`
      id,
      status,
      registered_at,
      team_id,
      teams(
        id,
        name,
        leader_id,
        description,
        is_active,
        team_members(
          member_id,
          profiles(full_name, email)
        ),
        profiles:profiles!leader_id(full_name, email)
      )
    `)
    .eq("tournament_id", tournamentId)
    .order("registered_at", { ascending: false })

  console.error(regError);
  if (regError) return { success: false, message: "Failed to fetch registrations" }

  // Get tournament points/leaderboard
  const { data: leaderboard, error: leaderboardError } = await supabase
    .from("tournament_leaderboard")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("points", { ascending: false })

  if (leaderboardError) return { success: false, message: "Failed to fetch leaderboard" }

  return {
    success: true,
    data: {
      tournament,
      registrations: registrations || [],
      leaderboard: leaderboard || [],
    },
  }
}

// Update tournament points
export async function updateTournamentPoints(
  tournamentId: string,
  teamId: string,
  points: number,
  matchResult?: { wins?: number; losses?: number; draws?: number },
) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) throw new Error("User not authenticated")

  // Check if user is core team member
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError || profile?.role !== "core") {
    throw new Error("Unauthorized: Only core team members can update points")
  }

  // Get current points
  const { data: currentPoints, error: currentError } = await supabase
    .from("tournament_points")
    .select("*")
    .eq("tournament_id", tournamentId)
    .eq("team_id", teamId)
    .single()

  if (currentError || !currentPoints) {
    throw new Error("Tournament points record not found")
  }

  // Update points
  const updateData: any = {
    points: currentPoints.points + points,
    updated_at: new Date().toISOString(),
  }

  if (matchResult) {
    updateData.matches_played = currentPoints.matches_played + 1
    if (matchResult.wins) updateData.wins = currentPoints.wins + matchResult.wins
    if (matchResult.losses) updateData.losses = currentPoints.losses + matchResult.losses
    if (matchResult.draws) updateData.draws = currentPoints.draws + matchResult.draws
  }

  const { error } = await supabase
    .from("tournament_points")
    .update(updateData)
    .eq("tournament_id", tournamentId)
    .eq("team_id", teamId)

  if (error) throw new Error("Failed to update tournament points")

  return { success: true, message: "Tournament points updated successfully" }
}

// Delete tournament (only if no registrations)
export async function deleteTournament(tournamentId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) throw new Error("User not authenticated")

  // Check if user is core team member
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError || profile?.role !== "core") {
    throw new Error("Unauthorized: Only core team members can delete tournaments")
  }

  // Check if tournament has registrations
  const { count, error: countError } = await supabase
    .from("tournament_registrations")
    .select("*", { count: "exact", head: true })
    .eq("tournament_id", tournamentId)

  if (countError) throw new Error("Failed to check tournament registrations")

  if (count && count > 0) {
    throw new Error("Cannot delete tournament with existing registrations")
  }

  const { error } = await supabase.from("tournaments").delete().eq("id", tournamentId)

  if (error) throw new Error("Failed to delete tournament")

  return { success: true, message: "Tournament deleted successfully" }
}

// Reset tournament (remove all registrations and points, set status to upcoming)
export async function resetTournament(tournamentId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) throw new Error("User not authenticated")

  // Check if user is core team member
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError || profile?.role !== "core") {
    throw new Error("Unauthorized: Only core team members can reset tournaments")
  }

  // Delete tournament points
  const { error: pointsError } = await supabase.from("tournament_points").delete().eq("tournament_id", tournamentId)

  if (pointsError) throw new Error("Failed to reset tournament points")

  // Delete tournament registrations
  const { error: regError } = await supabase.from("tournament_registrations").delete().eq("tournament_id", tournamentId)

  if (regError) throw new Error("Failed to reset tournament registrations")

  // Reset tournament status
  const { error: statusError } = await supabase
    .from("tournaments")
    .update({ status: "upcoming" })
    .eq("id", tournamentId)

  if (statusError) throw new Error("Failed to reset tournament status")

  return { success: true, message: "Tournament reset successfully" }
}

// Get tournament leaderboard
export async function getTournamentLeaderboard(tournamentId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("tournament_leaderboard")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("points", { ascending: false })

  if (error) return { success: false, message: "Failed to fetch leaderboard" }

  return { success: true, data: data || [] }
}

export async function getTotalEvents(tournamentId: string) {
  const supabase = await createClient();

  const { count: data, error } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("tournament_id", tournamentId)

  if (error) return { success: false, message: "Failed to fetch leaderboard" }

  return { success: true, data: data || 0 }
}