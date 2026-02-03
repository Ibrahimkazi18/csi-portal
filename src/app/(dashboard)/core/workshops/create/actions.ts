"use server"

import { createClient } from "../../../../../../utils/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const workshopSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200, "Title too long"),
  description: z.string().min(20, "Description must be at least 20 characters").max(5000, "Description too long"),
  banner_url: z.string().url().optional().or(z.literal("")),
  category: z.string().optional(),
  max_participants: z.number().int().min(1, "Must have at least 1 participant").max(500, "Too many participants"),
  meeting_link: z.string().url().optional().or(z.literal("")),
  registration_deadline: z.date({
    message: "Registration deadline is required"
  }),
  start_date: z.date({
    message: "Start date is required"
  }),
  end_date: z.date({
    message: "End date is required"
  }),
  hosts: z.array(z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    designation: z.string().optional(),
    profile_id: z.string().optional()
  })).min(1, "At least one host is required").max(10, "Too many hosts")
}).refine(data => data.registration_deadline < data.start_date, {
  message: "Registration deadline must be before start date",
  path: ["registration_deadline"]
}).refine(data => data.start_date <= data.end_date, {
  message: "End date must be after or equal to start date",
  path: ["end_date"]
}).refine(data => data.start_date > new Date(), {
  message: "Start date must be in the future",
  path: ["start_date"]
})

type WorkshopFormData = z.infer<typeof workshopSchema>

export async function createWorkshop(data: WorkshopFormData) {
  const supabase = await createClient()
  
  console.log('Server: Received workshop data:', data)
  console.log('Server: Hosts data:', data.hosts)
  
  // Check authentication
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { success: false, error: "Not authenticated" }
  }

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
    // Validate the data
    const validatedData = workshopSchema.parse(data)
    console.log('Server: Validated data:', validatedData)
    console.log('Server: Validated hosts:', validatedData.hosts)

    // Create the workshop event
    const { data: workshop, error: workshopError } = await supabase
      .from('events')
      .insert({
        title: validatedData.title,
        description: validatedData.description,
        banner_url: validatedData.banner_url || null,
        category: validatedData.category || 'Workshop',
        type: 'individual',
        mode: 'workshop',
        source: 'portal',
        max_participants: validatedData.max_participants,
        meeting_link: validatedData.meeting_link || null,
        registration_deadline: validatedData.registration_deadline.toISOString(),
        start_date: validatedData.start_date.toISOString(),
        end_date: validatedData.end_date.toISOString(),
        status: 'upcoming',
        is_tournament: false,
        team_size: 1,
        created_by: user.id
      })
      .select()
      .single()

    if (workshopError) {
      console.error('Workshop creation error:', workshopError)
      return { success: false, error: `Failed to create workshop: ${workshopError.message}` }
    }

    console.log('Server: Workshop created:', workshop)

    // Add workshop hosts
    if (validatedData.hosts && validatedData.hosts.length > 0) {
      // Filter out hosts with empty names and prepare data
      const hostsToInsert = validatedData.hosts
        .filter(host => host.name && host.name.trim().length > 0)
        .map(host => ({
          event_id: workshop.id,
          name: host.name.trim(),
          designation: host.designation?.trim() || null,
          profile_id: host.profile_id?.trim() || null,
        }))

      console.log('Server: Hosts to insert:', hostsToInsert)

      if (hostsToInsert.length > 0) {
        const { data: insertedHosts, error: hostsError } = await supabase
          .from('workshop_hosts')
          .insert(hostsToInsert)
          .select()

        if (hostsError) {
          console.error('Hosts creation error:', hostsError)
          // Delete the workshop since hosts are required
          await supabase.from('events').delete().eq('id', workshop.id)
          return { success: false, error: `Failed to add workshop hosts: ${hostsError.message}` }
        }

        console.log('Server: Hosts inserted:', insertedHosts)
      } else {
        console.log('Server: No valid hosts to insert')
        // Delete the workshop since at least one host is required
        await supabase.from('events').delete().eq('id', workshop.id)
        return { success: false, error: "At least one host with a valid name is required" }
      }
    } else {
      console.log('Server: No hosts provided')
      // Delete the workshop since hosts are required
      await supabase.from('events').delete().eq('id', workshop.id)
      return { success: false, error: "At least one host is required" }
    }

    // Create audit log
    await supabase.from("event_audit_logs").insert({
      event_id: workshop.id,
      action: "workshop_created",
      performed_by: user.id,
      metadata: {
        title: validatedData.title,
        max_participants: validatedData.max_participants,
        hosts_count: validatedData.hosts?.length || 0
      }
    })

    revalidatePath('/core/workshops')
    return { success: true, data: workshop }

  } catch (error) {
    console.error('Create workshop error:', error)
    if (error instanceof z.ZodError) {
      console.error('Validation errors:', error.issues)
      return { success: false, error: error.issues[0].message }
    }
    return { success: false, error: "Failed to create workshop" }
  }
}