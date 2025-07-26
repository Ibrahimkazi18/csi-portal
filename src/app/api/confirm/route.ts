// src/app/api/confirm/route.ts
import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest } from 'next/server';
import { redirect } from 'next/navigation';
import { createClient } from '../../../../utils/supabase/server';

export async function GET(request: NextRequest) {
  console.log("In confirm route");
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  console.log("token_hash:", token_hash);
  console.log("type:", type);
  
  if (token_hash && type) {
    const supabase = await createClient();

    // Verify OTP
    const { data: { user }, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    console.log("user:", user);

    if (error || !user) {
      console.error('OTP verification failed:', error?.message);
      redirect('/error');
    }

    // Fetch pending user data
    const { data: pendingUser, error: pendingError } = await supabase
      .from('pending_users')
      .select('*')
      .eq('email', user.email)
      .single();

    console.log("pendingUser:", pendingUser);

    if (pendingError || !pendingUser) {
      console.error('Pending user not found:', pendingError?.message);
      redirect('/error');
    }

    // Insert into profiles with correct ID
    const { data:userData, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id, // Use the auth user ID
        full_name: pendingUser.full_name,
        email: pendingUser.email,
        role: pendingUser.role.toLowerCase(),
        member_role: pendingUser.member_role,
        is_core_team: pendingUser.is_core_team,
        created_at: new Date().toISOString().slice(0, 10),
      });

    if (insertError) {
      console.error('Profile insert failed:', insertError.message);
      redirect('/error');
    }

    // Delete from pending_users
    const { error: deleteError } = await supabase
      .from('pending_users')
      .delete()
      .eq('email', user.email);

    if (deleteError) {
      console.error('Pending user deletion failed:', deleteError.message);
    }

    // Redirect to the specified URL or home
    redirect(`/${pendingUser?.role.toLowerCase()}`);
  }

  // Redirect to error page if token_hash or type is missing
  redirect('/error');
}