"use client"

import type React from "react"
import { useCallback, useEffect, useState } from "react"
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
import { Calendar, PlusIcon } from "lucide-react"
import { createEvent, getTournaments } from "../actions"

interface CreateEventModalProps {
  onSuccess: () => void
}

export function CreateEventModal({ onSuccess }: CreateEventModalProps) {
  const [open, setOpen] = useState(false)
  const [tournaments, setTournaments] = useState<any>([])

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
    tournament_id: "",
    status: "upcoming",
  })
  const [loading, setLoading] = useState(false)

  const handleLoadTournament = useCallback(async () => {
    try {
      const response = await getTournaments()

      if (response.error) {
        throw new Error(response.error)
      }

      if (response.data) {
        setTournaments(response.data)
      }
    } catch (error: any) {
      toast.error('Failed to fetch tournaments', {
        description: error.message
      })
    }
  }, [])

  useEffect(() => {
    if (open) {
      handleLoadTournament()
    }
  }, [handleLoadTournament, open])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validation
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error("Missing Information", {
        description: "Please fill in all required fields.",
      })
      setLoading(false)
      return
    }

    if (formData.type === "team" && (!formData.team_size || Number.parseInt(formData.team_size) < 2)) {
      toast.error("Invalid Team Size", {
        description: "Team events must have at least 2 members per team.",
      })
      setLoading(false)
      return
    }

    try {
      const response = await createEvent({
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
        tournament_id: formData.tournament_id,
        status: formData.status,
      })

      if (!response.success) {
        throw new Error("Failed to create event")
      }

      toast.success("Event Created", {
        description: `${formData.title} has been created successfully.`,
      })

      // Reset form
      setFormData({
        title: "",
        description: "",
        max_participants: "",
        team_size: "",
        registration_deadline: "",
        start_date: "",
        end_date: "",
        type: "individual",
        is_tournament: false,
        banner_url: "",
        tournament_id: "",
        status: "upcoming",
      })

      onSuccess()
      setOpen(false)
    } catch (error: any) {
      toast.error("Error Creating Event", {
        description: error.message || "Failed to create event.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ModalTrigger asChild>
        <Button>
          <PlusIcon className="mr-1 size-4" />
          Create Event
        </Button>
      </ModalTrigger>
      <ModalContent className="md:max-w-2xl max-h-[90vh] flex flex-col">
        <ModalHeader className="items-center py-6">
          <Calendar className="size-8" />
          <div className="flex flex-col items-center space-y-1">
            <ModalTitle className="text-xl font-medium">Create New Event</ModalTitle>
            <p className="text-muted-foreground text-center text-sm">
              Set up a new event or competition for your community members
            </p>
          </div>
        </ModalHeader>
        <ModalBody className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide">
          <EventForm
            formData={formData}
            tournaments={tournaments}
            onInputChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
            onSubmit={handleSubmit}
            loading={loading}
            submitText="Create Event"
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
