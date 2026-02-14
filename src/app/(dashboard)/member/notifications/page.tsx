"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Bell, CheckCircle, XCircle, Clock, Users, FileText, Search, RefreshCcw, X, AlertCircle, UserPlus
} from "lucide-react"
import { getTeamInvitations, getTeamApplication, respondToInvitation } from "../events/actions"
import { getTeamLeaderNotifications, markNotificationAsRead } from "@/components/teams/team-leader-actions"
import { toast } from "sonner"
import { CtaCard, CtaCardHeader, CtaCardTitle, CtaCardDescription, CtaCardContent } from "@/components/ui/cta-card"
import Preloader from "@/components/ui/preloader"

export default function NotificationsPage() {
  const [showPreloader, setShowPreloader] = useState(true)
  const [invitations, setInvitations] = useState<any[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [leaderNotifications, setLeaderNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processingInvitation, setProcessingInvitation] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const [invitationResponse, applicationResponse, leaderResponse] = await Promise.all([
        getTeamInvitations(),
        getTeamApplication(),
        getTeamLeaderNotifications()
      ])

      if (invitationResponse.success) {
        setInvitations(invitationResponse.data || [])
      }

      if (applicationResponse.success) {
        setApplications(applicationResponse.data || [])
      }

      if (leaderResponse.success) {
        setLeaderNotifications(leaderResponse.data || [])
      }
    } catch (error) {
      console.error("Failed to load notifications:", error)
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

  const handlePreloaderComplete = useCallback(() => {
    setShowPreloader(false)
  }, [])

  if (showPreloader) {
    return (
      <div className="relative w-full h-screen">
        <Preloader onComplete={handlePreloaderComplete} />
      </div>
    )
  }

  const handleLeaderNotificationRead = async (notificationId: string) => {
    try {
      const response = await markNotificationAsRead(notificationId)
      if (response.success) {
        setLeaderNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        )
        toast.success("Notification marked as read")
      } else {
        toast.error(response.error)
      }
    } catch (error) {
      toast.error("Failed to mark notification as read")
    }
  }

  const handleInvitationResponse = async (invitationId: string, accept: boolean) => {
    setProcessingInvitation(invitationId)
    try {
      const response = await respondToInvitation(invitationId, accept)
      toast.success("Response Sent", {
        description: response.message,
      })
      loadNotifications()
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to respond to invitation",
      })
    } finally {
      setProcessingInvitation(null)
    }
  }

  // Filter functions
  const filteredInvitations = invitations.filter(invitation => {
    const team = invitation?.teams || {}
    const teamName = team?.name || "Unknown Team"
    const teamLeader = team?.profiles?.full_name || "Team Leader"
    return teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           teamLeader.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const filteredApplications = applications.filter(application => {
    const team = application?.teams || {}
    const teamName = team?.name || "Unknown Team"
    const teamLeader = team?.profiles?.full_name || "Unknown Leader"
    return teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           teamLeader.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const filteredLeaderNotifications = leaderNotifications.filter(notification => {
    const searchLower = searchQuery.toLowerCase()
    return notification.title.toLowerCase().includes(searchLower) ||
           notification.message.toLowerCase().includes(searchLower) ||
           (notification.team_name && notification.team_name.toLowerCase().includes(searchLower))
  })

  const totalPending = invitations.length + applications.filter(app => app.status === 'pending').length + leaderNotifications.filter(n => !n.read).length

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "text-green-400 border-green-500/30 bg-green-500/10"
      case "rejected":
        return "text-red-400 border-red-500/30 bg-red-500/10"
      case "pending":
        return "text-yellow-400 border-yellow-500/30 bg-yellow-500/10"
      default:
        return "text-muted-foreground border-border bg-muted/10"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return CheckCircle
      case "rejected":
        return XCircle
      case "pending":
        return Clock
      default:
        return FileText
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {totalPending > 0 ? `You have ${totalPending} pending action(s)` : "All caught up! No pending notifications."}
          </p>
        </div>
        <Button variant="outline" onClick={loadNotifications}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Search Bar */}
      {(invitations.length > 0 || applications.length > 0) && (
        <CtaCard variant="accent">
          <CtaCardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by team name or leader..."
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
            {searchQuery && (
              <p className="text-sm text-muted-foreground mt-2">
                Found {filteredInvitations.length + filteredApplications.length + filteredLeaderNotifications.length} notification(s) matching "{searchQuery}"
              </p>
            )}
          </CtaCardContent>
        </CtaCard>
      )}

      {/* Tabs for different notification types */}
      {(invitations.length > 0 || applications.length > 0 || leaderNotifications.length > 0) ? (
        <Tabs defaultValue="invitations" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="invitations" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Invitations
              {invitations.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {invitations.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="applications" className="gap-2">
              <FileText className="h-4 w-4" />
              Applications
              <Badge variant="secondary" className="ml-1">
                {applications.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="leader" className="gap-2">
              <Bell className="h-4 w-4" />
              Team Leader
              {leaderNotifications.filter(n => !n.read).length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {leaderNotifications.filter(n => !n.read).length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Team Invitations Tab */}
          <TabsContent value="invitations">
            <CtaCard variant="accent">
              <CtaCardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  <CtaCardTitle>Team Invitations</CtaCardTitle>
                </div>
                <CtaCardDescription>
                  {invitations.length > 0 
                    ? `You have ${invitations.length} pending team invitation(s)`
                    : "No pending team invitations"
                  }
                </CtaCardDescription>
              </CtaCardHeader>
              <CtaCardContent>
                {filteredInvitations.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">
                      {searchQuery ? "No invitations match your search" : "No team invitations"}
                    </h3>
                    <p className="text-muted-foreground">
                      {searchQuery ? "Try adjusting your search terms" : "You're all caught up!"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredInvitations.map((invitation: any) => {
                      const team = invitation?.teams || {}
                      const teamName = team?.name || "Unknown Team"
                      const teamLeader = team?.profiles?.full_name || "Team Leader"
                      const teamDescription = team?.description || ""
                      const teamMembers = team?.team_members || []

                      return (
                        <div
                          key={invitation.id}
                          className="p-6 rounded-lg border border-border bg-card hover:bg-muted/20 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg mb-1">{teamName}</h4>
                              <p className="text-sm text-muted-foreground mb-2">
                                Invited by <span className="font-medium text-foreground">{teamLeader}</span>
                              </p>
                              {teamDescription && (
                                <p className="text-sm text-muted-foreground mb-3">{teamDescription}</p>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(invitation.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          
                          {teamMembers.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              <span className="text-sm text-muted-foreground mr-2">Team members:</span>
                              {teamMembers.map((member: any, index: number) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  <Users className="h-3 w-3 mr-1" />
                                  {member?.profiles?.full_name || "Unknown Member"}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          <div className="flex gap-3">
                            <Button
                              size="sm"
                              onClick={() => handleInvitationResponse(invitation.id, true)}
                              disabled={processingInvitation === invitation.id}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleInvitationResponse(invitation.id, false)}
                              disabled={processingInvitation === invitation.id}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Decline
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CtaCardContent>
            </CtaCard>
          </TabsContent>

          {/* Team Applications Tab */}
          <TabsContent value="applications">
            <CtaCard>
              <CtaCardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CtaCardTitle>Your Team Applications</CtaCardTitle>
                </div>
                <CtaCardDescription>
                  Track the status of your team applications
                </CtaCardDescription>
              </CtaCardHeader>
              <CtaCardContent>
                {filteredApplications.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">
                      {searchQuery ? "No applications match your search" : "No team applications"}
                    </h3>
                    <p className="text-muted-foreground">
                      {searchQuery ? "Try adjusting your search terms" : "You haven't applied to any teams yet"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredApplications.map((application: any) => {
                      const team = application?.teams || {}
                      const teamName = team?.name || "Unknown Team"
                      const teamLeader = team?.profiles?.full_name || "Unknown Leader"
                      const teamDescription = team?.description || ""
                      const teamMembers = team?.team_members || []
                      const StatusIcon = getStatusIcon(application.status)

                      return (
                        <div
                          key={application.id}
                          className="p-6 rounded-lg border border-border bg-card hover:bg-muted/20 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold text-lg">{teamName}</h4>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${getStatusColor(application.status)}`}
                                >
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                Leader: <span className="font-medium text-foreground">{teamLeader}</span>
                              </p>
                              {teamDescription && (
                                <p className="text-sm text-muted-foreground mb-3">{teamDescription}</p>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(application.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          
                          {teamMembers.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              <span className="text-sm text-muted-foreground mr-2">Team members:</span>
                              {teamMembers.map((member: any, index: number) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  <Users className="h-3 w-3 mr-1" />
                                  {member?.profiles?.full_name || "Unknown Member"}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CtaCardContent>
            </CtaCard>
          </TabsContent>

          {/* Team Leader Notifications Tab */}
          <TabsContent value="leader">
            <CtaCard variant="accent">
              <CtaCardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  <CtaCardTitle>Team Leader Notifications</CtaCardTitle>
                </div>
                <CtaCardDescription>
                  {leaderNotifications.length > 0 
                    ? `Responses to your team invitations`
                    : "No team leader notifications"
                  }
                </CtaCardDescription>
              </CtaCardHeader>
              <CtaCardContent>
                {filteredLeaderNotifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">
                      {searchQuery ? "No notifications match your search" : "No team leader notifications"}
                    </h3>
                    <p className="text-muted-foreground">
                      {searchQuery ? "Try adjusting your search terms" : "You'll see responses to your team invitations here"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredLeaderNotifications.map((notification: any) => (
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
                                onClick={() => handleLeaderNotificationRead(notification.id)}
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
        </Tabs>
      ) : (
        /* Empty State */
        <CtaCard>
          <CtaCardContent className="text-center py-16">
            <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-6 opacity-50" />
            <h3 className="text-xl font-semibold mb-3">No notifications</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              You're all caught up! No pending invitations, applications, or team notifications at the moment.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" onClick={() => window.location.href = '/member/events'}>
                <AlertCircle className="h-4 w-4 mr-2" />
                Browse Events
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/member/teams'}>
                <Users className="h-4 w-4 mr-2" />
                Manage Teams
              </Button>
              <Button onClick={loadNotifications}>
                <RefreshCcw className="h-4 w-4 mr-2" />
                Check Again
              </Button>
            </div>
          </CtaCardContent>
        </CtaCard>
      )}
    </div>
  )
}