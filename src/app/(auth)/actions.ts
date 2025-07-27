'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '../../../utils/supabase/server'

export async function login(formData: { email : string, password: string}) {
  const supabase = await createClient();
  const email = formData.email
  const password = formData.password

  if (!email || !password) {
    console.error('Email and password are required');
  }

  // 1. Check if user is in profiles table
  const { data: member, error: memberError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single()

  if (!member || memberError) {
    redirect('/error');
  }

  // 2. Attempt login
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (loginError) {
    redirect('/error') // wrong password or unregistered
  }

  revalidatePath('/', 'layout');
  redirect(`/${member.role}`);
}

export async function signup(formData: { email : string, password: string}) {
  const supabase = await createClient();
  const email = formData.email
  const password = formData.password

  if (!email || !password) {
    console.error('Email and password are required');
  }
    
  // 1. Check if user is in pending_users table
  const { data: member, error: memberError } = await supabase
    .from('pending_users')
    .select('email')
    .eq('email', email)
    .single()

  if (!member || memberError) {
    redirect('/error') 
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/confirm`, // handle confirm here
    },
  });

  if (error) {
    redirect('/error');

  }
  revalidatePath('/', 'layout');
  redirect('/pending-verification');
}


export async function createMember(member: {full_name: string, email: string, role: string, member_role: string, is_core_team: boolean}) {
  const supabase = await createClient();

    // Step 1: Fetch the member_role ID from the name
  const { data: roles, error: roleError } = await supabase
    .from('member_roles')
    .select('id')
    .eq('name', member.member_role)
    .single();

  if (roleError) {
    console.error('[CreateMember - Role Lookup]', roleError);
    return { data: null, error: roleError };
  }

  // Step 2: Insert member with member_role_id instead of member_role name
  const { data, error } = await supabase.from('profile').insert({
    full_name: member.full_name,
    email: member.email,
    role: member.role,
    memer_role: member.member_role,
    member_role_id: roles.id,
    is_core_team: member.is_core_team,
    created_at: new Date().toISOString().slice(0, 10),
  });

  if (error) console.error('[CreateMember]', error)
    
  await deletePendingMember(member.email);

  return { data, error }
}

async function deletePendingMember(email: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('pending_users')
    .delete()
    .eq('email', email)

  if (error) console.error('[DeletePendingMember]', error)
  return { success: !error }
}