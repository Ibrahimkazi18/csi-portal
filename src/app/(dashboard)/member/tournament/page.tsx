"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trophy, Calendar, Users, Clock, Play, UserPlus, Bell, FileText, Target, Award } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import {
  getAllTournaments,
  getTournamentTeamInvitations,
  getTournamentTeamApplications,
  respondToTournamentInvitation,
  getYourRegisteredTournamentTeam,
  isUserInTournamentTeam
} from "./actions"
import { CreateTournamentTeamModal } from "./components/create-tournament-team-modal"
import Link from "next/link"
import Preloader from "@/components/ui/preloader"

export default function MemberTournamentsPage() {
  const [showPreloader, setShowPreloader] = useState(true)
  const [loading, setLoading] = useState(true)
  const [tournaments, setTournaments] = useState<any[]>([])
  const [invitations, setInvitations] = useState<any[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false)
  const [selectedTournament, setSelectedTournament] = useState<any>(null)
  const [processingInvitation, setProcessingInvitation] = useState<string | null>(null)
  const [userTournamentMap, setUserTournamentMap] = useState<Record<string, boolean>>({})

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [tournamentsResponse, invitationsResponse, applicationsResponse] = await Promise.all([
        getAllTournaments(),
        getTournamentTeamInvitations(),
        getTournamentTeamApplications(),
      ])

      if (!tournamentsResponse.success) {
        throw new Error(tournamentsResponse.message || "Failed to load tournaments")
      }

      if(tournamentsResponse.data){
        setTournaments(tournamentsResponse.data)

      
        const tournamentsList = tournamentsResponse.data || []

        const teamStatus: Record<string, boolean> = {}
        for (const tournament of tournamentsList) {
            const res = await isUserInTournamentTeam(tournament.id)
            teamStatus[tournament.id] = res.success
        }
        console.log(teamStatus);
        setUserTournamentMap(teamStatus)
      }

      if (invitationsResponse.data) {
        setInvitations(invitationsResponse.data)
      }

      if (applicationsResponse.data) {
        setApplications(applicationsResponse.data)
      }

    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to load data",
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handlePreloaderComplete = useCallback(() => {
    setShowPreloader(false)
  }, [])

  if (showPreloader) {
    return (
      <div className="relative w-full h-screen">
        <Preloader onComplete={handlePreloaderComplete} />
      </div>
    )
  }

  const handleInvitationResponse = async (invitationId: string, accept: boolean) => {
    setProcessingInvitation(invitationId)
    try {
      const response = await respondToTournamentInvitation(invitationId, accept)
      toast.success("Response Sent", {
        description: response.message,
      })
      loadData()
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to respond to invitation",
      })
    } finally {
      setProcessingInvitation(null)
    }
  }

  const handleCreateTeam = (tournament: any) => {
    setSelectedTournament(tournament)
    setIsCreateTeamModalOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "registration_open":
        return "bg-green-500/20 text-green-400 border-green-500/30"
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
      case "upcoming":
        return Clock
      case "registration_open":
        return Users
      case "ongoing":
        return Play
      case "completed":
        return Trophy
      default:
        return Clock
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neon text-lavender">Tournaments</h1>
          <p className="text-muted-foreground">Join tournaments and compete with your team</p>
        </div>
      </div>

      {/* Team Invitations */}
      {invitations.length > 0 && (
        <Card className="bg-dark-surface border-border glow-blue">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Tournament Team Invitations
              <Badge variant="destructive" className="ml-2">
                {invitations.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations.map((invitation: any) => (
                <div
                  key={invitation.id}
                  className="p-4 rounded-lg border border-border bg-muted/10 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{invitation.teams.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Tournament: <span className="font-medium">{invitation.tournaments?.title}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Invited by{" "}
                        <span className="font-medium">{invitation.teams.profiles?.full_name || "Team Leader"}</span>
                      </p>
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

      {/* Your Applications */}
      {applications.length > 0 && (
        <Card className="bg-dark-surface border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Your Tournament Team Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {applications.map((application: any) => (
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
                          className={`text-xs ${
                            application.status === "accepted"
                              ? "text-green-400"
                              : application.status === "rejected"
                                ? "text-red-400"
                                : "text-yellow-400"
                          }`}
                        >
                          {application.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Tournament: <span className="font-medium">{application.tournaments?.title}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Leader: <span className="font-medium">{application.teams.profiles?.full_name}</span>
                      </p>
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
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tournaments List */}
      {tournaments.length === 0 ? (
        <Card className="bg-dark-surface border-border">
          <CardContent className="text-center py-12">
            <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No tournaments available</h3>
            <p className="text-muted-foreground">Check back later for upcoming tournaments</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tournaments.map((tournament) => {
            const StatusIcon = getStatusIcon(tournament.status)
            const isUserInTournament = isUserInTournamentTeam(tournament.id)

            return (
              <Card
                key={tournament.id}
                className="bg-dark-surface border-border hover:border-primary/50 transition-colors"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{tournament.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mb-3">{tournament.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{tournament.year}</span>
                        </div>
                        {tournament.start_date && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{new Date(tournament.start_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className={`${getStatusColor(tournament.status)}`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {tournament.status.replace("_", " ")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Link href={`/member/tournament/${tournament.id}`}>
                        <Button size="sm" variant="outline" className="glow-blue bg-transparent">
                          <Target className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </Link>
                      {(tournament.status === "ongoing" || tournament.status === "completed") && (
                        <Link href={`/member/tournament/${tournament.id}/leaderboard`}>
                          <Button size="sm" variant="outline" className="glow-yellow bg-transparent">
                            <Award className="h-4 w-4 mr-1" />
                            Leaderboard
                          </Button>
                        </Link>
                      )}
                    </div>
                    {tournament.status === "registration_open" && !userTournamentMap[tournament.id] && (
                      <Button size="sm" onClick={() => handleCreateTeam(tournament)} className="glow-green">
                        <UserPlus className="h-4 w-4 mr-1" />
                        Create Team
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Tournament Team Modal */}
      <CreateTournamentTeamModal
        isOpen={isCreateTeamModalOpen}
        onClose={() => {
          setIsCreateTeamModalOpen(false)
          setSelectedTournament(null)
        }}
        tournament={selectedTournament}
        onSuccess={loadData}
      />
    </div>
  )
}