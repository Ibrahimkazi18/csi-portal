"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Calendar, Users, Trophy, GraduationCap,
  Bell, ArrowRight
} from "lucide-react"
import Link from "next/link"
import * as dashboardActions from "./actions"
import { BentoGrid, BentoCard, BentoCardHeader, BentoCardTitle, BentoCardContent } from "@/components/ui/bento-grid"
import { CtaCard, CtaCardHeader, CtaCardTitle, CtaCardDescription, CtaCardContent } from "@/components/ui/cta-card"

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
        <CtaCard variant="accent" className="border-orange-500/50">
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
        </CtaCard>
      )}

      {/* Stats Cards - Bento Grid */}
      <BentoGrid>
        <BentoCard delay={0}>
          <BentoCardHeader>
            <BentoCardTitle className="text-sm font-medium">Events Participated</BentoCardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </BentoCardHeader>
          <BentoCardContent>
            <div className="text-2xl font-bold">{stats?.eventsParticipated || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </BentoCardContent>
        </BentoCard>

        <BentoCard delay={0.05}>
          <BentoCardHeader>
            <BentoCardTitle className="text-sm font-medium">Upcoming Events</BentoCardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </BentoCardHeader>
          <BentoCardContent>
            <div className="text-2xl font-bold">{stats?.upcomingEvents || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered</p>
          </BentoCardContent>
        </BentoCard>

        <BentoCard delay={0.1}>
          <BentoCardHeader>
            <BentoCardTitle className="text-sm font-medium">Workshops Attended</BentoCardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </BentoCardHeader>
          <BentoCardContent>
            <div className="text-2xl font-bold">{stats?.workshopsAttended || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Completed</p>
          </BentoCardContent>
        </BentoCard>

        <BentoCard delay={0.15}>
          <BentoCardHeader>
            <BentoCardTitle className="text-sm font-medium">Team Points</BentoCardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </BentoCardHeader>
          <BentoCardContent>
            <div className="text-2xl font-bold">{stats?.teamPoints || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Total earned</p>
          </BentoCardContent>
        </BentoCard>

        {/* Upcoming Events - Spans 2 columns */}
        <BentoCard span="2" delay={0.2}>
          <BentoCardHeader>
            <BentoCardTitle>Your Upcoming Events</BentoCardTitle>
            <Link href="/member/events">
              <Button variant="outline" size="sm">
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </BentoCardHeader>
          <BentoCardContent>
            <div className="space-y-3">
              {stats?.upcomingEventsList?.slice(0, 4).map((event: any) => (
                event && event.id ? (
                  <div key={event.id} className="p-3 border rounded-lg hover:bg-muted/20 transition-colors">
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
          </BentoCardContent>
        </BentoCard>

        {/* My Teams */}
        <BentoCard delay={0.25}>
          <BentoCardHeader>
            <BentoCardTitle>My Teams</BentoCardTitle>
            <Link href="/member/teams">
              <Button variant="outline" size="sm">
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </BentoCardHeader>
          <BentoCardContent>
            <div className="space-y-3">
              {stats?.myTeams?.slice(0, 4).map((team: any) => (
                team && team.id ? (
                  <div key={team.id} className="p-3 border rounded-lg hover:bg-muted/20 transition-colors">
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
          </BentoCardContent>
        </BentoCard>
      </BentoGrid>

      {/* Quick Actions */}
      <CtaCard>
        <CtaCardHeader>
          <CtaCardTitle>Quick Actions</CtaCardTitle>
          <CtaCardDescription>Common tasks and shortcuts</CtaCardDescription>
        </CtaCardHeader>
        <CtaCardContent>
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
        </CtaCardContent>
      </CtaCard>
    </div>
  )
}
