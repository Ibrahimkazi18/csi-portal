'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../../../utils/supabase/server'
import { z } from 'zod'

// Validation schemas
const ManualEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  meeting_link: z.string().url().optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
  type: z.enum(['individual', 'team']),
  category: z.string().min(1, 'Category is required'),
  max_participants: z.number().min(1, 'Max participants must be at least 1'),
  registration_deadline: z.string().optional().transform(val => val === '' ? undefined : val),
  mode: z.enum(['event', 'workshop']),
  duration: z.number().optional(), // For workshops
  team_size: z.number().optional(), // For team events
  is_tournament: z.boolean().default(false),
})

const ParticipantSchema = z.object({
  email: z.string().email('Invalid email'),
  name: z.string().min(1, 'Name is required'),
  role: z.string().optional(),
})

const TeamSchema = z.object({
  name: z.string().min(1, 'Team name is required'),
  members: z.array(ParticipantSchema).min(1, 'At least one member is required'),
})

const WorkshopHostSchema = z.object({
  name: z.string().min(1, 'Host name is required'),
  designation: z.string().optional(),
})

const RoundSchema = z.object({
  title: z.string().min(1, 'Round title is required'),
  description: z.string().optional(),
  round_number: z.number().min(1, 'Round number must be at least 1'),
})

const WinnerSchema = z.object({
  position: z.number().min(1).max(3, 'Position must be 1, 2, or 3'),
  team_id: z.string().optional(),
  user_id: z.string().optional(),
})

// Check if user is core team member
async function checkCoreAccess() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: 'Not authenticated' } as const
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, member_role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'core') {
    return { success: false, error: 'Unauthorized: Core team access required' } as const
  }

  return { success: true, user, profile } as const
}

export async function createManualEvent(data: z.infer<typeof ManualEventSchema>) {
  const authCheck = await checkCoreAccess()
  if (!authCheck.success) {
    return authCheck
  }

  const supabase = await createClient()
  const { user } = authCheck

  try {
    // Validate input
    const validatedData = ManualEventSchema.parse(data)
    
    // Create the event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        title: validatedData.title,
        description: validatedData.description,
        start_date: validatedData.start_date,
        end_date: validatedData.end_date,
        meeting_link: validatedData.meeting_link || null,
        type: validatedData.type,
        category: validatedData.category,
        max_participants: validatedData.max_participants,
        registration_deadline: validatedData.registration_deadline || null,
        source: 'manual',
        mode: validatedData.mode,
        manual_status: 'draft',
        status: 'completed', // Manual events are for completed events
        team_size: validatedData.team_size || (validatedData.type === 'team' ? 2 : 1),
        is_tournament: validatedData.is_tournament,
        created_by: user?.id,
      })
      .select()
      .single()

    if (eventError) {
      console.error('Event creation error:', eventError)
      return { success: false, error: 'Failed to create event' }
    }

    // Log the action
    await supabase
      .from('event_audit_logs')
      .insert({
        event_id: event.id,
        action: 'manual_event_created',
        performed_by: user?.id,
        metadata: { event_data: validatedData }
      })

    revalidatePath('/core/events')
    return { success: true, event }
  } catch (error) {
    console.error('Manual event creation error:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data', details: error.name }
    }
    return { success: false, error: 'Failed to create manual event' }
  }
}

