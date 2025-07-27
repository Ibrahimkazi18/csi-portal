'use server'

import { Member, PendingMember } from '@/types/auth'
import { createClient } from '../../../../../utils/supabase/client'

const supabase = createClient();

export async function getMembers(): Promise<Member[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[GetMembers]', error)
    return []
  }

  return data as Member[]
}

export async function getPendingMembers(): Promise<PendingMember[]> {
  const { data, error } = await supabase
    .from('pending_users')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[GetPendingMembers]', error)
    return []
  }

  return data as PendingMember[]
}

export async function createPendingMember(member: {full_name: string, email: string, role: string, member_role: string}) {
  const { data, error } = await supabase.from('pending_users').insert({
    ...member,
    created_at: new Date().toISOString().slice(0, 10),
  })

  if (error) console.error('[CreatePendingMember]', error)
    
  return { data, error }
}

export async function updateMember(id: string, updatedFields: any) {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      full_name: updatedFields.full_name,
      email: updatedFields.email,
      role: updatedFields.role.toLowerCase(),
      updated_at: new Date().toISOString(),
      is_core_team: updatedFields.role.toLowerCase() === 'core',
    })
    .eq('id', id)

  if (error) console.error('[UpdateMember]', error)
  return { data, error }
}

export async function updatePendingMember(email: string, updatedFields: Partial<PendingMember>) {
  const { data, error } = await supabase
    .from('pending_users')
    .update(updatedFields)
    .eq('email', email)

  if (error) console.error('[UpdatePendingMember]', error)
  return { data, error }
}

export async function deleteMember(id: string) {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id)

  if (error) console.error('[DeleteMember]', error)
  return { success: !error }
}

export async function deletePendingMember(email: string) {
  const { error } = await supabase
    .from('pending_users')
    .delete()
    .eq('email', email)

  if (error) console.error('[DeletePendingMember]', error)
  return { success: !error }
}