"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Trophy,
  Users,
  Calendar,
  Clock,
  UserPlus,
  Bell,
  Award,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  getTournamentDetails,
  getYourRegisteredTournamentTeam,
  getTournamentTeamsNeedingMembers,
  getMyTournamentTeamApplications,
  applyToTournamentTeam,
  respondToTournamentApplication,
} from "../actions"
import { CreateTournamentTeamModal } from "../components/create-tournament-team-modal"
import { TournamentDetailsSkeleton } from "../components/tournament-skeleton"

export default function TournamentDetailsPage() {
  const params = useParams()
  const tournamentId = params.tournamentId as string
  const [loading, setLoading] = useState(true)
  const [tournamentData, setTournamentData] = useState<any>(null)
  const [userTeam, setUserTeam] = useState<any>(null)
  const [teamsNeedingMembers, setTeamsNeedingMembers] = useState<any[]>([])
  const [teamApplications, setTeamApplications] = useState<any[]>([])
  const [userInTournamentTeam, setUserInTournamentTeam] = useState(false)
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false)
  const [applyingToTeam, setApplyingToTeam] = useState<string | null>(null)
  const [processingApplication, setProcessingApplication] = useState<string | null>(null)

  const router = useRouter();

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [tournamentResponse, userTeamResponse, teamsResponse, applicationsResponse] = await Promise.all([
        getTournamentDetails(tournamentId),
        getYourRegisteredTournamentTeam(tournamentId),
        getTournamentTeamsNeedingMembers(tournamentId),
        getMyTournamentTeamApplications(tournamentId),
      ])

      if (!tournamentResponse.success) {
        throw new Error(tournamentResponse.message || "Failed to fetch tournament details")
      }
      setTournamentData(tournamentResponse.data)

      if (userTeamResponse.success) {
        setUserTeam(userTeamResponse.registration)
        setUserInTournamentTeam(true)
      }

      if (teamsResponse.data) {
        setTeamsNeedingMembers(teamsResponse.data)
      } else if (teamsResponse.userInTournamentTeam) {
        setUserInTournamentTeam(true)
      }

      if (applicationsResponse.data) {
        setTeamApplications(applicationsResponse.data)
      }
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to load tournament details",
      })
    } finally {
      setLoading(false)
    }
  }, [tournamentId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleApplyToTeam = async (teamId: string) => {
    setApplyingToTeam(teamId)
    try {
      const response = await applyToTournamentTeam(teamId, tournamentId)
      toast.success("Application Sent", {
        description: response.message,
      })
      loadData()
    } catch (error: any) {
      toast.error("Application Failed", {
        description: error.message || "Failed to apply to team",
      })
    } finally {
      setApplyingToTeam(null)
    }
  }

  const handleApplicationResponse = async (applicationId: string, accept: boolean) => {
    setProcessingApplication(applicationId)
    try {
      const response = await respondToTournamentApplication(applicationId, accept)
      toast.success("Response Sent", {
        description: response.message,
      })
      loadData()
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to respond to application",
      })
    } finally {
      setProcessingApplication(null)
    }
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

  if (loading) {
    return <TournamentDetailsSkeleton />
  }

  if (!tournamentData) {
    return (
      <div className="text-center py-8">
        <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Tournament not found</h3>
        <Link href="/member/tournament">
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
      <div className="flex items-center gap-4">
        <Link href="/member/tournament">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tournaments
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-neon">{tournament.title}</h1>
            <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
              <Trophy className="h-4 w-4 mr-1" />
              Tournament {tournament.year}
            </Badge>
            <Badge variant="outline" className={`${getStatusColor(tournament.status)}`}>
              {tournament.status.replace("_", " ")}
            </Badge>
          </div>
          <p className="text-muted-foreground">{tournament.description}</p>
        </div>
        {tournament.status === "registration_open" && !userInTournamentTeam && (
          <Button onClick={() => setIsCreateTeamModalOpen(true)} className="glow-blue">
            <UserPlus className="h-4 w-4 mr-2" />
            Create Team
          </Button>
        )}
        {tournament.status === "ongoing" && (
          <Button onClick={() => router.push(`/member/tournament/${tournamentId}/leaderboard`)} className="glow-blue">
            <Award className="h-4 w-4 mr-2" />
            Leaderboard
          </Button>
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
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Year</span>
              </div>
              <p className="font-medium">{tournament.year}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="text-sm">Registered Teams</span>
              </div>
              <p className="font-medium">{registrations.length}</p>
            </div>
            {tournament.start_date && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Start Date</span>
                </div>
                <p className="font-medium">{new Date(tournament.start_date).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* User's Team */}
      {userTeam && (
        <Card className="bg-dark-surface border-border glow-blue">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Your Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg border border-border bg-muted/10">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-medium">{userTeam.teams?.name}</h4>
                <Badge variant="outline" className="text-xs">
                  Team
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {userTeam.teams?.team_members?.map((member: any, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {member.profiles?.full_name}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Applications for User's Team */}
      {teamApplications.length > 0 && (
        <Card className="bg-dark-surface border-border glow-blue">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Team Applications
              <Badge variant="destructive" className="ml-2">
                {teamApplications.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamApplications.map((application: any) => (
                <div
                  key={application.id}
                  className="p-4 rounded-lg border border-border bg-muted/10 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{application.profiles?.full_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Wants to join <span className="font-medium">{application.teams?.name}</span>
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(application.created_at).toLocaleDateString()}
                    </div>
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
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teams Looking for Members */}
      {tournament.status === "registration_open" && teamsNeedingMembers.length > 0 && !userInTournamentTeam && (
        <Card className="bg-dark-surface border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Teams Looking for Members
            </CardTitle>
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
                      {team.description && <p className="text-sm text-muted-foreground">{team.description}</p>}
                    </div>
                    <div className="text-xs text-muted-foreground">{team.team_members?.length || 0} members</div>
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

      {/* Leaderboard */}
      {(tournament.status === "ongoing" || tournament.status === "completed") && leaderboard?.length > 0 && (
        <Card className="bg-dark-surface border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-400" />
              Tournament Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaderboard.slice(0, 10).map((entry: any, index: number) => (
                <div
                  key={entry.team_name}
                  className={`p-4 rounded-lg border transition-all ${
                    index < 3 ? "border-yellow-500/30 bg-yellow-500/5" : "border-border bg-muted/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          index === 0
                            ? "bg-yellow-500 text-black"
                            : index === 1
                              ? "bg-gray-400 text-black"
                              : index === 2
                                ? "bg-amber-600 text-black"
                                : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {index + 1}
                      </div>
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
              ))}
            </div>
            {leaderboard.length > 10 && (
              <div className="text-center mt-4">
                <Link href={`/member/tournament/${tournamentId}/leaderboard`}>
                  <Button variant="outline" size="sm">
                    View Full Leaderboard
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
                    <Badge variant="outline" className="text-xs">
                      Team
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Leader: {registration.teams.profiles?.full_name}</p>
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

      {/* Create Tournament Team Modal */}
      <CreateTournamentTeamModal
        isOpen={isCreateTeamModalOpen}
        onClose={() => setIsCreateTeamModalOpen(false)}
        tournament={tournament}
        onSuccess={loadData}
      />
    </div>
  )
}
