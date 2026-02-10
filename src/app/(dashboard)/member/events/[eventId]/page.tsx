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
  MapPin,
  AlertCircle,
  ArrowLeft,
  Target,
  Crown,
  Medal,
  Award,
  UserPlus,
  Bell,
  FileText,
  CheckCircle,
  XCircle,
  Hourglass,
  RefreshCcw,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import {
  getEventDetails,
  respondToInvitation,
  applyToTeam,
  getTeamInvitations,
  getTeamApplication,
  getTeamsNeedingMembers,
  getMyTeamApplication,
  respondToApplication,
  getYourRegisteredTeam,
  isUserRegistered,
} from "../actions"
import { EventRegistrationModal } from "../components/event-registration-modal"
import Link from "next/link"
import { useParams } from "next/navigation"
import { EventDetailsPageSkeleton } from "../components/event-details-skeleton"

export default function EventDetailsPage() {
  const params = useParams()
  const eventId = params.eventId as string

  const [loadingData, setLoadingData] = useState(true)
  const [eventData, setEventData] = useState<any>(null)
  const [invitationData, setInvitationData] = useState<any[]>([])
  const [applicationData, setApplicationData] = useState<any[]>([])
  const [registrationData, setRegistrationData] = useState<any>()
  const [myTeamApplicationData, setmyTeamApplicationData] = useState<any[]>([])
  const [teamsNeedingMembers, setTeamsNeedingMembers] = useState<any[]>([])
  const [userAlreadyInTeam, setUserAlreadyInTeam] = useState<boolean>(false);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false)
  const [processingInvitation, setProcessingInvitation] = useState<string | null>(null)
  const [processingApplication, setProcessingApplication] = useState<string | null>(null)
  const [applyingToTeam, setApplyingToTeam] = useState<string | null>(null)

  const handleEventDetailsOnLoad = useCallback(async () => {
    setLoadingData(true)
    try {
      const [eventResponse, invitationResponse, applicationResponse, teamsResponse, myTeamApplicationResponse, registrationResponse, isUserResponse] =
        await Promise.all([
            getEventDetails(eventId),
            getTeamInvitations(),
            getTeamApplication(),
            getTeamsNeedingMembers(eventId),
            getMyTeamApplication(eventId),
            getYourRegisteredTeam(eventId),
            isUserRegistered(eventId)
        ]);

      if (!eventResponse.success) {
        throw new Error(eventResponse.message || "Failed to fetch event details")
      }
      setEventData(eventResponse.data)

      if (invitationResponse.data) {
        setInvitationData(invitationResponse.data)
    }
    
    if (applicationResponse.data) {
        setApplicationData(applicationResponse.data)
    }

    if(isUserResponse.userRegistered) {
        setUserAlreadyInTeam(true);
    }

    if (teamsResponse.data) {
        setTeamsNeedingMembers(teamsResponse.data)
    }

    if (myTeamApplicationResponse.data) {
        setmyTeamApplicationData(myTeamApplicationResponse.data)
    }

    if(registrationResponse.registration) {
        setRegistrationData(registrationResponse.registration)
    }

    } catch (error: any) {
      console.error("Failed to fetch event details:", error)
      toast.error("Error", {
        description: "Failed to load event details. Please try again.",
      })
    } finally {
      setLoadingData(false)
    }
  }, [eventId])

  useEffect(() => {
    handleEventDetailsOnLoad()
  }, [handleEventDetailsOnLoad])

  const handleRegisterForEvent = () => {
    setIsRegistrationModalOpen(true)
  }

  const handleInvitationResponse = async (invitationId: string, accept: boolean) => {
    setProcessingInvitation(invitationId)
    try {
      const response = await respondToInvitation(invitationId, accept)
      toast.success("Response Sent", {
        description: response.message,
      })
      handleEventDetailsOnLoad()
      
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to respond to invitation",
      })
    } finally {
      setProcessingInvitation(null)
    }
  }

  const handleApplicationResponse = async (applicationId: string, accept: boolean) => {
    setProcessingApplication(applicationId)
    try {
        const response = await respondToApplication(applicationId, accept);
        toast.success("Response Sent", {
            description: response.message,
        })
        handleEventDetailsOnLoad();

    } catch (error: any) {
        toast.error("Error", {
            description: error.message || "Failed to respond to invitation",
        })
    } finally {
        setProcessingApplication(null)
    }
  }

  const handleApplyToTeam = async (teamId: string) => {
    setApplyingToTeam(teamId)
    try {
      const response = await applyToTeam(teamId, eventId)
      toast.success("Application Sent", {
        description: response.message,
      })
      handleEventDetailsOnLoad()
    } catch (error: any) {
      toast.error("Application Failed", {
        description: error.message || "Failed to apply to team",
      })
    } finally {
      setApplyingToTeam(null)
    }
  }

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

  const getApplicationStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return CheckCircle
      case "rejected":
        return XCircle
      case "pending":
        return Hourglass
      default:
        return FileText
    }
  }

  const getApplicationStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "text-green-400"
      case "rejected":
        return "text-red-400"
      case "pending":
        return "text-yellow-400"
      default:
        return "text-muted-foreground"
    }
  }

  if (loadingData) {
    return <EventDetailsPageSkeleton />
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
  const isRegistrationDeadlinePassed = new Date(event.registration_deadline) < new Date()

  // Filter invitations and applications for this specific event
  const eventSpecificInvitations = invitationData.filter((invitation) =>
    invitation.event_id === event.id,
  )

  const eventSpecificApplications = applicationData.filter((application) =>
    application.event_id === event.id,
  )

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
            <h1 className="text-3xl font-bold text-neon text-lavender">{event.title}</h1>
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
        {event.status === "registration_open" && !isRegistrationDeadlinePassed && !userAlreadyInTeam && (
          <Button onClick={handleRegisterForEvent} className="glow-blue">
            <UserPlus className="h-4 w-4 mr-2" />
            Register Now
          </Button>
        )}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => handleEventDetailsOnLoad()}
            // className={showApplications ? "glow-yellow" : ""}
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
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
              <p className={`font-medium ${isRegistrationDeadlinePassed ? "text-red-400" : ""}`}>
                {new Date(event.registration_deadline).toLocaleDateString()}
              </p>
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
                <span className="text-sm">Max Participants</span>
              </div>
              <p className="font-medium">{event.max_participants}</p>
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
              {rounds.map((round: any, index: number) => (
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

      {/* Registration Open Specific Content */}
      {event.status === "registration_open" && (
        <>
          {userAlreadyInTeam && registrationData && (
            <Card className="bg-dark-surface border-border">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Your Team
                    </CardTitle>
                </CardHeader>

                <CardContent>
                    <div className="p-4 rounded-lg border border-border bg-muted/10 hover:bg-muted/20 transition-colors">
                        {registrationData.registration_type === "team" ? (
                            <div>
                            <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium">{registrationData.teams?.name}</h4>
                                <Badge variant="outline" className="text-xs">
                                Team
                                </Badge>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {registrationData.teams?.team_members?.map((member: any, index: number) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                    {member.profiles?.full_name}
                                </Badge>
                                ))}
                            </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                            <h4 className="font-medium">{registrationData.profiles?.full_name}</h4>
                            <Badge variant="outline" className="text-xs">
                                Individual
                            </Badge>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
          )}

          {/* Team Applications For this Team For your Team */}
          {myTeamApplicationData.length > 0 && (
            <Card className="bg-dark-surface border-border glow-blue">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Your Team Applications for this Event
                  <Badge variant="destructive" className="ml-2">
                    {myTeamApplicationData.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {myTeamApplicationData.map((application: any) => (
                    <div
                      key={application.id}
                      className="p-4 rounded-lg border border-border bg-muted/10 hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{application.teams?.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Raised By{" "}
                            <span className="font-medium">{application.teams.profiles?.full_name || "Team Leader"}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">{application.teams.description}</p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(application.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                          {application.teams.team_members?.map((member: any, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {member?.full_name}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApplicationResponse(application.id, true)}
                            disabled={processingApplication === application.id}
                            className="glow-green"
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleApplicationResponse(application.id, false)}
                            disabled={processingApplication === application.id}
                          >
                            Decline
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Registered Teams/Participants */}
          <Card className="bg-dark-surface border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Registered {event.type === "team" ? "Teams" : "Participants"} ({registrations.length}/
                {event.max_participants / event.team_size})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {registrations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No registrations yet. Be the first to register!</p>
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
                                {member?.full_name}
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

          {/* Team Invitations for this Event */}
          {eventSpecificInvitations.length > 0 && (
            <Card className="bg-dark-surface border-border glow-blue">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Your Team Invitations for this Event
                  <Badge variant="destructive" className="ml-2">
                    {eventSpecificInvitations.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {eventSpecificInvitations.map((invitation: any) => (
                    <div
                      key={invitation.id}
                      className="p-4 rounded-lg border border-border bg-muted/10 hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{invitation.teams.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Invited by{" "}
                            <span className="font-medium">{invitation.teams.profiles?.full_name || "Team Leader"}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">{invitation.teams.description}</p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(invitation.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                          {invitation.teams.team_members?.map((member: any, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {member.profiles?.full_name}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleInvitationResponse(invitation.id, true)}
                            disabled={processingInvitation === invitation.id}
                            className="glow-green"
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleInvitationResponse(invitation.id, false)}
                            disabled={processingInvitation === invitation.id}
                          >
                            Decline
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Teams Needing Members */}
          {event.type === "team" && teamsNeedingMembers.length > 0 && !userAlreadyInTeam && (
            <Card className="bg-dark-surface border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" />
                  Teams Looking for Members
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  These teams are registered for this event but need more members
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {teamsNeedingMembers.map((team: any) => (
                    <div
                      key={team.id}
                      className="p-4 rounded-lg border border-border bg-muted/10 hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{team.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Leader: <span className="font-medium">{team.profiles?.full_name}</span>
                          </p>
                          <p className="text-sm text-muted-foreground">{team.description}</p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {team.team_members?.length || 0}/{event.team_size} members
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-2">
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
                          {applyingToTeam === team.id ? "Applying..." : "Apply to Join"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Your Team Applications for this Event */}
          {eventSpecificApplications.length > 0 && (
            <Card className="bg-dark-surface border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Your Team Applications for this Event
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {eventSpecificApplications.map((application: any) => {
                    const StatusIcon = getApplicationStatusIcon(application.status)
                    return (
                      <div
                        key={application.id}
                        className="p-4 rounded-lg border border-border bg-muted/10 hover:bg-muted/20 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{application.teams.name}</h4>
                              <Badge
                                variant="outline"
                                className={`text-xs ${getApplicationStatusColor(application.status)}`}
                              >
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {application.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Leader: <span className="font-medium">{application.teams.profiles?.full_name}</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">{application.teams.description}</p>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(application.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {application.teams.team_members?.map((member: any, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {member.profiles?.full_name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Completed Event Specific Content */}
      {event.status === "completed" && (
        <>
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
                All Participants
              </CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </>
      )}

      {/* Registration Modal */}
      <EventRegistrationModal
        isOpen={isRegistrationModalOpen}
        onClose={() => setIsRegistrationModalOpen(false)}
        event={event}
        onSuccess={handleEventDetailsOnLoad}
      />
    </div>
  )
}
