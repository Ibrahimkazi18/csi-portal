"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Modal,
  ModalTrigger,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal"
import { EventForm } from "@/components/ui/event-form"
import { toast } from "sonner"
import { Calendar, Edit } from "lucide-react"
import { updateEvent } from "../actions"

interface EditEventModalProps {
  event: any
  onSuccess: () => void
  children: React.ReactNode
}

export function EditEventModal({ event, onSuccess, children }: EditEventModalProps) {
  const [open, setOpen] = useState(false)
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

  useEffect(() => {
    if (event && open) {
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
  }, [event, open])

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
      setOpen(false)
    } catch (error: any) {
      toast.error("Error Updating Event", {
        description: error.message || "Failed to update event.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ModalTrigger asChild>
        {children}
      </ModalTrigger>
      <ModalContent className="md:max-w-2xl max-h-[90vh] flex flex-col">
        <ModalHeader className="items-center py-6">
          <Edit className="size-8" />
          <div className="flex flex-col items-center space-y-1">
            <ModalTitle className="text-xl font-medium">Edit Event</ModalTitle>
            <p className="text-muted-foreground text-center text-sm">
              Make changes to the event. Click save when you're done.
            </p>
          </div>
        </ModalHeader>
        <ModalBody className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide">
          <EventForm
            formData={formData}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
            loading={loading}
            submitText="Save Changes"
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
