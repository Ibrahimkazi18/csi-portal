"use client"

import type React from "react"

import { useState } from "react"
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
import { createPendingMember } from "../actions"
import { toast } from "sonner"

interface AddMemberModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddMemberModal({ isOpen, onClose, onSuccess }: AddMemberModalProps) {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("")
  const [loading, setLoading] = useState(false)

  const roles = ["Core", "Member"] // Example roles

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!fullName || !email || !role) {
      toast.warning("Missing Information",{
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

      toast.success("Member Added",{
        description: `${fullName} has been added as a pending member.`,
      });
      
      setFullName("");
      setEmail("");
      setRole("");
      onSuccess();
      onClose();

    } catch (error: any) {
        toast.error("Error Adding Member",{
            description: error.message || "Failed to add member.",
        });

    } finally {
        setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] border-border text-foreground">
        <DialogHeader>
          <DialogTitle>Add New Member</DialogTitle>
          <DialogDescription>
            Enter the details for the new member. They will be added to pending users.
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
              {loading ? "Adding..." : "Add Member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
