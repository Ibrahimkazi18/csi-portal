"use client"

import { useActionState, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Computer, Users, Eye, EyeOff } from "lucide-react"


import { Alert, AlertDescription } from "@/components/ui/alert"
import { getPasswordChecks, isPasswordStrong } from "../../../../utils/password"
import { signupAction, SignupState } from "./actions"
import { PasswordChecklist } from "@/components/auth/password-checklist"
import { toast } from "sonner"

export default function SignupPage() {
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<"member" | "core-team">("member")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const checks = getPasswordChecks(password)
  const strong = isPasswordStrong(password)
  const match = password === confirm

  const initialState: SignupState = useMemo(() => ({}), [])
  const [state, formAction, isPending] = useActionState(signupAction, initialState)

  useEffect(() => {
    if (state?.error) {
      toast.error("Sign up failed", {
        description: state.error,
      })
    } else if (state?.ok && state.redirectTo) {
      toast("Check your email", { description: "We sent you a confirmation link." })
      router.push(state.redirectTo)
    }
  }, [state, router, toast])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Computer className="h-12 w-12 mx-auto" />
          <h1 className="text-3xl font-bold">CSI Dashboard</h1>
          <p className="text-muted-foreground">Create your account</p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-center">Join CSI</CardTitle>
            <CardDescription>Choose your account type and sign up</CardDescription>
            <p className="text-muted-foreground text-sm">
              Already have an account?{" "}
              <a href="/login" className="underline font-medium">
                Log In
              </a>
            </p>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "member" | "core-team")}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="member" className="flex items-center gap-2">
                  <Computer className="h-4 w-4" />
                  CSI Member
                </TabsTrigger>
                <TabsTrigger value="core-team" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Core Team
                </TabsTrigger>
              </TabsList>

              <TabsContent value="member" className="space-y-4">
                <form action={formAction} className="space-y-4" noValidate>
                  {state?.error ? (
                    <Alert variant="destructive">
                      <AlertDescription>{state.error}</AlertDescription>
                    </Alert>
                  ) : null}
                  <input type="hidden" name="accountType" value={activeTab} />
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="your.email@example.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm">Confirm password</Label>
                    <div className="relative">
                      <Input
                        id="confirm"
                        name="confirm"
                        type={showConfirm ? "text" : "password"}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        aria-label={showConfirm ? "Hide password" : "Show password"}
                        onClick={() => setShowConfirm((s) => !s)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <PasswordChecklist checks={checks} />

                  <Button type="submit" className="w-full" disabled={isPending || !strong || !match}>
                    {isPending ? "Creating account..." : "Sign Up"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="core-team" className="space-y-4">
                <form action={formAction} className="space-y-4" noValidate>
                  {state?.error ? (
                    <Alert variant="destructive">
                      <AlertDescription>{state.error}</AlertDescription>
                    </Alert>
                  ) : null}
                  <input type="hidden" name="accountType" value={activeTab} />
                  <div className="space-y-2">
                    <Label htmlFor="core-email">Email</Label>
                    <Input id="core-email" name="email" type="email" placeholder="admin@csi.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="core-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="core-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="core-confirm">Confirm password</Label>
                    <div className="relative">
                      <Input
                        id="core-confirm"
                        name="confirm"
                        type={showConfirm ? "text" : "password"}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        aria-label={showConfirm ? "Hide password" : "Show password"}
                        onClick={() => setShowConfirm((s) => !s)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <PasswordChecklist checks={checks} />

                  <Button
                    type="submit"
                    variant="secondary"
                    className="w-full"
                    disabled={isPending || !isPasswordStrong(password) || !match}
                  >
                    {isPending ? "Creating account..." : "Sign Up"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
