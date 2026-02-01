import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { WorkshopsList } from "@/components/workshops/workshops-list"
import { BookOpen, Users, Clock } from "lucide-react"

export default function WorkshopsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-purple-500" />
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Workshops & Seminars
          </h1>
        </div>
        <p className="text-muted-foreground">
          Discover learning opportunities and skill development sessions
        </p>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-purple-500" />
              Learning Focus
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">
              Non-competitive sessions designed for skill building and knowledge sharing
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              Individual Registration
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">
              Register individually on a first-come-first-serve basis
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-500" />
              Limited Seats
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">
              Seats are limited to ensure quality interaction and learning
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Workshops List */}
      <Card className="border-border/40">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Available Workshops</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Browse and register for upcoming workshops and seminars
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="text-sm text-muted-foreground">Loading workshops...</div>}>
            <WorkshopsList />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}