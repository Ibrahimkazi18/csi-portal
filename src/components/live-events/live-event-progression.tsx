"use client"

import { useState, useEffect } from "react"
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDraggable, useDroppable } from '@dnd-kit/core'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { 
  Users, User, Trophy, Target, Crown, X, 
  CheckCircle, Play, RotateCcw
} from "lucide-react"
import { toast } from "sonner"
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

interface LiveEventProgressionProps {
  eventData: any
  onMoveParticipant: (participant: any, targetRoundId: string | null) => Promise<void>
  onEliminateParticipant: (participant: any, roundId: string) => Promise<void>
  onSetWinners: (winners: any[]) => Promise<void>
  onCompleteEvent: () => Promise<void>
  onResetProgress: () => Promise<void>
  isCompleting: boolean
  isResetting: boolean
}

interface ProgressParticipant {
  id: string
  team_id?: string
  user_id?: string
  team_name?: string
  user_name?: string
  type: 'team' | 'individual'
  members?: string[]
  registration_type?: string
  teams?: any
  profiles?: any
  progress?: any
  winner?: any
  eliminated?: boolean
}

export function LiveEventProgression({
  eventData,
  onMoveParticipant,
  onEliminateParticipant,
  onSetWinners,
  onCompleteEvent,
  onResetProgress,
  isCompleting,
  isResetting
}: LiveEventProgressionProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [winnersDialogOpen, setWinnersDialogOpen] = useState(false)
  const [selectedWinners, setSelectedWinners] = useState<Array<{ position: number; teamId?: string; userId?: string; points?: number; prize?: string }>>(
    [
      { position: 1, points: 100 }, 
      { position: 2, points: 75 }, 
      { position: 3, points: 50 }
    ]
  )

  // Local state for smooth drag-and-drop
  const [roundColumns, setRoundColumns] = useState<RoundColumn[]>([])
  const [unassigned, setUnassigned] = useState<ProgressParticipant[]>([])
  const [eliminated, setEliminated] = useState<ProgressParticipant[]>([])
  const [winners, setWinners] = useState<ProgressParticipant[]>([])
  const [saving, setSaving] = useState(false)

  interface RoundColumn {
    id: string
    title: string
    round_number: number
    participants: ProgressParticipant[]
  }

  interface ProgressParticipant {
    id: string
    team_id?: string
    user_id?: string
    team_name?: string
    user_name?: string
    type: 'team' | 'individual'
    members?: string[]
    registration_type?: string
    teams?: any
    profiles?: any
    winner?: any
    progress?: any
    eliminated?: boolean
  }

  const { event, rounds, registrations, progress } = eventData
  const isCompleted = event.status === "completed"

  // Initialize local state from eventData
  useEffect(() => {
    initializeProgressionData()
  }, [eventData])

  const initializeProgressionData = () => {
    // Initialize round columns
    const columns: RoundColumn[] = rounds.map((round: any) => ({
      id: round.id,
      title: round.title,
      round_number: round.round_number,
      participants: []
    }))

    // Convert registrations to ProgressParticipant format
    const allParticipants: ProgressParticipant[] = registrations.map((reg: any) => {
      const isTeam = reg.registration_type === "team"
      return {
        id: reg.team_id || reg.user_id,
        team_id: reg.team_id,
        user_id: reg.user_id,
        team_name: isTeam ? reg.teams?.name : undefined,
        user_name: isTeam ? undefined : reg.profiles?.full_name,
        type: isTeam ? 'team' as const : 'individual' as const,
        members: isTeam ? reg.teams?.team_members?.map((tm: any) => tm.profiles?.full_name) : undefined,
        registration_type: reg.registration_type,
        teams: reg.teams,
        profiles: reg.profiles
      }
    })

    // Organize participants based on current progress
    const unassignedList: ProgressParticipant[] = []
    const eliminatedList: ProgressParticipant[] = []
    const winnersList: ProgressParticipant[] = []

    allParticipants.forEach(participant => {
      // Check if participant is in progress
      const participantProgress = progress.find((p: any) => 
        (participant.team_id && p.team_id === participant.team_id) ||
        (participant.user_id && p.user_id === participant.user_id)
      )

      // Check if participant is a winner
      const participantWinner = eventData.winners.find((w: any) => 
        (participant.team_id && w.team_id === participant.team_id) ||
        (participant.user_id && w.user_id === participant.user_id)
      )

      if (participantWinner) {
        winnersList.push({ ...participant, winner: participantWinner })
      } else if (participantProgress?.eliminated) {
        eliminatedList.push({ ...participant, progress: participantProgress, eliminated: true })
      } else if (participantProgress?.round_id) {
        const roundColumn = columns.find(c => c.id === participantProgress.round_id)
        if (roundColumn) {
          roundColumn.participants.push({ ...participant, progress: participantProgress })
        } else {
          unassignedList.push(participant)
        }
      } else {
        unassignedList.push(participant)
      }
    })

    setRoundColumns(columns)
    setUnassigned(unassignedList)
    setEliminated(eliminatedList)
    setWinners(winnersList)
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) {
      setActiveId(null)
      return
    }

    const participantId = active.id as string
    const targetColumnId = over.id as string

    await moveParticipant(participantId, targetColumnId)
    setActiveId(null)
  }

  const moveParticipant = async (participantId: string, targetColumnId: string) => {
    setSaving(true)

    try {
      // Find the participant
      const allParticipants = [...unassigned, ...eliminated, ...winners, ...roundColumns.flatMap(c => c.participants)]
      const participant = allParticipants.find(p => p.id === participantId)
      
      if (!participant) {
        toast.error('Participant not found')
        setSaving(false)
        return
      }

      console.log('Moving participant:', {
        participantId,
        targetColumnId,
        participant: participant.team_name || participant.user_name
      })

      // Calculate new state values (local state update first for smooth UI)
      let newUnassigned = unassigned.filter(p => p.id !== participantId)
      let newEliminated = eliminated.filter(p => p.id !== participantId)
      let newWinners = winners.filter(p => p.id !== participantId)
      let newRoundColumns = roundColumns.map(col => ({
        ...col,
        participants: col.participants.filter(p => p.id !== participantId)
      }))

      // Add to new location
      if (targetColumnId === 'eliminated') {
        newEliminated = [...newEliminated, { ...participant, eliminated: true }]
        toast.success(`${participant.team_name || participant.user_name} marked as eliminated`)
      } else if (targetColumnId === 'unassigned') {
        newUnassigned = [...newUnassigned, { ...participant, eliminated: false }]
        toast.success(`${participant.team_name || participant.user_name} moved to not started`)
      } else if (targetColumnId === 'winners') {
        toast.info("Use 'Set Winners' button to assign specific positions")
        setSaving(false)
        return
      } else {
        // Moving to a round
        newRoundColumns = newRoundColumns.map(col => 
          col.id === targetColumnId 
            ? { ...col, participants: [...col.participants, { ...participant, eliminated: false }] }
            : col
        )
        
        const targetRound = roundColumns.find(c => c.id === targetColumnId)
        toast.success(`${participant.team_name || participant.user_name} moved to ${targetRound?.title}`)
      }

      // Update local state immediately for smooth UI
      setUnassigned(newUnassigned)
      setEliminated(newEliminated)
      setWinners(newWinners)
      setRoundColumns(newRoundColumns)

      // Now make the server call in the background (don't await to keep UI smooth)
      if (targetColumnId === 'eliminated') {
        // Find current round for elimination
        const currentProgress = progress.find((p: any) =>
          (participant.team_id && p.team_id === participant.team_id) ||
          (participant.user_id && p.user_id === participant.user_id)
        )
        const currentRoundId = currentProgress?.round_id
        if (currentRoundId) {
          onEliminateParticipant(participant, currentRoundId).catch(error => {
            console.error('Background server call failed:', error)
            // Don't show error to user since UI already updated
          })
        }
      } else {
        // Move to specific round or unassigned
        const targetRoundId = targetColumnId === 'unassigned' ? null : targetColumnId
        onMoveParticipant(participant, targetRoundId).catch(error => {
          console.error('Background server call failed:', error)
          // Don't show error to user since UI already updated
        })
      }

    } catch (error) {
      console.error('Error in drag operation:', error)
      // Revert local state on error
      initializeProgressionData()
      toast.error('Failed to move participant')
    } finally {
      setSaving(false)
    }
  }

  const handleSetWinners = async () => {
    const validWinners = selectedWinners.filter((w) => w.teamId || w.userId)
    if (validWinners.length === 0) {
      toast.error("Please select at least one winner")
      return
    }

    await onSetWinners(validWinners)
    setWinnersDialogOpen(false)
  }

  const updatePoints = (position: 1 | 2 | 3, points: number) => {
    setSelectedWinners(prev => prev.map(w =>
      w.position === position ? { ...w, points } : w
    ))
  }

  const updatePrize = (position: 1 | 2 | 3, prize: string) => {
    setSelectedWinners(prev => prev.map(w =>
      w.position === position ? { ...w, prize } : w
    ))
  }

  const handleManualSelect = (position: 1 | 2 | 3, participantId: string) => {
    const participant = registrations.find((reg: any) => 
      reg.team_id === participantId || reg.user_id === participantId
    )
    if (!participant) return

    setSelectedWinners(prev => prev.map(w =>
      w.position === position
        ? {
            ...w,
            teamId: participant.team_id,
            userId: participant.user_id,
          }
        : w
    ))
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        {/* Header Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">Live Event Management</h2>
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

          <div className="flex items-center gap-3">
            {!isCompleted && (
              <>
                <Dialog open={winnersDialogOpen} onOpenChange={setWinnersDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-yellow-500/20 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/30">
                      <Crown className="h-4 w-4 mr-2" />
                      Set Winners
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-400" />
                        Set Event Winners
                      </DialogTitle>
                      <DialogDescription>
                        Select the 1st, 2nd, and 3rd place winners with points and prizes
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-center">🏆 Podium</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* 2nd Place */}
                        <div className="md:order-1 md:mt-8">
                          <PodiumPosition
                            position={2}
                            winner={selectedWinners[1]}
                            color="silver"
                            registrations={registrations}
                            selectedWinners={selectedWinners}
                            onChange={(participantId) => handleManualSelect(2, participantId)}
                            onPointsChange={(points) => updatePoints(2, points)}
                            onPrizeChange={(prize) => updatePrize(2, prize)}
                          />
                        </div>

                        {/* 1st Place */}
                        <div className="md:order-2">
                          <PodiumPosition
                            position={1}
                            winner={selectedWinners[0]}
                            color="gold"
                            registrations={registrations}
                            selectedWinners={selectedWinners}
                            onChange={(participantId) => handleManualSelect(1, participantId)}
                            onPointsChange={(points) => updatePoints(1, points)}
                            onPrizeChange={(prize) => updatePrize(1, prize)}
                          />
                        </div>

                        {/* 3rd Place */}
                        <div className="md:order-3 md:mt-12">
                          <PodiumPosition
                            position={3}
                            winner={selectedWinners[2]}
                            color="bronze"
                            registrations={registrations}
                            selectedWinners={selectedWinners}
                            onChange={(participantId) => handleManualSelect(3, participantId)}
                            onPointsChange={(points) => updatePoints(3, points)}
                            onPrizeChange={(prize) => updatePrize(3, prize)}
                          />
                        </div>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setWinnersDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSetWinners} className="bg-yellow-500/20 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/30">
                        <Trophy className="h-4 w-4 mr-2" />
                        Set Winners
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30">
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
                      <AlertDialogAction onClick={onCompleteEvent} disabled={isCompleting}>
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
                  <Button variant="outline" className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20">
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
                    <AlertDialogAction onClick={onResetProgress} disabled={isResetting}>
                      {isResetting ? "Resetting..." : "Reset Progress"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Instructions */}
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Target className="h-5 w-5 text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-400 mb-2">How to manage the live event:</h4>
                <ul className="text-sm text-blue-300 space-y-1">
                  <li>• Drag and drop participants between rounds</li>
                  <li>• Drop participants in "Eliminated" to eliminate them</li>
                  <li>• Use "Set Winners" button to assign 1st, 2nd, and 3rd place with points and prizes</li>
                  <li>• Click "Complete Event" when finished to lock results and calculate points</li>
                  <li>• Changes are saved automatically with smooth visual feedback</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Drag and Drop Board */}
        <div className="overflow-x-auto">
          <div className="flex gap-4 min-w-max pb-4">
            {/* Not Started/Unassigned Column */}
            <ProgressColumn
              id="unassigned"
              title="Not Started"
              count={unassigned.length}
              participants={unassigned}
              color="gray"
              icon={Users}
            />

            {/* Round Columns */}
            {roundColumns.map((round) => (
              <ProgressColumn
                key={round.id}
                id={round.id}
                title={round.title}
                count={round.participants.length}
                participants={round.participants}
                color="blue"
                icon={Target}
              />
            ))}

            {/* Eliminated Column */}
            <ProgressColumn
              id="eliminated"
              title="Eliminated"
              count={eliminated.length}
              participants={eliminated}
              color="red"
              icon={X}
            />
          </div>
        </div>

        {/* Progress Summary */}
        {saving && (
          <Card className="bg-blue-500/10 border-blue-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                <span className="text-sm text-blue-400">Saving changes...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Drag Overlay */}
        <DragOverlay>
          {activeId ? (
            <div className="p-3 bg-background border rounded-lg shadow-lg opacity-90">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="font-medium">Moving participant...</span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  )
}

// Progress Column Component
interface ProgressColumnProps {
  id: string
  title: string
  count: number
  participants: any[]
  color: 'gray' | 'blue' | 'red' | 'yellow'
  icon: any
}

function ProgressColumn({ id, title, count, participants, color, icon: Icon }: ProgressColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  const colorClasses = {
    gray: 'border-gray-500/30 bg-gray-500/5',
    blue: 'border-blue-500/30 bg-blue-500/5',
    red: 'border-red-500/30 bg-red-500/5',
    yellow: 'border-yellow-500/30 bg-yellow-500/5',
  }

  return (
    <Card
      ref={setNodeRef}
      className={`min-w-[280px] h-[600px] flex flex-col ${colorClasses[color]} ${
        isOver ? 'ring-2 ring-primary' : ''
      }`}
    >
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            <h3 className="font-semibold">{title}</h3>
          </div>
          <Badge variant="secondary">{count}</Badge>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {participants.map((participant) => (
          <DraggableParticipant 
            key={participant.id} 
            participant={participant} 
          />
        ))}

        {participants.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8">
            No participants
          </div>
        )}
      </div>
    </Card>
  )
}

// Draggable Participant Component
interface DraggableParticipantProps {
  participant: any
}

function DraggableParticipant({ participant }: DraggableParticipantProps) {
  const participantId = participant.id
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: participantId,
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  const isTeam = participant.type === "team"
  const name = isTeam ? participant.team_name : participant.user_name

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`p-3 cursor-grab active:cursor-grabbing hover:bg-muted/50 transition-colors ${
        isDragging ? 'opacity-50 ring-2 ring-primary' : ''
      }`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 text-muted-foreground">⋮⋮</div>
        {isTeam ? <Users className="h-4 w-4" /> : <User className="h-4 w-4" />}
        <span className="font-medium flex-1">{name}</span>
        
        {/* Status badges */}
        {participant.eliminated && (
          <Badge variant="destructive" className="text-xs">
            Eliminated
          </Badge>
        )}
        {participant.winner && (
          <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
            {participant.winner.position === 1 ? "1st" : participant.winner.position === 2 ? "2nd" : "3rd"}
          </Badge>
        )}
      </div>

      {isTeam && participant.members && (
        <div className="flex flex-wrap gap-1 mt-2">
          {participant.members.slice(0, 3).map((member: string, index: number) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {member}
            </Badge>
          ))}
          {participant.members.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{participant.members.length - 3}
            </Badge>
          )}
        </div>
      )}
    </Card>
  )
}