export async function addEventTeams(eventId: string, teams: z.infer<typeof TeamSchema>[]) {
  const authCheck = await checkCoreAccess()
  if (!authCheck.success) {
    return authCheck
  }

  const supabase = await createClient()
  const { user } = authCheck

  try {
    // Validate teams
    const validatedTeams = teams.map(t => TeamSchema.parse(t))
    
    // Get event details to validate team size
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('team_size, max_participants, type')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return { success: false, error: 'Event not found' }
    }

    if (event.type !== 'team') {
      return { success: false, error: 'Cannot add teams to individual events' }
    }

    const createdTeams = []
    const skippedTeams = []

    for (const team of validatedTeams) {
      // Validate team size
      if (team.members.length > event.team_size) {
        skippedTeams.push({ name: team.name, reason: `Team size exceeds limit of ${event.team_size}` })
        continue
      }

      // For manual events, we can create teams with external members
      // Check if members exist in profiles, but don't skip if they don't
      const memberIds = []
      const externalMembers = []

      for (const member of team.members) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('email', member.email)
          .single()

        if (profile) {
          memberIds.push(profile.id)
        } else {
          // For manual events, we'll track external members separately
          externalMembers.push(member)
        }
      }

      // Create team (use first existing member as leader, or null if all external)
      const { data: createdTeam, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: team.name,
          leader_id: memberIds.length > 0 ? memberIds[0] : null,
          event_id: eventId,
          is_tournament: false,
        })
        .select()
        .single()

      if (teamError) {
        console.error('Team creation error:', teamError)
        skippedTeams.push({ name: team.name, reason: 'Failed to create team' })
        continue
      }

      // Add existing members to team_members table
      if (memberIds.length > 0) {
        const teamMemberInserts = memberIds.map(memberId => ({
          team_id: createdTeam.id,
          member_id: memberId,
        }))

        const { error: membersError } = await supabase
          .from('team_members')
          .insert(teamMemberInserts)

        if (membersError) {
          console.error('Team members insertion error:', membersError)
          // Don't rollback, just log the error
        }
      }

      // Add external members to event_participants table
      if (externalMembers.length > 0) {
        const externalParticipants = externalMembers.map(member => ({
          event_id: eventId,
          email: member.email,
          name: member.name,
          role: member.role || 'Student',
          user_id: null,
          attendance_status: 'registered'
        }))

        const { error: externalError } = await supabase
          .from('event_participants')
          .insert(externalParticipants)

        if (externalError) {
          console.error('External participants insertion error:', externalError)
          // Don't rollback, just log the error
        }
      }

      // Register team for event
      const { error: regError } = await supabase
        .from('event_registrations')
        .insert({
          event_id: eventId,
          team_id: createdTeam.id,
          registration_type: 'team',
          status: 'registered',
        })

      if (regError) {
        // Rollback team and members
        await supabase.from('team_members').delete().eq('team_id', createdTeam.id)
        await supabase.from('teams').delete().eq('id', createdTeam.id)
        skippedTeams.push({ name: team.name, reason: 'Failed to register team for event' })
        continue
      }

      createdTeams.push(createdTeam)
    }

    // Log the action
    await supabase
      .from('event_audit_logs')
      .insert({
        event_id: eventId,
        action: 'teams_added',
        performed_by: user?.id,
        metadata: { 
          teams_created: createdTeams.length,
          teams_skipped: skippedTeams.length,
          skipped_details: skippedTeams
        }
      })

    revalidatePath('/core/events')
    
    let message = `Successfully created ${createdTeams.length} teams`
    if (skippedTeams.length > 0) {
      message += `. ${skippedTeams.length} teams were skipped`
    }

    return { 
      success: true, 
      message,
      created: createdTeams.length,
      skipped: skippedTeams.length,
      skippedDetails: skippedTeams
    }
  } catch (error) {
    console.error('Add teams error:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid team data', details: error.name }
    }
    return { success: false, error: 'Failed to add teams' }
  }
}

export async function addWorkshopHosts(eventId: string, hosts: z.infer<typeof WorkshopHostSchema>[]) {
  const authCheck = await checkCoreAccess()
  if (!authCheck.success) {
    return authCheck
  }

  const supabase = await createClient()
  const { user } = authCheck

  try {
    // Validate hosts
    const validatedHosts = hosts.map(h => WorkshopHostSchema.parse(h))
    
    // Insert hosts
    const hostsWithEventId = validatedHosts.map(host => ({
      event_id: eventId,
      name: host.name,
      designation: host.designation || null,
      profile_id: null // We don't link to profiles for manual entries
    }))

    const { error: hostsError } = await supabase
      .from('workshop_hosts')
      .insert(hostsWithEventId)

    if (hostsError) {
      console.error('Hosts insertion error:', hostsError)
      return { success: false, error: 'Failed to add hosts' }
    }

    // Log the action
    await supabase
      .from('event_audit_logs')
      .insert({
        event_id: eventId,
        action: 'hosts_added',
        performed_by: user?.id,
        metadata: { hosts_count: hosts.length }
      })

    revalidatePath('/core/events')
    return { success: true }
  } catch (error) {
    console.error('Add hosts error:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid host data', details: error.name }
    }
    return { success: false, error: 'Failed to add hosts' }
  }
}

export async function finalizeManualEvent(eventId: string) {
  const authCheck = await checkCoreAccess()
  if (!authCheck.success) {
    return authCheck
  }

  const supabase = await createClient()
  const { user } = authCheck

  try {
    // Update event status
    const { error: updateError } = await supabase
      .from('events')
      .update({
        manual_status: 'finalized',
        status: 'completed'
      })
      .eq('id', eventId)
      .eq('source', 'manual')

    if (updateError) {
      console.error('Event finalization error:', updateError)
      return { success: false, error: 'Failed to finalize event' }
    }

    // Log the action
    await supabase
      .from('event_audit_logs')
      .insert({
        event_id: eventId,
        action: 'event_finalized',
        performed_by: user?.id,
        metadata: { finalized_at: new Date().toISOString() }
      })

    revalidatePath('/core/events')
    revalidatePath('/member/events')
    return { success: true }
  } catch (error) {
    console.error('Finalize event error:', error)
    return { success: false, error: 'Failed to finalize event' }
  }
}

