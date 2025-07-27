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