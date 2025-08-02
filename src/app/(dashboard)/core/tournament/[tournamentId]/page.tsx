"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Trophy, Users, Calendar, Plus, Minus, TrendingUp, Award, Medal, Crown } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { useParams } from "next/navigation"
import Link from "next/link"
import { getTournamentDetails, updateTournamentPoints } from "../actions"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function TournamentManagementPage() {
  const params = useParams()
  const tournamentId = params.tournamentId as string
  const [loading, setLoading] = useState(true)
  const [tournamentData, setTournamentData] = useState<any>(null)
  const [isPointsModalOpen, setIsPointsModalOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<any>(null)
  const [pointsForm, setPointsForm] = useState({
    points: 0,
    matchResult: "",
  })
  const [updatingPoints, setUpdatingPoints] = useState(false)

  const loadTournamentData = useCallback(async () => {
    setLoading(true)
    try {
      const response = await getTournamentDetails(tournamentId)
      if (!response.success) {
        throw new Error(response.message || "Failed to load tournament data")
      }
      setTournamentData(response.data)
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to load tournament data",
      })
    } finally {
      setLoading(false)
    }
  }, [tournamentId])

  useEffect(() => {
    loadTournamentData()
  }, [loadTournamentData])

  const handleUpdatePoints = async () => {
    if (!selectedTeam || pointsForm.points === 0) {
      toast.error("Error", {
        description: "Please select a team and enter points",
      })
      return
    }

    setUpdatingPoints(true)
    try {
      // Convert matchResult string to object as required by updateTournamentPoints
      let matchResultObj: { wins?: number; losses?: number; draws?: number } | undefined = undefined;
      if (pointsForm.matchResult === "win") matchResultObj = { wins: 1 };
      else if (pointsForm.matchResult === "loss") matchResultObj = { losses: 1 };
      else if (pointsForm.matchResult === "draw") matchResultObj = { draws: 1 };

      const response = await updateTournamentPoints(
        tournamentId,
        selectedTeam.id,
        pointsForm.points,
        matchResultObj,
      )

      if (!response.success) {
        throw new Error(response.message)
      }

      toast.success("Success", {
        description: response.message,
      })
      setIsPointsModalOpen(false)
      setSelectedTeam(null)
      setPointsForm({ points: 0, matchResult: "" })
      loadTournamentData()
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to update points",
      })
    } finally {
      setUpdatingPoints(false)
    }
  }

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return Crown
      case 2:
        return Medal
      case 3:
        return Award
      default:
        return Trophy
    }
  }

  const getPositionColor = (position: number) => {
    switch (position) {
      case 1:
        return "text-yellow-400"
      case 2:
        return "text-gray-300"
      case 3:
        return "text-amber-600"
      default:
        return "text-muted-foreground"
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading tournament data...</div>
  }

  if (!tournamentData) {
    return (
      <div className="text-center py-8">
        <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Tournament not found</h3>
        <Link href="/core/tournament">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tournaments
          </Button>
        </Link>
      </div>
    )
  }

  const { tournament, registrations, leaderboard } = tournamentData

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/core/tournament">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tournaments
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-neon">{tournament.title}</h1>
              <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                <Trophy className="h-4 w-4 mr-1" />
                Tournament {tournament.year}
              </Badge>
            </div>
            <p className="text-muted-foreground">{tournament.description}</p>
          </div>
        </div>
        {tournament.status === "ongoing" && (
          <Dialog open={isPointsModalOpen} onOpenChange={setIsPointsModalOpen}>
            <DialogTrigger asChild>
              <Button className="glow-blue">
                <TrendingUp className="h-4 w-4 mr-2" />
                Update Points
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Update Tournament Points</DialogTitle>
                <DialogDescription>Add or subtract points for a team based on match results</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Team</Label>
                  <Select
                    onValueChange={(value) => {
                      const team = registrations.find((r: any) => r.teams.id === value)?.teams
                      setSelectedTeam(team)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a team..." />
                    </SelectTrigger>
                    <SelectContent>
                      {registrations.map((registration: any) => (
                        <SelectItem key={registration.teams.id} value={registration.teams.id}>
                          {registration.teams.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Points</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPointsForm((prev) => ({ ...prev, points: Math.max(prev.points - 1, -10) }))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      value={pointsForm.points}
                      onChange={(e) =>
                        setPointsForm((prev) => ({ ...prev, points: Number.parseInt(e.target.value) || 0 }))
                      }
                      className="text-center"
                      min="-10"
                      max="10"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPointsForm((prev) => ({ ...prev, points: Math.min(prev.points + 1, 10) }))}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Match Result (Optional)</Label>
                  <Select onValueChange={(value) => setPointsForm((prev) => ({ ...prev, matchResult: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select result..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="win">Win</SelectItem>
                      <SelectItem value="loss">Loss</SelectItem>
                      <SelectItem value="draw">Draw</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsPointsModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdatePoints} disabled={updatingPoints} className="glow-blue">
                  {updatingPoints ? "Updating..." : "Update Points"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Tournament Info */}
      <Card className="bg-dark-surface border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Tournament Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Trophy className="h-4 w-4" />
                <span className="text-sm">Status</span>
              </div>
              <Badge variant="outline" className="capitalize">
                {tournament.status.replace("_", " ")}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="text-sm">Registered Teams</span>
              </div>
              <p className="font-medium">{registrations.length}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Year</span>
              </div>
              <p className="font-medium">{tournament.year}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leaderboard */}
        <Card className="bg-dark-surface border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-400" />
              Tournament Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboard.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No points recorded yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((entry: any, index: number) => {
                  const PositionIcon = getPositionIcon(index + 1)
                  return (
                    <div
                      key={entry.team_name}
                      className={`p-4 rounded-lg border transition-all ${
                        index < 3 ? "border-yellow-500/30 bg-yellow-500/5" : "border-border bg-muted/10"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <PositionIcon className={`h-6 w-6 ${getPositionColor(index + 1)}`} />
                          <div>
                            <h4 className="font-medium">{entry.team_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {entry.matches_played} matches • {entry.wins}W {entry.losses}L {entry.draws}D
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">{entry.points}</p>
                          <p className="text-xs text-muted-foreground">points</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Registered Teams */}
        <Card className="bg-dark-surface border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Registered Teams ({registrations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {registrations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No teams registered yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {registrations.map((registration: any) => (
                  <div
                    key={registration.id}
                    className="p-4 rounded-lg border border-border bg-muted/10 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{registration.teams.name}</h4>
                      <Badge variant={registration.teams.is_active ? "default" : "secondary"} className="text-xs">
                        {registration.teams.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Leader: {registration.teams.profiles?.full_name}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {registration.teams.team_members?.map((member: any, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {member.profiles?.full_name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
