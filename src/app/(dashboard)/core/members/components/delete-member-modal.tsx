"use client"

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
import type { Member } from "@/types/auth"
import { deleteMember, deletePendingMember } from "../actions"
import { toast } from "sonner"

interface DeleteMemberDialogProps {
  isOpen: boolean
  onClose: () => void
  member: any | null
  onSuccess: () => void
}

export function DeleteMemberDialog({ isOpen, onClose, member, onSuccess }: DeleteMemberDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleConfirmDelete = async () => {
    if (!member) return
    setLoading(true)

    try {
      let success = false
      if (member.isPending) {
        const result = await deletePendingMember(member.email);
        success = result.success;

      } else {
        const result = await deleteMember(member.id);
        success = result.success;
      }

      if (!success) {
        throw new Error("Failed to delete member.");
      }

      toast.success("Member Deleted", {
        description: `${member?.full_name} has been removed.`,
      });
      onSuccess();
      onClose();

    } catch (error: any) {
        toast.success("Error Deleting Member", {
            description: error.message || "Failed to delete member.",
        });

    } finally {
        setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] border-border text-foreground">
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <span className="font-semibold text-neon">{member?.full_name}</span> (
            <span className="font-semibold text-neon">{member?.email}</span>)? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirmDelete} disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
