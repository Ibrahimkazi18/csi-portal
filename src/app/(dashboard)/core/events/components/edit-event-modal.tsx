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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Users, User, Trophy, Calendar } from "lucide-react"
import { updateEvent } from "../actions"

interface EditEventModalProps {
  isOpen: boolean
  onClose: () => void
  event: any
  onSuccess: () => void
}

export function EditEventModal({ isOpen, onClose, event, onSuccess }: EditEventModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    max_participants: "",
    team_size: "",
    registration_deadline: "",
    start_date: "",
    end_date: "",
    type: "individual" as "individual" | "team",
    is_tournament: false,
    banner_url: "",
    status: "upcoming",
  })
  const [loading, setLoading] = useState(false)

  const eventTypes = [
    { value: "individual", label: "Individual", icon: User, description: "Single participant events" },
    { value: "team", label: "Team", icon: Users, description: "Team-based events" },
  ]

  const statusOptions = [
    { value: "upcoming", label: "Upcoming", description: "Event is scheduled but not open for registration" },
    { value: "registration_open", label: "Registration Open", description: "Participants can register" },
    { value: "ongoing", label: "Ongoing", description: "Event is currently running" },
    { value: "completed", label: "Completed", description: "Event has finished" },
    { value: "cancelled", label: "Cancelled", description: "Event has been cancelled" },
  ]

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || "",
        description: event.description || "",
        max_participants: event.max_participants?.toString() || "",
        team_size: event.team_size?.toString() || "",
        registration_deadline: event.registration_deadline ? event.registration_deadline.split("T")[0] : "",
        start_date: event.start_date ? event.start_date.split("T")[0] : "",
        end_date: event.end_date ? event.end_date.split("T")[0] : "",
        type: event.type || "individual",
        is_tournament: event.is_tournament || false,
        banner_url: event.banner_url || "",
        status: event.status || "upcoming",
      })
    }
  }, [event])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!event || !formData.title.trim() || !formData.description.trim()) {
      toast.error("Missing Information", {
        description: "Please fill in all required fields.",
      })
      setLoading(false)
      return
    }

    try {
      const response = await updateEvent({
        id: event.id,
        fields: {
          title: formData.title.trim(),
          description: formData.description.trim(),
          max_participants: Number.parseInt(formData.max_participants),
          team_size: formData.type === "team" ? Number.parseInt(formData.team_size) : 1,
          registration_deadline: new Date(formData.registration_deadline),
          start_date: new Date(formData.start_date),
          end_date: new Date(formData.end_date),
          type: formData.type,
          is_tournament: formData.is_tournament,
          banner_url: formData.banner_url,
          status: formData.status,
        },
      })

      if (!response.success) {
        throw new Error(response.error)
      }

      toast.success("Event Updated", {
        description: `${formData.title} has been updated successfully.`,
      })

      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error("Error Updating Event", {
        description: error.message || "Failed to update event.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Edit Event
          </DialogTitle>
          <DialogDescription>Make changes to the event. Click save when you're done.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="bg-input border-border"
                  placeholder="e.g., Web Development Challenge"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_participants">Max Participants *</Label>
                <Input
                  id="max_participants"
                  type="number"
                  min="1"
                  value={formData.max_participants}
                  onChange={(e) => handleInputChange("max_participants", e.target.value)}
                  className="bg-input border-border"
                  placeholder="50"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                className="bg-input border-border resize-none"
                placeholder="Describe the event..."
                rows={3}
                required
              />
            </div>
          </div>

          {/* Event Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Event Configuration</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Event Type *</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)} required>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent className="border-border">
                    {eventTypes.map((type) => {
                      const Icon = type.icon
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-xs text-muted-foreground">{type.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              {formData.type === "team" && (
                <div className="space-y-2">
                  <Label htmlFor="team_size">Team Size *</Label>
                  <Input
                    id="team_size"
                    type="number"
                    min="2"
                    value={formData.team_size}
                    onChange={(e) => handleInputChange("team_size", e.target.value)}
                    className="bg-input border-border"
                    placeholder="4"
                    required={formData.type === "team"}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)} required>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="border-border">
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <div>
                          <div className="font-medium">{status.label}</div>
                          <div className="text-xs text-muted-foreground">{status.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_tournament"
                checked={formData.is_tournament}
                onCheckedChange={(checked) => handleInputChange("is_tournament", checked)}
              />
              <Label htmlFor="is_tournament" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Tournament Mode
              </Label>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Important Dates</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="registration_deadline">Registration Deadline *</Label>
                <Input
                  id="registration_deadline"
                  type="date"
                  value={formData.registration_deadline}
                  onChange={(e) => handleInputChange("registration_deadline", e.target.value)}
                  className="bg-input border-border"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange("start_date", e.target.value)}
                  className="bg-input border-border"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">End Date *</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange("end_date", e.target.value)}
                  className="bg-input border-border"
                  required
                />
              </div>
            </div>
          </div>

          {/* Optional Fields */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Optional</h3>

            <div className="space-y-2">
              <Label htmlFor="banner_url">Banner Image URL</Label>
              <Input
                id="banner_url"
                type="url"
                value={formData.banner_url}
                onChange={(e) => handleInputChange("banner_url", e.target.value)}
                className="bg-input border-border"
                placeholder="https://example.com/banner.jpg"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="glow-blue">
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
