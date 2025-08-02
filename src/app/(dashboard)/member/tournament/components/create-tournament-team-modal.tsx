"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, AlertCircle } from 'lucide-react'
import { toast } from "sonner"
import { createTournamentTeam, getAvailableMembers } from "../actions"

interface CreateTournamentTeamModalProps {
  isOpen: boolean
  onClose: () => void
  tournament: any
  onSuccess: () => void
}

export function CreateTournamentTeamModal({ isOpen, onClose, tournament, onSuccess }: CreateTournamentTeamModalProps) {
  const [loading, setLoading] = useState(false)
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [teamName, setTeamName] = useState("")
  const [availableMembers, setAvailableMembers] = useState<any[]>([])
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])

  const maxTeamSize = tournament?.max_team_size || 4
  const remainingSlots = maxTeamSize - 1 // -1 for the team leader (current user)

  useEffect(() => {
    if (isOpen && tournament) {
      loadAvailableMembers()
      setTeamName("")
      setSelectedMembers([])
    }
  }, [isOpen, tournament])

  const loadAvailableMembers = async () => {
    if (!tournament) return

    setLoadingMembers(true)
    try {
      const response = await getAvailableMembers(tournament.id)
      if (response.data) {
        setAvailableMembers(response.data)
      }
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to load available members",
      })
    } finally {
      setLoadingMembers(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tournament) return

    // Validate team size
    if (selectedMembers.length >= maxTeamSize) {
      toast.error("Team Size Limit", {
        description: `Maximum team size is ${maxTeamSize} members (including you as leader)`,
      })
      return
    }

    setLoading(true)
    try {
      const response = await createTournamentTeam(tournament.id, teamName, selectedMembers)
      if (!response.success) {
        throw new Error(response.message)
      }

      toast.success("Success", {
        description: response.message,
      })
      onSuccess()
      onClose()
      setTeamName("")
      setSelectedMembers([])
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to create team",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers((prev) => {
      if (prev.includes(memberId)) {
        return prev.filter((id) => id !== memberId)
      } else {
        // Check if adding this member would exceed the limit
        if (prev.length >= remainingSlots) {
          toast.error("Team Size Limit", {
            description: `You can only invite ${remainingSlots} more member(s) (max team size: ${maxTeamSize})`,
          })
          return prev
        }
        return [...prev, memberId]
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Create Tournament Team</span>
          </DialogTitle>
          <DialogDescription>
            Create a team for {tournament?.title}. You can invite up to {remainingSlots} other members to join your team.
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-blue-500/20 bg-blue-500/10">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Team Size Limit:</strong> Maximum {maxTeamSize} members per team (including you as team leader).
            You can invite up to {remainingSlots} additional member(s).
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="teamName">Team Name</Label>
            <Input
              id="teamName"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter team name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Invite Members (Optional)</Label>
            <div className="text-sm text-muted-foreground mb-2">
              Selected: {selectedMembers.length} / {remainingSlots} available slots
            </div>
            
            {loadingMembers ? (
              <div className="text-center py-4 text-muted-foreground">Loading available members...</div>
            ) : availableMembers.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">No available members to invite</div>
            ) : (
              <div className="max-h-48 overflow-y-auto border border-border rounded-md p-3 space-y-2">
                {availableMembers.map((member) => (
                  <div key={member.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={member.id}
                      checked={selectedMembers.includes(member.id)}
                      onCheckedChange={() => handleMemberToggle(member.id)}
                      disabled={!selectedMembers.includes(member.id) && selectedMembers.length >= remainingSlots}
                    />
                    <Label htmlFor={member.id} className="flex-1 cursor-pointer">
                      <div>
                        <p className="font-medium">{member.full_name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            )}
            
            {selectedMembers.length > 0 && (
              <div className="mt-2 p-2 bg-muted/50 rounded-md">
                <p className="text-sm font-medium mb-1">Team Preview:</p>
                <p className="text-sm text-muted-foreground">
                  • You (Team Leader)
                </p>
                {selectedMembers.map((memberId) => {
                  const member = availableMembers.find(m => m.id === memberId)
                  return member ? (
                    <p key={memberId} className="text-sm text-muted-foreground">
                      • {member.full_name}
                    </p>
                  ) : null
                })}
                <p className="text-xs text-muted-foreground mt-1">
                  Total: {selectedMembers.length + 1} / {maxTeamSize} members
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="glow-blue">
              {loading ? "Creating..." : "Create Team"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
