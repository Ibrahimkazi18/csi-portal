"use server"

import { createClient } from "../../../../../utils/supabase/server";

export async function fetchGuideSections() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('guide_sections').select('*').order('created_at');

  if(error) {
    return  { success: false, error}
  }

  else {
    return { success: true, data };
  }
}

export async function createGuideSection({ title, icon, content, order }: {
  title: string,
  icon: string,
  order: number,
  content: string[],
}) {
  const supabase = await createClient();

  const createdBy = (await supabase.auth.getUser()).data.user?.id

  const { error } = await supabase.from('guide_sections').insert({
    title, icon, content, order,created_by: createdBy, updated_by: createdBy
  });
  
  if(error) {
    return  { success: false, error}
  }

  else {
    return { success: true };
  }
}

export async function updateGuideSection({ id, title, icon, content, order }: {
  id: string,
  title: string,
  icon: string,
  order: number,
  content: string[],
}) {
  const supabase = await createClient();

  const updatedBy = (await supabase.auth.getUser()).data.user?.id

  const { data, error } = await supabase
    .from('guide_sections')
    .update({ title, icon, content, order, updated_by: updatedBy, updated_at: new Date() })
    .eq('id', id);
  
  if(error) {
    return  { success: false, error}
  }

  else {
    return { success: true, data };
  }
}

export async function deleteGuideSection(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('guide_sections').delete().eq('id', id);
  
  if(error) {
    return  { success: false, error}
  }

  else {
    return { success: true };
  }
}
