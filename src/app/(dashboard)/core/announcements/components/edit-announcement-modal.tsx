"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Users, Shield, Edit, Target, FileText } from "lucide-react"
import { updateAnnouncement } from "../actions"
import { ModernEditModal } from "@/components/ui/modern-modal"
import { ModernForm, FormSection } from "@/components/ui/modern-form"

interface EditAnnouncementModalProps {
  announcement: any
  onSuccess: () => void
  children: React.ReactNode
}

export function EditAnnouncementModal({ announcement, onSuccess, children }: EditAnnouncementModalProps) {
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

  useEffect(() => {
    if (announcement) {
      setTitle(announcement.title || "")
      setContent(announcement.content || "")
      setTargetAudience(announcement.target_audience || "all")
      setIsImportant(announcement.is_important || false)
    }
  }, [announcement])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!announcement || !title.trim() || !content.trim()) {
      toast.error("Missing Information", {
        description: "Please fill in all required fields.",
      })
      setLoading(false)
      return
    }

    try {
      const response = await updateAnnouncement({
        id: announcement.id,
        fields: {
          title: title.trim(),
          content: content.trim(),
          target_audience: targetAudience,
          is_important: isImportant,
        },
      })

      if (!response.success) {
        throw new Error(response.error)
      }

      toast.success("Announcement Updated", {
        description: `${title} has been updated successfully.`,
      })

      onSuccess()
    } catch (error: any) {
      toast.error("Error Updating Announcement", {
        description: error.message || "Failed to update announcement.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModernEditModal
      title="Edit Announcement"
      description="Make changes to the announcement. Click save when you're done."
      icon={Edit}
      onSuccess={onSuccess}
      triggerElement={children}
    >
      {({ onSuccess: handleSuccess }) => (
        <ModernForm
          onSubmit={(e) => {
            handleSubmit(e).then(() => handleSuccess())
          }}
          loading={loading}
          submitText="Save Changes"
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
    </ModernEditModal>
  )
}
