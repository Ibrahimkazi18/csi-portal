"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Calendar, Users, Trophy, GraduationCap,
  Bell, CheckCircle, Clock, ArrowRight
} from "lucide-react"
import Link from "next/link"
import * as dashboardActions from "./actions"

interface MemberDashboardStats {
  eventsParticipated: number
  upcomingEvents: number
  workshopsAttended: number
  teamPoints: number
  pendingInvitations: number
  pendingApplications: number
  pendingActions: number
  upcomingEventsList: any[]
  myTeams: any[]
}

export default function MemberDashboardPage() {
  const [stats, setStats] = useState<MemberDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const response = await dashboardActions.getMemberDashboardStats()
      
      if (response.success && response.data) {
        setStats(response.data)
      }
    } catch (error) {
      console.error("Failed to load dashboard:", error)
    }
    setLoading(false)
  }

  if (loading) return <div className="text-center py-8">Loading dashboard...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's your activity overview
        </p>
      </div>

      {/* Pending Actions Alert */}
      {stats && stats.pendingActions > 0 && (
        <Card className="border-orange-500/50 bg-orange-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-orange-500" />
              <div className="flex-1">
                <p className="font-medium">You have {stats.pendingActions} pending action(s)</p>
                <p className="text-sm text-muted-foreground">
                  {stats.pendingInvitations} invitation(s), {stats.pendingApplications} application(s)
                </p>
              </div>
              <Link href="/member/notifications">
                <Button variant="outline">View All</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Events Participated"
          value={stats?.eventsParticipated || 0}
          icon={Calendar}
          trend="All time"
        />
        <StatCard
          title="Upcoming Events"
          value={stats?.upcomingEvents || 0}
          icon={Calendar}
          trend="Registered"
        />
        <StatCard
          title="Workshops Attended"
          value={stats?.workshopsAttended || 0}
          icon={GraduationCap}
          trend="Completed"
        />
        <StatCard
          title="Team Points"
          value={stats?.teamPoints || 0}
          icon={Trophy}
          trend="Total earned"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Your Upcoming Events</CardTitle>
            <Link href="/member/events">
              <Button variant="outline" size="sm">
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.upcomingEventsList?.slice(0, 4).map((event: any) => (
                event && event.id ? (
                  <div key={event.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{event.title || 'Unknown Event'}</p>
                        <p className="text-sm text-muted-foreground">
                          {event.start_date ? new Date(event.start_date).toLocaleDateString() : 'Date TBD'}
                        </p>
                        {event.team && event.team.name && (
                          <Badge variant="secondary" className="mt-1">
                            Team: {event.team.name}
                          </Badge>
                        )}
                      </div>
                      <Link href={`/member/events/${event.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </div>
                  </div>
                ) : null
              )) || []}
              
              {(!stats?.upcomingEventsList || stats.upcomingEventsList.length === 0) && (
                <div className="text-center py-6 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No upcoming events</p>
                  <Link href="/member/events">
                    <Button variant="outline" size="sm" className="mt-2">
                      Browse Events
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* My Teams */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My Teams</CardTitle>
            <Link href="/member/teams">
              <Button variant="outline" size="sm">
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.myTeams?.slice(0, 4).map((team: any) => (
                team && team.id ? (
                  <div key={team.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{team.name || 'Unknown Team'}</p>
                        <p className="text-sm text-muted-foreground">
                          {team.member_count || 0} members • {team.points || 0} points
                        </p>
                        {team.is_leader && (
                          <Badge variant="default" className="mt-1">Leader</Badge>
                        )}
                      </div>
                      <Link href={`/member/teams/${team.id}`}>
                        <Button variant="ghost" size="sm">Manage</Button>
                      </Link>
                    </div>
                  </div>
                ) : null
              )) || []}
              
              {(!stats?.myTeams || stats.myTeams.length === 0) && (
                <div className="text-center py-6 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No teams yet</p>
                  <Link href="/member/events">
                    <Button variant="outline" size="sm" className="mt-2">
                      Join a Team
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/member/events">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Browse Events
              </Button>
            </Link>
            <Link href="/member/workshops">
              <Button variant="outline" className="w-full justify-start">
                <GraduationCap className="h-4 w-4 mr-2" />
                View Workshops
              </Button>
            </Link>
            <Link href="/member/profile">
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Update Profile
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, trend }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{trend}</p>
      </CardContent>
    </Card>
  )
}