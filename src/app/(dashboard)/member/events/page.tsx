"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar, Users, User, Trophy, Clock, MapPin, AlertCircle, Bell, UserPlus, Eye } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { getAllEvents } from "./actions"
import { TeamInvitationsCard } from "./components/team-invitations-card"
import { PendingTeamsCard } from "./components/pending-team-cards"
import { TeamApplicationsCard } from "./components/team-applications-card"
import Link from "next/link"

export default function MemberEventsPage() {
  const [loadingData, setLoadingData] = useState(true)
  const [eventsData, setEventsData] = useState<any>({
    registrationOpen: [],
    upcoming: [],
    completed: [],
  })
  const [showInvitations, setShowInvitations] = useState(false)
  const [showPendingTeams, setShowPendingTeams] = useState(false)
  const [showApplications, setShowApplications] = useState(false)

  const handleAllEventsOnLoad = useCallback(async () => {
    setLoadingData(true)
    try {
      const response = await getAllEvents()
      if (!response.success) {
        throw new Error(response.message || "Failed to fetch events")
      }
      console.log(response.data)
      setEventsData(response.data || { registrationOpen: [], upcoming: [], completed: [] })
    } catch (error: any) {
      console.error("Failed to fetch events:", error)
      toast.error("Error", {
        description: "Failed to load events. Please try again.",
      })
    } finally {
      setLoadingData(false)
    }
  }, [])

  useEffect(() => {
    handleAllEventsOnLoad()
  }, [handleAllEventsOnLoad])

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

  const isRegistrationDeadlinePassed = (deadline: string) => {
    return new Date(deadline) < new Date()
  }

  const EventCard = ({ event, showRegisterButton = false }: { event: any; showRegisterButton?: boolean }) => {
    const StatusIcon = getStatusIcon(event.status)
    const deadlinePassed = isRegistrationDeadlinePassed(event.registration_deadline)

    return (
      <div
        className={`p-6 rounded-lg border transition-all ${
          event.is_tournament ? "border-yellow-500/30 bg-yellow-500/5 glow-yellow" : "border-border bg-muted/20"
        }`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-semibold text-foreground">{event.title}</h3>
            {event.is_tournament && (
              <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                <Trophy className="h-3 w-3 mr-1" />
                Tournament
              </Badge>
            )}
            <Badge variant="outline" className={`text-xs ${getStatusColor(event.status)}`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {event.status.replace("_", " ")}
            </Badge>
            {showRegisterButton && deadlinePassed && (
              <Badge variant="destructive" className="text-xs">
                Registration Closed
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            {event.type === "team" ? <Users className="h-4 w-4" /> : <User className="h-4 w-4" />}
            <span className="text-sm capitalize">{event.type}</span>
            {event.type === "team" && <span className="text-sm">({event.team_size} members)</span>}
          </div>
        </div>

        <p className="text-foreground leading-relaxed mb-4">{event.description}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <span className="text-muted-foreground">
                {showRegisterButton ? "Registration Deadline: " : "Event Date: "}
              </span>
              <span className={`font-medium ${deadlinePassed && showRegisterButton ? "text-red-400" : ""}`}>
                {new Date(showRegisterButton ? event.registration_deadline : event.start_date).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <span className="text-muted-foreground">
                {event.status === "completed" ? "Completed: " : "Start Date: "}
              </span>
              <span className="font-medium">
                {new Date(event.status === "completed" ? event.end_date : event.start_date).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Max Participants: </span>
            <span className="font-medium">{event.max_participants}</span>
          </div>
        </div>

        {/* Event Banner */}
        {event.banner_url && (
          <div className="mb-4">
            <img
              src={event.banner_url || "/placeholder.svg"}
              alt={event.title}
              className="w-full h-32 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {event.category && (
              <span className="inline-flex items-center gap-1">
                Category: <Badge variant="secondary">{event.category}</Badge>
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Link href={`/member/events/${event.id}`}>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-neon">Events</h1>
          <p className="text-muted-foreground">Discover and register for CSI events and competitions</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowInvitations(!showInvitations)}
            className={showInvitations ? "glow-blue" : ""}
          >
            <Bell className="h-4 w-4 mr-2" />
            Team Invitations
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowPendingTeams(!showPendingTeams)}
            className={showPendingTeams ? "glow-purple" : ""}
          >
            <Users className="h-4 w-4 mr-2" />
            Find Teams
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowApplications(!showApplications)}
            className={showApplications ? "glow-yellow" : ""}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            My Applications
          </Button>
        </div>
      </div>

      {/* Team Management Cards */}
      {showInvitations && <TeamInvitationsCard onUpdate={handleAllEventsOnLoad} />}
      {showPendingTeams && <PendingTeamsCard onUpdate={handleAllEventsOnLoad} />}
      {showApplications && <TeamApplicationsCard onUpdate={handleAllEventsOnLoad} />}
      {(showInvitations || showPendingTeams || showApplications) && <Separator />}

      {loadingData ? (
        <div className="text-center py-8 text-muted-foreground">Loading events...</div>
      ) : (
        <>
          {/* Registration Open Events */}
          <Card className="bg-dark-surface border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-green-400" />
                Registration Open
              </CardTitle>
              <p className="text-sm text-muted-foreground">Events currently accepting registrations</p>
            </CardHeader>
            <CardContent>
              {eventsData.registrationOpen.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No events open for registration</h3>
                  <p className="text-muted-foreground mb-4">Check back later for new events!</p>
                  <div className="p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 max-w-md mx-auto">
                    <p className="text-sm text-yellow-400">
                      <Trophy className="h-4 w-4 inline mr-1" />
                      To see tournament events, you need to be part of a tournament-registered team.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {eventsData.registrationOpen.map((event: any) => (
                    <EventCard key={event.id} event={event} showRegisterButton={true} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          {eventsData.upcoming.length > 0 && (
            <Card className="bg-dark-surface border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-400" />
                  Upcoming Events
                </CardTitle>
                <p className="text-sm text-muted-foreground">Events scheduled to start soon</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {eventsData.upcoming.map((event: any) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Completed Events */}
          {eventsData.completed.length > 0 && (
            <Card className="bg-dark-surface border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-gray-400" />
                  Completed Events
                </CardTitle>
                <p className="text-sm text-muted-foreground">Past events and their results</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {eventsData.completed.map((event: any) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
