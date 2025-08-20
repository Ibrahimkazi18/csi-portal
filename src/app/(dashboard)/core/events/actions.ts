"use server";

import { createClient } from "../../../../../utils/supabase/server";
import { google, sheets_v4, drive_v3 } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive", 'https://www.googleapis.com/auth/drive.file'];

// Events
export async function getEvents() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return { success: false, error: error.message }

  return { success: true, data }
}

export async function createEvent({ 
    title, 
    description, 
    max_participants,
    team_size,
    registration_deadline,
    start_date,
    end_date,
    type,
    is_tournament,
    banner_url,
    tournament_id,
    status
}: { 
    title: string, 
    description: string,
    max_participants: number,
    team_size: number,
    registration_deadline: Date,
    start_date: Date,
    end_date: Date,
    type: "individual" | "team",
    is_tournament: boolean,
    banner_url: string,
    tournament_id: string,
    status: string              // "upcoming", "registration_open", "ongoing", "completed", "cancelled"
}) {

  const supabase = await createClient();

  const createdBy = (await supabase.auth.getUser()).data.user?.id

  const { data, error } = await supabase
    .from('events')
    .insert([{ 
        title, 
        description, 
        max_participants,
        team_size,
        registration_deadline,
        start_date,
        end_date,
        type,
        is_tournament,
        status,
        banner_url : banner_url || null,
        tournament_id : tournament_id || null,
        created_by: createdBy
    }])
    .select()
    .single();

  if (error) return { success: false };

  return { success: true, data };
}

export async function updateEvent({
  id,
  fields,
}: {
  id: string
  fields: Partial<{
    title: string, 
    description: string,
    max_participants: number,
    team_size: number,
    registration_deadline: Date,
    start_date: Date,
    end_date: Date,
    type: "individual" | "team",
    is_tournament: boolean,
    banner_url: string,
    status: string
  }>
}) {
  const supabase = await createClient();

  const updatedBy = (await supabase.auth.getUser()).data.user?.id

  const { error } = await supabase
    .from('events')
    .update({
      ...fields,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy,
    })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  return { success: true, message: 'Event updated successfully' }
}


export async function deleteEvent(id: string) {
  const supabase = await createClient();

  const { data } = await supabase.from('events').select('*').eq('id', id).single();

  if(!data) {
    return { success: false, error: "Event does not exist" }
  }

  if(data.status === "ongoing"){
    return { success: false, error: "Event is ongoing cannot delete." }
  }

  const { error } = await supabase.from('events').delete().eq('id', id)

  if (error) return { success: false, error: error.message }

  return { success: true, message: 'Event deleted successfully' }
}

// fetching tournament to provide tournament ids for create event
export async function getTournaments() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tournaments')
    .select('*')

  if (error) return { success: false, error: error.message }

  return { success: true, data }
}

// Event rounds
export async function getEventRounds(event_id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('event_rounds')
    .select('*')
    .eq('event_id', event_id)
    .order('created_at', { ascending: false })

  if (error) return { success: false, error: error.message }

  return { success: true, data }
}

export async function addEventRounds(
  eventId: string, 
    rounds: { 
        title: string; 
        description: string; 
        round_number: number 
    }[]
) {
  const supabase = await createClient();

  // Fetch existing rounds to check for duplicates
  const { data: existingRounds, error: fetchError } = await supabase
    .from('event_rounds')
    .select('round_number')
    .eq('event_id', eventId);

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  const existingRoundNumbers = existingRounds.map(r => r.round_number);
  const newRounds = rounds.filter(r => !existingRoundNumbers.includes(r.round_number));

  if (newRounds.length === 0) {
    throw new Error('No new rounds to add');
  }

  const payload = newRounds.map(r => ({
    event_id: eventId,
    title: r.title,
    description: r.description,
    round_number: r.round_number,
  }));

  const { data, error } = await supabase
    .from('event_rounds')
    .insert(payload)
    .select();

  if (error) throw error;
  return data;
}

export async function updateEventRound({
  id,
  fields,
}: {
  id: string
  fields: Partial<{
    eventId: string,
    rounds: { 
        title: string; 
        description: string; 
        round_number: number 
    }
  }[]>
}) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('event_rounds')
    .update({
      ...fields,
    })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  return { success: true, message: 'Event round updated successfully' }
}

export async function deleteEventRound(id: string) {
  const supabase = await createClient();

  const { data } = await supabase.from('event_rounds').select('*').eq('id', id).single();

  if(!data) {
    return { success: false, error: "Event round does not exist" }
  }

  const { error } = await supabase.from('event_rounds').delete().eq('id', id)

  if (error) return { success: false, error: error.message }

  return { success: true, message: 'Event deleted successfully' }
}