export async function getAvailableMembers() {
  const authCheck = await checkCoreAccess()
  if (!authCheck.success) {
    return authCheck
  }

  const supabase = await createClient()

  try {
    const { data: members, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'member')
      .order('full_name', { ascending: true })

    if (error) {
      console.error('Get members error:', error)
      return { success: false, error: 'Failed to fetch members' }
    }

    return { success: true, members }
  } catch (error) {
    console.error('Get members error:', error)
    return { success: false, error: 'Failed to fetch members' }
  }
}

export async function getManualEvents() {
  const authCheck = await checkCoreAccess()
  if (!authCheck.success) {
    return authCheck
  }

  const supabase = await createClient()

  try {
    // First, get events with basic registration data
    const { data: events, error } = await supabase
      .from('events')
      .select(`
        *,
        event_registrations(
          id,
          registration_type,
          team_id,
          user_id
        ),
        workshop_hosts(*)
      `)
      .eq('source', 'manual')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Get manual events error:', error)
      return { success: false, error: 'Failed to fetch manual events' }
    }

    // Try to fetch event_participants separately with better error handling
    let eventsWithParticipants = events
    try {
      // Check if event_participants table exists by trying a simple query
      const { data: testQuery, error: testError } = await supabase
        .from('event_participants')
        .select('id')
        .limit(1)

      if (!testError) {
        // Table exists, fetch participant data for each event
        for (const event of events) {
          const { data: participants, error: participantsError } = await supabase
            .from('event_participants')
            .select('id, user_id, email, name')
            .eq('event_id', event.id)

          if (!participantsError && participants) {
            event.event_participants = participants
          }
        }
      }
    } catch (participantsError: any) {
      console.warn('event_participants table not accessible, using fallback data:', participantsError?.message)
      // Continue without participant data if table doesn't exist or is inaccessible
    }

    return { success: true, events: eventsWithParticipants }
  } catch (error: any) {
    console.error('Get manual events error:', error)
    return { success: false, error: 'Failed to fetch manual events' }
  }
}

export async function addEventParticipants(eventId: string, participants: z.infer<typeof ParticipantSchema>[]) {
  const authCheck = await checkCoreAccess()
  if (!authCheck.success) {
    return authCheck
  }

  const supabase = await createClient()
  const { user } = authCheck

  try {
    // Validate participants
    const validatedParticipants = participants.map(p => ParticipantSchema.parse(p))
    
    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('type, max_participants, source')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return { success: false, error: 'Event not found' }
    }

    if (event.type !== 'individual') {
      return { success: false, error: 'Cannot add individual participants to team events' }
    }

    // For manual events, use event_participants table to support external participants
    if (event.source === 'manual') {
      try {
        const participantsToAdd = validatedParticipants.map(participant => ({
          event_id: eventId,
          email: participant.email,
          name: participant.name,
          role: participant.role || 'Student',
          user_id: null, // Will be set if we find a matching profile
          attendance_status: 'registered'
        }))

        // Try to link to existing profiles where possible
        for (const participant of participantsToAdd) {
          const { data: existingUser } = await supabase
            .from('profiles')
            .select('id, full_name')
            .eq('email', participant.email)
            .single()

          if (existingUser) {
            participant.user_id = existingUser.id
            participant.name = existingUser.full_name // Use profile name if available
          }
        }

        // Insert into event_participants table
        const { error: participantsError } = await supabase
          .from('event_participants')
          .insert(participantsToAdd)

        if (participantsError) {
          console.error('Participants insertion error:', participantsError)
          // If event_participants table doesn't exist, fall back to event_registrations
          if (participantsError.code === '42P01' || participantsError.code === '42703') {
            console.warn('event_participants table not found, falling back to event_registrations')
            return await addParticipantsToRegistrations(supabase, eventId, validatedParticipants, user)
          }
          return { success: false, error: 'Failed to add participants' }
        }

        // Log the action
        await supabase
          .from('event_audit_logs')
          .insert({
            event_id: eventId,
            action: 'participants_added',
            performed_by: user?.id,
            metadata: { 
              participants_added: participantsToAdd.length,
              participant_emails: participantsToAdd.map(p => p.email)
            }
          })

        revalidatePath('/core/events')
        return { 
          success: true, 
          message: `Successfully added ${participantsToAdd.length} participants`,
          added: participantsToAdd.length,
          skipped: 0 
        }
      } catch (error: any) {
        console.error('Error adding participants to event_participants:', error)
        // If event_participants table doesn't exist, fall back to event_registrations
        if (error.code === '42P01' || error.code === '42703') {
          console.warn('event_participants table not found, falling back to event_registrations')
          return await addParticipantsToRegistrations(supabase, eventId, validatedParticipants, user)
        }
        throw error
      }
    }

    // For portal events, use the original logic with event_registrations
    const participantsToAdd = []
    const skippedParticipants = []

    for (const participant of validatedParticipants) {
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('email', participant.email)
        .single()

      if (existingUser) {
        // Check if already registered
        const { data: existingRegistration } = await supabase
          .from('event_registrations')
          .select('id')
          .eq('event_id', eventId)
          .eq('user_id', existingUser.id)
          .single()

        if (!existingRegistration) {
          participantsToAdd.push({
            event_id: eventId,
            user_id: existingUser.id,
            registration_type: 'individual',
            status: 'registered',
          })
        }
      } else {
        skippedParticipants.push(participant)
      }
    }

    // Insert participants
    if (participantsToAdd.length > 0) {
      const { error: participantsError } = await supabase
        .from('event_registrations')
        .insert(participantsToAdd)

      if (participantsError) {
        console.error('Participants insertion error:', participantsError)
        return { success: false, error: 'Failed to add participants' }
      }
    }

    // Log the action
    await supabase
      .from('event_audit_logs')
      .insert({
        event_id: eventId,
        action: 'participants_added',
        performed_by: user?.id,
        metadata: { 
          participants_added: participantsToAdd.length,
          participants_skipped: skippedParticipants.length,
          skipped_emails: skippedParticipants.map(p => p.email)
        }
      })

    revalidatePath('/core/events')
    
    let message = `Successfully added ${participantsToAdd.length} participants`
    if (skippedParticipants.length > 0) {
      message += `. ${skippedParticipants.length} participants were skipped (not found in system)`
    }

    return { 
      success: true, 
      message,
      added: participantsToAdd.length,
      skipped: skippedParticipants.length 
    }
  } catch (error) {
    console.error('Add participants error:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid participant data', details: error.name }
    }
    return { success: false, error: 'Failed to add participants' }
  }
}

