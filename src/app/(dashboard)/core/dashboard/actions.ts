"use server"

import { createClient } from "../../../../../utils/supabase/server"

export async function getDashboardStats() {
  const supabase = await createClient()
  
  // Verify core member
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "core") {
    return { success: false, error: "Unauthorized" }
  }

  try {
    // Get counts in parallel
    const [
      { count: totalEvents },
      { count: upcomingEvents },
      { count: activeMembers },
      { count: pendingQueries },
      { count: totalWorkshops },
      { count: completedEvents }
    ] = await Promise.all([
      supabase.from("events").select("*", { count: "exact", head: true }),
      supabase.from("events").select("*", { count: "exact", head: true })
        .in("status", ["upcoming", "registration_open"]),
      supabase.from("profiles").select("*", { count: "exact", head: true })
        .eq("role", "member"),
      supabase.from("queries").select("*", { count: "exact", head: true })
        .eq("status", "open"),
      supabase.from("events").select("*", { count: "exact", head: true })
        .eq("mode", "workshop"),
      supabase.from("events").select("*", { count: "exact", head: true })
        .eq("status", "completed")
    ])

    return {
      success: true,
      data: {
        totalEvents: totalEvents || 0,
        upcomingEvents: upcomingEvents || 0,
        activeMembers: activeMembers || 0,
        pendingQueries: pendingQueries || 0,
        totalWorkshops: totalWorkshops || 0,
        completedEvents: completedEvents || 0
      }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getRecentActivity() {
  const supabase = await createClient()
  
  try {
    // Get recent audit logs
    const { data, error } = await supabase
      .from("event_audit_logs")
      .select("*")
      .order("performed_at", { ascending: false })
      .limit(10)

    if (error) return { success: false, error: error.message }

    return { success: true, data: data || [] }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getUpcomingEvents() {
  const supabase = await createClient()
  
  try {
    // Get upcoming events with registration counts
    const { data, error } = await supabase
      .from("events")
      .select(`
        id,
        title,
        start_date,
        status,
        max_participants
      `)
      .in("status", ["upcoming", "registration_open"])
      .order("start_date", { ascending: true })
      .limit(10)

    if (error) return { success: false, error: error.message }

    // Get registration counts for each event
    const eventsWithCounts = await Promise.all(
      (data || []).map(async (event) => {
        const { count } = await supabase
          .from("event_registrations")
          .select("*", { count: "exact", head: true })
          .eq("event_id", event.id)

        return {
          ...event,
          registration_count: count || 0
        }
      })
    )

    return { success: true, data: eventsWithCounts }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getRecentQueries() {
  const supabase = await createClient()
  
  try {
    // Get recent open queries
    const { data, error } = await supabase
      .from("queries")
      .select(`
        id,
        subject,
        priority,
        created_at,
        profiles:member_id(full_name, email)
      `)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(5)

    if (error) return { success: false, error: error.message }

    return { success: true, data: data || [] }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getAllMembers() {
  const supabase = await createClient()
  
  // Verify core member
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "core") {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, member_role, created_at, is_core_team")
      .eq("role", "member")
      .order("created_at", { ascending: false })

    if (error) return { success: false, error: error.message }

    return { success: true, data: data || [] }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}