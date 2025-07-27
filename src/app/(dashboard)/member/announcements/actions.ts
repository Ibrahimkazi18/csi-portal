'use server'

import { createClient } from "../../../../../utils/supabase/server"


export async function createAnnouncement({
  title,
  content,
  isImportant = false,
  targetAudience = 'all',
}: {
  title: string
  content: string
  isImportant?: boolean
  targetAudience?: 'all' | 'core-team' | 'members'
}) {
  const supabase = await createClient();

  const createdBy = (await supabase.auth.getUser()).data.user?.id

  const { error } = await supabase.from('announcements').insert({
    title,
    content,
    is_important: isImportant,
    target_audience: targetAudience,
    created_by: createdBy,
  })

  if (error) return { success: false, error: error.message }

  return { success: true, message: 'Announcement created successfully' }
}

export async function getAnnouncements() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return { success: false, error: error.message }

  return { success: true, data }
}

export async function updateAnnouncement({
  id,
  fields,
}: {
  id: string
  fields: Partial<{
    title: string
    content: string
    is_important: boolean
    target_audience: 'all' | 'core-team' | 'members'
  }>
}) {
  const supabase = await createClient();

  const updatedBy = (await supabase.auth.getUser()).data.user?.id

  const { error } = await supabase
    .from('announcements')
    .update({
      ...fields,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy,
    })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  return { success: true, message: 'Announcement updated successfully' }
}

export async function updateLastSeenAnnoucement() {
  const supabase = await createClient();

  const userId = (await supabase.auth.getUser()).data.user?.id

  const { error } = await supabase
    .from('profiles')
    .update({ last_seen_announcement_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) return { success: false, error: error.message }

  return { success: true, message: 'Last seen announcement updated successfully' }
}