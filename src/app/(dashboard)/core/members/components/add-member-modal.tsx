"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createPendingMember } from "../actions"
import { toast } from "sonner"
import { UserPlus, PlusIcon, FileText, Settings } from "lucide-react"
import { ModernCreateModal } from "@/components/ui/modern-modal"
import { ModernForm, FormSection } from "@/components/ui/modern-form"

interface AddMemberModalProps {
  onSuccess: () => void
}

export function AddMemberModal({ onSuccess }: AddMemberModalProps) {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("")
  const [loading, setLoading] = useState(false)

  const roles = ["Core", "Member"] // Example roles

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!fullName || !email || !role) {
      toast.warning("Missing Information", {
        description: "Please fill in all fields.",
      })
      setLoading(false)
      return
    }

    try {
      const { data, error } = await createPendingMember({ full_name: fullName, email, role, member_role: "none" })

      if (error) {
        throw new Error(error.message)
      }

      toast.success("Member Added", {
        description: `${fullName} has been added as a pending member.`,
      })
      
      // Reset form
      setFullName("")
      setEmail("")
      setRole("")
      onSuccess()
    } catch (error: any) {
      toast.error("Error Adding Member", {
        description: error.message || "Failed to add member.",
      })
    } finally {
      setLoading(false)
    }
  }

  const triggerButton = (
    <Button className="glow-blue">
      <PlusIcon className="mr-1 size-4" />
      Add Member
    </Button>
  )

  return (
    <ModernCreateModal
      title="Add New Member"
      description="Enter the details for the new member. They will be added to pending users."
      icon={UserPlus}
      onSuccess={onSuccess}
      triggerButton={triggerButton}
    >
      {({ onSuccess: handleSuccess }) => (
        <ModernForm
          onSubmit={(e) => {
            handleSubmit(e).then(() => handleSuccess())
          }}
          loading={loading}
          submitText="Add Member"
        >
          <FormSection title="Member Information" icon={FileText}>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-10 rounded-lg"
                placeholder="Enter full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 rounded-lg"
                placeholder="Enter email address"
                required
              />
            </div>
          </FormSection>

          <FormSection title="Role Assignment" icon={Settings}>
            <div className="space-y-2">
              <Label htmlFor="role">Account Role *</Label>
              <Select value={role} onValueChange={setRole} required>
                <SelectTrigger id="role" className="h-10 rounded-lg">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FormSection>
        </ModernForm>
      )}
    </ModernCreateModal>
  )
}
