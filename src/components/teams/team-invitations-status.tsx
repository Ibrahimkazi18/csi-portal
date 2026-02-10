"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, Mail, UserPlus } from "lucide-react"
import { toast } from "sonner"

interface TeamInvitationStatus {
  id: string
  invitee_name: string
  invitee_email: string
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  created_at: string
  responded_at?: string
  expires_at: string
  invitee_id: string
}

interface TeamInvitationsStatusProps {
  teamId: string
}

export function TeamInvitationsStatus({ teamId }: TeamInvitationsStatusProps) {
  const [invitations, setInvitations] = useState<TeamInvitationStatus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInvitations()
  }, [teamId])

  const loadInvitations = async () => {
    setLoading(true)
    try {
      const { getTeamInvitationStatus } = await import("./actions")
      const response = await getTeamInvitationStatus(teamId)
      
      if (response.success) {
        setInvitations(response.data)
      } else {
        toast.error(response.error)
      }
    } catch (error) {
      toast.error("Failed to load invitations")
    }
    setLoading(false)
  }

  const handleCancel = async (invitationId: string) => {
    if (!confirm("Cancel this invitation?")) return

    try {
      const { cancelInvitation } = await import("./actions")
      const response = await cancelInvitation(invitationId)
      
      if (response.success) {
        toast.success("Invitation cancelled")
        loadInvitations()
      } else {
        toast.error(response.error)
      }
    } catch (error) {
      toast.error("Failed to cancel invitation")
    }
  }

  const handleReinvite = async (memberId: string) => {
    try {
      const { reinviteMember } = await import("./actions")
      const response = await reinviteMember(teamId, memberId)
      
      if (response.success) {
        toast.success("Invitation sent")
        loadInvitations()
      } else {
        toast.error(response.error)
      }
    } catch (error) {
      toast.error("Failed to send invitation")
    }
  }

  if (loading) return <div>Loading invitations...</div>

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'declined': return <XCircle className="h-4 w-4 text-red-500" />
      case 'expired': return <Clock className="h-4 w-4 text-gray-500" />
      default: return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: any = {
      accepted: "default",
      declined: "destructive", 
      pending: "secondary",
      expired: "outline"
    }
    
    return (
      <Badge variant={variants[status] || "outline"}>
        {status}
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Team Invitations ({invitations.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {invitations.map((invitation) => (
          <div
            key={invitation.id}
            className="p-3 rounded-lg border flex items-start justify-between"
          >
            <div className="flex items-start gap-3 flex-1">
              {getStatusIcon(invitation.status)}
              <div className="flex-1">
                <p className="font-medium">{invitation.invitee_name}</p>
                <p className="text-sm text-muted-foreground">
                  {invitation.invitee_email}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusBadge(invitation.status)}
                  <span className="text-xs text-muted-foreground">
                    {invitation.responded_at
                      ? `${invitation.status} ${new Date(invitation.responded_at).toLocaleString()}`
                      : `Sent ${new Date(invitation.created_at).toLocaleString()}`
                    }
                  </span>
                </div>
                {invitation.status === 'pending' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Expires {new Date(invitation.expires_at).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {invitation.status === 'declined' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReinvite(invitation.invitee_id)}
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Reinvite
                </Button>
              )}

              {invitation.status === 'pending' && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleCancel(invitation.id)}
                >
                  Cancel
                </Button>
              )}

              {invitation.status === 'expired' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReinvite(invitation.invitee_id)}
                >
                  Resend
                </Button>
              )}
            </div>
          </div>
        ))}

        {invitations.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            No invitations sent yet
          </div>
        )}
      </CardContent>
    </Card>
  )
}