"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface DeleteAnnouncementDialogProps {
  isOpen: boolean
  onClose: () => void
  announcement: any
  onConfirm: () => void
}

export function DeleteAnnouncementDialog({ isOpen, onClose, announcement, onConfirm }: DeleteAnnouncementDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] border-border text-foreground">
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the announcement{" "}
            <span className="font-semibold text-neon">"{announcement?.title}"</span>? This action cannot be undone and
            will remove the announcement for all users.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete Announcement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
