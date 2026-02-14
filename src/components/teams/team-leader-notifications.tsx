"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Bell, CheckCircle, XCircle, Clock, Users, Search, RefreshCcw, X, UserPlus, Crown, AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import { CtaCard, CtaCardHeader, CtaCardTitle, CtaCardDescription, CtaCardContent } from "@/components/ui/cta-card"
import { TeamInvitationsStatus } from "./team-invitations-status"

interface TeamLeaderNotification {
  id: string
  title: string
  message: string
  type: string
  created_at: string
  read: boolean
  team_id?: string
  team_name?: string
}

interface TeamLeaderNotificationsProps {
  className?: string
}

export function TeamLeaderNotifications({ className }: TeamLeaderNotificationsProps) {
  const [notifications, setNotifications] = useState<TeamLeaderNotification[]>([])
  const [myTeams, setMyTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const { getTeamLeaderNotifications, getMyTeams } = await import("./team-leader-actions")
      
      const [notificationsResponse, teamsResponse] = await Promise.all([
        getTeamLeaderNotifications(),
        getMyTeams()
      ])

      if (notificationsResponse.success) {
        setNotifications(notificationsResponse.data || [])
      }

      if (teamsResponse.success) {
        setMyTeams(teamsResponse.data || [])
      }
    } catch (error) {
      console.error("Failed to load team leader notifications:", error)
      toast.error("Error", {
        description: "Failed to load notifications. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const markAsRead = async (notificationId: string) => {
    try {
      const { markNotificationAsRead } = await import("./team-leader-actions")
      const response = await markNotificationAsRead(notificationId)
      
      if (response.success) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        )
      }
    } catch (error) {
      toast.error("Failed to mark notification as read")
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    const searchLower = searchQuery.toLowerCase()
    return notification.title.toLowerCase().includes(searchLower) ||
           notification.message.toLowerCase().includes(searchLower) ||
           (notification.team_name && notification.team_name.toLowerCase().includes(searchLower))
  })

  const unreadCount = notifications.filter(n => !n.read).length

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Crown className="h-6 w-6 text-primary" />
              Team Leader Dashboard
            </h2>
            <p className="text-muted-foreground">
              {unreadCount > 0 
                ? `You have ${unreadCount} unread notification(s)` 
                : "All caught up! No unread notifications."
              }
            </p>
          </div>
          <Button variant="outline" onClick={loadNotifications}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Search Bar */}
        {notifications.length > 0 && (
          <CtaCard variant="accent">
            <CtaCardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 h-12 text-base"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </CtaCardContent>
          </CtaCard>
        )}

        {/* Tabs for notifications and team management */}
        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="teams" className="gap-2">
              <Users className="h-4 w-4" />
              My Teams
              <Badge variant="secondary" className="ml-1">
                {myTeams.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <CtaCard variant="accent">
              <CtaCardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  <CtaCardTitle>Team Response Notifications</CtaCardTitle>
                </div>
                <CtaCardDescription>
                  {notifications.length > 0 
                    ? `Track responses to your team invitations`
                    : "No team notifications yet"
                  }
                </CtaCardDescription>
              </CtaCardHeader>
              <CtaCardContent>
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">
                      {searchQuery ? "No notifications match your search" : "No notifications"}
                    </h3>
                    <p className="text-muted-foreground">
                      {searchQuery ? "Try adjusting your search terms" : "You'll see responses to your team invitations here"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 rounded-lg border transition-colors ${
                          notification.read 
                            ? "bg-card border-border" 
                            : "bg-primary/5 border-primary/20"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{notification.title}</h4>
                              {!notification.read && (
                                <Badge variant="destructive" className="text-xs">
                                  New
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {notification.message}
                            </p>
                            {notification.team_name && (
                              <Badge variant="outline" className="text-xs">
                                <Users className="h-3 w-3 mr-1" />
                                {notification.team_name}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {new Date(notification.created_at).toLocaleDateString()}
                            </span>
                            {!notification.read && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => markAsRead(notification.id)}
                              >
                                Mark Read
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CtaCardContent>
            </CtaCard>
          </TabsContent>

          {/* Teams Management Tab */}
          <TabsContent value="teams">
            <CtaCard>
              <CtaCardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <CtaCardTitle>Your Teams</CtaCardTitle>
                </div>
                <CtaCardDescription>
                  Manage your teams and track invitation status
                </CtaCardDescription>
              </CtaCardHeader>
              <CtaCardContent>
                {myTeams.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No teams yet</h3>
                    <p className="text-muted-foreground mb-6">
                      You haven't created any teams yet. Create a team to start inviting members.
                    </p>
                    <Button onClick={() => window.location.href = '/member/events'}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Browse Events
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {myTeams.map((team) => (
                      <div key={team.id} className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                          <div>
                            <h4 className="font-semibold text-lg">{team.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {team.event_title || "Tournament Team"}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary">
                                <Users className="h-3 w-3 mr-1" />
                                {team.member_count} members
                              </Badge>
                              {team.is_tournament && (
                                <Badge variant="outline">Tournament</Badge>
                              )}
                            </div>
                          </div>
                          <Crown className="h-5 w-5 text-primary" />
                        </div>
                        
                        {/* Team Invitations Status */}
                        <TeamInvitationsStatus 
                          teamId={team.id} 
                          eventId={team.event_id}
                          teamName={team.name}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CtaCardContent>
            </CtaCard>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}