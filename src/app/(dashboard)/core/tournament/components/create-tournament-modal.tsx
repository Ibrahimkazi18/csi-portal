"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Trophy, PlusIcon, FileText, Calendar, Settings } from "lucide-react"
import { createTournament } from "../actions"
import { ModernCreateModal } from "@/components/ui/modern-modal"
import { ModernForm, FormSection } from "@/components/ui/modern-form"

interface CreateTournamentModalProps {
  onSuccess: () => void
}

export function CreateTournamentModal({ onSuccess }: CreateTournamentModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    year: new Date().getFullYear(),
    start_date: "",
    end_date: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await createTournament(formData)
      if (!response.success) {
        throw new Error(response.message)
      }

      toast.success("Tournament Created", {
        description: response.message,
      })
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        year: new Date().getFullYear(),
        start_date: "",
        end_date: "",
      })
      onSuccess()
    } catch (error: any) {
      toast.error("Error Creating Tournament", {
        description: error.message || "Failed to create tournament",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const triggerButton = (
    <Button className="glow-blue">
      <PlusIcon className="mr-1 size-4" />
      Create Tournament
    </Button>
  )

  return (
    <ModernCreateModal
      title="Create New Tournament"
      description="Create a new tournament for teams to compete in"
      icon={Trophy}
      onSuccess={onSuccess}
      triggerButton={triggerButton}
    >
      {({ onSuccess: handleSuccess }) => (
        <ModernForm
          onSubmit={(e) => {
            handleSubmit(e).then(() => handleSuccess())
          }}
          loading={loading}
          submitText="Create Tournament"
        >
          <FormSection title="Basic Information" icon={FileText}>
            <div className="space-y-2">
              <Label htmlFor="title">Tournament Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className="h-10 rounded-lg"
                placeholder="e.g., Annual Programming Contest"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                className="rounded-lg resize-none"
                placeholder="Enter tournament description"
                rows={3}
              />
            </div>
          </FormSection>

          <FormSection title="Tournament Settings" icon={Settings}>
            <div className="space-y-2">
              <Label htmlFor="year">Year *</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => handleInputChange("year", Number.parseInt(e.target.value))}
                className="h-10 rounded-lg"
                min={new Date().getFullYear()}
                required
              />
            </div>
          </FormSection>

          <FormSection title="Schedule (Optional)" icon={Calendar}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange("start_date", e.target.value)}
                  className="h-10 rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange("end_date", e.target.value)}
                  className="h-10 rounded-lg"
                />
              </div>
            </div>
          </FormSection>
        </ModernForm>
      )}
    </ModernCreateModal>
  )
}
