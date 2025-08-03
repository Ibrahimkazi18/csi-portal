"use server"

import type { PostgrestError } from "@supabase/supabase-js"
import { createClient } from "../../../../../utils/supabase/server"

// Get available members for team invitation
export async function getAvailableMembers(tournamentId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) throw new Error("User not authenticated")

  // Get all member IDs already registered for this tournament
  const { data: registeredMembers, error: regError } = await supabase
    .from("tournament_registrations")
    .select("team_id, teams!inner(team_members!inner(member_id))")
    .eq("tournament_id", tournamentId)

  if (regError) {
    return { success: false, message: "Failed to fetch registered members" }
  }

  const registeredUserIds = registeredMembers
    ?.map((r) => (r as any).teams?.team_members?.map((tm: any) => tm.member_id))
    .flat()
    .filter(Boolean)

  // Now get all non-core users except self and filter out already registered
  const { data: allMembers, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .neq("id", user.id)
    .neq("role", "core")

  if (error) {
    return { success: false, message: "Failed to fetch members" }
  }

  const availableMembers = allMembers.filter(
    (mem) => !registeredUserIds.includes(mem.id)
  )

  return { success: true, data: availableMembers }
}

// Create a team for tournament
export async function createTournamentTeam(
  tournamentId: string,
  teamName: string,
  memberIds: string[],
): Promise<{ teamId?: string; message: string; success: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) throw new Error("User not authenticated")

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) throw new Error("Profile not found")

  const { data: tournament, error: tournamentError } = await supabase
    .from("tournaments")
    .select("id, title, status")
    .eq("id", tournamentId)
    .eq("status", "registration_open")
    .single()

  if (tournamentError || !tournament) throw new Error("Tournament not found or registration closed")

  // Create team (tournament teams don't have event_id, they're tournament-specific)
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .insert({
      name: teamName,
      leader_id: user.id,
      is_tournament: true,
      description: `Team for tournament ${tournamentId}`,
      event_id: null, 
      tournament_id: tournamentId, 
    })
    .select()
    .single()

  if (teamError) {
    if ((teamError as PostgrestError).code === "23505") {
      return {
        success: false,
        message: "A team with this name already exists. Please choose a different name.",
      }
    }
    return { success: false, message: "Failed to create team. Please try again." }
  }

  // Add leader to team members
  const { error: leaderError } = await supabase.from("team_members").insert({ team_id: team.id, member_id: user.id })

  if (leaderError) throw new Error("Failed to add leader to team")

  // Create invitations for other members
  const invitations = memberIds.map((memberId) => ({
    team_id: team.id,
    inviter_id: user.id,
    invitee_id: memberId,
    tournament_id: tournamentId,
    invitation_token: Math.random().toString(36).substring(2),
    status: "pending" as const,
    message: `You have been invited to participate in ${tournament.title} from Team ${team.name} by ${profile.full_name}`,
  }))

  if (invitations.length > 0) {
    const { error: inviteError } = await supabase.from("team_invitations").insert(invitations)

    if (inviteError) throw new Error("Failed to send invitations")
  }

  return { success: true, teamId: team.id, message: "Team created and invitations sent to members" }
}

