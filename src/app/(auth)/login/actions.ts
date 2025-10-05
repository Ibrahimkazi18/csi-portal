"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "../../../../utils/supabase/server"

export type AuthState = {
  ok?: boolean
  error?: string
  redirectTo?: string
}

export async function loginAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient()
  const email = String(formData.get("email") || "").trim()
  const password = String(formData.get("password") || "")

  if (!email || !password) {
    return { error: "Please enter both email and password." }
  }

  // Check profile existence first for clearer error messaging
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("id, role, email")
    .eq("email", email)
    .single()

  if (profileErr || !profile) {
    return { error: "No account found with this email. Please check or contact the admin." }
  }

  const { error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (loginError) {
    const m = (loginError.message || "").toLowerCase()
    if (m.includes("invalid") || m.includes("credentials")) {
      return { error: "Incorrect password. Please try again." }
    }
    if (m.includes("email") && m.includes("confirm")) {
      return { error: "Please verify your email before logging in." }
    }
    return { error: "Unable to sign in. Please try again." }
  }

  // Success: revalidate and direct user by role
  revalidatePath("/", "layout")
  const next = `/${profile.role ?? "member"}`
  return { ok: true, redirectTo: next }
}
