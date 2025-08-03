"use server"

import { createClient } from "../../../../../utils/supabase/server"

export async function getProfile() {
  const supabase = await createClient();

  // Get current authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, message: "User not authenticated" };
  }

  // Fetch profile from profiles table
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { success: false, message: "Error fetching profile" };
  }

  // Fetch stats from user_participation_stats view
  const { data: stats, error: statsError } = await supabase
    .from("user_participation_stats")
    .select("*")
    .eq("id", user.id)
    .single();

  if (statsError || !stats) {
    return { success: true, profile }; // fallback to just profile
  }

  // Remove duplicated keys from stats before merging
  const { id, full_name, email, ...cleanedStats } = stats;

  return {
    success: true,
    profile: {
      ...profile,
      ...cleanedStats,
    },
  };
}


export async function updateBio(bio: string) {
  const supabase = await createClient()

  // Get current authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, message: "User not authenticated" }
  }

  // Update bio in profiles table
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ bio, updated_at: new Date().toISOString() })
    .eq("id", user.id)

  if (updateError) {
    return { success: false, message: "Failed to update bio" }
  }

  return { success: true, message: "Bio updated successfully" }
}

export async function updateAvatar(avatarData: string) {
  const supabase = await createClient()

  // Get current authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, message: "User not authenticated" }
  }

  const fileName = `${user.id}_${Date.now()}.png`

  const base64 = avatarData.split(',')[1]
  const buffer = Buffer.from(base64, 'base64')
  const blob = new Blob([buffer], { type: 'image/png' })

  // Upload to Supabase Storage bucket named 'avatar'
  const { error: uploadError } = await supabase.storage
    .from("avatar")
    .upload(fileName, blob, {
      contentType: "image/png",
      upsert: true,
    })

  console.log(uploadError)
  if (uploadError) {
    return { success: false, message: "Failed to upload avatar" }
  }

  // Get public URL of uploaded image
  const {
    data: { publicUrl },
  } = supabase.storage.from("avatar").getPublicUrl(fileName)

  // Update the profile with avatar URL
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
    .eq("id", user.id)

  if (updateError) {
    return { success: false, message: "Failed to update avatar URL in profile" }
  }

  return { success: true, message: "Avatar updated successfully" }
}

export async function updatePassword(currentPassword: string, newPassword: string) {
  const supabase = await createClient()

  // Get current authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, message: "User not authenticated" }
  }

  // Verify current password by attempting to sign in
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  })

  if (verifyError) {
    return { success: false, message: "Current password is incorrect" }
  }

  // Update password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (updateError) {
    return { success: false, message: "Failed to update password" }
  }

  return { success: true, message: "Password updated successfully" }
}