// Get Registered Teams
export async function getRegisteredTeams() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: "User not authenticated" };
  }

  // fetching registered teams for the event
  const { data: registrations, error: registrationError } = await supabase
  .from("event_registrations")
  .select(
    `
    id,
    registration_type,
    status,
    user_id,
    team_id,
    event_id,
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

  if (registrationError || !registrations) {
    return { success: false, error: "Registration not found" };
  }

  const groupedByEvent: Record<string, typeof registrations> = {};

  for (const reg of registrations) {
    const eventId = reg.event_id;
    if (!groupedByEvent[eventId]) {
      groupedByEvent[eventId] = [];
    }
    groupedByEvent[eventId].push(reg);
  }

  return { success: true, data: groupedByEvent };
}

export async function getEventRegistrations(eventId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: "User not authenticated" }
  }

  // Get event details
  const { data: event, error: eventError } = await supabase.from("events").select("*").eq("id", eventId).single();

  if (eventError || !event) {
    return { success: false, error: "Event not found" }
  }

  // Get all registrations for this event
  const { data: registrations, error: regError } = await supabase
    .from("event_registrations")
    .select(`
      id,
      registration_type,
      status,
      user_id,
      team_id,
      registered_at,
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
    console.error("regError:", regError.message);
    return { success: false, error: "Failed to fetch registrations" }
  }

  if(event.is_tournament) {
    const { data : tournamentTeams, error: tournamentError } = await supabase
      .from("teams")
      .select(`*, 
        team_members(
          member_id,
          profiles(full_name, email)
        )
      `)
      .eq("is_tournament", true)
      .eq("tournament_id", event.tournament_id)

    if(tournamentError) {
      return { success: false, message: "Error fetching tournament teams" }
    }

    const registeredTeamIds = new Set(registrations.map((reg) => reg.team_id));
    const pendingTeams = tournamentTeams.filter((team) => !registeredTeamIds.has(team.id));

    return {
      success: true,
      data : {
        event,
          registrations: {
            completeTeams: registrations,
            incompleteTeams: [],
            pendingInvitations: [],
            individualRegistrations: [],
            tournamentPending: pendingTeams
          },
      }
    }
  }

  const registeredTeamIds = registrations
    ?.filter((r) => r.team_id)
    .map((r) => r.team_id) || []

  // Get incomplete teams (teams with pending invitations)
  let incompleteTeamsQuery = supabase
  .from("teams")
  .select(`
    id,
    name,
    leader_id,
    description,
    team_members(
      member_id,
      profiles(full_name, email)
    ),
    profiles(full_name, email),
    team_invitations(
      id,
      status,
      invitee_id,
      created_at,
      profiles!team_invitations_invitee_id_fkey(full_name, email)
    )
  `)
  .eq('event_id', event.id)

  // Only apply `.not("id", "in", ...)` if there are registered teams
  if (registeredTeamIds.length > 0) {
    const formattedIds = `(${registeredTeamIds.map(id => `"${id}"`).join(",")})`
    incompleteTeamsQuery = incompleteTeamsQuery.not("id", "in", formattedIds)
  }

  const { data: incompleteTeams, error: incompleteError } = await incompleteTeamsQuery

  if (incompleteError) {
    console.error("incompleteError:", incompleteError)
  }
  
  // Filter teams that have pending invitations or are incomplete
  const filteredIncompleteTeams =
    incompleteTeams
      ?.filter((team) => {
        const currentMembers = (team as any).team_members?.length || 0
        const hasPendingInvitations = team.team_invitations?.some((inv) => inv.status === "pending")
        return currentMembers < event.team_size || hasPendingInvitations
      })
      .map((team) => ({
        ...team,
        pending_invitations: team.team_invitations?.map((inv) => ({
          ...inv,
          invitee_profile: inv.profiles,
        })),
      })) || []

  // Separate complete teams and individual registrations
  const completeTeams =
    registrations
      ?.filter(
        (reg) =>
          reg.registration_type === "team" && reg.teams && ((reg.teams as any).team_members?.length || 0) >= event.team_size,
      )
      .map((reg) => reg.teams) || []

  const individualRegistrations = registrations?.filter((reg) => reg.registration_type === "individual") || []

  return {
    success: true,
    data: {
      event,
      registrations: {
        completeTeams,
        incompleteTeams: filteredIncompleteTeams,
        individualRegistrations,
        pendingInvitations: [],
        tournamentPending: []
      },
    },
  }
}


// Create attendance sheet
export async function createAttendanceSheet({
  eventData,
  registrationsData,
}: {
  eventData: any;
  registrationsData: any;
}) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data: coreEmails, error: coreEmailsError } = await supabase
      .from('profiles')
      .select('email')
      .eq('role', 'core');

    if (coreEmailsError) return { success: false, error: coreEmailsError.message };
    if (!coreEmails || coreEmails.length === 0) return { success: false, error: 'No core members found' };

    const GAS_ENDPOINT = process.env.NEXT_PUBLIC_GAS_ENDPOINT!;

    const response = await fetch(GAS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventData,
        registrationsData,
        coreEmails: coreEmails.map(e => e.email),
      }),
    });

    const result = await response.json();

    if (!result.success) {
      return { success: false, error: result.error || 'Unknown error from GAS' };
    }

    const updatedBy = (await supabase.auth.getUser()).data.user?.id

    const { error } = await supabase
      .from('events')
      .update({
        status: 'ongoing',
        updated_at: new Date().toISOString(),
        updated_by: updatedBy,
      })
      .eq('id', eventData.id)

    if (error) return { success: false, error: error.message, updated: false }

    return { success: true, url: result.url, updated: true };

  } catch (err: any) {
    console.error('Error calling GAS:', err);
    return { success: false, error: err.message || 'Server error' };
  }
}
