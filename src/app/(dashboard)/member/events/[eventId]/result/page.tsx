"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Users,
  User,
  Trophy,
  Clock,
  ArrowLeft,
  Target,
  Crown,
  Medal,
  Award,
  AlertCircle,
  MapPin,
  UserPlus,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { useParams } from "next/navigation"
import Link from "next/link"
import { getEventResults } from "./actions"
import { EventResultsPageSkeleton } from "../../components/event-results-skeleton"

export default function EventResultsPage() {
  const params = useParams()
  const eventId = params.eventId as string
  const [loading, setLoading] = useState(true)
  const [eventData, setEventData] = useState<any>(null)

  const loadEventData = useCallback(async () => {
    setLoading(true)
    try {
      const response = await getEventResults(eventId)
      if (!response.success) {
        throw new Error(response.error || "Failed to load event results")
      }
      setEventData(response.data)
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to load event results",
      })
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    loadEventData()
  }, [loadEventData])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "registration_open":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "upcoming":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "ongoing":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "completed":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "registration_open":
        return UserPlus
      case "upcoming":
        return Clock
      case "ongoing":
        return MapPin
      case "completed":
        return Trophy
      default:
        return Clock
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
    return <EventResultsPageSkeleton />
  }

  if (!eventData) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Event not found</h3>
        <p className="text-muted-foreground mb-4">The event you're looking for doesn't exist or has been removed.</p>
        <Link href="/member/events">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
        </Link>
      </div>
    )
  }

  const { event, rounds, registrations, winners } = eventData
  const StatusIcon = getStatusIcon(event.status)

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
            <h1 className="text-3xl font-bold text-neon">{event.title}</h1>
            {event.is_tournament && (
              <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                <Trophy className="h-4 w-4 mr-1" />
                Tournament
              </Badge>
            )}
            <Badge variant="outline" className={`${getStatusColor(event.status)}`}>
              <StatusIcon className="h-4 w-4 mr-1" />
              {event.status.replace("_", " ")}
            </Badge>
          </div>
          <p className="text-muted-foreground">{event.description}</p>
        </div>
      </div>

      {/* Event Banner */}
      {event.banner_url && (
        <div className="w-full h-64 rounded-lg overflow-hidden">
          <img src={event.banner_url || "/placeholder.svg"} alt={event.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Event Details */}
      <Card className="bg-dark-surface border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Event Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Registration Deadline</span>
              </div>
              <p className="font-medium">{new Date(event.registration_deadline).toLocaleDateString()}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Event Period</span>
              </div>
              <p className="font-medium">
                {new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                {event.type === "team" ? <Users className="h-4 w-4" /> : <User className="h-4 w-4" />}
                <span className="text-sm">Participation Type</span>
              </div>
              <p className="font-medium capitalize">
                {event.type} {event.type === "team" && `(${event.team_size} members)`}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="text-sm">Total Participants</span>
              </div>
              <p className="font-medium">{registrations.length}</p>
            </div>
          </div>
          {event.category && (
            <div className="mt-4 pt-4 border-t border-border">
              <span className="text-sm text-muted-foreground">Category: </span>
              <Badge variant="secondary">{event.category}</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Rounds */}
      {rounds.length > 0 && (
        <Card className="bg-dark-surface border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Event Rounds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {rounds.map((round: any) => (
                <div key={round.id} className="p-4 rounded-lg border border-border bg-muted/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      Round {round.round_number}
                    </Badge>
                    <h4 className="font-medium">{round.title}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">{round.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Winners */}
      {winners.length > 0 && (
        <Card className="bg-dark-surface border-border glow-yellow">
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
                return (
                  <div
                    key={winner.id}
                    className={`p-4 rounded-lg border transition-all ${
                      winner.position <= 3
                        ? "border-yellow-500/30 bg-yellow-500/5 glow-yellow"
                        : "border-border bg-muted/10"
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
                            Position {winner.position}
                          </span>
                        </div>
                        {winner.team_id ? (
                          <div>
                            <h4 className="font-medium">{winner.teams?.name}</h4>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {winner.teams?.team_members?.map((member: any, index: number) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {member.profiles?.full_name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <h4 className="font-medium">{winner.profiles?.full_name}</h4>
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

      {/* All Participants */}
      <Card className="bg-dark-surface border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            All Participants ({registrations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {registrations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No participants registered for this event.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {registrations.map((registration: any) => (
                <div
                  key={registration.id}
                  className="p-4 rounded-lg border border-border bg-muted/10 hover:bg-muted/20 transition-colors"
                >
                  {registration.registration_type === "team" ? (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{registration.teams?.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          Team
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {registration.teams?.team_members?.map((member: any, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {member.profiles?.full_name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{registration.profiles?.full_name}</h4>
                      <Badge variant="outline" className="text-xs">
                        Individual
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Statistics */}
      <Card className="bg-dark-surface border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Event Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">{registrations.length}</div>
              <div className="text-sm text-muted-foreground">Total Participants</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">{rounds.length}</div>
              <div className="text-sm text-muted-foreground">Total Rounds</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">{winners.length}</div>
              <div className="text-sm text-muted-foreground">Winners Declared</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
