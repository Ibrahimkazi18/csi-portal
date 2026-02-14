"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trophy, Plus, Calendar, Users, Play, CheckCircle, Clock, Trash2, RotateCcw, Target, Award } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import {
  getAllTournaments,
  startTournament,
  beginTournament,
  completeTournament,
  deleteTournament,
  resetTournament,
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
import { CreateTournamentModal } from "./components/create-tournament-modal"
import Link from "next/link"
import Preloader from "@/components/ui/preloader"

export default function CoreTournamentsPage() {
  const [showPreloader, setShowPreloader] = useState(true)
  const [loading, setLoading] = useState(true)
  const [tournaments, setTournaments] = useState<any[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [processingTournament, setProcessingTournament] = useState<string | null>(null)

  const loadTournaments = useCallback(async () => {
    setLoading(true)
    try {
      const response = await getAllTournaments()
      if (!response.success) {
        throw new Error(response.message || "Failed to load tournaments")
      }
      
      if(response.data) setTournaments(response.data);

    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to load tournaments",
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTournaments()
  }, [loadTournaments])

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

  const handleStatusChange = async (tournamentId: string, action: string) => {
    setProcessingTournament(tournamentId)
    try {
      let response
      switch (action) {
        case "start":
          response = await startTournament(tournamentId)
          break
        case "begin":
          response = await beginTournament(tournamentId)
          break
        case "complete":
          response = await completeTournament(tournamentId)
          break
        case "reset":
          response = await resetTournament(tournamentId)
          break
        case "delete":
          response = await deleteTournament(tournamentId)
          break
        default:
          throw new Error("Invalid action")
      }

      if (!response.success) {
        throw new Error(response.message)
      }

      toast.success("Success", {
        description: response.message,
      })
      loadTournaments()
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to update tournament",
      })
    } finally {
      setProcessingTournament(null)
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
          <h1 className="text-3xl font-bold text-neon">Tournament Management</h1>
          <p className="text-muted-foreground">Create and manage tournaments</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="glow-blue">
          <Plus className="h-4 w-4 mr-2" />
          Create Tournament
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-dark-surface border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-yellow-400" />
              <div>
                <p className="text-sm text-muted-foreground">Total Tournaments</p>
                <p className="text-2xl font-bold">{tournaments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-dark-surface border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Play className="h-8 w-8 text-green-400" />
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">
                  {tournaments.filter((t) => t.status === "ongoing" || t.status === "registration_open").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-dark-surface border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{tournaments.filter((t) => t.status === "completed").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-dark-surface border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-purple-400" />
              <div>
                <p className="text-sm text-muted-foreground">Total Teams</p>
                <p className="text-2xl font-bold">
                  {tournaments.reduce((acc, t) => acc + (t.tournament_registrations?.[0]?.count || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tournaments List */}
      {tournaments.length === 0 ? (
        <Card className="bg-dark-surface border-border">
          <CardContent className="text-center py-12">
            <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No tournaments yet</h3>
            <p className="text-muted-foreground mb-4">Create your first tournament to get started</p>
            <Button onClick={() => setIsCreateModalOpen(true)} className="glow-blue">
              <Plus className="h-4 w-4 mr-2" />
              Create Tournament
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tournaments.map((tournament) => {
            const StatusIcon = getStatusIcon(tournament.status)
            const isProcessing = processingTournament === tournament.id
            const registrationCount = tournament.tournament_registrations?.[0]?.count || 0

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
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{registrationCount} teams</span>
                        </div>
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
                      <Link href={`/core/tournament/${tournament.id}`}>
                        <Button size="sm" variant="outline" className="glow-blue bg-transparent">
                          <Target className="h-4 w-4 mr-1" />
                          Manage
                        </Button>
                      </Link>
                      {tournament.status === "ongoing" || tournament.status === "completed" ? (
                        <Link href={`/core/tournament/${tournament.id}/leaderboard`}>
                          <Button size="sm" variant="outline" className="glow-yellow bg-transparent">
                            <Award className="h-4 w-4 mr-1" />
                            Leaderboard
                          </Button>
                        </Link>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      {tournament.status === "upcoming" && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(tournament.id, "start")}
                          disabled={isProcessing}
                          className="glow-green"
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Start Registration
                        </Button>
                      )}
                      {tournament.status === "registration_open" && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(tournament.id, "begin")}
                          disabled={isProcessing}
                          className="glow-yellow"
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Begin Tournament
                        </Button>
                      )}
                      {tournament.status === "ongoing" && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(tournament.id, "complete")}
                          disabled={isProcessing}
                          className="glow-blue"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Complete
                        </Button>
                      )}
                      {tournament.status === "completed" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="glow-red bg-transparent">
                              <RotateCcw className="h-4 w-4 mr-1" />
                              Reset
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Reset Tournament</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will reset all tournament data including points, registrations, and set status back
                                to upcoming. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleStatusChange(tournament.id, "reset")}
                                disabled={isProcessing}
                              >
                                Reset Tournament
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      {tournament.status === "upcoming" && registrationCount === 0 && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Tournament</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this tournament? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleStatusChange(tournament.id, "delete")}
                                disabled={isProcessing}
                              >
                                Delete Tournament
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Tournament Modal */}
      <CreateTournamentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadTournaments}
      />
    </div>
  )
}