// Podium Position Component
interface PodiumPositionProps {
  position: 1 | 2 | 3
  winner: any
  color: 'gold' | 'silver' | 'bronze'
  registrations: any[]
  selectedWinners: any[]
  onChange: (participantId: string) => void
  onPointsChange: (points: number) => void
  onPrizeChange: (prize: string) => void
}

function PodiumPosition({
  position,
  winner,
  color,
  registrations,
  selectedWinners,
  onChange,
  onPointsChange,
  onPrizeChange
}: PodiumPositionProps) {
  const colorClasses = {
    gold: 'border-yellow-500/50 bg-yellow-500/10',
    silver: 'border-gray-400/50 bg-gray-400/10',
    bronze: 'border-orange-600/50 bg-orange-600/10'
  }

  const getIcon = () => {
    switch (position) {
      case 1: return '👑'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return '🏆'
    }
  }

  const selectedParticipant = registrations.find(reg => 
    reg.team_id === winner.teamId || reg.user_id === winner.userId
  )

  return (
    <Card className={`${colorClasses[color]}`}>
      <CardContent className="p-4 space-y-3">
        {/* Position Badge */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-2xl">{getIcon()}</span>
          <span className="text-lg font-bold">
            {position === 1 ? '1st' : position === 2 ? '2nd' : '3rd'} Place
          </span>
        </div>

        {/* Selected Winner Display */}
        {selectedParticipant && (
          <div className="p-3 rounded-lg border border-border bg-muted/20 mb-3">
            <p className="font-medium text-center">
              {selectedParticipant.registration_type === "team" 
                ? selectedParticipant.teams?.name 
                : selectedParticipant.profiles?.full_name}
            </p>
            {selectedParticipant.registration_type === "team" && (
              <Badge variant="secondary" className="mt-2">Team</Badge>
            )}
          </div>
        )}

        {/* Manual Selection Dropdown */}
        <div className="space-y-2">
          <Label>Select Winner</Label>
          <Select value={winner.teamId || winner.userId || ''} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {registrations
                .filter(reg => {
                  const selectedIds = selectedWinners
                    .filter(w => w.position !== position)
                    .map(w => w.teamId || w.userId)
                  const id = reg.team_id || reg.user_id
                  return !selectedIds.includes(id)
                })
                .map(reg => (
                  <SelectItem key={reg.id} value={reg.team_id || reg.user_id}>
                    {reg.registration_type === "team" ? reg.teams?.name : reg.profiles?.full_name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Points */}
        <div className="space-y-2">
          <Label>Points Awarded</Label>
          <Input
            type="number"
            value={winner.points || 0}
            onChange={(e) => onPointsChange(parseInt(e.target.value) || 0)}
            min={0}
          />
        </div>

        {/* Prize (Optional) */}
        <div className="space-y-2">
          <Label>Prize (Optional)</Label>
          <Input
            type="text"
            value={winner.prize || ''}
            onChange={(e) => onPrizeChange(e.target.value)}
            placeholder="e.g., Trophy, Gift Card"
          />
        </div>
      </CardContent>
    </Card>
  )
}