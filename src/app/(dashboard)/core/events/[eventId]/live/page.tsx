"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Trophy,
  Users,
  User,
  Play,
  RotateCcw,
  Crown,
  Medal,
  Award,
  X,
  CheckCircle,
  AlertTriangle,
  Target,
  ChevronRight,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  getLiveEventData,
  moveToNextRound,
  eliminateParticipant,
  setEventWinners,
  completeEvent,
  resetEventProgress,
} from "./actions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export default function LiveEventPage() {
  const params = useParams()
  const eventId = params.eventId as string

  const [loading, setLoading] = useState(true)
  const [eventData, setEventData] = useState<any>(null)
  const [isCompleting, setIsCompleting] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [winnersDialogOpen, setWinnersDialogOpen] = useState(false)
  const [movingParticipant, setMovingParticipant] = useState<string | null>(null)
  const [selectedWinners, setSelectedWinners] = useState<Array<{ position: number; teamId?: string; userId?: string }>>(
    [{ position: 1 }, { position: 2 }, { position: 3 }],
  )

  const loadEventData = useCallback(async () => {
    setLoading(true)
    try {
      const response = await getLiveEventData(eventId)
      if (!response.success) {
        throw new Error(response.error || "Failed to load event data")
      }
      setEventData(response.data)
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
  }, [loadEventData])

  const handleMoveParticipant = async (participant: any, targetRoundId: string | null) => {
    const participantKey = participant.team_id || participant.user_id
    setMovingParticipant(participantKey)

    try {
      // Find current progress
      const currentProgress = eventData.progress.find(
        (p: any) =>
          (p.team_id === participant.team_id && p.user_id === participant.user_id) ||
          (participant.team_id && p.team_id === participant.team_id) ||
          (participant.user_id && p.user_id === participant.user_id),
      )

      const fromRoundId = currentProgress?.round_id || null

      if (fromRoundId === targetRoundId) {
        return
      }

      const response = await moveToNextRound({
        eventId,
        teamId: participant.team_id,
        userId: participant.user_id,
        fromRoundId,
        toRoundId: targetRoundId!,
      })

      if (!response.success) {
        throw new Error(response.error)
      }

      toast.success("Success", {
        description: response.message,
      })

      loadEventData()
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to move participant",
      })
    } finally {
      setMovingParticipant(null)
    }
  }

  const handleEliminate = async (participant: any, roundId: string) => {
    const participantKey = participant.team_id || participant.user_id
    setMovingParticipant(participantKey)

    try {
      const response = await eliminateParticipant({
        eventId,
        teamId: participant.team_id,
        userId: participant.user_id,
        roundId,
      })

      if (!response.success) {
        throw new Error(response.error)
      }

      toast.success("Success", {
        description: response.message,
      })

      loadEventData()
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to eliminate participant",
      })
    } finally {
      setMovingParticipant(null)
    }
  }

  const handleSetWinners = async () => {
    const validWinners = selectedWinners.filter((w) => w.teamId || w.userId)
    if (validWinners.length === 0) {
      toast.error("Error", {
        description: "Please select at least one winner",
      })
      return
    }

    try {
      const response = await setEventWinners({
        eventId,
        winners: validWinners,
      })

      if (!response.success) {
        throw new Error(response.error)
      }

      toast.success("Success", {
        description: response.message,
      })

      setWinnersDialogOpen(false)
      loadEventData()
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to set winners",
      })
    }
  }

  const handleCompleteEvent = async () => {
    setIsCompleting(true)
    try {
      const response = await completeEvent(eventId)

      if (!response.success) {
        throw new Error(response.error)
      }

      toast.success("Success", {
        description: response.message,
      })

      loadEventData()
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to complete event",
      })
    } finally {
      setIsCompleting(false)
    }
  }

  const handleResetProgress = async () => {
    setIsResetting(true)
    try {
      const response = await resetEventProgress(eventId)

      if (!response.success) {
        throw new Error(response.error)
      }

      toast.success("Success", {
        description: response.message,
      })

      loadEventData()
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to reset progress",
      })
    } finally {
      setIsResetting(false)
    }
  }

  const getParticipantsInRound = (roundId: string | null) => {
    if (roundId === null) {
      // Return participants not in any round yet
      const participantsInRounds = eventData.progress.map((p: any) => p.team_id || p.user_id)
      return eventData.registrations.filter((reg: any) => !participantsInRounds.includes(reg.team_id || reg.user_id))
    }

    return eventData.progress
      .filter((p: any) => p.round_id === roundId && !p.eliminated)
      .map((p: any) => {
        const registration = eventData.registrations.find((reg: any) => {
          // More precise matching logic
          if (p.team_id && reg.team_id) {
            return reg.team_id === p.team_id
          }
          if (p.user_id && reg.user_id) {
            return reg.user_id === p.user_id
          }
          return false
        })

        if (!registration) {
          console.warn("No registration found for progress:", p)
          return null
        }

        return { ...registration, progress: p }
      })
      .filter(Boolean) // Remove null entries
  }

  const getEliminatedParticipants = () => {
    return eventData.progress
      .filter((p: any) => p.eliminated)
      .map((p: any) => {
        const registration = eventData.registrations.find((reg: any) => {
          // More precise matching logic
          if (p.team_id && reg.team_id) {
            return reg.team_id === p.team_id
          }
          if (p.user_id && reg.user_id) {
            return reg.user_id === p.user_id
          }
          return false
        })

        if (!registration) {
          console.warn("No registration found for eliminated participant:", p)
          return null
        }

        return { ...registration, progress: p }
      })
      .filter(Boolean) // Remove null entries
  }

  const getEventWinners = () => {
    return eventData.winners
      .map((winner: any) => {
        const registration = eventData.registrations.find((reg: any) => {
          // More precise matching logic
          if (winner.team_id && reg.team_id) {
            return reg.team_id === winner.team_id
          }
          if (winner.user_id && reg.user_id) {
            return reg.user_id === winner.user_id
          }
          return false
        })

        if (!registration) {
          console.warn("No registration found for winner:", winner)
          return null
        }

        return { ...registration, winner }
      })
      .filter(Boolean) // Remove null entries
  }

  const getNextRound = (currentRoundId: string | null) => {
    if (currentRoundId === null) {
      return eventData.rounds[0] // First round
    }

    const currentRoundIndex = eventData.rounds.findIndex((r: any) => r.id === currentRoundId)
    if (currentRoundIndex < eventData.rounds.length - 1) {
      return eventData.rounds[currentRoundIndex + 1]
    }

    return null // No next round (can move to winners)
  }

  const ParticipantCard = ({ participant, roundId, showEliminate = true, showMoveControls = true }: any) => {
    const isTeam = participant.registration_type === "team"
    const name = isTeam ? participant.teams?.name : participant.profiles?.full_name
    const participantKey = participant.team_id || participant.user_id
    const isMoving = movingParticipant === participantKey

    // Find current progress to determine current round
    const currentProgress = eventData.progress.find(
      (p: any) =>
        (p.team_id === participant.team_id && p.user_id === participant.user_id) ||
        (participant.team_id && p.team_id === participant.team_id) ||
        (participant.user_id && p.user_id === participant.user_id),
    )

    const currentRoundId = currentProgress?.round_id || null
    const nextRound = getNextRound(currentRoundId)
    const canMoveToWinners = currentRoundId && !nextRound

    return (
      <div className="p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/30 transition-colors group">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {isTeam ? <Users className="h-4 w-4" /> : <User className="h-4 w-4" />}
            <span className="font-medium">{name}</span>
            {participant.progress?.eliminated && (
              <Badge variant="destructive" className="text-xs">
                Eliminated
              </Badge>
            )}
            {isMoving && (
              <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-400">
                Moving...
              </Badge>
            )}
          </div>
        </div>

        {isTeam && participant.teams?.team_members && (
          <div className="flex flex-wrap gap-1 mb-2">
            {participant.teams.team_members.map((member: any, index: number) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {member.profiles?.full_name}
              </Badge>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        {showMoveControls && !participant.progress?.eliminated && !isMoving && (
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Move to next round */}
            {nextRound && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleMoveParticipant(participant, nextRound.id)}
                className="h-7 px-2 text-xs glow-blue"
                title={`Move to ${nextRound.title}`}
              >
                <ChevronRight className="h-3 w-3 mr-1" />
                {nextRound.title}
              </Button>
            )}

            {/* Move to winners (if in final round) */}
            {canMoveToWinners && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleMoveParticipant(participant, "winners")}
                className="h-7 px-2 text-xs glow-yellow bg-transparent"
                title="Move to Winners"
              >
                <Crown className="h-3 w-3 mr-1" />
                Winners
              </Button>
            )}

            {/* Eliminate */}
            {showEliminate && roundId && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleEliminate(participant, roundId)}
                className="h-7 w-7 p-0"
                title="Eliminate"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading event data...</div>
  }

  if (!eventData) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Event not found</h3>
        <Link href="/core/events">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
        </Link>
      </div>
    )
  }

  const { event, rounds, registrations, progress } = eventData
  const isCompleted = event.status === "completed"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/core/events">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-neon">Live Event Management</h1>
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
                {isCompleted ? <Trophy className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
                {isCompleted ? "Completed" : "Ongoing"}
              </Badge>
            </div>
            <p className="text-muted-foreground">{event.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isCompleted && (
            <>
              <Dialog open={winnersDialogOpen} onOpenChange={setWinnersDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="glow-yellow bg-transparent">
                    <Crown className="h-4 w-4 mr-2" />
                    Set Winners
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Set Event Winners</DialogTitle>
                    <DialogDescription>Select the 1st, 2nd, and 3rd place winners</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    {selectedWinners.map((winner, index) => (
                      <div key={index} className="space-y-2">
                        <Label>{index === 0 ? "🥇 1st Place" : index === 1 ? "🥈 2nd Place" : "🥉 3rd Place"}</Label>
                        <select
                          value={winner.teamId || winner.userId || ""}
                          onChange={(e) => {
                            const value = e.target.value
                            const participant = registrations.find(
                              (reg: any) => reg.team_id === value || reg.user_id === value,
                            )
                            setSelectedWinners((prev) =>
                              prev.map((w, i) =>
                                i === index
                                  ? {
                                      position: w.position,
                                      teamId: participant?.team_id,
                                      userId: participant?.user_id,
                                    }
                                  : w,
                              ),
                            )
                          }}
                          className="w-full px-3 py-2 bg-input border border-border rounded-md"
                        >
                          <option value="" className="dark:bg-gray-800 dark:text-white">Select winner...</option>
                          {registrations.map((reg: any) => (
                            <option key={reg.id} value={reg.team_id || reg.user_id} className="dark:bg-gray-800 dark:text-white">
                              {reg.registration_type === "team" ? reg.teams?.name : reg.profiles?.full_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setWinnersDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSetWinners} className="glow-yellow">
                      Set Winners
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="glow-green">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete Event
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Complete Event</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to complete this event? This action cannot be undone and will:
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Mark the event as completed</li>
                        <li>Lock all progress and results</li>
                        {event.is_tournament && <li>Calculate and assign tournament points</li>}
                      </ul>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCompleteEvent} disabled={isCompleting}>
                      {isCompleting ? "Completing..." : "Complete Event"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}

          {isCompleted && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="glow-red bg-transparent">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Progress
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Event Progress</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reset all event progress, eliminate all winners, and set the event back to ongoing status.
                    This action should only be used for corrections.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetProgress} disabled={isResetting}>
                    {isResetting ? "Resetting..." : "Reset Progress"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Event Progress Board */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Registered Participants */}
        <Card className="lg:col-span-2 bg-dark-surface border-border">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Registered ({getParticipantsInRound(null).length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 min-h-[400px]">
            {getParticipantsInRound(null).map((participant: any) => (
              <ParticipantCard
                key={participant.id}
                participant={participant}
                roundId={null}
                showEliminate={false}
                showMoveControls={true}
              />
            ))}
          </CardContent>
        </Card>

        {/* Rounds */}
        {rounds.map((round: any) => (
          <Card key={round.id} className="lg:col-span-2 bg-dark-surface border-border">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4" />
                {round.title} ({getParticipantsInRound(round.id).length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 min-h-[400px]">
              {getParticipantsInRound(round.id).map((participant: any) => (
                <ParticipantCard
                  key={participant.id}
                  participant={participant}
                  roundId={round.id}
                  showEliminate={true}
                  showMoveControls={true}
                />
              ))}
            </CardContent>
          </Card>
        ))}

        {/* Winners */}
        <Card className="lg:col-span-2 bg-dark-surface border-yellow-500/30 glow-yellow">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Crown className="h-4 w-4 text-yellow-400" />
              Winners ({eventData.winners.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 min-h-[400px]">
            {getEventWinners().map((participant: any) => {
              const PositionIcon =
                participant.winner.position === 1 ? Crown : participant.winner.position === 2 ? Medal : Award
              return (
                <div
                  key={participant.id}
                  className="p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <PositionIcon className="h-4 w-4 text-yellow-400" />
                    <span className="font-medium">
                      {participant.registration_type === "team"
                        ? participant.teams?.name
                        : participant.profiles?.full_name}
                    </span>
                    <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                      {participant.winner.position === 1 ? "1st" : participant.winner.position === 2 ? "2nd" : "3rd"}
                    </Badge>
                  </div>
                  {participant.registration_type === "team" && participant.teams?.team_members && (
                    <div className="flex flex-wrap gap-1">
                      {participant.teams.team_members.map((member: any, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {member.profiles?.full_name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Eliminated */}
        <Card className="lg:col-span-2 bg-dark-surface border-red-500/30">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <X className="h-4 w-4 text-red-400" />
              Eliminated ({getEliminatedParticipants().length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 min-h-[400px]">
            {getEliminatedParticipants().map((participant: any) => (
              <ParticipantCard
                key={participant.id}
                participant={participant}
                roundId={participant.progress.round_id}
                showEliminate={false}
                showMoveControls={false}
              />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      {!isCompleted && (
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Target className="h-5 w-5 text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-400 mb-2">How to manage the event:</h4>
                <ul className="text-sm text-blue-300 space-y-1">
                  <li>• Hover over participants to see action buttons</li>
                  <li>• Click the round name button (e.g., "Round 2") to advance participants</li>
                  <li>• Click "Winners" to move participants from the final round to winners</li>
                  <li>• Click the X button to eliminate participants</li>
                  <li>• Use "Set Winners" to manually assign 1st, 2nd, and 3rd place</li>
                  <li>• Click "Complete Event" when finished to lock results and calculate points</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
