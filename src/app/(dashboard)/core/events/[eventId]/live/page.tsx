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
  Copy,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { useParams } from "next/navigation"
import Link from "next/link"
import { LiveEventProgression } from "@/components/live-events/live-event-progression"
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

export default function LiveEventPage() {
  const params = useParams()
  const eventId = params.eventId as string

  const [loading, setLoading] = useState(true)
  const [eventData, setEventData] = useState<any>(null)
  const [isCompleting, setIsCompleting] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [movingParticipant, setMovingParticipant] = useState<string | null>(null)

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

      // Don't reload data - let the component handle local state updates
      // The server call is made in the background for persistence
    } catch (error: any) {
      console.error("Move participant error:", error)
      throw error // Re-throw so the component can handle the error
    }
  }

  const handleEliminateParticipant = async (participant: any, roundId: string) => {
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

      // Don't reload data - let the component handle local state updates
      // The server call is made in the background for persistence
    } catch (error: any) {
      console.error("Eliminate participant error:", error)
      throw error // Re-throw so the component can handle the error
    }
  }

  const handleSetWinners = async (winners: any[]) => {
    try {
      const response = await setEventWinners({
        eventId,
        winners,
      })

      if (!response.success) {
        throw new Error(response.error)
      }

      toast.success("Winners set successfully")
      
      // Reload data to get fresh winners state
      await loadEventData()
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

      if(response.success) {
        toast.success('Event completed successfully', {
          description: response.message
        })
      }

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

      toast.success("Event progress reset successfully")
      loadEventData()
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to reset progress",
      })
    } finally {
      setIsResetting(false)
    }
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

  const { event } = eventData
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
              <h1 className="text-3xl font-bold">Live Event Management</h1>
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
      </div>

      {/* Live Event Progression Component */}
      <LiveEventProgression
        eventData={eventData}
        onMoveParticipant={handleMoveParticipant}
        onEliminateParticipant={handleEliminateParticipant}
        onSetWinners={handleSetWinners}
        onCompleteEvent={handleCompleteEvent}
        onResetProgress={handleResetProgress}
        isCompleting={isCompleting}
        isResetting={isResetting}
        movingParticipant={movingParticipant}
      />
    </div>
  )
}
