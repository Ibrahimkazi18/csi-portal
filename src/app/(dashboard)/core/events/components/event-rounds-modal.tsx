"use client"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Plus, Edit, Trash2, Trophy, Target } from "lucide-react"
import { addEventRounds, getEventRounds } from "../actions"

interface EventRoundsModalProps {
  isOpen: boolean
  onClose: () => void
  event: any
  onSuccess: () => void
}

interface Round {
  id?: string
  title: string
  description: string
  round_number: number
}

export function EventRoundsModal({ isOpen, onClose, event, onSuccess }: EventRoundsModalProps) {
  const [loadingData, setLoadingData] = useState(true)
  const [rounds, setRounds] = useState<Round[]>([])
  const [newRound, setNewRound] = useState<Round>({
    title: "",
    description: "",
    round_number: 1,
  })
  const [loading, setLoading] = useState(false)
  const [editingRound, setEditingRound] = useState<Round | null>(null)

  const handleEventsOnLoad = useCallback(async () => {
    setLoadingData(true);
    console.log("event:", event);

    try {
      const [responseEventRounds] = await Promise.all([
        getEventRounds(event.id),
      ])

      if (responseEventRounds.error) {
        throw new Error(responseEventRounds.error);

      } else if (responseEventRounds.data) {
        setRounds(responseEventRounds.data)
        setNewRound({
          title: "",
          description: "",
          round_number: responseEventRounds.data.length + 1,
        })
      }
    } catch (error) {
      console.error("Failed to fetch rounds:", error)
      toast.error("Error", {
        description: "Failed to load rounds. Please try again.",
      })
    } finally {
      setLoadingData(false)
    }
  }, [])

  useEffect(() => {
    if (!event || !event.id) {
      console.warn("Event is null or missing ID, skipping rounds fetch");
      setLoadingData(false);
      return;
    }

    handleEventsOnLoad()
  }, [handleEventsOnLoad, event])

  const handleAddRound = () => {
    if (!newRound.title.trim() || !newRound.description.trim()) {
      toast.error("Missing Information", {
        description: "Please fill in all round details.",
      })
      return
    }

    const round: Round = {
      ...newRound,
      round_number: rounds.length + 1,
      id: Date.now().toString(),
    }

    setRounds([...rounds, round])
    setNewRound({
      title: "",
      description: "",
      round_number: rounds.length + 2,
    })

    toast.success("Round Added", {
      description: `${round.title} has been added to the event.`,
    })
  }

  const handleEditRound = (round: Round) => {
    setEditingRound(round)
  }

  const handleUpdateRound = () => {
    if (!editingRound) return

    setRounds(rounds.map((r) => (r.id === editingRound.id ? editingRound : r)))
    setEditingRound(null)

    toast.success("Round Updated", {
      description: `${editingRound.title} has been updated.`,
    })
  }

  const handleDeleteRound = (roundId: string) => {
    setRounds(rounds.filter((r) => r.id !== roundId))
    toast.success("Round Deleted", {
      description: "Round has been removed from the event.",
    })
  }

  const handleSaveRounds = async () => {
    if (!event || rounds.length === 0) {
      toast.error("No Rounds", {
        description: "Please add at least one round before saving.",
      })
      return
    }

    setLoading(true)
    try {
      const response = await addEventRounds(
        event.id,
        rounds.map((r) => ({
          title: r.title,
          description: r.description,
          round_number: r.round_number,
        })),
      )

      toast.success("Rounds Saved", {
        description: `${rounds.length} rounds have been saved for ${event.title}.`,
      })

      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error("Error Saving Rounds", {
        description: error.message || "Failed to save event rounds.",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!event) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Manage Event Rounds - {event.title}
          </DialogTitle>
          <DialogDescription>
            Set up rounds and stages for your event. Perfect for tournaments and multi-stage competitions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Round */}
          <Card className="bg-dark-surface border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add New Round
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="round-title">Round Title</Label>
                  <Input
                    id="round-title"
                    value={newRound.title}
                    onChange={(e) => setNewRound({ ...newRound, title: e.target.value })}
                    className="bg-input border-border"
                    placeholder="e.g., Qualification Round"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="round-number">Round Number</Label>
                  <Input
                    id="round-number"
                    type="number"
                    min="1"
                    value={newRound.round_number}
                    onChange={(e) => setNewRound({ ...newRound, round_number: Number.parseInt(e.target.value) })}
                    className="bg-input border-border"
                    disabled
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="round-description">Description</Label>
                <Textarea
                  id="round-description"
                  value={newRound.description}
                  onChange={(e) => setNewRound({ ...newRound, description: e.target.value })}
                  className="bg-input border-border resize-none"
                  placeholder="Describe what happens in this round..."
                  rows={2}
                />
              </div>
              <Button onClick={handleAddRound} className="glow-blue">
                <Plus className="h-4 w-4 mr-2" />
                Add Round
              </Button>
            </CardContent>
          </Card>

          {/* Existing Rounds */}
          <Card className="bg-dark-surface border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Event Rounds ({rounds.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rounds.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No rounds added yet. Add your first round above.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rounds.map((round) => (
                    <div
                      key={round.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/10 hover:bg-muted/20 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            Round {round.round_number}
                          </Badge>
                          <h4 className="font-medium text-foreground">{round.title}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">{round.description}</p>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditRound(round)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteRound(round.id!)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit Round Modal */}
          {editingRound && (
            <Card className="bg-dark-surface border-border glow-blue">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Round
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-title">Round Title</Label>
                    <Input
                      id="edit-title"
                      value={editingRound.title}
                      onChange={(e) => setEditingRound({ ...editingRound, title: e.target.value })}
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-number">Round Number</Label>
                    <Input
                      id="edit-number"
                      type="number"
                      min="1"
                      value={editingRound.round_number}
                      onChange={(e) =>
                        setEditingRound({ ...editingRound, round_number: Number.parseInt(e.target.value) })
                      }
                      className="bg-input border-border"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editingRound.description}
                    onChange={(e) => setEditingRound({ ...editingRound, description: e.target.value })}
                    className="bg-input border-border resize-none"
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleUpdateRound} className="glow-blue">
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={() => setEditingRound(null)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleSaveRounds} disabled={loading} className="glow-blue">
            {loading ? "Saving..." : "Save All Rounds"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
