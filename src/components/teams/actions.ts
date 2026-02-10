"use server"

import { createClient } from "../../../utils/supabase/server"
import { revalidatePath } from "next/cache"

// Get all invitations sent by current user for a team
export async function getTeamInvitationStatus(teamId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { success: false, error: "Not authenticated" }

  // Get team to verify user is leader
  const { data: team } = await supabase
    .from("teams")
    .select("leader_id")
    .eq("id", teamId)
    .single()

  if (!team || team.leader_id !== user.id) {
    return { success: false, error: "Not authorized" }
  }

  // Get all invitations
  const { data: invitations, error } = await supabase
    .from("team_invitations")
    .select(`
      id,
      status,
      created_at,
      responded_at,
      expires_at,
      invitee_id,
      profiles:invitee_id(full_name, email)
    `)
    .eq("team_id", teamId)
    .order("created_at", { ascending: false })

  if (error) return { success: false, error: error.message }

  // Mark expired invitations and format data
  const now = new Date()
  const processedInvitations = invitations.map(inv => ({
    id: inv.id,
    invitee_name: inv.profiles?.full_name || "Unknown",
    invitee_email: inv.profiles?.email || "Unknown",
    status: inv.status === 'pending' && new Date(inv.expires_at) < now 
      ? 'expired' 
      : inv.status,
    created_at: inv.created_at,
    responded_at: inv.responded_at,
    expires_at: inv.expires_at,
    invitee_id: inv.invitee_id
  }))

  return { success: true, data: processedInvitations }
}

// Cancel a pending invitation
export async function cancelInvitation(invitationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { success: false, error: "Not authenticated" }

  // Verify user is the inviter
  const { data: invitation } = await supabase
    .from("team_invitations")
    .select("inviter_id, status")
    .eq("id", invitationId)
    .single()

  if (!invitation || invitation.inviter_id !== user.id) {
    return { success: false, error: "Not authorized" }
  }

  if (invitation.status !== 'pending') {
    return { success: false, error: "Can only cancel pending invitations" }
  }

  // Update status to cancelled
  const { error } = await supabase
    .from("team_invitations")
    .update({ 
      status: 'cancelled', 
      responded_at: new Date().toISOString() 
    })
    .eq("id", invitationId)

  if (error) return { success: false, error: error.message }

  return { success: true, message: "Invitation cancelled" }
}

// Reinvite after decline/expiry
export async function reinviteMember(teamId: string, memberId: string) {
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

  // Delete old invitation(s)
  await supabase
    .from("team_invitations")
    .delete()
    .eq("team_id", teamId)
    .eq("invitee_id", memberId)

  // Get event details
  const { data: event } = await supabase
    .from("events")
    .select("title")
    .eq("id", team.event_id)
    .single()

  // Create new invitation
  const { error } = await supabase
    .from("team_invitations")
    .insert({
      team_id: teamId,
      inviter_id: user.id,
      invitee_id: memberId,
      event_id: team.event_id,
      invitation_token: crypto.randomUUID(),
      status: 'pending',
      message: `New invitation to join team ${team.name} for ${event?.title}`,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    })

  if (error) return { success: false, error: error.message }

  return { success: true, message: "Invitation sent" }
}

// Get user's application status
export async function getMyApplicationStatus(eventId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { success: false, error: "Not authenticated" }

  let query = supabase
    .from("team_applications")
    .select(`
      id,
      status,
      created_at,
      team_id,
      event_id,
      teams(
        name,
        leader_id,
        profiles:leader_id(full_name, email)
      ),
      events(title, start_date)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (eventId) {
    query = query.eq("event_id", eventId)
  }

  const { data, error } = await query

  if (error) return { success: false, error: error.message }

  // Format data
  const formattedData = data.map(app => ({
    id: app.id,
    team_name: app.teams?.name || "Unknown Team",
    team_leader_name: app.teams?.profiles?.full_name || "Unknown Leader",
    event_title: app.events?.title || "Unknown Event",
    status: app.status,
    created_at: app.created_at,
    event_id: app.event_id
  }))

  return { success: true, data: formattedData }
}

// Withdraw application
export async function withdrawApplication(applicationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { success: false, error: "Not authenticated" }

  // Verify user owns application
  const { data: application } = await supabase
    .from("team_applications")
    .select("user_id, status")
    .eq("id", applicationId)
    .single()

  if (!application || application.user_id !== user.id) {
    return { success: false, error: "Not authorized" }
  }

  if (application.status !== 'pending') {
    return { success: false, error: "Can only withdraw pending applications" }
  }

  // Delete application
  const { error } = await supabase
    .from("team_applications")
    .delete()
    .eq("id", applicationId)

  if (error) return { success: false, error: error.message }

  revalidatePath("/member/events")
  return { success: true, message: "Application withdrawn" }
}