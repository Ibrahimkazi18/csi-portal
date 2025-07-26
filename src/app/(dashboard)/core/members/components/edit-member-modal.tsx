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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateMember, updatePendingMember } from "../actions"
import { toast } from "sonner"

interface EditMemberModalProps {
  isOpen: boolean
  onClose: () => void
  member: any | null
  onSuccess: () => void
}

export function EditMemberModal({ isOpen, onClose, member, onSuccess }: EditMemberModalProps) {
  const [fullName, setFullName] = useState(member?.full_name || "")
  const [email, setEmail] = useState(member?.email || "")
  const [role, setRole] = useState(member?.role || "")
  const [loading, setLoading] = useState(false)

  const roles = ["Core", "Member"] // Example roles

  useEffect(() => {
    if (member) {
      setFullName(member.full_name)
      setEmail(member.email)
      setRole(member.role)
    }
  }, [member])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!member) return

    const updatedFields = {
      full_name: fullName,
      email,
      role,
    }

    try {
      let error = null
      if (member.isPending) {
        // For pending members, update by email as ID might not be stable or primary
        const result = await updatePendingMember(member.email, updatedFields)
        error = result.error
      } else {
        const result = await updateMember(member.id, updatedFields)
        error = result.error
      }

      if (error) {
        throw new Error(error.message)
      }

      toast.success("Member Updated", {
        description: `${fullName}'s information has been updated.`,
      });
      onSuccess();
      onClose();

    } catch (error: any) {
        toast.error("Error Updating Member", {
            description: error.message || "Failed to update member.",
        });

    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] border-border text-foreground">
        <DialogHeader>
          <DialogTitle>Edit Member</DialogTitle>
          <DialogDescription>
            Make changes to {member?.full_name}'s profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="fullName" className="text-right">
              Full Name
            </Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="col-span-3 bg-input border-border"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="col-span-3 bg-input border-border"
              required
              disabled={member?.isPending} // Email might be the primary key for pending, so disable editing it
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Role
            </Label>
            <Select value={role} onValueChange={setRole} required>
              <SelectTrigger id="role" className="col-span-3 bg-input border-border">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent className="bg-dark-surface border-border">
                {roles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading} className="glow-blue">
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
