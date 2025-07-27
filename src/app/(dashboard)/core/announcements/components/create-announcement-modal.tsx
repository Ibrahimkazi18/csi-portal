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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Users, Shield } from "lucide-react"
import { createAnnouncement } from "../actions"

interface CreateAnnouncementModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateAnnouncementModal({ isOpen, onClose, onSuccess }: CreateAnnouncementModalProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [targetAudience, setTargetAudience] = useState<"all" | "core-team" | "members">("all")
  const [isImportant, setIsImportant] = useState(false)
  const [loading, setLoading] = useState(false)

  const audienceOptions = [
    { value: "all", label: "Everyone", icon: Users, description: "Visible to all members and core team" },
    { value: "core-team", label: "Core Team Only", icon: Shield, description: "Visible only to core team members" },
    { value: "members", label: "Members Only", icon: Users, description: "Visible only to regular members" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!title.trim() || !content.trim()) {
      toast.error("Missing Information", {
        description: "Please fill in all required fields.",
      })
      setLoading(false)
      return
    }

    try {
      const response = await createAnnouncement({
        title: title.trim(),
        content: content.trim(),
        targetAudience,
        isImportant,
      })

      if (!response.success) {
        throw new Error(response.error)
      }

      toast.success("Announcement Created", {
        description: `${title} has been published successfully.`,
      })

      // Reset form
      setTitle("")
      setContent("")
      setTargetAudience("all")
      setIsImportant(false)
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error("Error Creating Announcement", {
        description: error.message || "Failed to create announcement.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] border-border text-foreground">
        <DialogHeader>
          <DialogTitle>Create New Announcement</DialogTitle>
          <DialogDescription>Share important information with your community members.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3 bg-input border-border"
              placeholder="e.g., Important Meeting Tomorrow"
              required
            />
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="content" className="text-right pt-2">
              Content *
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="col-span-3 bg-input border-border resize-none"
              placeholder="Write your announcement content here..."
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="audience" className="text-right">
              Audience *
            </Label>
            <Select
              value={targetAudience}
              onValueChange={(value) => setTargetAudience(value as "all" | "core-team" | "members")}
              required
            >
              <SelectTrigger className="col-span-3 bg-input border-border">
                <SelectValue placeholder="Select target audience" />
              </SelectTrigger>
              <SelectContent className="border-border">
                {audienceOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-muted-foreground">{option.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="important" className="text-right">
              Mark as Important
            </Label>
            <div className="col-span-3 flex items-center space-x-2">
              <Switch id="important" checked={isImportant} onCheckedChange={setIsImportant} />
              <Label htmlFor="important" className="text-sm text-muted-foreground">
                Important announcements are highlighted with a red border
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="glow-blue">
              {loading ? "Publishing..." : "Publish Announcement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
