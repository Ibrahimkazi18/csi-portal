'use server'

import { createClient } from "../../../../../utils/supabase/server";



export async function getMembers(): Promise<any[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('profiles')
    .select(`
        id,
        full_name,
        email,
        created_at,
        member_role,
        member_roles (
            id,
            name,
            color_class
        )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[GetMembers]', error)
    return []
  }

  return data as any[]
}

export async function getMemberRoles(): Promise<any[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('member_roles')
    .select(`
        id,
        name,
        description,
        created_at,
        color_class,
        created_at
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[GetMemberRoles]', error)
    return []
  }

  return data as any[]
}

export async function updateMemberRole(id: string, role: string, roleId: string) {
  const supabase = await createClient();

  if (!id || !role || !roleId) {
    return { success: false, error: 'Missing member ID or role' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
        member_role: role.toLowerCase(),
        member_role_id: roleId,
    })
    .eq('id', id)

  if (error) {
    console.error('[UpdateMemberRole]', error)
    return { success: false, error: error.message }
  }

  return { success: true, message: 'Member role updated successfully' }
}

export async function getProfileUser() {
  const supabase = await createClient();

  const { data: user, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', (await supabase.auth.getUser()).data.user?.id)
    .single();

  if (error) {
    console.error('[GetProfileUser]:', error);
    return { success: false, error: error.message };
  }
  else {
    return { success: true, user };
  }
}


