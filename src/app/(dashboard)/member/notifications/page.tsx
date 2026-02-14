"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Bell, CheckCircle, XCircle, Clock, ArrowLeft, Users, FileText
} from "lucide-react"
import Link from "next/link"
import { getTeamInvitations, getTeamApplication, respondToInvitation, respondToApplication } from "../events/actions"
import { toast } from "sonner"
import Preloader from "@/components/ui/preloader"

export default function NotificationsPage() {
  const [showPreloader, setShowPreloader] = useState(true)
  const [invitations, setInvitations] = useState<any[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processingInvitation, setProcessingInvitation] = useState<string | null>(null)
  const [processingApplication, setProcessingApplication] = useState<string | null>(null)

    const loadNotifications = async () => {
    setLoading(true)
    try {
      const [invitationResponse, applicationResponse] = await Promise.all([
        getTeamInvitations(),
        getTeamApplication()
      ])

      if (invitationResponse.success) {
        setInvitations(invitationResponse.data || [])
      }

      if (applicationResponse.success) {
        setApplications(applicationResponse.data || [])
      }
    } catch (error) {
      console.error("Failed to load notifications:", error)
      toast.error("Failed to load notifications")
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
  
  const totalPending = invitations.length + applications.filter(app => app.status === 'pending').length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/member/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {totalPending > 0 ? `You have ${totalPending} pending action(s)` : "All caught up!"}
          </p>
        </div>
      </div>

      {/* Team Invitations */}
      {invitations.length > 0 && (
        <Card className="bg-dark-surface border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Team Invitations
              <Badge variant="destructive" className="ml-2">
                {invitations.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations.map((invitation: any) => {
                const team = invitation?.teams || {};
                const teamName = team?.name || "Unknown Team";
                const teamLeader = team?.profiles?.full_name || "Team Leader";
                const teamDescription = team?.description || "";
                const teamMembers = team?.team_members || [];

                return (
                  <div
                    key={invitation.id}
                    className="p-4 rounded-lg border border-border bg-muted/10 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{teamName}</h4>
                        <p className="text-sm text-muted-foreground">
                          Invited by <span className="font-medium">{teamLeader}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{teamDescription}</p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(invitation.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-2">
                        {teamMembers.map((member: any, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {member?.profiles?.full_name || "Unknown Member"}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleInvitationResponse(invitation.id, true)}
                          disabled={processingInvitation === invitation.id}
                          className="glow-green"
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleInvitationResponse(invitation.id, false)}
                          disabled={processingInvitation === invitation.id}
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Applications */}
      {applications.length > 0 && (
        <Card className="bg-dark-surface border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Your Team Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {applications.map((application: any) => {
                const team = application?.teams || {};
                const teamName = team?.name || "Unknown Team";
                const teamLeader = team?.profiles?.full_name || "Unknown Leader";
                const teamDescription = team?.description || "";
                const teamMembers = team?.team_members || [];

                const getStatusColor = (status: string) => {
                  switch (status) {
                    case "accepted":
                      return "text-green-400"
                    case "rejected":
                      return "text-red-400"
                    case "pending":
                      return "text-yellow-400"
                    default:
                      return "text-muted-foreground"
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

                const StatusIcon = getStatusIcon(application.status)

                return (
                  <div
                    key={application.id}
                    className="p-4 rounded-lg border border-border bg-muted/10 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{teamName}</h4>
                          <Badge
                            variant="outline"
                            className={`text-xs ${getStatusColor(application.status)}`}
                          >
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {application.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Leader: <span className="font-medium">{teamLeader}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{teamDescription}</p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(application.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {teamMembers.map((member: any, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {member?.profiles?.full_name || "Unknown Member"}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {invitations.length === 0 && applications.length === 0 && (
        <Card className="bg-dark-surface border-border">
          <CardContent className="text-center py-8">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No notifications</h3>
            <p className="text-muted-foreground mb-4">You're all caught up! No pending invitations or applications.</p>
            <Link href="/member/events">
              <Button variant="outline">
                Browse Events
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}