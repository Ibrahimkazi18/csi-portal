"use client"

import type React from "react"

import { useState, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { updateAvatar } from "../actions"
import { Upload, X } from "lucide-react"

interface UpdateAvatarModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentAvatar?: string
  onSuccess: () => void
}

export function UpdateAvatarModal({ open, onOpenChange, currentAvatar, onSuccess }: UpdateAvatarModalProps) {
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB")
      return
    }

    setSelectedFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select an image")
      return
    }

    setLoading(true)
    try {
      // Convert file to base64 for simple storage
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target?.result as string

        const result = await updateAvatar(base64)

        if (result.success) {
          toast.success("Avatar updated successfully!")
          onSuccess()
          onOpenChange(false)
          setPreview(null)
          setSelectedFile(null)
        } else {
          toast.error("Failed to update avatar", {
            description: result.message,
          })
        }
        setLoading(false)
      }
      reader.readAsDataURL(selectedFile)
    } catch (error) {
      toast.error("An error occurred while updating avatar")
      setLoading(false)
    }
  }

  const clearSelection = () => {
    setPreview(null)
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleClose = () => {
    clearSelection()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] border-border">
        <DialogHeader>
          <DialogTitle>Update Avatar</DialogTitle>
          <DialogDescription>Choose a new profile picture. Recommended size: 400x400px (max 5MB).</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current/Preview Avatar */}
          <div className="flex justify-center">
            <Avatar className="h-32 w-32">
              <AvatarImage src={preview || currentAvatar} />
              <AvatarFallback className="text-4xl font-bold bg-primary/10 text-primary">U</AvatarFallback>
            </Avatar>
          </div>

          {/* File Input */}
          <div className="space-y-4">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 gap-2"
                disabled={loading}
              >
                <Upload className="h-4 w-4" />
                Choose Image
              </Button>

              {preview && (
                <Button type="button" variant="outline" size="icon" onClick={clearSelection} disabled={loading}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {selectedFile && (
              <div className="text-sm text-muted-foreground">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={loading || !selectedFile}>
            {loading ? "Uploading..." : "Update Avatar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
