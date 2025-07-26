'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '../../utils/supabase/server';

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
