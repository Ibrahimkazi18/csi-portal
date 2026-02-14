"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserPlus, Search, X, Users, Mail } from "lucide-react"
import { toast } from "sonner"
import { ModernCreateModal } from "@/components/ui/modern-modal"
import { ModernForm, FormSection } from "@/components/ui/modern-form"
import { Badge } from "@/components/ui/badge"

interface Member {
  id: string
  full_name: string
  email: string
}

interface SendInvitationModalProps {
  teamId: string
  eventId: string
  teamName: string
  onSuccess?: () => void
  triggerButton?: React.ReactNode
}

export function SendInvitationModal({ 
  teamId, 
  eventId, 
  teamName, 
  onSuccess,
  triggerButton 
}: SendInvitationModalProps) {
  const [availableMembers, setAvailableMembers] = useState<Member[]>([])
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([])
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingMembers, setLoadingMembers] = useState(true)

  const loadAvailableMembers = async () => {
    setLoadingMembers(true)
    try {
      const { getAvailableMembersForInvitation } = await import("./team-leader-actions")
      const response = await getAvailableMembersForInvitation(teamId, eventId)
      
      if (response.success) {
        setAvailableMembers(response.data || [])
        setFilteredMembers(response.data || [])
      } else {
        toast.error(response.error)
      }
    } catch (error) {
      toast.error("Failed to load available members")
    } finally {
      setLoadingMembers(false)
    }
  }

  useEffect(() => {
    loadAvailableMembers()
  }, [teamId, eventId])

  useEffect(() => {
    const filtered = availableMembers.filter(member =>
      member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredMembers(filtered)
  }, [searchQuery, availableMembers])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedMember) {
      toast.error("Please select a member to invite")
      return
    }

    setLoading(true)
    try {
      const { sendNewInvitation } = await import("./team-leader-actions")
      const response = await sendNewInvitation(teamId, selectedMember.id, eventId)
      
      if (response.success) {
        toast.success("Invitation sent!", {
          description: `Invitation sent to ${selectedMember.full_name}`,
        })
        onSuccess?.()
      } else {
        toast.error(response.error)
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to send invitation")
    } finally {
      setLoading(false)
    }
  }

  const defaultTrigger = (
    <Button size="sm" variant="outline">
      <UserPlus className="h-4 w-4 mr-2" />
      Invite Member
    </Button>
  )

  return (
    <ModernCreateModal
      title="Invite New Member"
      description={`Send an invitation to join ${teamName}`}
      icon={UserPlus}
      onSuccess={onSuccess}
      triggerButton={triggerButton || defaultTrigger}
      maxWidth="md:max-w-lg"
    >
      {({ onSuccess: handleSuccess }) => (
        <ModernForm
          onSubmit={handleSubmit}
          loading={loading}
          submitText="Send Invitation"
        >
          <FormSection title="Search Members" icon={Search}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="search">Search available members</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {loadingMembers ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-12 bg-muted rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? "No members match your search" : "No available members to invite"}
                  </p>
                  {searchQuery && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchQuery("")}
                      className="mt-2"
                    >
                      Clear search
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedMember?.id === member.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedMember(member)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{member.full_name}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {member.email}
                          </p>
                        </div>
                        {selectedMember?.id === member.id && (
                          <Badge variant="default" className="text-xs">
                            Selected
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedMember && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-sm font-medium mb-1">Selected member:</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">
                      <Users className="h-3 w-3 mr-1" />
                      {selectedMember.full_name}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedMember(null)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </FormSection>
        </ModernForm>
      )}
    </ModernCreateModal>
  )
}