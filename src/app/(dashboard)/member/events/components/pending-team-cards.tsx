"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Users, UserPlus, Trophy, AlertCircle } from "lucide-react"
import { getPendingTeams, applyToTeam } from "../actions"

interface PendingTeamsCardProps {
  onUpdate: () => void
}

export function PendingTeamsCard({ onUpdate }: PendingTeamsCardProps) {
  const [pendingTeams, setPendingTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [applyingToTeam, setApplyingToTeam] = useState<string | null>(null)
  const [selectedEventId, setSelectedEventId] = useState<string>("")

  useEffect(() => {
    if (selectedEventId) {
      loadPendingTeams()
    }
  }, [selectedEventId])

  const loadPendingTeams = async () => {
    if (!selectedEventId) return

    setLoading(true)
    try {
      const response = await getPendingTeams(selectedEventId)
      if (!response.success) {
        throw new Error(response.message || "Failed to load pending teams")
      }
      setPendingTeams(response.data || [])
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to load pending teams",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApplyToTeam = async (teamId: string) => {
    setApplyingToTeam(teamId)
    try {
      const response = await applyToTeam(teamId)
      toast.success("Application Sent", {
        description: response.message,
      })
      loadPendingTeams()
      onUpdate()
    } catch (error: any) {
      toast.error("Application Failed", {
        description: error.message || "Failed to apply to team",
      })
    } finally {
      setApplyingToTeam(null)
    }
  }

  return (
    <Card className="bg-dark-surface border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Find Teams Looking for Members
        </CardTitle>
        <p className="text-sm text-muted-foreground">Apply to join teams that need additional members</p>
      </CardHeader>
      <CardContent>
        {/* Event Selection */}
        <div className="mb-4">
          <label className="text-sm font-medium mb-2 block">Select Event</label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground"
          >
            <option value="">Choose an event to see pending teams</option>
            {/* This would be populated with available events */}
            <option value="event1">Web Development Challenge</option>
            <option value="event2">Programming Contest</option>
          </select>
        </div>

        {!selectedEventId ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select an event to see teams looking for members</p>
          </div>
        ) : loading ? (
          <div className="text-center py-4 text-muted-foreground">Loading teams...</div>
        ) : pendingTeams.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No teams are currently looking for members in this event</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingTeams.map((team) => (
              <div
                key={team.id}
                className="p-4 rounded-lg border border-border bg-muted/10 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{team.name}</h4>
                      {team.is_tournament && (
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
                      Leader: <span className="font-medium">{team.leader_name}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">{team.description}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {team.current_members}/{team.max_members} members
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {team.team_members?.map((member: any, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {member.profiles?.full_name}
                      </Badge>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleApplyToTeam(team.id)}
                    disabled={applyingToTeam === team.id}
                    className="glow-blue"
                  >
                    <UserPlus className="h-3 w-3 mr-1" />
                    {applyingToTeam === team.id ? "Applying..." : "Apply to Join"}
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
