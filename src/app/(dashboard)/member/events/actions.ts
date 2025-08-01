"use server"

import { PostgrestError } from "@supabase/supabase-js"
import { createClient } from "../../../../../utils/supabase/server"
import { revalidatePath } from "next/cache"

// Event rounds
export async function getEventRounds(event_id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("event_rounds")
    .select("*")
    .eq("event_id", event_id)
    .order("created_at", { ascending: false })

  if (error) return { success: false, error: error.message }
  return { success: true, data }
}

export async function getAllEvents() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) return { success: false, message: "User not authenticated" }

  const { data: profile, error: profileError } = await supabase.from("profiles").select("id").eq("id", user.id).single()

  if (profileError || !profile) return { success: false, message: "Profile Not Found" }

  const { data: teams, error: teamsError } = await supabase
    .from("team_members")
    .select("team_id, teams!inner(is_tournament)")
    .eq("member_id", user.id)

  if (teamsError) return { success: false, message: "Failed To Fetch Team" }

  // Safely handle the teams data structure
  const teamIds =
    teams
      ?.filter((t) => {
        // Handle both array and object structures
        const teamData = Array.isArray(t.teams) ? t.teams[0] : t.teams
        return teamData?.is_tournament === true
      })
      .map((t) => t.team_id) || []

  // Build base query
  let baseQuery = supabase
    .from("events")
    .select(
      "id, title, description, banner_url, max_participants, team_size, registration_deadline, start_date, end_date, type, is_tournament, category, status, created_at",
    )
    .order("start_date", { ascending: true });

  // Apply tournament filtering
  if (teamIds.length > 0) {
    baseQuery = baseQuery.or(`is_tournament.eq.false, and(is_tournament.eq.true, id.in.(${teamIds.join(",")}))`)
  } else {
    baseQuery = baseQuery.eq("is_tournament", false)
  }

  const { data: allEvents, error } = await baseQuery

  if (error) return { success: false, message: "Failed to fetch events" }

  // Categorize events
  const now = new Date()
  const registrationOpen = allEvents?.filter(
    (event) => event.status === "registration_open" && new Date(event.registration_deadline) >= now,
  )
  const upcoming = allEvents?.filter((event) => event.status === "upcoming")
  const completed = allEvents?.filter((event) => event.status === "completed")

  return {
    success: true,
    data: {
      registrationOpen: registrationOpen || [],
      upcoming: upcoming || [],
      completed: completed || [],
    },
  }
}
// Get single event details
export async function getEventDetails(eventId: string) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) return { success: false, message: "User not authenticated" }

  // Get event details
  const { data: event, error: eventError } = await supabase.from("events").select("*").eq("id", eventId).single()

  if (eventError || !event) return { success: false, message: "Event not found" }

  // Get event rounds
  const { data: rounds, error: roundsError } = await supabase
    .from("event_rounds")
    .select("*")
    .eq("event_id", eventId)
    .order("round_number", { ascending: true })

  if (roundsError) return { success: false, message: "Failed to fetch event rounds" }

  // Get registered teams/participants
  const { data: registrations, error: regError } = await supabase
    .from("event_registrations")
    .select(
      `
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
    `,
    )
    .eq("event_id", eventId)

  if (regError) return { success: false, message: "Failed to fetch registrations" }

  // Get pending teams (teams that need more members)
  const { data: pendingTeams, error: pendingError } = await supabase
    .from("teams")
    .select(
      `
      id,
      name,
      leader_id,
      description,
      team_members(
        member_id,
        profiles(full_name, email)
      ),
      team_invitations!inner(status),
      profiles!teams_leader_id_fkey(full_name, email)
    `,
    )
    .eq("team_invitations.status", "pending")
    .not(
      "id",
      "in",
      `(${
        registrations
          ?.filter((r) => r.team_id)
          .map((r) => r.team_id)
          .join(",") || "null"
      })`,
    )

  // Get user's invitations for this event
  const { data: userInvitations, error: inviteError } = await supabase
    .from("team_invitations")
    .select(
      `
      id,
      status,
      created_at,
      team_id,
      teams(
        name,
        leader_id,
        profiles!teams_leader_id_fkey(full_name, email)
      )
    `,
    )
    .eq("invitee_id", user.id)
    .eq("status", "pending")
    .in("team_id", registrations?.filter((r) => r.team_id).map((r) => r.team_id) || [])

  // Get winners (for completed events)
  let winners = null
  if (event.status === "completed") {
    const { data: winnersData, error: winnersError } = await supabase
      .from("event_winners")
      .select(
        `
        id,
        position,
        team_id,
        user_id,
        teams(name, team_members(profiles(full_name))),
        profiles(full_name)
      `,
      )
      .eq("event_id", eventId)
      .order("position", { ascending: true })

    if (!winnersError) winners = winnersData
  }

  return {
    success: true,
    data: {
      event,
      rounds: rounds || [],
      registrations: registrations || [],
      pendingTeams: pendingTeams || [],
      userInvitations: userInvitations || [],
      winners: winners || [],
    },
  }
}


