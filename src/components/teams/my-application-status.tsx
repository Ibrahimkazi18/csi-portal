"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, UserX } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface ApplicationStatus {
  id: string
  team_name: string
  team_leader_name: string
  event_title: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  event_id: string
}

interface MyApplicationStatusProps {
  eventId?: string
}

export function MyApplicationStatus({ eventId }: MyApplicationStatusProps) {
  const [applications, setApplications] = useState<ApplicationStatus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadApplications()
  }, [eventId])

  const loadApplications = async () => {
    setLoading(true)
    try {
      const { getMyApplicationStatus } = await import("./actions")
      const response = await getMyApplicationStatus(eventId)
      
      if (response.success && response.data) {
        setApplications(response.data)
      }
    } catch (error) {
      toast.error("Failed to load applications")
    }
    setLoading(false)
  }

  const handleWithdraw = async (applicationId: string) => {
    if (!confirm("Withdraw this application?")) return

    try {
      const { withdrawApplication } = await import("./actions")
      const response = await withdrawApplication(applicationId)
      
      if (response.success) {
        toast.success("Application withdrawn")
        loadApplications()
      } else {
        toast.error(response.error)
      }
    } catch (error) {
      toast.error("Failed to withdraw application")
    }
  }

  if (loading) return <div>Loading applications...</div>

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />
      default: return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Team Applications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {applications.map((app) => (
          <div
            key={app.id}
            className="p-3 rounded-lg border flex items-start justify-between"
          >
            <div className="flex items-start gap-3 flex-1">
              {getStatusIcon(app.status)}
              <div className="flex-1">
                <p className="font-medium">
                  {app.team_name} (Led by {app.team_leader_name})
                </p>
                <p className="text-sm text-muted-foreground">
                  For: {app.event_title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={
                    app.status === 'accepted' ? 'default' :
                    app.status === 'rejected' ? 'destructive' :
                    'secondary'
                  }>
                    {app.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {app.status === 'pending'
                      ? `Applied ${new Date(app.created_at).toLocaleString()}`
                      : `${app.status} ${new Date(app.created_at).toLocaleString()}`
                    }
                  </span>
                </div>

                {app.status === 'rejected' && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Your application was not accepted. You can apply to other teams.
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {app.status === 'pending' && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleWithdraw(app.id)}
                >
                  <UserX className="h-4 w-4 mr-1" />
                  Withdraw
                </Button>
              )}

              {app.status === 'accepted' && (
                <Link href={`/member/events/${app.event_id}`}>
                  <Button size="sm" variant="outline">
                    View Team
                  </Button>
                </Link>
              )}

              {app.status === 'rejected' && (
                <Link href={`/member/events/${app.event_id}`}>
                  <Button size="sm" variant="outline">
                    Apply Elsewhere
                  </Button>
                </Link>
              )}
            </div>
          </div>
        ))}

        {applications.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            No team applications yet
          </div>
        )}
      </CardContent>
    </Card>
  )
}