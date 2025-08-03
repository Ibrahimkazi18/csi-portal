"use client"
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
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { Users, User, Trophy, X, Calendar, Clock, CheckCircle } from "lucide-react"
import {
  getAvailableMembers,
  createTeam,
  registerForIndividualEvent,
  getUserTournamentTeam,
  registerExistingTournamentTeam,
} from "../actions"

interface EventRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  event: any
  onSuccess: () => void
}

interface SelectedMember {
  id: string
  full_name: string
  email: string
}

interface TournamentTeam {
  id: string
  name: string
  team_members: Array<{
    member_id: string
    profiles: {
      full_name: string
      email: string
    }
  }>
}

export function EventRegistrationModal({ isOpen, onClose, event, onSuccess }: EventRegistrationModalProps) {
  const [loading, setLoading] = useState(false)
  const [availableMembers, setAvailableMembers] = useState<any[]>([])
  const [selectedMembers, setSelectedMembers] = useState<SelectedMember[]>([])
  const [teamName, setTeamName] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [existingTournamentTeam, setExistingTournamentTeam] = useState<TournamentTeam | null>(null)
  const [loadingTeam, setLoadingTeam] = useState(false)

  useEffect(() => {
    if (event && event.type === "team" && isOpen) {
      if (event.is_tournament) {
        loadExistingTournamentTeam()
      } else {
        loadAvailableMembers()
      }
    }
  }, [event, isOpen])

  const loadExistingTournamentTeam = async () => {
    if (!event) return

    setLoadingTeam(true)
    try {
      const response = await getUserTournamentTeam()
      if (response.success && response.data) {
        setExistingTournamentTeam(response.data)
        setTeamName(response.data.name)
      } else {
        // No existing team, load available members for team creation
        loadAvailableMembers()
      }
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to load tournament team",
      })
      // Fallback to normal team creation
      loadAvailableMembers()
    } finally {
      setLoadingTeam(false)
    }
  }

  const loadAvailableMembers = async () => {
    if (!event) return

    try {
      const response = await getAvailableMembers(event.id)
      if (!response.success) {
        throw new Error(response.message || "Failed to load members")
      }
      setAvailableMembers(response.data || [])
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to load available members",
      })
    }
  }

  const handleAddMember = (member: any) => {
    if (selectedMembers.length >= event.team_size - 1) {
      toast.error("Team Full", {
        description: `Maximum ${event.team_size - 1} additional members allowed (you are the leader)`,
      })
      return
    }

    if (selectedMembers.find((m) => m.id === member.id)) {
      toast.error("Already Added", {
        description: "This member is already in your team",
      })
      return
    }

    setSelectedMembers([...selectedMembers, member])
    setSearchTerm("")
  }

  const handleRemoveMember = (memberId: string) => {
    setSelectedMembers(selectedMembers.filter((m) => m.id !== memberId))
  }

  const handleIndividualRegistration = async () => {
    if (!event) return

    setLoading(true)
    try {
      const response = await registerForIndividualEvent(event.id)
      toast.success("Registration Successful", {
        description: response.message,
      })
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error("Registration Failed", {
        description: error.message || "Failed to register for event",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExistingTournamentTeamRegistration = async () => {
    if (!event || !existingTournamentTeam) return

    setLoading(true)
    try {
      const response = await registerExistingTournamentTeam(event.id, existingTournamentTeam.id)
      if (!response.success) {
        throw new Error(response.message)
      }

      toast.success("Registration Successful", {
        description: "Your tournament team has been registered for this event!",
      })
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error("Registration Failed", {
        description: error.message || "Failed to register tournament team",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTeamRegistration = async () => {
    if (!event || !teamName.trim()) {
      toast.error("Missing Information", {
        description: "Please enter a team name",
      })
      return
    }

    if (selectedMembers.length === 0) {
      toast.error("No Team Members", {
        description: "Please add at least one team member",
      })
      return
    }

    setLoading(true)
    try {
      const response = await createTeam(
        event.id,
        teamName.trim(),
        selectedMembers.map((m) => m.id),
      )

      if (!response.success) {
        throw new Error(response.message)
      }

      if (event.is_tournament) {
        toast.success("Tournament Team Created", {
          description: "Your tournament team has been created and registered automatically",
        })
      } else {
        toast.success("Team Created", {
          description: "Team created! Invitations sent to members. Registration will complete when all members accept.",
        })
      }

      // Reset form
      setTeamName("")
      setSelectedMembers([])
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error("Team Creation Failed", {
        description: error.message || "Failed to create team",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredMembers = availableMembers.filter(
    (member) =>
      member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (!event) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {event.type === "team" ? <Users className="h-5 w-5" /> : <User className="h-5 w-5" />}
            Register for {event.title}
          </DialogTitle>
          <DialogDescription>
            {event.type === "individual"
              ? "Confirm your individual registration for this event"
              : event.is_tournament && existingTournamentTeam
                ? "Register your existing tournament team for this event"
                : event.is_tournament
                  ? "Create your tournament team (automatic registration)"
                  : "Create your team and invite members (they must accept to complete registration)"}
          </DialogDescription>
        </DialogHeader>

        {/* Event Details */}
        <Card className="bg-muted/20 border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-medium">{event.title}</h4>
              {event.is_tournament && (
                <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                  <Trophy className="h-3 w-3 mr-1" />
                  Tournament
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Deadline: {new Date(event.registration_deadline).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Event: {new Date(event.start_date).toLocaleDateString()}</span>
              </div>
              {event.type === "team" && (
                <>
                  <div>Team Size: {event.team_size} members</div>
                  <div>Max Teams: {event.max_participants}</div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Individual Registration */}
        {event.type === "individual" && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-green-500/30 bg-green-500/10">
              <p className="text-sm text-green-400">
                <User className="h-4 w-4 inline mr-1" />
                You will be registered individually for this event.
              </p>
            </div>
          </div>
        )}

        {/* Existing Tournament Team Registration */}
        {event.type === "team" && event.is_tournament && existingTournamentTeam && !loadingTeam && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-green-500/30 bg-green-500/10">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <h4 className="font-medium text-green-400">Existing Tournament Team Found</h4>
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Team Name</Label>
                  <p className="text-sm text-muted-foreground">{existingTournamentTeam.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    Team Members ({existingTournamentTeam.team_members.length})
                  </Label>
                  <div className="space-y-2 mt-2">
                    {existingTournamentTeam.team_members.map((member) => (
                      <div key={member.member_id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20">
                        <div>
                          <div className="font-medium text-sm">{member.profiles.full_name}</div>
                          <div className="text-xs text-muted-foreground">{member.profiles.email}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg border border-blue-500/30 bg-blue-500/10">
              <p className="text-sm text-blue-400">
                <Trophy className="h-4 w-4 inline mr-1" />
                Your existing tournament team will be registered for this event automatically.
              </p>
            </div>
          </div>
        )}

        {/* Team Registration (New Team or Non-Tournament) */}
        {event.type === "team" && (!event.is_tournament || !existingTournamentTeam) && !loadingTeam && (
          <div className="space-y-4">
            {/* Team Name */}
            <div className="space-y-2">
              <Label htmlFor="team-name">Team Name *</Label>
              <Input
                id="team-name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="bg-input border-border"
                placeholder="Enter your team name"
                required
              />
            </div>

            {/* Member Search */}
            <div className="space-y-2">
              <Label htmlFor="member-search">
                Add Team Members ({selectedMembers.length}/{event.team_size - 1})
              </Label>
              <Input
                id="member-search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-input border-border"
                placeholder="Search members by name or email..."
              />
            </div>

            {/* Available Members Dropdown */}
            {searchTerm && (
              <div className="max-h-40 overflow-y-auto border border-border rounded-lg bg-muted/20">
                {filteredMembers.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground text-center">
                    No members found matching "{searchTerm}"
                  </div>
                ) : (
                  filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      className="p-3 hover:bg-muted/40 cursor-pointer border-b border-border last:border-b-0"
                      onClick={() => handleAddMember(member)}
                    >
                      <div className="font-medium">{member.full_name}</div>
                      <div className="text-sm text-muted-foreground">{member.email}</div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Selected Members */}
            {selectedMembers.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Team Members</Label>
                <div className="space-y-2">
                  {selectedMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20"
                    >
                      <div>
                        <div className="font-medium">{member.full_name}</div>
                        <div className="text-sm text-muted-foreground">{member.email}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveMember(member.id)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tournament vs Regular Team Info */}
            {event.is_tournament ? (
              <div className="p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10">
                <p className="text-sm text-yellow-400">
                  <Trophy className="h-4 w-4 inline mr-1" />
                  Tournament teams are registered automatically upon creation.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-lg border border-blue-500/30 bg-blue-500/10">
                <p className="text-sm text-blue-400">
                  <Users className="h-4 w-4 inline mr-1" />
                  Team members will receive invitations and must accept before registration is complete.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {loadingTeam && (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading tournament team...</p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={
              event.type === "individual"
                ? handleIndividualRegistration
                : event.is_tournament && existingTournamentTeam
                  ? handleExistingTournamentTeamRegistration
                  : handleTeamRegistration
            }
            disabled={
              loading ||
              loadingTeam ||
              (event.type === "team" && !event.is_tournament && (!teamName.trim() || selectedMembers.length === 0)) ||
              (event.type === "team" &&
                event.is_tournament &&
                !existingTournamentTeam &&
                (!teamName.trim() || selectedMembers.length === 0))
            }
            className="glow-blue"
          >
            {loading
              ? "Processing..."
              : event.type === "individual"
                ? "Register"
                : event.is_tournament && existingTournamentTeam
                  ? "Register Team"
                  : "Create Team"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
