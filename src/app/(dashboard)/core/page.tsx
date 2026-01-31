import { Suspense } from "react"
import { Users, Calendar, Trophy, Megaphone, TrendingUp, UserCheck } from "lucide-react"
import { StatsCard } from "@/components/dashboard/stats-card"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "../../../../utils/supabase/server"

async function getDashboardStats() {
  const supabase = await createClient()
  
  try {
    // Get member count
    const { count: memberCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'member')

    // Get active events count
    const { count: eventCount } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    // Get recent announcements count
    const { count: announcementCount } = await supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    return {
      memberCount: memberCount || 0,
      eventCount: eventCount || 0,
      announcementCount: announcementCount || 0,
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return {
      memberCount: 0,
      eventCount: 0,
      announcementCount: 0,
    }
  }
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-border/40">
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

async function DashboardStats() {
  const stats = await getDashboardStats()
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Members"
        value={stats.memberCount}
        description="Active registered members"
        icon={Users}
        trend={{ value: 12, isPositive: true }}
      />
      <StatsCard
        title="Active Events"
        value={stats.eventCount}
        description="Currently running events"
        icon={Calendar}
        trend={{ value: 8, isPositive: true }}
      />
      <StatsCard
        title="Recent Announcements"
        value={stats.announcementCount}
        description="Posted this month"
        icon={Megaphone}
      />
      <StatsCard
        title="Engagement Rate"
        value="87%"
        description="Member participation rate"
        icon={TrendingUp}
        trend={{ value: 5, isPositive: true }}
      />
    </div>
  )
}

export default function CoreDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Core Team Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening in your organization.
        </p>
      </div>

      {/* Stats */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardStats />
      </Suspense>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        <QuickActions role="core" />
        <RecentActivity role="core" />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/40">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Member Growth</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Track member registration trends over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="mx-auto h-12 w-12 rounded-lg bg-muted/50 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Chart Coming Soon</p>
                  <p className="text-xs text-muted-foreground">Member growth analytics will be displayed here</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Event Participation</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Monitor event registration and attendance rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="mx-auto h-12 w-12 rounded-lg bg-muted/50 flex items-center justify-center">
                  <UserCheck className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Chart Coming Soon</p>
                  <p className="text-xs text-muted-foreground">Event participation metrics will be displayed here</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}