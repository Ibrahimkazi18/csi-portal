"use server"

import { createClient } from "../../../../../../../utils/supabase/server"
import { revalidatePath } from "next/cache"

export async function getAttendanceSheet(workshopId: string) {
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

    // Get participants
    const { data: participants, error } = await supabase
      .from("event_participants")
      .select(`
        id,
        user_id,
        attended,
        user:profiles!user_id(full_name, email)
      `)
      .eq("event_id", workshopId)
      .order("user(full_name)")

    if (error) {
      return { success: false, error: error.message }
    }

    return {
      success: true,
      data: { 
        workshop,
        participants: participants || [] 
      }
    }

  } catch (error: any) {
    console.error('Get attendance sheet error:', error)
    return { success: false, error: "Failed to fetch attendance sheet" }
  }
}

export async function updateAttendance(
  workshopId: string,
  attendanceData: Array<{ participantId: string; attended: boolean }>
) {
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
    // Update each participant's attendance
    for (const { participantId, attended } of attendanceData) {
      await supabase
        .from("event_participants")
        .update({
          attended,
          status: attended ? "confirmed" : "registered"
        })
        .eq("id", participantId)
        .eq("event_id", workshopId)
    }

    // Create audit log
    const attendedCount = attendanceData.filter(a => a.attended).length

    await supabase.from("event_audit_logs").insert({
      event_id: workshopId,
      action: "attendance_updated",
      performed_by: user.id,
      metadata: {
        total_participants: attendanceData.length,
        attended_count: attendedCount,
        attendance_rate: Math.round((attendedCount / attendanceData.length) * 100)
      }
    })

    revalidatePath(`/core/workshops/${workshopId}`)
    revalidatePath(`/core/workshops/${workshopId}/attendance`)

    return { success: true, message: "Attendance updated successfully" }

  } catch (error: any) {
    console.error('Update attendance error:', error)
    return { success: false, error: "Failed to update attendance" }
  }
}