// Respond to tournament team invitation
export async function respondToTournamentInvitation(
  invitationId: string,
  accept: boolean,
): Promise<{ message: string }> {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) throw new Error("User not authenticated")

  // Fetch invitation data
  const { data: invitation, error: inviteError } = await supabase
    .from("team_invitations")
    .select("team_id, invitee_id, tournament_id, teams!inner(event_id, is_tournament)")
    .eq("id", invitationId)
    .eq("invitee_id", user.id)
    .single()

  if (inviteError || !invitation) throw new Error("Invitation not found or not authorized")

  const status = accept ? "accepted" : "declined"

  // Update invitation status
  const { error: updateError } = await supabase
    .from("team_invitations")
    .update({ status, responded_at: new Date().toISOString() })
    .eq("id", invitationId)

  if (updateError) throw new Error("Failed to update invitation")

  // If accepted, add user to team_members
  if (accept) {
    const { error: memberError } = await supabase
      .from("team_members")
      .insert({ team_id: invitation.team_id, member_id: user.id })

    if (memberError) throw new Error("Failed to add member to team");

    const team = invitation.teams as unknown as { event_id: string; is_tournament: boolean };

    // Count team members
    const { count: memberCount, error: countError } = await supabase
      .from("team_members")
      .select("*", { count: "exact", head: true })
      .eq("team_id", invitation.team_id);

    if (countError) throw new Error("Failed to count team members");

    if (team.is_tournament && memberCount === 4) {
        const { data: existingRegistration, error: regCheckError } = await supabase
        .from("tournament_registrations")
        .select("id")
        .eq("team_id", invitation.team_id)
        .single();

        console.log(regCheckError)
        if (regCheckError && regCheckError.code !== "PGRST116") {
            throw new Error("Failed to check existing registration");
        }

        if (!existingRegistration) {
            const { error: regError } = await supabase.from("tournament_registrations").insert({
            tournament_id: invitation.tournament_id,
            team_id: invitation.team_id,
            status: "registered",
            });

            console.log(regError)
            if (regError) throw new Error("Failed to register team");

            // Initialize tournament points for the team
            const { error: pointsError } = await supabase.from("tournament_points").insert({
                tournament_id: invitation.tournament_id,
                team_id: invitation.team_id,
                points: 0,
                matches_played: 0,
                wins: 0,
                losses: 0,
                draws: 0,
            })
            
            console.log(pointsError)
            if (pointsError) throw new Error("Failed to initialize tournament points")
        }
      }

  }

  return { message: `Invitation ${status}` }
}

// Get tournament team invitations for current user
export async function getTournamentTeamInvitations() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) return { success: false, message: "User not authenticated" }

  const { data, error } = await supabase
    .from("team_invitations")
    .select(`
      id,
      status,
      created_at,
      team_id,
      tournament_id,
      teams(
        name,
        leader_id,
        description,
        team_members(
          member_id,
          profiles(full_name, email)
        ),
        profiles!teams_leader_id_fkey(full_name, email)
      ),
      tournaments(title)
    `)
    .eq("invitee_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  if (error) return { success: false, message: "Failed to fetch team invitations" }

  return { success: true, data: data || [] }
}

// Get tournament team applications for current user
export async function getTournamentTeamApplications() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) return { success: false, message: "User not authenticated" }

  const { data, error } = await supabase
    .from("team_applications")
    .select(`
      id,
      status,
      created_at,
      team_id,
      tournament_id,
      teams(
        name,
        leader_id,
        description,
        team_members(
          member_id,
          profiles(full_name, email)
        ),
        profiles!teams_leader_id_fkey(full_name, email)
      ),
      tournaments(title)
    `)
    .eq("user_id", user.id)
    .not("tournament_id", "is", null)
    .order("created_at", { ascending: false })

  if (error) return { success: false, message: "Failed to fetch team applications" }

  return { success: true, data: data || [] }
}

// Get team applications for my tournament team
export async function getMyTournamentTeamApplications(tournamentId: string) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) return { success: false, message: "User not authenticated" }

  const { data, error } = await supabase
    .from("team_applications")
    .select(`
      id,
      status,
      created_at,
      team_id,
      tournament_id,
      user_id,
      teams(
        name,
        leader_id,
        description,
        team_members(
          member_id,
          profiles(full_name, email)
        ),
        profiles!teams_leader_id_fkey(full_name, email)
      ),
      profiles!team_applications_user_id_fkey(full_name, email)
    `)
    .eq("tournament_id", tournamentId)
    .eq("status", "pending")
    .filter("teams.leader_id", "eq", user.id)
    .order("created_at", { ascending: false })

  if (error) return { success: false, message: "Failed to fetch team applications" }

  return { success: true, data: data || [] }
}

