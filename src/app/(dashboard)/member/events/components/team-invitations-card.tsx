"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Bell, Check, X, Trophy, Calendar } from "lucide-react"
import { respondToInvitation } from "../actions"

interface TeamInvitationsCardProps {
  onUpdate: () => void
}

export function TeamInvitationsCard({ onUpdate }: TeamInvitationsCardProps) {
  const [invitations, setInvitations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processingInvitation, setProcessingInvitation] = useState<string | null>(null)

  useEffect(() => {
    loadInvitations()
  }, [])

  const loadInvitations = async () => {
    setLoading(true)
    try {
      // Mock data - replace with actual API call
      const mockInvitations = [
        {
          id: "1",
          team_id: "team1",
          team_name: "Code Warriors",
          inviter_name: "John Doe",
          event_title: "Web Development Challenge",
          event_type: "team",
          is_tournament: false,
          created_at: "2024-01-15T10:00:00Z",
          status: "pending",
        },
        {
          id: "2",
          team_id: "team2",
          team_name: "Algorithm Masters",
          inviter_name: "Jane Smith",
          event_title: "Programming Contest",
          event_type: "team",
          is_tournament: true,
          created_at: "2024-01-14T15:30:00Z",
          status: "pending",
        },
      ]
      setInvitations(mockInvitations)
    } catch (error: any) {
      toast.error("Error", {
        description: "Failed to load team invitations",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInvitationResponse = async (invitationId: string, accept: boolean) => {
    setProcessingInvitation(invitationId)
    try {
      const response = await respondToInvitation(invitationId, accept)
      toast.success("Response Sent", {
        description: response.message,
      })
      loadInvitations()
      onUpdate()
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to respond to invitation",
      })
    } finally {
      setProcessingInvitation(null)
    }
  }

  return (
    <Card className="bg-dark-surface border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Team Invitations
          {invitations.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {invitations.length}
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">Respond to team invitations from other members</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4 text-muted-foreground">Loading invitations...</div>
        ) : invitations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No pending team invitations</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="p-4 rounded-lg border border-border bg-muted/10 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{invitation.team_name}</h4>
                      {invitation.is_tournament && (
                        <Badge
                          variant="outline"
                          className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs"
                        >
                          <Trophy className="h-3 w-3 mr-1" />
                          Tournament
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Invited by <span className="font-medium">{invitation.inviter_name}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Event: <span className="font-medium">{invitation.event_title}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(invitation.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleInvitationResponse(invitation.id, true)}
                    disabled={processingInvitation === invitation.id}
                    className="glow-green"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleInvitationResponse(invitation.id, false)}
                    disabled={processingInvitation === invitation.id}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
