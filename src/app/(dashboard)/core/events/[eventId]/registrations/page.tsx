"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Users,
  User,
  Trophy,
  CheckCircle,
  AlertTriangle,
  Clock,
  Mail,
  UserCheck,
  UserX,
  UserPlus,
  RefreshCcw,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import Link from "next/link"
import { useParams } from "next/navigation"
import { getEventRegistrations } from "../../actions"

export default function EventRegistrationsPage() {
  const params = useParams()
  const eventId = params.eventId as string

  const [loadingData, setLoadingData] = useState(true)
  const [eventData, setEventData] = useState<any>(null)
  const [registrationsData, setRegistrationsData] = useState<any>({
    completeTeams: [],
    incompleteTeams: [],
    individualRegistrations: [],
    pendingInvitations: [],
    tournamentPending: []
  })

  const handleRegistrationsOnLoad = useCallback(async () => {
    setLoadingData(true)
    try {
      const response = await getEventRegistrations(eventId)
      console.log(response.data)
      if (!response.success) {
        throw new Error(response.error || "Failed to fetch registrations")
      }
      
      if(response.data) {
        setEventData(response.data.event)
        setRegistrationsData(response.data.registrations)
      }

    } catch (error: any) {
      console.error("Failed to fetch registrations:", error)
      toast.error("Error", {
        description: "Failed to load registrations. Please try again.",
      })
    } finally {
      setLoadingData(false)
    }
  }, [eventId])

  useEffect(() => {
    handleRegistrationsOnLoad()
  }, [handleRegistrationsOnLoad])

  const getTeamCompletionPercentage = (currentMembers: number, requiredMembers: number) => {
    return Math.round((currentMembers / requiredMembers) * 100)
  }

  const getInvitationStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "text-green-400"
      case "declined":
        return "text-red-400"
      case "pending":
        return "text-yellow-400"
      default:
        return "text-muted-foreground"
    }
  }

  const getInvitationStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return UserCheck
      case "declined":
        return UserX
      case "pending":
        return Clock
      default:
        return User
    }
  }

  if (loadingData) {
    return <div className="text-center py-8 text-muted-foreground">Loading registrations...</div>
  }

  if (!eventData) {
    return (
      <div className="text-center py-8">
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

  const totalRegistrations = registrationsData.completeTeams.length + registrationsData.individualRegistrations.length
  const totalIncomplete = registrationsData.incompleteTeams.length
  const registrationProgress = (totalRegistrations / (eventData.max_participants / eventData.team_size)) * 100

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/core/events">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
        </Link>
        <div className="flex-1">  
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-neon">Event Registrations</h1>
            {eventData.is_tournament && (
              <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                <Trophy className="h-4 w-4 mr-1" />
                Tournament
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">{eventData.title}</p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => handleRegistrationsOnLoad()}
            // className={showApplications ? "glow-yellow" : ""}
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-dark-surface border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-sm text-muted-foreground">Complete Registrations</p>
                <p className="text-2xl font-bold text-green-400">{totalRegistrations}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              <div>
                <p className="text-sm text-muted-foreground">Incomplete Teams</p>
                <p className="text-2xl font-bold text-yellow-400">{totalIncomplete}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-sm text-muted-foreground">Total Capacity</p>
                <p className="text-2xl font-bold text-blue-400">{eventData.max_participants}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Fill Rate</p>
                <p className="text-2xl font-bold text-primary">{Math.round(registrationProgress)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card className="bg-dark-surface border-border">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Registration Progress</span>
            <span className="text-sm text-muted-foreground">
              {totalRegistrations} / {eventData.max_participants / eventData.team_size}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div
              className="bg-primary h-3 rounded-full transition-all duration-300 glow-blue"
              style={{ width: `${Math.min(registrationProgress, 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Individual Registrations (for individual events) */}
      {eventData.type === "individual" && registrationsData.individualRegistrations.length > 0 && (
        <Card className="bg-dark-surface border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-green-400" />
              Individual Registrations ({registrationsData.individualRegistrations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {registrationsData.individualRegistrations.map((registration: any) => (
                <div
                  key={registration.id}
                  className="p-4 rounded-lg border border-border bg-muted/10 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <h4 className="font-medium">
                      {registration.profiles?.full_name  }
                    </h4>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    {registration.profiles?.email}
                  </div>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                      Registered
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Complete Teams */}
      {eventData.type === "team" && registrationsData.completeTeams.length > 0 && (
        <Card className="bg-dark-surface border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              Complete Teams ({registrationsData.completeTeams.length})
            </CardTitle>
            <p className="text-sm text-muted-foreground">Teams with all members confirmed and registered</p>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {eventData.is_tournament && registrationsData.completeTeams.map((team: any) => (
                <div
                  key={team.id}
                  className="p-6 rounded-lg border border-green-500/30 bg-green-500/5 hover:bg-green-500/10 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-lg font-medium">{team.teams.name}</h4>
                        <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Complete
                        </Badge>
                        {eventData.is_tournament && (
                          <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                            <Trophy className="h-3 w-3 mr-1" />
                            Tournament
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{team.description}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {team.teams.team_members?.length || 0}/{eventData.team_size} members
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {team.teams.team_members?.map((member: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-3 rounded-lg bg-muted/20 border border-border"
                      >
                        <UserCheck className="h-4 w-4 text-green-400" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{member.profiles?.full_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{member.profiles?.email}</p>
                        </div>
                        {member.member_id === team.leader_id && (
                          <Badge variant="secondary" className="text-xs">
                            Leader
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {!eventData.is_tournament && registrationsData.completeTeams.map((team: any) => (
                <div
                  key={team.id}
                  className="p-6 rounded-lg border border-green-500/30 bg-green-500/5 hover:bg-green-500/10 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-lg font-medium">{team.name}</h4>
                        <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Complete
                        </Badge>
                        {eventData.is_tournament && (
                          <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                            <Trophy className="h-3 w-3 mr-1" />
                            Tournament
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{team.description}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {team.team_members?.length || 0}/{eventData.team_size} members
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {team.team_members?.map((member: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-3 rounded-lg bg-muted/20 border border-border"
                      >
                        <UserCheck className="h-4 w-4 text-green-400" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{member.profiles?.full_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{member.profiles?.email}</p>
                        </div>
                        {member.member_id === team.leader_id && (
                          <Badge variant="secondary" className="text-xs">
                            Leader
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Incomplete Teams */}
      {eventData.type === "team" && registrationsData.incompleteTeams.length > 0 && (
        <Card className="bg-dark-surface border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              Incomplete Teams ({registrationsData.incompleteTeams.length})
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Teams that are still looking for members or waiting for confirmations
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {registrationsData.incompleteTeams.map((team: any) => {
                const currentMembers = team.team_members?.length || 0
                const completionPercentage = getTeamCompletionPercentage(currentMembers, eventData.team_size)

                return (
                  <div
                    key={team.id}
                    className="p-6 rounded-lg border border-yellow-500/30 bg-yellow-500/5 hover:bg-yellow-500/10 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-lg font-medium">{team.name}</h4>
                          <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Incomplete
                          </Badge>
                          {eventData.is_tournament && (
                            <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                              <Trophy className="h-3 w-3 mr-1" />
                              Tournament
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{team.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          {currentMembers}/{eventData.team_size} members
                        </div>
                        <div className="text-xs text-yellow-400">{completionPercentage}% complete</div>
                      </div>
                    </div>

                    {/* Progress bar for team completion */}
                    <div className="w-full bg-muted rounded-full h-2 mb-4">
                      <div
                        className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${completionPercentage}%` }}
                      />
                    </div>

                    {/* Current Members */}
                    <div className="mb-4">
                      <h5 className="text-sm font-medium mb-2">Current Members:</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {team.team_members?.map((member: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-3 rounded-lg bg-muted/20 border border-border"
                          >
                            <UserCheck className="h-4 w-4 text-green-400" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{member.profiles?.full_name}</p>
                              <p className="text-xs text-muted-foreground truncate">{member.profiles?.email}</p>
                            </div>
                            {member.member_id === team.leader_id && (
                              <Badge variant="secondary" className="text-xs">
                                Leader
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pending Invitations */}
                    {team.pending_invitations && team.pending_invitations.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium mb-2">Pending Invitations:</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {team.pending_invitations.map((invitation: any, index: number) => {
                            const StatusIcon = getInvitationStatusIcon(invitation.status)
                            return (
                              <div
                                key={index}
                                className="flex items-center gap-2 p-3 rounded-lg bg-muted/10 border border-dashed border-border"
                              >
                                <StatusIcon className={`h-4 w-4 ${getInvitationStatusColor(invitation.status)}`} />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{invitation.invitee_profile?.full_name}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {invitation.invitee_profile?.email}
                                  </p>
                                </div>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    invitation.status === "pending"
                                      ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                      : invitation.status === "accepted"
                                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                                        : "bg-red-500/20 text-red-400 border-red-500/30"
                                  }`}
                                >
                                  {invitation.status}
                                </Badge>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Missing Members Indicator */}
                    {currentMembers < eventData.team_size && (
                      <div className="mt-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                        <div className="flex items-center gap-2">
                          <UserPlus className="h-4 w-4 text-orange-400" />
                          <span className="text-sm text-orange-400">
                            Still needs {eventData.team_size - currentMembers} more member(s)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tournament Teams Not Registered */}
      {eventData.type === "team" && registrationsData.tournamentPending.length > 0 && (
        <Card className="bg-dark-surface border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              Tournament Teams Pending ({registrationsData.tournamentPending.length})
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Teams that are registered for tournament but have not registered for the event yet
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {registrationsData.tournamentPending.map((team: any) => {
                const currentMembers = team.team_members?.length || 0
                const completionPercentage = getTeamCompletionPercentage(currentMembers, eventData.team_size)

                return (
                  <div
                    key={team.id}
                    className="p-6 rounded-lg border border-yellow-500/30 bg-yellow-500/5 hover:bg-yellow-500/10 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-lg font-medium">{team.name}</h4>
                          <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Incomplete
                          </Badge>
                          {eventData.is_tournament && (
                            <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                              <Trophy className="h-3 w-3 mr-1" />
                              Tournament
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{team.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          {currentMembers}/{eventData.team_size} members
                        </div>
                        <div className="text-xs text-yellow-400">{completionPercentage}% complete</div>
                      </div>
                    </div>

                    {/* Progress bar for team completion */}
                    <div className="w-full bg-muted rounded-full h-2 mb-4">
                      <div
                        className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${completionPercentage}%` }}
                      />
                    </div>

                    {/* Current Members */}
                    <div className="mb-4">
                      <h5 className="text-sm font-medium mb-2">Current Members:</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {team.team_members?.map((member: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-3 rounded-lg bg-muted/20 border border-border"
                          >
                            <UserCheck className="h-4 w-4 text-green-400" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{member.profiles?.full_name}</p>
                              <p className="text-xs text-muted-foreground truncate">{member.profiles?.email}</p>
                            </div>
                            {member.member_id === team.leader_id && (
                              <Badge variant="secondary" className="text-xs">
                                Leader
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pending Invitations */}
                    {team.pending_invitations && team.pending_invitations.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium mb-2">Pending Invitations:</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {team.pending_invitations.map((invitation: any, index: number) => {
                            const StatusIcon = getInvitationStatusIcon(invitation.status)
                            return (
                              <div
                                key={index}
                                className="flex items-center gap-2 p-3 rounded-lg bg-muted/10 border border-dashed border-border"
                              >
                                <StatusIcon className={`h-4 w-4 ${getInvitationStatusColor(invitation.status)}`} />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{invitation.invitee_profile?.full_name}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {invitation.invitee_profile?.email}
                                  </p>
                                </div>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    invitation.status === "pending"
                                      ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                      : invitation.status === "accepted"
                                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                                        : "bg-red-500/20 text-red-400 border-red-500/30"
                                  }`}
                                >
                                  {invitation.status}
                                </Badge>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Missing Members Indicator */}
                    {currentMembers < eventData.team_size && (
                      <div className="mt-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                        <div className="flex items-center gap-2">
                          <UserPlus className="h-4 w-4 text-orange-400" />
                          <span className="text-sm text-orange-400">
                            Still needs {eventData.team_size - currentMembers} more member(s)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Registrations */}
      {totalRegistrations === 0 && totalIncomplete === 0 && (
        <Card className="bg-dark-surface border-border">
          <CardContent className="text-center py-12">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No registrations yet</h3>
            <p className="text-muted-foreground">
              This event hasn't received any registrations yet. Share the event to get participants!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
