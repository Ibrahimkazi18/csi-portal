"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "../../../../utils/supabase/server"
import { isPasswordStrong } from "../../../../utils/password"


export type SignupState = {
  ok?: boolean
  error?: string
  redirectTo?: string
}

export async function signupAction(_: SignupState, formData: FormData): Promise<SignupState> {
  const supabase = await createClient()
  const email = String(formData.get("email") || "").trim()
  const password = String(formData.get("password") || "")
  const confirm = String(formData.get("confirm") || "")

  if (!email || !password) return { error: "Email and password are required." }
  if (password !== confirm) return { error: "Passwords do not match." }
  if (!isPasswordStrong(password)) {
    return { error: "Password does not meet the required complexity." }
  }

  // Require invitation/pending approval
  const { data: pending, error: pendingErr } = await supabase
    .from("pending_users")
    .select("email")
    .eq("email", email)
    .single()

  if (pendingErr || !pending) {
    return { error: "This email is not eligible to sign up. Please contact the admin." }
  }

  // Build redirect URL with fallback in case NEXT_PUBLIC_SITE_URL is not set
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${baseUrl}/api/confirm`,
    },
  })

  if (error) {
    const m = (error.message || "").toLowerCase()
    if (m.includes("password")) return { error: "Password does not meet the requirements." }
    if (m.includes("rate") || m.includes("attempts")) return { error: "Too many attempts. Please try again later." }
    return { error: "Unable to sign up. Please try again." }
  }

  revalidatePath("/", "layout")
  return { ok: true, redirectTo: "/pending-verification" }
}
