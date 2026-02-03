"use server"

import { createClient } from "../../../../../../../utils/supabase/server"

export async function getWorkshopRegistrations(workshopId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Unauthorized" }

  // Check if user is core team member
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'core') {
    return { success: false, error: "Unauthorized: Core team access required" }
  }

  try {
    // Get workshop details
    const { data: workshop, error: workshopError } = await supabase
      .from("events")
      .select("id, title, description")
      .eq("id", workshopId)
      .eq("mode", "workshop")
      .single()

    if (workshopError || !workshop) {
      return { success: false, error: "Workshop not found" }
    }

    // Get registrations
    const { data: registrations, error: regError } = await supabase
      .from("event_participants")
      .select(`
        id,
        user_id,
        status,
        attended,
        registered_at,
        user:profiles!user_id(full_name, email)
      `)
      .eq("event_id", workshopId)
      .order("registered_at", { ascending: false })

    if (regError) {
      return { success: false, error: regError.message }
    }

    return {
      success: true,
      data: {
        workshop,
        registrations: registrations || []
      }
    }

  } catch (error: any) {
    console.error('Get workshop registrations error:', error)
    return { success: false, error: "Failed to fetch registrations" }
  }
}

export async function exportRegistrationsToCsv(workshopId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Unauthorized" }

  try {
    // Get registrations
    const { data: registrations, error } = await supabase
      .from("event_participants")
      .select(`
        id,
        user_id,
        status,
        attended,
        registered_at,
        user:profiles!user_id(full_name, email)
      `)
      .eq("event_id", workshopId)
      .order("registered_at", { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    // Generate CSV
    const headers = ["#", "Name", "Email", "Registered At", "Status", "Attended"]
    const csvRows = [headers.join(",")]

    registrations?.forEach((reg: any, index) => {
      const user = reg.user
      const row = [
        index + 1,
        `"${user?.full_name || ""}"`,
        `"${user?.email || ""}"`,
        `"${new Date(reg.registered_at).toLocaleString()}"`,
        `"${reg.status || "registered"}"`,
        reg.attended ? "Yes" : "No"
      ]
      csvRows.push(row.join(","))
    })

    const csv = csvRows.join("\n")

    return {
      success: true,
      data: { csv }
    }

  } catch (error: any) {
    console.error('Export registrations error:', error)
    return { success: false, error: "Failed to export registrations" }
  }
}