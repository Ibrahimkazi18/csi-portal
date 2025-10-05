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
import { AuthState, loginAction } from "./actions"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"member" | "core-team">("member")
  const [showPassword, setShowPassword] = useState(false)

  const initialState: AuthState = useMemo(() => ({}), [])
  const [state, formAction, isPending] = useActionState(loginAction, initialState)

  useEffect(() => {
    if (state?.error) {
      toast.error("Sign in failed",{
        description: state.error,
      })
    } else if (state?.ok && state.redirectTo) {
      toast("Welcome back!", { description: "Signed in successfully." })
      router.push(state.redirectTo)
    }
  }, [state, router, toast])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Computer className="h-12 w-12 mx-auto" />
          <h1 className="text-3xl font-bold">CSI Dashboard</h1>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-center">Welcome Back</CardTitle>
            <CardDescription>Choose your account type and sign in</CardDescription>
            <p className="text-muted-foreground text-sm">
              Did not sign up?{" "}
              <a href="/signup" className="underline font-medium">
                Sign Up
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
                  <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? "Signing in..." : "Sign In as Member"}
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
                  <Button type="submit" variant="secondary" className="w-full" disabled={isPending}>
                    {isPending ? "Signing in..." : "Sign In as Core Team"}
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
