'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '../../utils/supabase/server'

export async function logOut() {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Logout error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function getProfileUser() {
  const supabase = await createClient()

  const { data: user, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', (await supabase.auth.getUser()).data.user?.id)
    .single()

  if (error) {
    console.error('[GetProfileUser]:', error)
    return { success: false, error: error.message }
  }
  
  return { success: true, user }
}

// Optimized function to get user profile and announcement counts in one call
export async function getDashboardData() {
  const supabase = await createClient()
  
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) {
    return { success: false, error: 'Not authenticated' }
  }

  try {
    // Get user profile
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (userError || !user) {
      return { success: false, error: userError?.message || 'User not found' }
    }

    // Get announcement counts based on role
    const targetAudiences = ['all']
    if (user.role === 'core') {
      targetAudiences.push('core-team')
    } else {
      targetAudiences.push('members')
    }

    const { data: announcements, error: announcementError } = await supabase
      .from('announcements')
      .select('id, created_at')
      .in('target_audience', targetAudiences)
      .order('created_at', { ascending: false })

    if (announcementError) {
      console.error('[GetAnnouncements]:', announcementError)
      return { 
        success: true, 
        user, 
        unseenCount: 0 
      }
    }

    // Calculate unseen count
    const lastSeen = user.last_seen_announcement_at ? new Date(user.last_seen_announcement_at) : new Date(0)
    const unseenCount = announcements?.filter(ann => new Date(ann.created_at) > lastSeen).length || 0

    return {
      success: true,
      user,
      unseenCount
    }
  } catch (error) {
    console.error('[GetDashboardData]:', error)
    return { success: false, error: 'Failed to fetch dashboard data' }
  }
}

// Legacy functions for backward compatibility - now use getDashboardData instead
export async function getLastSeenAnnoucementAll() {
  const dashboardData = await getDashboardData()
  if (!dashboardData.success) {
    return { success: false, error: dashboardData.error }
  }
  return { success: true, unseenCount: dashboardData.unseenCount }
}

export async function getLastSeenAnnoucementCore() {
  return getLastSeenAnnoucementAll()
}

export async function getLastSeenAnnoucementMember() {
  return getLastSeenAnnoucementAll()
}