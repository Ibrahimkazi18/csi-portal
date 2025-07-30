"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { UserPlus, Check, X, Clock, Trophy, AlertCircle } from "lucide-react"
import { respondToApplication } from "../actions"

interface TeamApplicationsCardProps {
  onUpdate: () => void
}

export function TeamApplicationsCard({ onUpdate }: TeamApplicationsCardProps) {
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processingApplication, setProcessingApplication] = useState<string | null>(null)

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    setLoading(true)
    try {
      // Mock data - replace with actual API call to get applications for teams user leads
      const mockApplications = [
        {
          id: "1",
          team_id: "team1",
          team_name: "Code Warriors",
          applicant_name: "Alice Johnson",
          applicant_email: "alice@example.com",
          event_title: "Web Development Challenge",
          is_tournament: false,
          created_at: "2024-01-15T10:00:00Z",
          status: "pending",
        },
        {
          id: "2",
          team_id: "team2",
          team_name: "Algorithm Masters",
          applicant_name: "Bob Wilson",
          applicant_email: "bob@example.com",
          event_title: "Programming Contest",
          is_tournament: true,
          created_at: "2024-01-14T15:30:00Z",
          status: "pending",
        },
      ]
      setApplications(mockApplications)
    } catch (error: any) {
      toast.error("Error", {
        description: "Failed to load team applications",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApplicationResponse = async (applicationId: string, accept: boolean) => {
    setProcessingApplication(applicationId)
    try {
      const response = await respondToApplication(applicationId, accept)
      toast.success("Response Sent", {
        description: response.message,
      })
      loadApplications()
      onUpdate()
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to respond to application",
      })
    } finally {
      setProcessingApplication(null)
    }
  }

  return (
    <Card className="bg-dark-surface border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          Team Applications
          {applications.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {applications.length}
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">Manage applications to join your teams</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4 text-muted-foreground">Loading applications...</div>
        ) : applications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No pending applications for your teams</p>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((application) => (
              <div
                key={application.id}
                className="p-4 rounded-lg border border-border bg-muted/10 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{application.applicant_name}</h4>
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{application.applicant_email}</p>
                    <p className="text-sm text-muted-foreground mb-1">
                      Wants to join: <span className="font-medium">{application.team_name}</span>
                      {application.is_tournament && (
                        <Badge
                          variant="outline"
                          className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs ml-2"
                        >
                          <Trophy className="h-3 w-3 mr-1" />
                          Tournament
                        </Badge>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Event: <span className="font-medium">{application.event_title}</span>
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(application.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleApplicationResponse(application.id, true)}
                    disabled={processingApplication === application.id}
                    className="glow-green"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleApplicationResponse(application.id, false)}
                    disabled={processingApplication === application.id}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Reject
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
