"use server";

import { createClient } from "../../../../../utils/supabase/server";


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

export async function getAllEventRounds() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('event_rounds')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return { success: false, error: error.message }

  return { success: true, data }
}

export async function addEventRounds(
    eventId: string, 
    rounds: { 
        title: string; 
        description: string; 
        round_number: number }[]
    ) 
{

  const supabase = await createClient();

  const payload = rounds.map(r => ({
    ...r,
    event_id: eventId
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