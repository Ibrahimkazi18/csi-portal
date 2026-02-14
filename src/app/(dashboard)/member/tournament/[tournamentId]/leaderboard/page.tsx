"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Trophy, Award, Medal, Crown, TrendingUp, Users, Target } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { useParams } from "next/navigation"
import Link from "next/link"
import { getTournamentLeaderboard, getTournamentDetails } from "../../actions"
import Preloader from "@/components/ui/preloader"

export default function TournamentLeaderboardPage() {
  const [showPreloader, setShowPreloader] = useState(true)
  const params = useParams()
  const tournamentId = params.tournamentId as string
  const [loading, setLoading] = useState(true)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [tournament, setTournament] = useState<any>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [leaderboardResponse, tournamentResponse] = await Promise.all([
        getTournamentLeaderboard(tournamentId),
        getTournamentDetails(tournamentId),
      ])

      if (!leaderboardResponse.success) {
        throw new Error(leaderboardResponse.message || "Failed to load leaderboard")
      }

      if(leaderboardResponse.data)
        setLeaderboard(leaderboardResponse.data)

      if (tournamentResponse.data) {
        setTournament(tournamentResponse.data.tournament)
      }

    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to load leaderboard",
      })
    } finally {
      setLoading(false)
    }
  }, [tournamentId])

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

  const getPositionBg = (position: number) => {
    switch (position) {
      case 1:
        return "bg-yellow-500/10 border-yellow-500/30"
      case 2:
        return "bg-gray-500/10 border-gray-500/30"
      case 3:
        return "bg-amber-500/10 border-amber-500/30"
      default:
        return "bg-muted/10 border-border"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/member/tournament/${tournamentId}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tournament
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-neon text-lavender">Tournament Leaderboard</h1>
            <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
              <Trophy className="h-4 w-4 mr-1" />
              {tournament?.title}
            </Badge>
          </div>
          <p className="text-muted-foreground">Current standings and team performance</p>
        </div>
      </div>

      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <Card className="bg-dark-surface border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-400" />
              Top 3 Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 2nd Place */}
              <div className="order-1 md:order-1">
                <Card className="bg-gray-500/10 border-gray-500/30">
                  <CardContent className="p-6 text-center">
                    <Medal className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-xl font-bold mb-2">{leaderboard[1]?.team_name}</h3>
                    <p className="text-3xl font-bold text-gray-300 mb-2">{leaderboard[1]?.points}</p>
                    <p className="text-sm text-muted-foreground">
                      {leaderboard[1]?.matches_played} matches • {leaderboard[1]?.wins}W {leaderboard[1]?.losses}L{" "}
                      {leaderboard[1]?.draws}D
                    </p>
                    <Badge variant="outline" className="mt-2 bg-gray-500/20 text-gray-300 border-gray-500/30">
                      2nd Place
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              {/* 1st Place */}
              <div className="order-2 md:order-2">
                <Card className="bg-yellow-500/10 border-yellow-500/30 transform md:scale-110">
                  <CardContent className="p-6 text-center">
                    <Crown className="h-16 w-16 text-yellow-400 mx-auto mb-3" />
                    <h3 className="text-2xl font-bold mb-2">{leaderboard[0]?.team_name}</h3>
                    <p className="text-4xl font-bold text-yellow-400 mb-2">{leaderboard[0]?.points}</p>
                    <p className="text-sm text-muted-foreground">
                      {leaderboard[0]?.matches_played} matches • {leaderboard[0]?.wins}W {leaderboard[0]?.losses}L{" "}
                      {leaderboard[0]?.draws}D
                    </p>
                    <Badge variant="outline" className="mt-2 bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                      🏆 Champion
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              {/* 3rd Place */}
              <div className="order-3 md:order-3">
                <Card className="bg-amber-500/10 border-amber-500/30">
                  <CardContent className="p-6 text-center">
                    <Award className="h-12 w-12 text-amber-600 mx-auto mb-3" />
                    <h3 className="text-xl font-bold mb-2">{leaderboard[2]?.team_name}</h3>
                    <p className="text-3xl font-bold text-amber-600 mb-2">{leaderboard[2]?.points}</p>
                    <p className="text-sm text-muted-foreground">
                      {leaderboard[2]?.matches_played} matches • {leaderboard[2]?.wins}W {leaderboard[2]?.losses}L{" "}
                      {leaderboard[2]?.draws}D
                    </p>
                    <Badge variant="outline" className="mt-2 bg-amber-500/20 text-amber-600 border-amber-500/30">
                      3rd Place
                    </Badge>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full Leaderboard */}
      <Card className="bg-dark-surface border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Full Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leaderboard.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No data yet</h3>
              <p>Tournament points will appear here once matches begin</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry: any, index: number) => {
                const PositionIcon = getPositionIcon(index + 1)
                return (
                  <div
                    key={entry.team_name}
                    className={`p-4 rounded-lg border transition-all hover:scale-[1.02] ${getPositionBg(index + 1)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
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
                        <PositionIcon className={`h-6 w-6 ${getPositionColor(index + 1)}`} />
                        <div>
                          <h4 className="font-bold text-lg">{entry.team_name}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              {entry.matches_played} matches
                            </span>
                            <span className="text-green-400">{entry.wins}W</span>
                            <span className="text-red-400">{entry.losses}L</span>
                            <span className="text-yellow-400">{entry.draws}D</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-primary">{entry.points}</p>
                        <p className="text-sm text-muted-foreground">points</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      {leaderboard.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-dark-surface border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-400" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Teams</p>
                  <p className="text-2xl font-bold">{leaderboard.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-dark-surface border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Target className="h-8 w-8 text-green-400" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Matches</p>
                  <p className="text-2xl font-bold">
                    {leaderboard.reduce((acc, team) => acc + team.matches_played, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-dark-surface border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Trophy className="h-8 w-8 text-yellow-400" />
                <div>
                  <p className="text-sm text-muted-foreground">Highest Score</p>
                  <p className="text-2xl font-bold">{Math.max(...leaderboard.map((t) => t.points))}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-dark-surface border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-purple-400" />
                <div>
                  <p className="text-sm text-muted-foreground">Average Score</p>
                  <p className="text-2xl font-bold">
                    {Math.round(leaderboard.reduce((acc, team) => acc + team.points, 0) / leaderboard.length)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
