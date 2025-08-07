"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Trophy,
  Users,
  User,
  Crown,
  Medal,
  Award,
  Target,
  CheckCircle,
  X,
  Clock,
  Star,
  TrendingUp,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { useParams } from "next/navigation"
import Link from "next/link"
import { getMemberLiveEventData, getUserEventStatus } from "./actions"
import { LiveEventPageSkeleton } from "../../components/live-event-skeleton"

export default function MemberLiveEventPage() {
  const params = useParams()
  const eventId = params.eventId as string

  const [loading, setLoading] = useState(true)
  const [eventData, setEventData] = useState<any>(null)
  const [userStatus, setUserStatus] = useState<any>(null)

  const loadEventData = useCallback(async () => {
    setLoading(true)
    try {
      const [eventResponse, statusResponse] = await Promise.all([
        getMemberLiveEventData(eventId),
        getUserEventStatus(eventId),
      ])

      if (!eventResponse.success) {
        throw new Error(eventResponse.error || "Failed to load event data")
      }

      setEventData(eventResponse.data)
      setUserStatus(statusResponse.success ? statusResponse.data : null)
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to load event data",
      })
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    loadEventData()

    // Auto-refresh every 30 seconds for live updates
    const interval = setInterval(loadEventData, 30000)
    return () => clearInterval(interval)
  }, [loadEventData])

  const getParticipantsInRound = (roundId: string | null) => {
    if (roundId === null) {
      // Return participants not in any round yet
      const participantsInRounds = eventData.progress.map((p: any) => p.team_id || p.user_id)
      return eventData.progress.filter((p: any) => !participantsInRounds.includes(p.team_id || p.user_id))
    }

    return eventData.progress.filter((p: any) => p.round_id === roundId && !p.eliminated)
  }

  const getEliminatedParticipants = () => {
    return eventData.progress.filter((p: any) => p.eliminated)
  }

  const getUserCurrentRound = () => {
    if (!userStatus?.currentProgress) return null
    return eventData.rounds.find((r: any) => r.id === userStatus.currentProgress.round_id)
  }

  const isUserEliminated = () => {
    return userStatus?.currentProgress?.eliminated || false
  }

  const getUserTeammates = () => {
    if (userStatus?.registration?.registration_type !== "team") return []
    return userStatus.registration.teams?.team_members?.map((tm: any) => tm.profiles) || []
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

  const ParticipantCard = ({ participant, showDetails = false }: any) => {
    const isTeam = participant.teams
    const name = isTeam ? participant.teams?.name : participant.profiles?.full_name

    return (
      <div className="p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-2 mb-2">
          {isTeam ? <Users className="h-4 w-4" /> : <User className="h-4 w-4" />}
          <span className="font-medium">{name}</span>
          {participant.eliminated && (
            <Badge variant="destructive" className="text-xs">
              Eliminated
            </Badge>
          )}
        </div>
        {showDetails && isTeam && participant.teams?.team_members && (
          <div className="flex flex-wrap gap-1">
            {participant.teams.team_members.map((member: any, index: number) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {member.profiles?.full_name}
              </Badge>
            ))}
          </div>
        )}
        {participant.moved_at && (
          <div className="text-xs text-muted-foreground mt-1">
            <Clock className="h-3 w-3 inline mr-1" />
            {new Date(participant.moved_at).toLocaleString()}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return <LiveEventPageSkeleton />
  }

  if (!eventData) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium mb-2">Event not found</h3>
        <Link href="/member/events">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
        </Link>
      </div>
    )
  }

  const { event, rounds, progress, winners, tournamentPoints } = eventData
  const isCompleted = event.status === "completed"
  const currentRound = getUserCurrentRound()
  const isEliminated = isUserEliminated()
  const teammates = getUserTeammates()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/member/events">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-neon text-lavender">{isCompleted ? "Event Results" : "Live Event"}</h1>
            {event.is_tournament && (
              <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                <Trophy className="h-4 w-4 mr-1" />
                Tournament
              </Badge>
            )}
            <Badge
              variant="outline"
              className={
                isCompleted
                  ? "bg-gray-500/20 text-gray-400 border-gray-500/30"
                  : "bg-green-500/20 text-green-400 border-green-500/30"
              }
            >
              {isCompleted ? <Trophy className="h-4 w-4 mr-1" /> : <Target className="h-4 w-4 mr-1" />}
              {isCompleted ? "Completed" : "Ongoing"}
            </Badge>
          </div>
          <p className="text-muted-foreground">{event.title}</p>
        </div>
        <Button variant="outline" onClick={loadEventData} size="sm">
          Refresh
        </Button>
      </div>

      {/* User Status Card */}
      {userStatus && (
        <Card className={`bg-dark-surface border-border ${isEliminated ? "border-red-500/30" : "glow-blue"}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {userStatus.registration.registration_type === "team" ? (
                <Users className="h-5 w-5" />
              ) : (
                <User className="h-5 w-5" />
              )}
              Your Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {userStatus.registration.registration_type === "team" ? "Team" : "Participant"}
                </p>
                <p className="font-medium">
                  {userStatus.registration.registration_type === "team"
                    ? userStatus.registration.teams?.name
                    : "Individual Participant"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Round</p>
                <p className="font-medium">
                  {isEliminated ? (
                    <span className="text-red-400">Eliminated</span>
                  ) : currentRound ? (
                    currentRound.title
                  ) : (
                    "Not started"
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="flex items-center gap-2">
                  {isEliminated ? (
                    <>
                      <X className="h-4 w-4 text-red-400" />
                      <span className="text-red-400">Eliminated</span>
                    </>
                  ) : isCompleted ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-green-400">Event Completed</span>
                    </>
                  ) : (
                    <>
                      <Target className="h-4 w-4 text-blue-400" />
                      <span className="text-blue-400">Active</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {teammates.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">Team Members</p>
                <div className="flex flex-wrap gap-2">
                  {teammates.map((teammate: any, index: number) => (
                    <Badge key={index} variant="secondary">
                      {teammate.full_name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Winners Section (for completed events) */}
      {isCompleted && winners.length > 0 && (
        <Card className="bg-dark-surface border-yellow-500/30 glow-yellow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-400" />
              Winners & Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {winners.map((winner: any) => {
                const PositionIcon = getPositionIcon(winner.position)
                const isTeam = winner.teams
                const name = isTeam ? winner.teams?.name : winner.profiles?.full_name

                return (
                  <div
                    key={winner.id}
                    className={`p-4 rounded-lg border transition-all ${
                      winner.position <= 3 ? "border-yellow-500/30 bg-yellow-500/5" : "border-border bg-muted/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <PositionIcon className={`h-6 w-6 ${getPositionColor(winner.position)}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-lg">
                            {winner.position === 1 && "🥇 "}
                            {winner.position === 2 && "🥈 "}
                            {winner.position === 3 && "🥉 "}
                            {name}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {winner.position === 1 ? "1st Place" : winner.position === 2 ? "2nd Place" : "3rd Place"}
                          </Badge>
                        </div>
                        {isTeam && winner.teams?.team_members && (
                          <div className="flex flex-wrap gap-2">
                            {winner.teams.team_members.map((member: any, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {member.profiles?.full_name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tournament Points (for completed tournament events) */}
      {isCompleted && event.is_tournament && tournamentPoints.length > 0 && (
        <Card className="bg-dark-surface border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Tournament Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tournamentPoints.map((entry: any, index: number) => {
                const isTeam = entry.teams
                const name = isTeam ? entry.teams?.name : entry.profiles?.full_name

                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{name}</p>
                        <p className="text-sm text-muted-foreground">{entry.reason}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-400" />
                      <span className="font-bold text-green-400">{entry.points} pts</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Progress Board */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Rounds */}
        {rounds.map((round: any) => (
          <Card key={round.id} className="lg:col-span-3 bg-dark-surface border-border">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4" />
                {round.title} ({getParticipantsInRound(round.id).length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 min-h-[300px]">
              {getParticipantsInRound(round.id).map((participant: any) => (
                <ParticipantCard key={participant.id} participant={participant} showDetails={true} />
              ))}
            </CardContent>
          </Card>
        ))}

        {/* Eliminated */}
        <Card className="lg:col-span-3 bg-dark-surface border-red-500/30">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <X className="h-4 w-4 text-red-400" />
              Eliminated ({getEliminatedParticipants().length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 min-h-[300px]">
            {getEliminatedParticipants().map((participant: any) => (
              <ParticipantCard key={participant.id} participant={participant} showDetails={true} />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Live Updates Notice */}
      {!isCompleted && (
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-blue-400" />
              <div>
                <p className="font-medium text-blue-400">Live Event in Progress</p>
                <p className="text-sm text-blue-300">
                  This page updates automatically every 30 seconds. You can also click "Refresh" for the latest updates.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