export async function addEventRounds(eventId: string, rounds: z.infer<typeof RoundSchema>[]) {
  const authCheck = await checkCoreAccess()
  if (!authCheck.success) {
    return authCheck
  }

  const supabase = await createClient()
  const { user } = authCheck

  try {
    // Validate rounds
    const validatedRounds = rounds.map(r => RoundSchema.parse(r))
    
    // Check for existing rounds to avoid duplicates
    const { data: existingRounds, error: fetchError } = await supabase
      .from('event_rounds')
      .select('round_number')
      .eq('event_id', eventId)

    if (fetchError) {
      return { success: false, error: 'Failed to fetch existing rounds' }
    }

    const existingRoundNumbers = existingRounds.map(r => r.round_number)
    const newRounds = validatedRounds.filter(r => !existingRoundNumbers.includes(r.round_number))

    if (newRounds.length === 0) {
      return { success: false, error: 'No new rounds to add' }
    }

    // Insert new rounds
    const roundsToInsert = newRounds.map(round => ({
      event_id: eventId,
      title: round.title,
      description: round.description || '',
      round_number: round.round_number,
    }))

    const { data: createdRounds, error: insertError } = await supabase
      .from('event_rounds')
      .insert(roundsToInsert)
      .select()

    if (insertError) {
      console.error('Rounds insertion error:', insertError)
      return { success: false, error: 'Failed to create rounds' }
    }

    // Log the action
    await supabase
      .from('event_audit_logs')
      .insert({
        event_id: eventId,
        action: 'rounds_added',
        performed_by: user?.id,
        metadata: { rounds_count: createdRounds.length }
      })

    revalidatePath('/core/events')
    return { success: true, rounds: createdRounds }
  } catch (error) {
    console.error('Add rounds error:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid round data', details: error.name }
    }
    return { success: false, error: 'Failed to add rounds' }
  }
}

export async function setEventProgress(eventId: string, progressData: {
  team_id?: string
  user_id?: string
  round_id: string
  position?: number
  eliminated?: boolean
}[]) {
  const authCheck = await checkCoreAccess()
  if (!authCheck.success) {
    return authCheck
  }

  const supabase = await createClient()
  const { user } = authCheck

  try {
    // Clear existing progress for this event
    await supabase
      .from('event_progress')
      .delete()
      .eq('event_id', eventId)

    // Insert new progress data
    const progressInserts = progressData.map(progress => ({
      event_id: eventId,
      team_id: progress.team_id || null,
      user_id: progress.user_id || null,
      round_id: progress.round_id,
      position: progress.position || null,
      eliminated: progress.eliminated || false,
      moved_at: new Date().toISOString(),
    }))

    const { error: progressError } = await supabase
      .from('event_progress')
      .insert(progressInserts)

    if (progressError) {
      console.error('Progress insertion error:', progressError)
      return { success: false, error: 'Failed to set event progress' }
    }

    // Log the action
    await supabase
      .from('event_audit_logs')
      .insert({
        event_id: eventId,
        action: 'progress_updated',
        performed_by: user?.id,
        metadata: { progress_entries: progressInserts.length }
      })

    revalidatePath('/core/events')
    return { success: true }
  } catch (error) {
    console.error('Set progress error:', error)
    return { success: false, error: 'Failed to set event progress' }
  }
}

