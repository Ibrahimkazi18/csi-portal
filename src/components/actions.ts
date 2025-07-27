'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '../../utils/supabase/server';
import { count } from 'console';

export async function logOut() {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect('/login');
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


export async function getLastSeenAnnoucementAll() {
  const supabase = await createClient();

  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', (await supabase.auth.getUser()).data.user?.id)
    .single();

  if (userError) return { success: false, error: userError.message }

  const { count, error } = await supabase
    .from('announcements')
    .select('id', { count: 'exact', head: true })
    .gt('created_at', user.last_seen_announcement_at)
    .eq('target_audience', 'all') 

  if (error) return { success: false, error: error.message }

  return { success: true, unseenCount: count || 0 }
}

export async function getLastSeenAnnoucementCore() {
  const supabase = await createClient();

  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', (await supabase.auth.getUser()).data.user?.id)
    .single();

  if (userError) return { success: false, error: userError.message }

  const { count, error } = await supabase
    .from('announcements')
    .select('id', { count: 'exact', head: true })
    .gt('created_at', user.last_seen_announcement_at)
    .eq('target_audience', 'core-team') 

  if (error) return { success: false, error: error.message }

  return { success: true, unseenCount: count || 0 }
}

export async function getLastSeenAnnoucementMember() {
  const supabase = await createClient();

  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', (await supabase.auth.getUser()).data.user?.id)
    .single();

  if (userError) return { success: false, error: userError.message }

  const { count, error } = await supabase
    .from('announcements')
    .select('id', { count: 'exact', head: true })
    .gt('created_at', user.last_seen_announcement_at)
    .eq('target_audience', 'members') 

  if (error) return { success: false, error: error.message }

  return { success: true, unseenCount: count || 0 }
}