// Get available members for team invitation
export async function getAvailableMembers(eventId: string) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) throw new Error("User not authenticated")

  const { data: registeredUsers, error: regError } = await supabase
    .from("event_registrations")
    .select("user_id, team_id, teams!inner(team_members!inner(member_id))")
    .eq("event_id", eventId)

  if (regError) return { success: false, message: "Failed to fetch registered users" }

  const registeredUserIds = registeredUsers.flatMap((reg) =>
    reg.user_id
      ? [reg.user_id]
      : Array.isArray(reg.teams)
        ? reg.teams.flatMap((team) =>
            Array.isArray(team.team_members) ? team.team_members.map((tm) => tm.member_id) : [],
          )
        : [],
  );

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .neq("id", user.id)
    .neq("role", 'core')

  if (error) return { success: false, message: "Failed to fetch members" }

  const availableMembers = data.filter((mem) => !registeredUserIds.includes(mem.id))

  return { success: true, data: availableMembers }
}

// Create a team and send invitations
export async function createTeam(
  eventId: string,
  teamName: string,
  memberIds: string[],
): Promise<{ teamId?: string; message: string, success: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) throw new Error("User not authenticated");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) throw new Error("Profile not found")

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, title, team_size, is_tournament")
    .eq("id", eventId)
    .eq('status', 'registration_open')
    .single()

  if (eventError || !event) throw new Error("Event not found")

  if (memberIds.length > event.team_size - 1) throw new Error("Too many members for team size")

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .insert({
      name: teamName,
      leader_id: user.id,
      is_tournament: event.is_tournament,
      description: `Team for event ${eventId}`,
      event_id: event.id
    })
    .select()
    .single()

    if (teamError) {
    // Check for unique violation (duplicate team name for same event)
    if ((teamError as PostgrestError).code === "23505") {
      return {
        success:false, message: "A team with this name already exists for the selected event. Please choose a different name.",
      }
    }

    return { success:false, message: "Failed to create team. Please try again." }
  }

  const { error: leaderError } = await supabase.from("team_members").insert({ team_id: team.id, member_id: user.id })

  if (leaderError) throw new Error("Failed to add leader to team")

  const invitations = memberIds.map((memberId) => ({
    team_id: team.id,
    inviter_id: user.id,
    invitee_id: memberId,
    event_id: event.id,
    invitation_token: Math.random().toString(36).substring(2),
    status: "pending" as const,                                 // 'pending', 'accepted', 'declined', 'expired'
    message: `You have been invited to participate in ${event.title} from Team ${team.name} by ${profile.full_name}`
  }));

  const { error: inviteError } = await supabase.from("team_invitations").insert(invitations)

  if (inviteError) throw new Error("Failed to send invitations")

  if (event.is_tournament) {
    const { error: regError } = await supabase.from("event_registrations").insert({
      event_id: eventId,
      team_id: team.id,
      registration_type: "team",
      status: "registered",
    })

    if (regError) throw new Error("Failed to register team")
  }

  revalidatePath("/member/events")
  return { success:true, teamId: team.id, message: "Team created and invitations sent" }
}

// Respond to team invitation
export async function respondToInvitation(invitationId: string, accept: boolean): Promise<{ message: string }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("User not authenticated");

  // Step 1: Fetch invitation and team data
  const { data: invitation, error: inviteError } = await supabase
    .from("team_invitations")
    .select("team_id, invitee_id, teams!inner(event_id, is_tournament)")
    .eq("id", invitationId)
    .eq("invitee_id", user.id)
    .single();

  if (inviteError || !invitation) throw new Error("Invitation not found or not authorized");

  const status = accept ? "accepted" : "declined";

  // Step 2: Update invitation status
  const { error: updateError } = await supabase
    .from("team_invitations")
    .update({ status, responded_at: new Date().toISOString() })
    .eq("id", invitationId);

  if (updateError) throw new Error("Failed to update invitation");

  // Step 3: If accepted, add user to team_members
  if (accept) {
    const { error: memberError } = await supabase
      .from("team_members")
      .insert({ team_id: invitation.team_id, member_id: user.id });

    if (memberError) throw new Error("Failed to add member to team");

    const team = invitation.teams as unknown as { event_id: string; is_tournament: boolean };

    // Step 4: Fetch event.team_size
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("team_size")
      .eq("id", team.event_id)
      .single();

    if (eventError || !event) throw new Error("Failed to fetch event details");

    // Step 5: Count team members
    const { count: memberCount, error: countError } = await supabase
      .from("team_members")
      .select("*", { count: "exact", head: true })
      .eq("team_id", invitation.team_id);

    if (countError) throw new Error("Failed to count team members");

    // Step 6: If team is full and not registered, register
    if (!team.is_tournament && memberCount === event.team_size) {
      const { data: existingRegistration, error: regCheckError } = await supabase
        .from("event_registrations")
        .select("id")
        .eq("team_id", invitation.team_id)
        .single();

      if (regCheckError && regCheckError.code !== "PGRST116") {
        throw new Error("Failed to check existing registration");
      }

      if (!existingRegistration) {
        const { error: regError } = await supabase.from("event_registrations").insert({
          event_id: team.event_id,
          team_id: invitation.team_id,
          registration_type: "team",
          status: "registered",
        });

        if (regError) throw new Error("Failed to register team");
      }
    }
  }

  revalidatePath("/member/events");
  return { message: `Invitation ${status}` };
}


