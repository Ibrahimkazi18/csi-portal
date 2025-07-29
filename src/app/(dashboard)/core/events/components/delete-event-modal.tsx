"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Calendar, Users } from "lucide-react"

interface DeleteEventDialogProps {
  isOpen: boolean
  onClose: () => void
  event: any
  onConfirm: () => void
}

export function DeleteEventDialog({ isOpen, onClose, event, onConfirm }: DeleteEventDialogProps) {
  if (!event) return null

  const canDelete = event.status !== "ongoing"

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="border-border text-foreground">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Event
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>Are you sure you want to delete this event? This action cannot be undone.</p>

            <div className="p-4 rounded-lg border border-border bg-muted/20">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-medium">{event.title}</h4>
                <Badge variant="outline" className="text-xs">
                  {event.status.replace("_", " ")}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(event.start_date).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {event.registered_count || 0} registered
                </div>
              </div>
            </div>

            {!canDelete && (
              <div className="p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10">
                <p className="text-sm text-yellow-400">
                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                  Cannot delete ongoing events. Please change the status first.
                </p>
              </div>
            )}

            {event.registered_count > 0 && canDelete && (
              <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10">
                <p className="text-sm text-red-400">
                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                  Warning: This event has {event.registered_count} registered participants.
                </p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={!canDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete Event
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