// Get tournament teams that need members
export async function getTournamentTeamsNeedingMembers(tournamentId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) return { success: false, message: "User not authenticated" }

  // Check if user is already in a tournament team
  const { data: userTeams, error: userTeamError } = await supabase
    .from("team_members")
    .select("team_id, teams!inner(is_tournament)")
    .eq("member_id", user.id)
    .eq("teams.is_tournament", true)

  if (userTeamError) throw new Error("Error fetching user teams")

  // Check if any of user's tournament teams are registered for this tournament
  if (userTeams && userTeams.length > 0) {
    const userTournamentTeamIds = userTeams.map((ut) => ut.team_id)

    const { data: registeredTeams, error: regError } = await supabase
      .from("tournament_registrations")
      .select("team_id")
      .eq("tournament_id", tournamentId)
      .in("team_id", userTournamentTeamIds)

    if (regError) throw new Error("Error checking tournament registrations")

    if (registeredTeams && registeredTeams.length > 0) {
      return { message: "User already in a tournament team", userInTournamentTeam: true }
    }
  }

  // Get all teams registered for this tournament
  const { data: tournamentTeams, error: teamError } = await supabase
    .from("teams")
    .select(`
      id,
      name,
      leader_id,
      description,
      tournament_id,
      team_members(
        member_id,
        profiles(full_name, email)
      ),
      profiles:profiles!leader_id(full_name, email)
    `)
    .eq("tournament_id", tournamentId);

  if (teamError) return { success: false, message: "Failed to fetch tournament teams" }

  const TOURNAMENT_TEAM_SIZE = 4 

  const teamsNeedingMembers = tournamentTeams
    .filter((team) => team && ((team as any).team_members?.length || 0) < TOURNAMENT_TEAM_SIZE)

  return { success: true, data: teamsNeedingMembers || [] }
}

// Apply to join a tournament team
export async function applyToTournamentTeam(teamId: string, tournamentId: string): Promise<{ message: string }> {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) throw new Error("User not authenticated")

  // Check if team exists and is registered for tournament
  const { data: registration, error: regError } = await supabase
    .from("tournament_registrations")
    .select("*")
    .eq("team_id", teamId)
    .eq("tournament_id", tournamentId)
    .single()

  if (regError || !registration) throw new Error("Team not found or not registered for tournament")

  // Check if user already applied
  const { data: existingApp, error: existingError } = await supabase
    .from("team_applications")
    .select("id")
    .eq("team_id", teamId)
    .eq("user_id", user.id)
    .eq("tournament_id", tournamentId)
    .single()

  if (existingApp) throw new Error("You have already applied to this team")

  const { error } = await supabase.from("team_applications").insert({
    team_id: teamId,
    user_id: user.id,
    status: "pending",
    tournament_id: tournamentId,
  })

  if (error) throw new Error("Failed to apply to team")

  return { message: "Application submitted" }
}

// Respond to tournament team application (leader only)
export async function respondToTournamentApplication(
  applicationId: string,
  accept: boolean,
): Promise<{ message: string }> {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) throw new Error("User not authenticated")

  // Fetch application and ensure current user is leader
  const { data: application, error: appError } = await supabase
    .from("team_applications")
    .select("team_id, user_id, tournament_id, teams!inner(leader_id)")
    .eq("id", applicationId)
    .eq("teams.leader_id", user.id)
    .single()

  if (appError || !application) throw new Error("Application not found or not authorized")

  const status = accept ? "accepted" : "rejected"

  // Update application status
  const { error: updateError } = await supabase.from("team_applications").update({ status }).eq("id", applicationId)

  if (updateError) throw new Error("Failed to update application")

  // If accepted, add user to team_members
  if (accept) {
    const { error: memberError } = await supabase
      .from("team_members")
      .insert({ team_id: application.team_id, member_id: user.id })

    if (memberError) throw new Error("Failed to add member to team");

    const team = application.teams as unknown as { event_id: string; is_tournament: boolean };

    // Count team members
    const { count: memberCount, error: countError } = await supabase
      .from("team_members")
      .select("*", { count: "exact", head: true })
      .eq("team_id", application.team_id);

    if (countError) throw new Error("Failed to count team members");

    if (team.is_tournament && memberCount === 4) {
        const { data: existingRegistration, error: regCheckError } = await supabase
        .from("tournament_registrations")
        .select("id")
        .eq("team_id", application.team_id)
        .single();

        console.log(regCheckError)
        if (regCheckError && regCheckError.code !== "PGRST116") {
            throw new Error("Failed to check existing registration");
        }

        if (!existingRegistration) {
            const { error: regError } = await supabase.from("tournament_registrations").insert({
              tournament_id: application.tournament_id,
              team_id: application.team_id,
              status: "registered",
            });

            console.log(regError)
            if (regError) throw new Error("Failed to register team");

            // Initialize tournament points for the team
            const { error: pointsError } = await supabase.from("tournament_points").insert({
                tournament_id: application.tournament_id,
                team_id: application.team_id,
                points: 0,
                matches_played: 0,
                wins: 0,
                losses: 0,
                draws: 0,
            })
            
            console.log(pointsError)
            if (pointsError) throw new Error("Failed to initialize tournament points")
        }
      }

  }

  return { message: `Application ${status}` }
}