export async function setEventWinners(eventId: string, winners: z.infer<typeof WinnerSchema>[]) {
  const authCheck = await checkCoreAccess()
  if (!authCheck.success) {
    return authCheck
  }

  const supabase = await createClient()
  const { user } = authCheck

  try {
    // Validate winners
    const validatedWinners = winners.map(w => WinnerSchema.parse(w))
    
    // Clear existing winners
    await supabase
      .from('event_winners')
      .delete()
      .eq('event_id', eventId)

    // Insert new winners
    const winnersToInsert = validatedWinners.map(winner => ({
      event_id: eventId,
      position: winner.position,
      team_id: winner.team_id || null,
      user_id: winner.user_id || null,
    }))

    const { error: winnersError } = await supabase
      .from('event_winners')
      .insert(winnersToInsert)

    if (winnersError) {
      console.error('Winners insertion error:', winnersError)
      return { success: false, error: 'Failed to set winners' }
    }

    // Log the action
    await supabase
      .from('event_audit_logs')
      .insert({
        event_id: eventId,
        action: 'winners_set',
        performed_by: user?.id,
        metadata: { winners_count: winnersToInsert.length }
      })

    revalidatePath('/core/events')
    return { success: true }
  } catch (error) {
    console.error('Set winners error:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid winner data', details: error.name }
    }
    return { success: false, error: 'Failed to set winners' }
  }
}

export async function getManualEventDetails(eventId: string) {
  const authCheck = await checkCoreAccess()
  if (!authCheck.success) {
    return authCheck
  }

  const supabase = await createClient()

  try {
    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .eq('source', 'manual')
      .single()

    if (eventError || !event) {
      return { success: false, error: 'Manual event not found' }
    }

    // Get rounds
    const { data: rounds, error: roundsError } = await supabase
      .from('event_rounds')
      .select('*')
      .eq('event_id', eventId)
      .order('round_number', { ascending: true })

    // Get registrations (teams and individuals)
    const { data: registrations, error: regError } = await supabase
      .from('event_registrations')
      .select(`
        *,
        teams(
          id,
          name,
          team_members(
            member_id,
            profiles(full_name, email)
          )
        ),
        profiles(full_name, email)
      `)
      .eq('event_id', eventId)

    // Get workshop hosts
    const { data: hosts, error: hostsError } = await supabase
      .from('workshop_hosts')
      .select('*')
      .eq('event_id', eventId)

    // Get progress
    const { data: progress, error: progressError } = await supabase
      .from('event_progress')
      .select(`
        *,
        teams(name),
        profiles(full_name, email),
        event_rounds(title, round_number)
      `)
      .eq('event_id', eventId)

    // Get winners
    const { data: winners, error: winnersError } = await supabase
      .from('event_winners')
      .select(`
        *,
        teams(name),
        profiles(full_name, email)
      `)
      .eq('event_id', eventId)
      .order('position', { ascending: true })

    return {
      success: true,
      data: {
        event,
        rounds: rounds || [],
        registrations: registrations || [],
        hosts: hosts || [],
        progress: progress || [],
        winners: winners || [],
      }
    }
  } catch (error) {
    console.error('Get manual event details error:', error)
    return { success: false, error: 'Failed to fetch event details' }
  }
}

export async function updateManualEvent(eventId: string, data: Partial<z.infer<typeof ManualEventSchema>>) {
  const authCheck = await checkCoreAccess()
  if (!authCheck.success) {
    return authCheck
  }

  const supabase = await createClient()
  const { user } = authCheck

  try {
    // Update event
    const { error: updateError } = await supabase
      .from('events')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
        updated_by: user?.id,
      })
      .eq('id', eventId)
      .eq('source', 'manual')

    if (updateError) {
      console.error('Event update error:', updateError)
      return { success: false, error: 'Failed to update event' }
    }

    // Log the action
    await supabase
      .from('event_audit_logs')
      .insert({
        event_id: eventId,
        action: 'event_updated',
        performed_by: user?.id,
        metadata: { updated_fields: Object.keys(data) }
      })

    revalidatePath('/core/events')
    return { success: true }
  } catch (error) {
    console.error('Update manual event error:', error)
    return { success: false, error: 'Failed to update event' }
  }
}

