"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserPlus, Search, X, Users, Mail, Shield } from "lucide-react"
import { toast } from "sonner"
import { ModernEditModal, ModernCreateModal } from "@/components/ui/modern-modal"
import { ModernForm, FormSection } from "@/components/ui/modern-form"
import { Badge } from "@/components/ui/badge"
import { getMembers, updateMemberRole } from "../actions"

interface Member {
  id: string
  full_name: string
  email: string
  member_role: string
  member_role_id: string
}

interface RoleConfig {
  role: string
  label: string
  minCount: number
  maxCount: number | null
}

interface RoleDefinition {
  id: string
  name: string
  description: string
  color_class: string
}

interface AssignRoleModalProps {
  currentMember?: Member
  roleConfig: RoleConfig
  availableRoles: RoleDefinition[]
  onSuccess?: () => void
  triggerButton: React.ReactNode
}

export function AssignRoleModal({ 
  currentMember,
  roleConfig, 
  availableRoles,
  onSuccess,
  triggerButton 
}: AssignRoleModalProps) {
  const [allMembers, setAllMembers] = useState<Member[]>([])
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([])
  const [selectedMember, setSelectedMember] = useState<Member | null>(currentMember || null)
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingMembers, setLoadingMembers] = useState(true)

  const isEdit = !!currentMember

  const loadAvailableMembers = async () => {
    setLoadingMembers(true)
    try {
      const members = await getMembers()
      
      // Filter out members who already have a role (except 'none' and current member if editing)
      const availableMembers = members.filter(member => {
        if (isEdit && member.id === currentMember.id) return true
        return !member.member_role || member.member_role.toLowerCase() === 'none'
      })
      
      setAllMembers(availableMembers)
      setFilteredMembers(availableMembers)
    } catch (error) {
      toast.error("Failed to load members")
    } finally {
      setLoadingMembers(false)
    }
  }

  useEffect(() => {
    loadAvailableMembers()
  }, [])

  useEffect(() => {
    const filtered = allMembers.filter(member =>
      member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredMembers(filtered)
  }, [searchQuery, allMembers])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedMember) {
      toast.error("Please select a member")
      return
    }

    setLoading(true)
    try {
      const roleData = availableRoles.find(r => r.name.toLowerCase() === roleConfig.role.toLowerCase())
      
      if (!roleData) {
        throw new Error("Role not found")
      }

      const response = await updateMemberRole(
        selectedMember.id, 
        roleConfig.role, 
        roleData.id
      )
      
      if (response.success) {
        toast.success(isEdit ? "Role updated!" : "Member assigned!", {
          description: `${selectedMember.full_name} is now ${roleConfig.label}`,
        })
        onSuccess?.()
      } else {
        toast.error(response.error)
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to assign role")
    } finally {
      setLoading(false)
    }
  }

  const modalContent = ({ onSuccess: handleSuccess }: { onSuccess: () => void }) => (
    <ModernForm
      onSubmit={handleSubmit}
      loading={loading}
      submitText={isEdit ? "Update Role" : "Assign Role"}
    >
      <FormSection title="Search Members" icon={Search}>
        <div className="space-y-4">
          <div>
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
                  <div className="h-16 bg-muted rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "No members match your search" : "No available members"}
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
            <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-hide">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedMember?.id === member.id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedMember(member)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-linear-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold shrink-0">
                      {member.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{member.full_name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
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
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Selected member:</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMember(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-linear-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                  {selectedMember.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{selectedMember.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{selectedMember.email}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Will be assigned as:</span>
                  <Badge variant="outline" className="text-xs">
                    {roleConfig.label}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>
      </FormSection>
    </ModernForm>
  )

  if (isEdit) {
    return (
      <ModernEditModal
        title={`Edit ${roleConfig.label}`}
        description={`Change the member assigned to ${roleConfig.label} role`}
        icon={Shield}
        onSuccess={onSuccess}
        triggerElement={triggerButton}
        maxWidth="md:max-w-lg"
      >
        {modalContent}
      </ModernEditModal>
    )
  }

  return (
    <ModernCreateModal
      title={`Assign ${roleConfig.label}`}
      description={`Select a member to assign as ${roleConfig.label}`}
      icon={UserPlus}
      onSuccess={onSuccess}
      triggerButton={triggerButton}
      maxWidth="md:max-w-lg"
    >
      {modalContent}
    </ModernCreateModal>
  )
}