// Get user's registered tournament team
export async function getYourRegisteredTournamentTeam(tournamentId: string) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: "User not authenticated" }
  }

  // Get user's team memberships for tournament teams
  const { data: teamMember, error: teamMemberError } = await supabase
    .from("team_members")
    .select("team_id, teams!inner(is_tournament)")
    .eq("member_id", user.id)
    .eq("teams.is_tournament", true)

  if (teamMemberError || !teamMember || teamMember.length === 0) {
    return { success: false, error: "No tournament team found for user" }
  }

  // Check which of user's tournament teams is registered for this tournament
  const userTournamentTeamIds = teamMember.map((tm) => tm.team_id)

  const { data: registration, error: registrationError } = await supabase
    .from("tournament_registrations")
    .select(`
      id,
      status,
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
    .eq("tournament_id", tournamentId)
    .in("team_id", userTournamentTeamIds)
    .single()

  if (registrationError || !registration) {
    return { success: false, error: "Tournament registration not found" }
  }

  return { success: true, registration }
}

export async function isUserInTournamentTeam(tournamentId: string) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: "User not authenticated" }
  }

  // Get user's team memberships for tournament teams
  const { data: teamMember, error: teamMemberError } = await supabase
    .from("team_members")
    .select("team_id, teams!inner(is_tournament)")
    .eq("member_id", user.id)
    .eq("teams.is_tournament", true)

  if (teamMemberError || !teamMember || teamMember.length === 0) {
    return { success: false, error: "No tournament team found for user" }
  }

  // Check which of user's tournament teams is registered for this tournament
  const userTournamentTeamIds = teamMember.map((tm) => tm.team_id)

  const { data: registration, error: registrationError } = await supabase
    .from("tournament_registrations")
    .select(`
      *
    `)
    .eq("tournament_id", tournamentId)
    .in("team_id", userTournamentTeamIds)
    .single()

  if (registrationError || !registration) {
    return { success: false, error: "Tournament registration not found" }
  }

  return { success: true }
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

// Get tournament details
export async function getTournamentDetails(tournamentId: string) {
  const supabase = await createClient()

  const { data: tournament, error: tournamentError } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", tournamentId)
    .single()

  if (tournamentError || !tournament) {
    return { success: false, message: "Tournament not found" }
  }

  // Get registered teams
  const { data: registrations, error: regError } = await supabase
    .from("tournament_registrations")
    .select(`
      id,
      status,
      team_id,
      teams(
        id,
        name,
        leader_id,
        description,
        team_members(
          member_id,
          profiles(full_name, email)
        ),
        profiles:profiles!leader_id(full_name, email)
      )
    `)
    .eq("tournament_id", tournamentId)

  if (regError) return { success: false, message: "Failed to fetch registrations" }

  // Get tournament points
  const { data: points, error: pointsError } = await supabase
    .from("tournament_points")
    .select(`
      *,
      teams(name)
    `)
    .eq("tournament_id", tournamentId)
    .order("points", { ascending: false })

  if (pointsError) return { success: false, message: "Failed to fetch tournament points" }

  return {
    success: true,
    data: {
      tournament,
      registrations: registrations || [],
      points: points || [],
    },
  }
}

// Get all tournaments
export async function getAllTournaments() {
  const supabase = await createClient()

  const { data, error } = await supabase.from("tournaments").select("*").order("created_at", { ascending: false })

  if (error) return { success: false, message: "Failed to fetch tournaments" }

  return { success: true, data: data || [] }
}