export async function createComprehensiveManualEvent(data: {
  eventData: z.infer<typeof ManualEventSchema>
  rounds?: z.infer<typeof RoundSchema>[]
  participants?: z.infer<typeof ParticipantSchema>[]
  teams?: z.infer<typeof TeamSchema>[]
  hosts?: z.infer<typeof WorkshopHostSchema>[]
  progress?: any[]
  winners?: z.infer<typeof WinnerSchema>[]
}) {
  const authCheck = await checkCoreAccess()
  if (!authCheck.success) {
    return authCheck
  }

  const supabase = await createClient()
  const { user } = authCheck

  try {
    // Validate event data
    const validatedEventData = ManualEventSchema.parse(data.eventData)
    
    // Create the event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        title: validatedEventData.title,
        description: validatedEventData.description,
        start_date: validatedEventData.start_date,
        end_date: validatedEventData.end_date,
        meeting_link: validatedEventData.meeting_link || null,
        type: validatedEventData.type,
        category: validatedEventData.category,
        max_participants: validatedEventData.max_participants,
        registration_deadline: validatedEventData.registration_deadline || null,
        source: 'manual',
        mode: validatedEventData.mode,
        manual_status: 'draft',
        status: 'completed',
        team_size: validatedEventData.team_size || (validatedEventData.type === 'team' ? 2 : 1),
        is_tournament: validatedEventData.is_tournament,
        created_by: user?.id,
      })
      .select()
      .single()

    if (eventError) {
      console.error('Event creation error:', eventError)
      return { success: false, error: 'Failed to create event' }
    }

    const eventId = event.id

    // Add rounds if provided
    if (data.rounds && data.rounds.length > 0) {
      const roundsResult = await addEventRounds(eventId, data.rounds)
      if (!roundsResult.success) {
        console.error('Failed to add rounds:', roundsResult.error)
      }
    }

    // Add participants or teams
    if (data.eventData.type === 'individual' && data.participants && data.participants.length > 0) {
      const participantsResult = await addEventParticipants(eventId, data.participants)
      if (!participantsResult.success) {
        console.error('Failed to add participants:', participantsResult.error)
      }
    } else if (data.eventData.type === 'team' && data.teams && data.teams.length > 0) {
      const teamsResult = await addEventTeams(eventId, data.teams)
      if (!teamsResult.success) {
        console.error('Failed to add teams:', teamsResult.error)
      }
    }

    // Add workshop hosts if provided
    if (data.hosts && data.hosts.length > 0) {
      const hostsResult = await addWorkshopHosts(eventId, data.hosts)
      if (!hostsResult.success) {
        console.error('Failed to add hosts:', hostsResult.error)
      }
    }

    // Add progress if provided
    if (data.progress && data.progress.length > 0) {
      const progressResult = await setEventProgress(eventId, data.progress)
      if (!progressResult.success) {
        console.error('Failed to set progress:', progressResult.error)
      }
    }

    // Add winners if provided
    if (data.winners && data.winners.length > 0) {
      const winnersResult = await setEventWinners(eventId, data.winners)
      if (!winnersResult.success) {
        console.error('Failed to set winners:', winnersResult.error)
      }
    }

    // Log the action
    await supabase
      .from('event_audit_logs')
      .insert({
        event_id: eventId,
        action: 'comprehensive_manual_event_created',
        performed_by: user?.id,
        metadata: { 
          event_data: validatedEventData,
          components_added: {
            rounds: data.rounds?.length || 0,
            participants: data.participants?.length || 0,
            teams: data.teams?.length || 0,
            hosts: data.hosts?.length || 0,
            progress_entries: data.progress?.length || 0,
            winners: data.winners?.length || 0
          }
        }
      })

    revalidatePath('/core/events')
    return { success: true, event, eventId }
  } catch (error) {
    console.error('Comprehensive manual event creation error:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data', details: error.issues }
    }
    return { success: false, error: 'Failed to create comprehensive manual event' }
  }
}

