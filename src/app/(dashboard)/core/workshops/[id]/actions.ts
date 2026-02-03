"use server"

import { createClient } from "../../../../../../utils/supabase/server"
import { revalidatePath } from "next/cache"

export async function getWorkshopDetails(workshopId: string) {
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
    // Get workshop
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", workshopId)
      .eq("mode", "workshop")
      .single()

    if (eventError || !event) {
      return { success: false, error: "Workshop not found" }
    }

    // Get hosts
    const { data: hosts } = await supabase
      .from("workshop_hosts")
      .select("*")
      .eq("event_id", workshopId)

    // Get registration count
    const { count: registrationCount } = await supabase
      .from("event_participants")
      .select("*", { count: "exact", head: true })
      .eq("event_id", workshopId)

    // Get attendance count
    const { count: attendanceCount } = await supabase
      .from("event_participants")
      .select("*", { count: "exact", head: true })
      .eq("event_id", workshopId)
      .eq("attended", true)

    // Get recent registrations
    const { data: recentRegistrations } = await supabase
      .from("event_participants")
      .select(`
        id,
        registered_at,
        user:profiles!user_id(full_name, email)
      `)
      .eq("event_id", workshopId)
      .order("registered_at", { ascending: false })
      .limit(5)

    return {
      success: true,
      data: {
        event,
        hosts: hosts || [],
        registrationCount: registrationCount || 0,
        attendanceCount: attendanceCount || 0,
        recentRegistrations: recentRegistrations || []
      }
    }

  } catch (error: any) {
    console.error('Get workshop details error:', error)
    return { success: false, error: "Failed to fetch workshop details" }
  }
}

export async function completeWorkshop(workshopId: string) {
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
    // Get workshop current state
    const { data: workshop } = await supabase
      .from("events")
      .select("status")
      .eq("id", workshopId)
      .single()

    if (!workshop) {
      return { success: false, error: "Workshop not found" }
    }

    if (workshop.status === "completed") {
      return { success: false, error: "Workshop already completed" }
    }

    // Update status
    const { error } = await supabase
      .from("events")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq("id", workshopId)

    if (error) {
      return { success: false, error: error.message }
    }

    // Create audit log
    await supabase.from("event_audit_logs").insert({
      event_id: workshopId,
      action: "workshop_completed",
      performed_by: user.id,
      metadata: {
        completed_at: new Date().toISOString()
      }
    })

    revalidatePath(`/core/workshops/${workshopId}`)
    revalidatePath("/core/workshops")

    return { success: true, message: "Workshop completed successfully" }

  } catch (error: any) {
    console.error('Complete workshop error:', error)
    return { success: false, error: "Failed to complete workshop" }
  }
}

export async function updateWorkshop(workshopId: string, data: any) {
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
    // Update workshop event
    const { error: workshopError } = await supabase
      .from('events')
      .update({
        title: data.title,
        description: data.description,
        banner_url: data.banner_url || null,
        category: data.category || 'Workshop',
        max_participants: data.max_participants,
        meeting_link: data.meeting_link || null,
        status: data.status || 'upcoming',
        registration_deadline: data.registration_deadline.toISOString(),
        start_date: data.start_date.toISOString(),
        end_date: data.end_date.toISOString(),
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', workshopId)

    if (workshopError) {
      console.error('Workshop update error:', workshopError)
      return { success: false, error: `Failed to update workshop: ${workshopError.message}` }
    }

    // Delete existing hosts
    await supabase
      .from('workshop_hosts')
      .delete()
      .eq('event_id', workshopId)

    // Add new hosts
    if (data.hosts && data.hosts.length > 0) {
      const hostsToInsert = data.hosts
        .filter((host: any) => host.name && host.name.trim().length > 0)
        .map((host: any) => ({
          event_id: workshopId,
          name: host.name.trim(),
          designation: host.designation?.trim() || null,
          profile_id: host.profile_id?.trim() || null
        }))

      if (hostsToInsert.length > 0) {
        const { error: hostsError } = await supabase
          .from('workshop_hosts')
          .insert(hostsToInsert)

        if (hostsError) {
          console.error('Hosts update error:', hostsError)
          return { success: false, error: `Failed to update workshop hosts: ${hostsError.message}` }
        }
      }
    }

    // Create audit log
    await supabase.from("event_audit_logs").insert({
      event_id: workshopId,
      action: "workshop_updated",
      performed_by: user.id,
      metadata: {
        title: data.title,
        max_participants: data.max_participants,
        hosts_count: data.hosts?.length || 0
      }
    })

    revalidatePath(`/core/workshops/${workshopId}`)
    revalidatePath("/core/workshops")
    
    return { success: true, message: "Workshop updated successfully" }

  } catch (error: any) {
    console.error('Update workshop error:', error)
    return { success: false, error: "Failed to update workshop" }
  }
}