"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Users, Shield, Megaphone, PlusIcon, Target, FileText } from "lucide-react"
import { createAnnouncement } from "../actions"
import { ModernCreateModal } from "@/components/ui/modern-modal"
import { ModernForm, FormSection } from "@/components/ui/modern-form"

interface CreateAnnouncementModalProps {
  onSuccess: () => void
}

export function CreateAnnouncementModal({ onSuccess }: CreateAnnouncementModalProps) {
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
    } catch (error: any) {
      toast.error("Error Creating Announcement", {
        description: error.message || "Failed to create announcement.",
      })
    } finally {
      setLoading(false)
    }
  }

  const triggerButton = (
    <Button>
      <PlusIcon className="mr-1 size-4" />
      Create Announcement
    </Button>
  )

  return (
    <ModernCreateModal
      title="Create New Announcement"
      description="Share important information with your community members"
      icon={Megaphone}
      onSuccess={onSuccess}
      triggerButton={triggerButton}
    >
      {({ onSuccess: handleSuccess }) => (
        <ModernForm
          onSubmit={(e) => {
            handleSubmit(e).then(() => handleSuccess())
          }}
          loading={loading}
          submitText="Publish Announcement"
        >
          <FormSection title="Basic Information" icon={FileText}>
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-10 rounded-lg"
                placeholder="e.g., Important Meeting Tomorrow"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[100px] rounded-lg resize-none"
                placeholder="Write your announcement content here..."
                required
              />
            </div>
          </FormSection>

          <FormSection title="Audience & Settings" icon={Target}>
            <div className="space-y-2">
              <Label htmlFor="audience">Target Audience *</Label>
              <Select
                value={targetAudience}
                onValueChange={(value) => setTargetAudience(value as "all" | "core-team" | "members")}
                required
              >
                <SelectTrigger className="h-10 rounded-lg">
                  <SelectValue placeholder="Select target audience" />
                </SelectTrigger>
                <SelectContent>
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

            <div className="flex items-center space-x-3 p-3 rounded-lg border bg-muted/30">
              <Switch id="important" checked={isImportant} onCheckedChange={setIsImportant} />
              <Label htmlFor="important" className="flex items-center gap-2 cursor-pointer text-sm">
                <Shield className="h-4 w-4" />
                Mark as Important
              </Label>
              <span className="text-xs text-muted-foreground">Highlighted with red border</span>
            </div>
          </FormSection>
        </ModernForm>
      )}
    </ModernCreateModal>
  )
}