export async function deleteManualEvent(eventId: string) {
  const authCheck = await checkCoreAccess()
  if (!authCheck.success) {
    return authCheck
  }

  const supabase = await createClient()
  const { user, profile } = authCheck

  // Only President can delete events
  if (profile.member_role !== 'president') {
    return { success: false, error: 'Only President can delete events' }
  }

  try {
    // Delete event (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)
      .eq('source', 'manual')

    if (deleteError) {
      console.error('Event deletion error:', deleteError)
      return { success: false, error: 'Failed to delete event' }
    }

    revalidatePath('/core/events')
    return { success: true }
  } catch (error) {
    console.error('Delete manual event error:', error)
    return { success: false, error: 'Failed to delete event' }
  }
}
export async function getProgressionData(eventId: string) {
  const authCheck = await checkCoreAccess()
  if (!authCheck.success) {
    return authCheck
  }

  const supabase = await createClient()

  try {
    // Get event details
    const { data: event } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single()

    if (!event) {
      return { success: false, error: "Event not found" }
    }

    // Get rounds
    const { data: rounds } = await supabase
      .from("event_rounds")
      .select("*")
      .eq("event_id", eventId)
      .order("round_number")

    // Get participants
    const { data: participants } = await supabase
      .from("event_participants")
      .select(`
        id,
        user_id,
        profiles!inner(full_name),
        attended
      `)
      .eq("event_id", eventId)

    const { data: teams } = await supabase
      .from("teams")
      .select(`
        id,
        name,
        team_members(
          member_id,
          profiles(full_name)
        )
      `)
      .eq("event_id", eventId)

    // Get current progress
    const { data: progress } = await supabase
      .from("event_progress")
      .select("*")
      .eq("event_id", eventId)

    // Structure data
    const structuredRounds = rounds?.map(round => ({
      id: round.id,
      title: round.title,
      round_number: round.round_number,
      participants: []
    })) || []

    // Organize participants by their current round
    const unassigned: any[] = []
    const eliminated: any[] = []

    if (event.type === 'team') {
      teams?.forEach((team: any) => {
        const teamProgress = progress?.find(p => p.team_id === team.id)
        const participantData = {
          id: team.id,
          team_id: team.id,
          team_name: team.name,
          type: 'team',
          members: team.team_members?.map((tm: any) => tm.profiles?.full_name) || [],
          current_round_id: teamProgress?.round_id,
          eliminated: teamProgress?.eliminated
        }

        if (teamProgress?.eliminated) {
          eliminated.push(participantData)
        } else if (teamProgress?.round_id) {
          const round = structuredRounds.find(r => r.id === teamProgress.round_id)
          if (round) {
            (round as any).participants.push(participantData)
          }
        } else {
          unassigned.push(participantData)
        }
      })
    } else {
      participants?.forEach((participant: any) => {
        const userProgress = progress?.find(p => p.user_id === participant.user_id)
        const participantData = {
          id: participant.id,
          user_id: participant.user_id,
          user_name: participant.profiles?.full_name,
          type: 'individual',
          current_round_id: userProgress?.round_id,
          eliminated: userProgress?.eliminated
        }

        if (userProgress?.eliminated) {
          eliminated.push(participantData)
        } else if (userProgress?.round_id) {
          const round = structuredRounds.find(r => r.id === userProgress.round_id)
          if (round) {
            (round as any).participants.push(participantData)
          }
        } else {
          unassigned.push(participantData)
        }
      })
    }

    return {
      success: true,
      data: {
        event,
        rounds: structuredRounds,
        unassigned,
        eliminated
      }
    }
  } catch (error) {
    console.error('Get progression data error:', error)
    return { success: false, error: 'Failed to fetch progression data' }
  }
}

export async function moveParticipantToRound({
  eventId,
  participantId,
  participantType,
  targetRoundId
}: {
  eventId: string
  participantId: string
  participantType: 'team' | 'individual'
  targetRoundId: string | 'eliminated'
}) {
  const authCheck = await checkCoreAccess()
  if (!authCheck.success) {
    return authCheck
  }

  const supabase = await createClient()
  const { user } = authCheck

  try {
    // If moving to eliminated
    if (targetRoundId === 'eliminated') {
      const { error } = await supabase
        .from("event_progress")
        .update({
          eliminated: true,
          eliminated_at: new Date().toISOString()
        })
        .eq("event_id", eventId)
        .eq(participantType === 'team' ? 'team_id' : 'user_id', participantId)

      if (error) return { success: false, error: error.message }
      
      return { success: true, message: "Marked as eliminated" }
    }

    // Delete existing progress
    await supabase
      .from("event_progress")
      .delete()
      .eq("event_id", eventId)
      .eq(participantType === 'team' ? 'team_id' : 'user_id', participantId)

    // Insert new progress
    const { error } = await supabase
      .from("event_progress")
      .insert({
        event_id: eventId,
        round_id: targetRoundId,
        [participantType === 'team' ? 'team_id' : 'user_id']: participantId,
        moved_at: new Date().toISOString(),
        eliminated: false
      })

    if (error) return { success: false, error: error.message }

    // Log audit
    await supabase.from("event_audit_logs").insert({
      event_id: eventId,
      action: 'participant_moved',
      performed_by: user?.id,
      metadata: {
        participant_id: participantId,
        participant_type: participantType,
        target_round_id: targetRoundId
      }
    })

    return { success: true, message: "Participant moved successfully" }
  } catch (error) {
    console.error('Move participant error:', error)
    return { success: false, error: 'Failed to move participant' }
  }
}

