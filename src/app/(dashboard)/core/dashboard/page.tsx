"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Users, Calendar, MessageSquare, GraduationCap,
  Plus, CheckCircle, Clock
} from "lucide-react"
import Link from "next/link"
import * as dashboardActions from "./actions"

interface DashboardStats {
  totalEvents: number
  upcomingEvents: number
  activeMembers: number
  pendingQueries: number
  totalWorkshops: number
  completedEvents: number
}

export default function CoreDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activity, setActivity] = useState<any[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])
  const [recentQueries, setRecentQueries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    setLoading(true)
    
    try {
      const [statsRes, activityRes, eventsRes, queriesRes] = await Promise.all([
        dashboardActions.getDashboardStats(),
        dashboardActions.getRecentActivity(),
        dashboardActions.getUpcomingEvents(),
        dashboardActions.getRecentQueries()
      ])

      if (statsRes.success && statsRes.data) setStats(statsRes.data)
      if (activityRes.success && activityRes.data) setActivity(activityRes.data)
      if (eventsRes.success && eventsRes.data) setUpcomingEvents(eventsRes.data)
      if (queriesRes.success && queriesRes.data) setRecentQueries(queriesRes.data)
    } catch (error) {
      console.error("Failed to load dashboard:", error)
    }
    
    setLoading(false)
  }

  if (loading) return <div className="text-center py-8">Loading dashboard...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Core Dashboard</h1>
          <p className="text-muted-foreground">Overview of CSI Portal activity</p>
        </div>
        
        <div className="flex gap-2">
          <Link href="/core/events/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </Link>
          <Link href="/core/workshops/create">
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create Workshop
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Events"
          value={stats?.totalEvents || 0}
          icon={Calendar}
          trend={`${stats?.upcomingEvents || 0} upcoming`}
        />
        <StatCard
          title="Active Members"
          value={stats?.activeMembers || 0}
          icon={Users}
          trend="Registered users"
        />
        <StatCard
          title="Workshops"
          value={stats?.totalWorkshops || 0}
          icon={GraduationCap}
          trend="Educational sessions"
        />
        <StatCard
          title="Pending Queries"
          value={stats?.pendingQueries || 0}
          icon={MessageSquare}
          trend="Need response"
          urgent={stats?.pendingQueries && stats.pendingQueries > 0}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming Events</CardTitle>
            <Link href="/core/events">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingEvents.slice(0, 5).map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex-1">
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.start_date).toLocaleDateString()}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={
                        event.status === 'registration_open' ? 'default' :
                        event.status === 'upcoming' ? 'secondary' :
                        'outline'
                      }>
                        {event.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {event.registration_count || 0} registered
                      </span>
                    </div>
                  </div>
                  <Link href={`/core/events/${event.id}`}>
                    <Button variant="ghost" size="sm">View</Button>
                  </Link>
                </div>
              ))}
              {upcomingEvents.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  No upcoming events
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activity.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className="p-1 rounded-full bg-primary/10">
                    {getActivityIcon(item.action)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{getActivityMessage(item)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.performed_at || item.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              {activity.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  No recent activity
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Queries */}
      {recentQueries.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Queries</CardTitle>
            <Link href="/core/queries">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentQueries.slice(0, 3).map((query) => (
                <div key={query.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex-1">
                    <p className="font-medium">{query.subject}</p>
                    <p className="text-sm text-muted-foreground">
                      From: {query.profiles?.full_name} • {new Date(query.created_at).toLocaleDateString()}
                    </p>
                    <Badge variant={
                      query.priority === 'urgent' ? 'destructive' :
                      query.priority === 'high' ? 'default' :
                      'secondary'
                    } className="mt-1">
                      {query.priority} priority
                    </Badge>
                  </div>
                  <Link href={`/core/queries/${query.id}`}>
                    <Button variant="outline" size="sm">Reply</Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatCard({ title, value, icon: Icon, trend, urgent }: any) {
  return (
    <Card className={urgent ? "border-orange-500/50" : ""}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${urgent ? "text-orange-500" : "text-muted-foreground"}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className={`text-xs mt-1 ${urgent ? "text-orange-600" : "text-muted-foreground"}`}>
          {trend}
        </p>
      </CardContent>
    </Card>
  )
}

function getActivityIcon(action: string) {
  switch (action) {
    case 'event_created':
    case 'workshop_created':
      return <Plus className="h-3 w-3 text-green-500" />
    case 'event_completed':
    case 'workshop_completed':
      return <CheckCircle className="h-3 w-3 text-blue-500" />
    case 'attendance_updated':
      return <Users className="h-3 w-3 text-purple-500" />
    default:
      return <Clock className="h-3 w-3 text-gray-500" />
  }
}

function getActivityMessage(item: any) {
  switch (item.action) {
    case 'event_created':
      return `New event created: ${item.metadata?.title || 'Unknown'}`
    case 'workshop_created':
      return `New workshop created: ${item.metadata?.title || 'Unknown'}`
    case 'event_completed':
      return `Event completed: ${item.metadata?.title || 'Unknown'}`
    case 'workshop_completed':
      return `Workshop completed: ${item.metadata?.title || 'Unknown'}`
    case 'attendance_updated':
      return `Attendance updated: ${item.metadata?.attended_count || 0} attended`
    default:
      return `Activity: ${item.action}`
  }
}