// Helper to get event_id from team
async function eventIdFromTeam(teamId: string): Promise<string> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("event_registrations").select("event_id").eq("team_id", teamId).single()

  if (error || !data) throw new Error("Event not found for team")
  return data.event_id
}

// Get team invitations for current user
export async function getTeamInvitations() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) return { success: false, message: "User not authenticated" }

  const { data, error } = await supabase
    .from("team_invitations")
    .select(
      `
      id,
      status,
      created_at,
      team_id,
      event_id,
      teams(
        name,
        leader_id,
        description,
        team_members(
          member_id,
          profiles(full_name, email)
        ),
        profiles!teams_leader_id_fkey(full_name, email)
      )
    `,
    )
    .eq("invitee_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  if (error) return { success: false, message: "Failed to fetch team invitations" }

  return { success: true, data: data || [] }
}

// Get team applications for current user
export async function getTeamApplication() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) return { success: false, message: "User not authenticated" }

  const { data, error } = await supabase
    .from("team_applications")
    .select(
      `
      id,
      status,
      created_at,
      team_id,
      event_id,
      teams(
        name,
        leader_id,
        description,
        team_members(
          member_id,
          profiles(full_name, email)
        ),
        profiles!teams_leader_id_fkey(full_name, email)
      )
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) return { success: false, message: "Failed to fetch team applications" }

  return { success: true, data: data || [] }
}

// Get team applications for my team
export async function getMyTeamApplication(eventId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) return { success: false, message: "User not authenticated" }

  const { data, error } = await supabase
    .from("team_applications")
    .select(
      `
      id,
      status,
      created_at,
      team_id,
      event_id,
      teams(
        name,
        leader_id,
        description,
        team_members(
          member_id,
          profiles(full_name, email)
        ),
        profiles!teams_leader_id_fkey(full_name, email)
      )
    `,
    )
    .eq("event_id", eventId)
    .eq("status", 'pending')
    .filter("teams.leader_id", "eq", user.id)
    .order("created_at", { ascending: false })

  if (error) return { success: false, message: "Failed to fetch team applications" }

  return { success: true, data: data || [] }
}


// Get teams that need members for a specific event
export async function getTeamsNeedingMembers(eventId: string) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return { success: false, message: "User not authenticated" };

  // Get event details to know team size
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();

  if (eventError || !event) return { success: false, message: "Event not found" };

  // Get all teams for this event
  const { data: teams, error: teamError } = await supabase
    .from("teams")
    .select(`
      id,
      name,
      leader_id,
      description,
      event_id,
      team_members(
        member_id,
        profiles(full_name, email)
      ),
      profiles:profiles!leader_id(full_name, email)
    `)
    .eq("event_id", eventId);

  if (teamError) return { success: false, message: "Failed to fetch teams" };

  const { data: userTeams, error: userTeamError } = await supabase
    .from("team_members")
    .select("*")
    .eq("member_id", user.id)

  let userInEventTeam = false;
    
  if(userTeamError) throw new Error("Error fetching if user is a team member");

  const userTeamIds = userTeams.map((team) => team.team_id);

  // Check if any of the user's team IDs exist in the list of teams for the event
  userInEventTeam = teams?.some((team) => userTeamIds.includes(team.id)) || false;  

  if(userInEventTeam) return { message: "User already in an event team", userInEventTeam}

  // Filter teams that need more members
  const teamsNeedingMembers = teams
    ?.filter((team) => (team.team_members?.length || 0) < event.team_size);

  return { success: true, data: teamsNeedingMembers || [] };
}


// Apply to join a pending team
export async function applyToTeam(teamId: string, eventId: string): Promise<{ message: string }> {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) throw new Error("User not authenticated")

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .single()

  if (teamError) {
    console.error(teamError)
    throw new Error("Team not found")
  }
  if (!team) {
    console.error("team not found")
    return { message : "Error"}
  }

  const { data: registraion, error: regError } = await supabase
    .from("event_registrations")
    .select("*")
    .eq("team_id", teamId)

  if (regError) {
    console.error(teamError)
    throw new Error("Reg error")
  }
  if (!registraion) {
    console.error("team not found")
    return { message : "Error"}
  }

  if (registraion.length > 0) throw new Error("Team already registered")

  const { error } = await supabase
    .from("team_applications")
    .insert({ team_id: teamId, user_id: user.id, status: "pending", event_id: eventId });

  if (error) throw new Error("Failed to apply to team")

  revalidatePath("/member/events")
  return { message: "Application submitted" }
}

// Respond to team application (leader only)
export async function respondToApplication(applicationId: string, accept: boolean): Promise<{ message: string }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) throw new Error("User not authenticated")

  // Step 1: Fetch application and ensure current user is leader
  const { data: application, error: appError } = await supabase
    .from("team_applications")
    .select("team_id, user_id, teams!inner(leader_id, event_id)")
    .eq("id", applicationId)
    .eq("teams.leader_id", user.id)
    .single()

  if (appError || !application) throw new Error("Application not found or not authorized")

  const status = accept ? "accepted" : "rejected"

  // Step 2: Update application status
  const { error: updateError } = await supabase
    .from("team_applications")
    .update({ status })
    .eq("id", applicationId)

  if (updateError) throw new Error("Failed to update application")

  // Step 3: If accepted, add user to team_members
  if (accept) {
    const { error: memberError } = await supabase
      .from("team_members")
      .insert({ team_id: application.team_id, member_id: application.user_id })

    if (memberError) throw new Error("Failed to add member to team")
  
  
    const team = application.teams as unknown as { leader_id: string; event_id: string };

    // Step 4: Fetch event.team_size
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("team_size")
      .eq("id", team.event_id )
      .single()

      
    if (eventError || !event) throw new Error("Failed to fetch event details")
  
    // Step 5: Count members in team
    const { count: memberCount, error: countError } = await supabase
      .from("team_members")
      .select("*", { count: "exact", head: true })
      .eq("team_id", application.team_id)

    if (countError) throw new Error("Failed to count team members")
  
    // Step 6: If team is full and not yet registered, register it
    if (memberCount === event.team_size) {
      const { error: regError } = await supabase.from("event_registrations").insert({
        event_id: team.event_id,
        team_id: application.team_id,
        registration_type: "team",
        status: "registered",
      })

      if (regError){
         throw new Error("Failed to register team")
      }
    }
  }

  revalidatePath("/member/events")
  return { message: `Application ${status}` }
}

// Get pending teams for an event
export async function getPendingTeams(eventId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("teams")
    .select(
      "id, name, leader_id, description, team_members(id, profiles(full_name)), team_invitations(id, status), team_applications(id, status)",
    )
    .eq("event_registrations.event_id", eventId)
    .not("event_registrations.id", "is", null)
    .eq("event_registrations.status", "pending")

  if (error) return { success: false, message: "Failed to fetch pending teams" }

  return { success: true, data }
}

// Register for individual event
export async function registerForIndividualEvent(eventId: string): Promise<{ message: string }> {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) throw new Error("User not authenticated")

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("type, registration_deadline")
    .eq("id", eventId)
    .single()

  if (eventError || !event) throw new Error("Event not found")
  if (event.type !== "individual") throw new Error("Event is not individual")
  if (new Date(event.registration_deadline) < new Date()) throw new Error("Registration deadline passed")

  const { error } = await supabase.from("event_registrations").insert({
    event_id: eventId,
    user_id: user.id,
    registration_type: "individual",
    status: "registered",
  })

  if (error) throw new Error("Failed to register for event")

  revalidatePath("/member/events")
  return { message: "Registered for event" }
}


// Fetch user's registered team
export async function getYourRegisteredTeam(eventId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: "User not authenticated" };
  }

  // First, get the team_id for the current user
  const { data: teamMember, error: teamMemberError } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('member_id', user.id)
    .single();

  if (teamMemberError || !teamMember) {
    return { success: false, error: "Team not found for user" };
  }

  // Now fetch the registration with nested team and member data
  const { data: registration, error: registrationError } = await supabase
  .from("event_registrations")
  .select(
    `
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
  `,
  )
  .eq("event_id", eventId)
  .eq("team_id", teamMember.team_id)
  .single()

  if (registrationError || !registration) {
    return { success: false, error: "Registration not found" };
  }

  return { success: true, registration };
}
