"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Users, Calendar, MessageSquare, GraduationCap,
  Plus, CheckCircle, Clock
} from "lucide-react"
import Link from "next/link"
import * as dashboardActions from "./actions"
import { BentoGrid, BentoCard, BentoCardHeader, BentoCardTitle, BentoCardContent } from "@/components/ui/bento-grid"
import { CtaCard, CtaCardHeader, CtaCardTitle, CtaCardContent } from "@/components/ui/cta-card"

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

      {/* Stats Cards - Bento Grid */}
      <BentoGrid>
        <BentoCard delay={0}>
          <BentoCardHeader>
            <BentoCardTitle className="text-sm font-medium">Total Events</BentoCardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </BentoCardHeader>
          <BentoCardContent>
            <div className="text-2xl font-bold">{stats?.totalEvents || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats?.upcomingEvents || 0} upcoming</p>
          </BentoCardContent>
        </BentoCard>

        <BentoCard delay={0.05}>
          <BentoCardHeader>
            <BentoCardTitle className="text-sm font-medium">Active Members</BentoCardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </BentoCardHeader>
          <BentoCardContent>
            <div className="text-2xl font-bold">{stats?.activeMembers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered users</p>
          </BentoCardContent>
        </BentoCard>

        <BentoCard delay={0.1}>
          <BentoCardHeader>
            <BentoCardTitle className="text-sm font-medium">Workshops</BentoCardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </BentoCardHeader>
          <BentoCardContent>
            <div className="text-2xl font-bold">{stats?.totalWorkshops || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Educational sessions</p>
          </BentoCardContent>
        </BentoCard>

        <BentoCard delay={0.15} className={stats?.pendingQueries && stats.pendingQueries > 0 ? "border-orange-500/50" : ""}>
          <BentoCardHeader>
            <BentoCardTitle className="text-sm font-medium">Pending Queries</BentoCardTitle>
            <MessageSquare className={`h-4 w-4 ${stats?.pendingQueries && stats.pendingQueries > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
          </BentoCardHeader>
          <BentoCardContent>
            <div className="text-2xl font-bold">{stats?.pendingQueries || 0}</div>
            <p className={`text-xs mt-1 ${stats?.pendingQueries && stats.pendingQueries > 0 ? "text-orange-600" : "text-muted-foreground"}`}>
              Need response
            </p>
          </BentoCardContent>
        </BentoCard>

        {/* Upcoming Events - Spans 2 columns */}
        <BentoCard span="2" delay={0.2}>
          <BentoCardHeader>
            <BentoCardTitle>Upcoming Events</BentoCardTitle>
            <Link href="/core/events">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </BentoCardHeader>
          <BentoCardContent>
            <div className="space-y-3">
              {upcomingEvents.slice(0, 5).map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/20 transition-colors">
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
          </BentoCardContent>
        </BentoCard>

        {/* Recent Activity */}
        <BentoCard delay={0.25}>
          <BentoCardHeader>
            <BentoCardTitle>Recent Activity</BentoCardTitle>
          </BentoCardHeader>
          <BentoCardContent>
            <div className="space-y-3">
              {activity.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/20 transition-colors">
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
          </BentoCardContent>
        </BentoCard>
      </BentoGrid>

      {/* Recent Queries */}
      {recentQueries.length > 0 && (
        <CtaCard variant="accent">
          <CtaCardHeader>
            <CtaCardTitle>Recent Queries</CtaCardTitle>
            <Link href="/core/queries">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CtaCardHeader>
          <CtaCardContent>
            <div className="space-y-3">
              {recentQueries.slice(0, 3).map((query) => (
                <div key={query.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/20 transition-colors">
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
          </CtaCardContent>
        </CtaCard>
      )}
    </div>
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