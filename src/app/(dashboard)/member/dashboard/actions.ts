"use server"

import { createClient } from "../../../../../utils/supabase/server"

export async function getMemberDashboardStats() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Unauthorized" }

  try {
    // Get events participated
    const { count: eventsParticipated } = await supabase
      .from("event_registrations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)

    // Get upcoming events
    const { data: upcomingEvents, error: upcomingError } = await supabase
      .from("event_registrations")
      .select(`
        event_id,
        team_id,
        events!inner(
          id, title, start_date, status
        ),
        teams(name)
      `)
      .eq("user_id", user.id)
      .gte("events.start_date", new Date().toISOString())
      .in("events.status", ["upcoming", "registration_open", "ongoing"])

    if (upcomingError) {
      console.error("Upcoming events error:", upcomingError)
    }

    // Get workshops attended
    const { count: workshopsAttended } = await supabase
      .from("event_participants")
      .select("*, events!inner(*)", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("attended", true)
      .eq("events.mode", "workshop")

    // Get team points and teams
    const { data: teamMemberships, error: teamError } = await supabase
      .from("team_members")
      .select(`
        teams!inner(
          id, name, points, leader_id
        )
      `)
      .eq("member_id", user.id)

    if (teamError) {
      console.error("Team memberships error:", teamError)
    }

    const teamPoints = teamMemberships?.reduce((sum: number, tm: any) => {
      return sum + (tm?.teams?.points || 0)
    }, 0) || 0
    
    const myTeams = teamMemberships?.map((tm: any) => {
      if (!tm?.teams) return null
      return {
        id: tm.teams.id,
        name: tm.teams.name || 'Unknown Team',
        points: tm.teams.points || 0,
        is_leader: tm.teams.leader_id === user.id,
        member_count: 0 // Will be populated below
      }
    }).filter(team => team !== null && team.id) || [] // Filter out null teams and teams with no ID

    // Get member counts for teams
    for (const team of myTeams) {
      if (team && team.id) {
        const { count } = await supabase
          .from("team_members")
          .select("*", { count: "exact", head: true })
          .eq("team_id", team.id)
        team.member_count = count || 0
      }
    }

    // Get pending invitations
    const { count: pendingInvitations } = await supabase
      .from("team_invitations")
      .select("*", { count: "exact", head: true })
      .eq("invitee_id", user.id)
      .eq("status", "pending")

    // Get pending applications
    const { count: pendingApplications } = await supabase
      .from("team_applications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "pending")

    // Format upcoming events
    const upcomingEventsList = upcomingEvents?.map((reg: any) => {
      if (!reg?.events) return null
      return {
        id: reg.events.id,
        title: reg.events.title || 'Unknown Event',
        start_date: reg.events.start_date,
        status: reg.events.status,
        team: reg.teams ? { name: reg.teams.name || 'Unknown Team' } : null
      }
    }).filter(event => event !== null && event.id) || [] // Filter out null events and events with no ID

    return {
      success: true,
      data: {
        eventsParticipated: eventsParticipated || 0,
        upcomingEvents: upcomingEvents?.length || 0,
        upcomingEventsList,
        workshopsAttended: workshopsAttended || 0,
        teamPoints,
        myTeams,
        pendingInvitations: pendingInvitations || 0,
        pendingApplications: pendingApplications || 0,
        pendingActions: (pendingInvitations || 0) + (pendingApplications || 0)
      }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}