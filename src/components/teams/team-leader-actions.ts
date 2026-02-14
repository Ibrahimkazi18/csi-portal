"use server"

import { createClient } from "../../../utils/supabase/server"
import { revalidatePath } from "next/cache"

// Get all notifications for team leader
export async function getTeamLeaderNotifications() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { success: false, error: "Not authenticated" }

  // Get notifications where user is the recipient (team leader)
  const { data: notifications, error } = await supabase
    .from("notifications")
    .select(`
      id,
      title,
      message,
      type,
      created_at,
      read,
      metadata
    `)
    .eq("recipient_id", user.id)
    .eq("type", "team")
    .order("created_at", { ascending: false })

  if (error) return { success: false, error: error.message }

  // Format notifications with team info if available
  const formattedNotifications = notifications.map(notification => {
    let team_name = null
    
    // Try to extract team name from message
    if (notification.message) {
      const teamMatch = notification.message.match(/join (.+?)(?:\s|$)/)
      if (teamMatch) {
        team_name = teamMatch[1]
      }
    }

    return {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      created_at: notification.created_at,
      read: notification.read || false,
      team_name
    }
  })

  return { success: true, data: formattedNotifications }
}

// Get teams where current user is leader
export async function getMyTeams() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { success: false, error: "Not authenticated" }

  const { data: teams, error } = await supabase
    .from("teams")
    .select(`
      id,
      name,
      description,
      is_tournament,
      event_id,
      tournament_id,
      created_at,
      team_members(id),
      events(title)
    `)
    .eq("leader_id", user.id)
    .order("created_at", { ascending: false })

  if (error) return { success: false, error: error.message }

  // Format teams with member count and event info
  const formattedTeams = teams.map(team => ({
    id: team.id,
    name: team.name,
    description: team.description,
    is_tournament: team.is_tournament,
    event_id: team.event_id,
    tournament_id: team.tournament_id,
    created_at: team.created_at,
    member_count: team.team_members?.length || 0,
    event_title: team.events?.[0]?.title || null
  }))

  return { success: true, data: formattedTeams }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { success: false, error: "Not authenticated" }

  // Verify user owns the notification
  const { data: notification } = await supabase
    .from("notifications")
    .select("recipient_id")
    .eq("id", notificationId)
    .single()

  if (!notification || notification.recipient_id !== user.id) {
    return { success: false, error: "Not authorized" }
  }

  // Mark as read
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId)

  if (error) return { success: false, error: error.message }

  return { success: true, message: "Notification marked as read" }
}

// Get team invitation responses for a specific team
export async function getTeamInvitationResponses(teamId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { success: false, error: "Not authenticated" }

  // Verify user is team leader
  const { data: team } = await supabase
    .from("teams")
    .select("leader_id")
    .eq("id", teamId)
    .single()

  if (!team || team.leader_id !== user.id) {
    return { success: false, error: "Not authorized" }
  }

  // Get invitation responses
  const { data: responses, error } = await supabase
    .from("team_invitations")
    .select(`
      id,
      status,
      created_at,
      responded_at,
      invitee_id,
      invitee:profiles!invitee_id(full_name, email)
    `)
    .eq("team_id", teamId)
    .in("status", ["accepted", "declined"])
    .order("responded_at", { ascending: false })

  if (error) return { success: false, error: error.message }

  const formattedResponses = responses.map(response => {
    const profile = (response as any).invitee
    return {
      id: response.id,
      status: response.status,
      created_at: response.created_at,
      responded_at: response.responded_at,
      invitee_name: profile?.full_name || "Unknown",
      invitee_email: profile?.email || "Unknown",
      invitee_id: response.invitee_id
    }
  })

  return { success: true, data: formattedResponses }
}

// Send new invitation to available member
export async function sendNewInvitation(teamId: string, memberId: string, eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { success: false, error: "Not authenticated" }

  // Verify user is team leader
  const { data: team } = await supabase
    .from("teams")
    .select("leader_id, name, event_id")
    .eq("id", teamId)
    .single()

  if (!team || team.leader_id !== user.id) {
    return { success: false, error: "Not authorized" }
  }

  // Get user profile for invitation message
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single()

  // Get event details
  const { data: event } = await supabase
    .from("events")
    .select("title")
    .eq("id", eventId)
    .single()

  // Check if there's already a pending invitation
  const { data: existingInvitation } = await supabase
    .from("team_invitations")
    .select("id")
    .eq("team_id", teamId)
    .eq("invitee_id", memberId)
    .eq("status", "pending")
    .single()

  if (existingInvitation) {
    return { success: false, error: "Invitation already pending for this member" }
  }

  // Create new invitation
  const { error } = await supabase
    .from("team_invitations")
    .insert({
      team_id: teamId,
      inviter_id: user.id,
      invitee_id: memberId,
      event_id: eventId,
      invitation_token: crypto.randomUUID(),
      status: 'pending',
      message: `You have been invited to join team ${team.name} for ${event?.title} by ${profile?.full_name}`,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    })

  if (error) return { success: false, error: error.message }

  revalidatePath("/member/events")
  return { success: true, message: "Invitation sent successfully" }
}

// Get available members for invitation (not already in team or registered for event)
export async function getAvailableMembersForInvitation(teamId: string, eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { success: false, error: "Not authenticated" }

  // Verify user is team leader
  const { data: team } = await supabase
    .from("teams")
    .select("leader_id")
    .eq("id", teamId)
    .single()

  if (!team || team.leader_id !== user.id) {
    return { success: false, error: "Not authorized" }
  }

  // Get all registered users for this event
  const { data: registeredUsers, error: regError } = await supabase
    .from("event_registrations")
    .select("user_id, team_id, teams!inner(team_members!inner(member_id))")
    .eq("event_id", eventId)

  if (regError) return { success: false, error: "Failed to fetch registered users" }

  const registeredUserIds = registeredUsers.flatMap((reg) =>
    reg.user_id
      ? [reg.user_id]
      : Array.isArray(reg.teams)
        ? reg.teams.flatMap((team) =>
            Array.isArray(team.team_members) ? team.team_members.map((tm) => tm.member_id) : [],
          )
        : [],
  )

  // Get current team members
  const { data: teamMembers } = await supabase
    .from("team_members")
    .select("member_id")
    .eq("team_id", teamId)

  const teamMemberIds = teamMembers?.map(tm => tm.member_id) || []

  // Get users with pending invitations for this team
  const { data: pendingInvitations } = await supabase
    .from("team_invitations")
    .select("invitee_id")
    .eq("team_id", teamId)
    .eq("status", "pending")

  const pendingInviteeIds = pendingInvitations?.map(inv => inv.invitee_id) || []

  // Get all members excluding registered users, team members, and pending invitees
  const excludedIds = [...registeredUserIds, ...teamMemberIds, ...pendingInviteeIds, user.id]

  const { data: availableMembers, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .neq("role", "core")
    .not("id", "in", `(${excludedIds.join(",") || "null"})`)

  if (error) return { success: false, error: error.message }

  return { success: true, data: availableMembers || [] }
}