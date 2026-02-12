"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plus, Calendar, Edit, Trash2, AlertCircle, Settings, Trophy, Clock, MapPin, Users, User } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { CreateEventModal } from "./components/create-event-modal"
import { EditEventModal } from "./components/edit-event-modal"
import { DeleteEventDialog } from "./components/delete-event-modal"
import { EventRoundsModal } from "./components/event-rounds-modal"
import { deleteEvent, getEvents, getRegisteredTeams } from "./actions"
import { useRouter } from "next/navigation"
import { MorphingCardStack, type LayoutMode } from "@/components/ui/morphing-card-stack"
import { EventCardCore } from "@/components/events/event-card-core"
import { CtaCard, CtaCardHeader, CtaCardTitle, CtaCardDescription, CtaCardContent } from "@/components/ui/cta-card"

export default function EventsPage() {
  const [loadingData, setLoadingData] = useState(true)
  const [events, setEvents] = useState<any[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isRoundsModalOpen, setIsRoundsModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [isManagementMode, setIsManagementMode] = useState(false)
  const [registeredTeams, setRegisteredTeams] = useState<any>({})
  const [viewMode, setViewMode] = useState<LayoutMode>("stack")

  const router = useRouter()

  const handleEventsOnLoad = useCallback(async () => {
    setLoadingData(true)
    try {
      const [responseEvents, responseRegisteredTeams] = await Promise.all([
        getEvents(),
        getRegisteredTeams()
      ]);

      if (responseEvents.error) {
        throw new Error(responseEvents.error)
      }
      else if(responseEvents.data) {
        setEvents(responseEvents.data)
      }

      if (responseRegisteredTeams.error) {
        throw new Error(responseRegisteredTeams.error)
      }
      else if(responseRegisteredTeams.data) {
        setRegisteredTeams(responseRegisteredTeams.data)
      }

    } catch (error) {
      console.error("Failed to fetch announcements:", error)
      toast.error("Error", {
        description: "Failed to load announcements. Please try again.",
      })
    } finally {
      setLoadingData(false)
    }
  }, [])

  useEffect(() => {
    handleEventsOnLoad()
  }, [handleEventsOnLoad])


  const handleEditEvent = (event: any) => {
    setSelectedEvent(event)
    setIsEditModalOpen(true)
  }

  const handleDeleteEvent = (event: any) => {
    setSelectedEvent(event)
    setIsDeleteDialogOpen(true)
  }

  const handleManageRounds = (event: any) => {
    setSelectedEvent(event)
    setIsRoundsModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedEvent) return
    try {
      const response = await deleteEvent(selectedEvent.id);

      if(response.success) {
        toast.success("Event deleted successfully")
        handleEventsOnLoad()
        setIsDeleteDialogOpen(false)
        setSelectedEvent(null)
      }
      else {
        throw new Error(response.error);
      }

    } catch (error: any) {
      toast.error("Error deleting event", {
        description: error.message || "Failed to delete event.",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "registration_open":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "ongoing":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "completed":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
      case "cancelled":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "upcoming":
        return Clock
      case "registration_open":
        return Users
      case "ongoing":
        return MapPin
      case "completed":
        return Trophy
      case "cancelled":
        return AlertCircle
      default:
        return Clock
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-neon">Events Management</h1>
          <p className="text-muted-foreground">Create and manage CSI events and competitions</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setIsManagementMode(!isManagementMode)}
            className={isManagementMode ? "glow-purple" : ""}
          >
            <Settings className="h-4 w-4 mr-2" />
            {isManagementMode ? "Exit Management" : "Manage Events"}
          </Button>
          <Button className="glow-blue" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        </div>
      </div>

      {/* Active Events Section */}
      <CtaCard variant="accent">
        <CtaCardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CtaCardTitle>Active Events</CtaCardTitle>
          </div>
          <CtaCardDescription>Currently running and upcoming events</CtaCardDescription>
        </CtaCardHeader>
        <CtaCardContent>
          {loadingData ? (
            <div className="text-center py-8 text-muted-foreground">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No events yet</h3>
              <p className="text-muted-foreground mb-4">Create your first event to get started!</p>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Event
              </Button>
            </div>
          ) : (
            <MorphingCardStack
              cards={events.map((event) => ({
                id: event.id,
                title: event.title,
                description: event.description,
                content: (
                  <EventCardCore
                    event={event}
                    registeredTeams={registeredTeams[event.id] || []}
                    isManagementMode={isManagementMode}
                    onEdit={handleEditEvent}
                    onDelete={handleDeleteEvent}
                    onManageRounds={handleManageRounds}
                    onViewRegistrations={(id) => router.push(`/core/events/${id}/registrations`)}
                    onViewLive={(id) => router.push(`/core/events/${id}/live`)}
                    onViewResults={(id) => router.push(`/core/events/${id}/result`)}
                  />
                )
              }))}
              defaultLayout={viewMode}
            />
          )}
        </CtaCardContent>
      </CtaCard>

      {/* Management Section */}
      {isManagementMode && (
        <>
          <Separator className="my-6" />
          <CtaCard>
            <CtaCardHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                <CtaCardTitle>Manage All Events</CtaCardTitle>
              </div>
              <CtaCardDescription>Edit and delete all events. Total: {events.length} events</CtaCardDescription>
            </CtaCardHeader>
            <CtaCardContent>
              {events.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No events to manage.</div>
              ) : (
                <div className="space-y-3">
                  {events.map((event) => (
                    <EventCardCore
                      key={event.id}
                      event={event}
                      registeredTeams={registeredTeams[event.id] || []}
                      isManagementMode={true}
                      onEdit={handleEditEvent}
                      onDelete={handleDeleteEvent}
                      onManageRounds={handleManageRounds}
                      compact
                    />
                  ))}
                </div>
              )}
            </CtaCardContent>
          </CtaCard>
        </>
      )}

      {/* Modals */}
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleEventsOnLoad}
      />
      <EditEventModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        event={selectedEvent}
        onSuccess={handleEventsOnLoad}
      />
      <DeleteEventDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        event={selectedEvent}
        onConfirm={handleDeleteConfirm}
      />
      {
        isRoundsModalOpen && 
        
        <EventRoundsModal
          isOpen={isRoundsModalOpen}
          onClose={() => setIsRoundsModalOpen(false)}
          event={selectedEvent}
          onSuccess={handleEventsOnLoad}
        />
      }
    </div>
  )
}
