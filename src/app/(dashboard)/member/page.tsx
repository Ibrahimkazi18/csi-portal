import { Suspense } from "react"
import { Calendar, Trophy, Award, Target, TrendingUp, BookOpen } from "lucide-react"
import { StatsCard } from "@/components/dashboard/stats-card"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "../../../../utils/supabase/server"
import { getDashboardData } from "@/components/actions"

async function getMemberStats(userId: string) {
  const supabase = await createClient()
  
  try {
    // Get user's event registrations
    const { count: eventCount } = await supabase
      .from('event_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Get user's certificates
    const { count: certificateCount } = await supabase
      .from('certificates')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Get upcoming events
    const { count: upcomingEvents } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .gte('deadline', new Date().toISOString())

    return {
      eventCount: eventCount || 0,
      certificateCount: certificateCount || 0,
      upcomingEvents: upcomingEvents || 0,
    }
  } catch (error) {
    console.error('Error fetching member stats:', error)
    return {
      eventCount: 0,
      certificateCount: 0,
      upcomingEvents: 0,
    }
  }
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
              <div className="h-3 w-24 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

async function MemberStats() {
  const dashboardData = await getDashboardData()
  
  if (!dashboardData.success || !dashboardData.user) {
    return <div>Error loading dashboard data</div>
  }

  const stats = await getMemberStats(dashboardData.user.id)
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Events Joined"
        value={stats.eventCount}
        description="Total event participations"
        icon={Calendar}
      />
      <StatsCard
        title="Certificates Earned"
        value={stats.certificateCount}
        description="Achievement certificates"
        icon={Award}
        trend={{ value: 15, isPositive: true }}
      />
      <StatsCard
        title="Upcoming Events"
        value={stats.upcomingEvents}
        description="Available to register"
        icon={Target}
      />
      <StatsCard
        title="Member Level"
        value="Active"
        description="Current participation level"
        icon={TrendingUp}
      />
    </div>
  )
}

async function WelcomeCard() {
  const dashboardData = await getDashboardData()
  
  if (!dashboardData.success || !dashboardData.user) {
    return null
  }

  const user = dashboardData.user

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Welcome back, {user.full_name}!</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          You're registered as a {user.member_role} in the CSI community.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary" className="text-xs">{user.member_role}</Badge>
              <Badge variant="outline" className="text-xs">Member since {new Date(user.created_at).getFullYear()}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Stay active by participating in events and engaging with the community.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function MemberDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Member Dashboard
        </h1>
        <p className="text-muted-foreground">
          Track your progress and stay connected with the CSI community.
        </p>
      </div>

      {/* Welcome Card */}
      <Suspense fallback={<Card className="border-border/40"><CardContent className="h-24 animate-pulse bg-muted rounded" /></Card>}>
        <WelcomeCard />
      </Suspense>

      {/* Stats */}
      <Suspense fallback={<DashboardSkeleton />}>
        <MemberStats />
      </Suspense>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        <QuickActions role="member" />
        <RecentActivity role="member" />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/40">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Your Progress</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Track your participation and achievements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="mx-auto h-12 w-12 rounded-lg bg-muted/50 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Progress Chart Coming Soon</p>
                  <p className="text-xs text-muted-foreground">Event participation over time will be displayed here</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Learning Path</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Recommended resources and next steps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="mx-auto h-12 w-12 rounded-lg bg-muted/50 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Learning Path Coming Soon</p>
                  <p className="text-xs text-muted-foreground">Personalized learning recommendations will be shown here</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}