export async function getEventFinalists(eventId: string) {
  const authCheck = await checkCoreAccess()
  if (!authCheck.success) {
    return authCheck
  }

  const supabase = await createClient()

  try {
    // Get event
    const { data: event } = await supabase
      .from("events")
      .select("*, event_rounds(*)")
      .eq("id", eventId)
      .single()

    if (!event) {
      return { success: false, error: "Event not found" }
    }

    let finalists: any[] = []

    // Get participants from final round
    const finalRound = event.event_rounds?.sort((a: any, b: any) => b.round_number - a.round_number)[0]

    if (finalRound) {
      const { data: progress } = await supabase
        .from("event_progress")
        .select(`
          team_id,
          user_id,
          teams(id, name, team_members(profiles(full_name))),
          profiles(id, full_name)
        `)
        .eq("event_id", eventId)
        .eq("round_id", finalRound.id)
        .eq("eliminated", false)

      finalists = progress?.map((p: any) => ({
        id: p.team_id || p.user_id,
        team_id: p.team_id,
        user_id: p.user_id,
        team_name: p.teams?.name,
        user_name: p.profiles?.full_name,
        type: p.team_id ? 'team' : 'individual',
        members: p.teams?.team_members?.map((tm: any) => tm.profiles?.full_name) || []
      })) || []
    }

    // If no finalists in final round, get all participants
    if (finalists.length === 0) {
      if (event.type === 'team') {
        const { data: teams } = await supabase
          .from("teams")
          .select(`
            id,
            name,
            team_members(profiles(full_name))
          `)
          .eq("event_id", eventId)

        finalists = teams?.map((t: any) => ({
          id: t.id,
          team_id: t.id,
          team_name: t.name,
          type: 'team',
          members: t.team_members?.map((tm: any) => tm.profiles?.full_name) || []
        })) || []
      } else {
        const { data: participants } = await supabase
          .from("event_participants")
          .select(`
            user_id,
            profiles(id, full_name)
          `)
          .eq("event_id", eventId)

        finalists = participants?.map((p: any) => ({
          id: p.user_id,
          user_id: p.user_id,
          user_name: p.profiles?.full_name,
          type: 'individual'
        })) || []
      }
    }

    // Get existing winners
    const { data: existingWinners } = await supabase
      .from("event_winners")
      .select("*")
      .eq("event_id", eventId)

    return {
      success: true,
      data: {
        event,
        finalists,
        existingWinners: existingWinners || []
      }
    }
  } catch (error) {
    console.error('Get finalists error:', error)
    return { success: false, error: 'Failed to fetch finalists' }
  }
}

export async function saveEventWinners({
  eventId,
  winners
}: {
  eventId: string
  winners: Array<{
    position: number
    team_id?: string
    user_id?: string
    points_awarded?: number
    prize?: string
  }>
}) {
  const authCheck = await checkCoreAccess()
  if (!authCheck.success) {
    return authCheck
  }

  const supabase = await createClient()
  const { user } = authCheck

  try {
    // Delete existing winners
    await supabase.from("event_winners").delete().eq("event_id", eventId)

    // Insert new winners
    const winnerEntries = winners.map(w => ({
      event_id: eventId,
      position: w.position,
      team_id: w.team_id || null,
      user_id: w.user_id || null,
      points_awarded: w.points_awarded || 0,
      prize: w.prize || null
    }))

    const { error: winnersError } = await supabase
      .from("event_winners")
      .insert(winnerEntries)

    if (winnersError) {
      return { success: false, error: winnersError.message }
    }

    // Audit log
    await supabase.from("event_audit_logs").insert({
      event_id: eventId,
      action: 'winners_declared',
      performed_by: user?.id,
      metadata: {
        winner_count: winners.length,
        winners: winners
      }
    })

    return { success: true, message: "Winners saved successfully" }
  } catch (error) {
    console.error('Save winners error:', error)
    return { success: false, error: 'Failed to save winners' }
  }
}
// Fallback function for when event_participants table doesn't exist
async function addParticipantsToRegistrations(supabase: any, eventId: string, validatedParticipants: any[], user: any) {
  const participantsToAdd = []
  const skippedParticipants = []

  for (const participant of validatedParticipants) {
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('email', participant.email)
      .single()

    if (existingUser) {
      // Check if already registered
      const { data: existingRegistration } = await supabase
        .from('event_registrations')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', existingUser.id)
        .single()

      if (!existingRegistration) {
        participantsToAdd.push({
          event_id: eventId,
          user_id: existingUser.id,
          registration_type: 'individual',
          status: 'registered',
        })
      }
    } else {
      skippedParticipants.push(participant)
    }
  }

  // Insert participants
  if (participantsToAdd.length > 0) {
    const { error: participantsError } = await supabase
      .from('event_registrations')
      .insert(participantsToAdd)

    if (participantsError) {
      console.error('Participants insertion error:', participantsError)
      return { success: false, error: 'Failed to add participants' }
    }
  }

  // Log the action
  try {
    await supabase
      .from('event_audit_logs')
      .insert({
        event_id: eventId,
        action: 'participants_added',
        performed_by: user?.id,
        metadata: { 
          participants_added: participantsToAdd.length,
          participants_skipped: skippedParticipants.length,
          skipped_emails: skippedParticipants.map((p: any) => p.email),
          fallback_used: true
        }
      })
  } catch (auditError) {
    console.warn('Failed to log audit entry:', auditError)
  }

  let message = `Successfully added ${participantsToAdd.length} participants`
  if (skippedParticipants.length > 0) {
    message += `. ${skippedParticipants.length} participants were skipped (not found in system)`
  }

  return { 
    success: true, 
    message,
    added: participantsToAdd.length,
    skipped: skippedParticipants.length 
  }
}