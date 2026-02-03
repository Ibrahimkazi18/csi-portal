"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteWorkshop } from "../../app/(dashboard)/core/workshops/actions"

interface DeleteWorkshopButtonProps {
  workshopId: string
  workshopTitle: string
  onDeleted?: () => void
}

export function DeleteWorkshopButton({ workshopId, workshopTitle, onDeleted }: DeleteWorkshopButtonProps) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    
    const response = await deleteWorkshop(workshopId)
    
    if (response.success) {
      toast.success("Workshop deleted successfully")
      if (onDeleted) {
        onDeleted()
      }
    } else {
      toast.error(response.error)
    }
    
    setDeleting(false)
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Workshop</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{workshopTitle}"? This action cannot be undone and will:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Remove the workshop permanently</li>
              <li>Cancel all registrations</li>
              <li>Delete all associated data</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete} 
            disabled={deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting ? "Deleting..." : "Delete Workshop"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}