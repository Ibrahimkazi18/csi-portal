"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plus, Calendar, Edit, Trash2, AlertCircle, Users, User, Settings, Trophy, Clock, MapPin } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { CreateEventModal } from "./components/create-event-modal"
import { EditEventModal } from "./components/edit-event-modal"
import { DeleteEventDialog } from "./components/delete-event-modal"
import { EventRoundsModal } from "./components/event-rounds-modal"
import { deleteEvent, getEvents, getRegisteredTeams } from "./actions"
import { useRouter } from "next/navigation"

export default function EventsPage() {
  const [loadingData, setLoadingData] = useState(true)
  const [events, setEvents] = useState<any[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isRoundsModalOpen, setIsRoundsModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [isManagementMode, setIsManagementMode] = useState(false)
  const [registeredTeams, setRegisteredTeams] = useState<any>({});

  const router = useRouter();

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
        console.error(responseRegisteredTeams.error);
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
      <Card className="bg-dark-surface border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Active Events
          </CardTitle>
          <p className="text-sm text-muted-foreground">Currently running and upcoming events</p>
        </CardHeader>
        <CardContent>
          {loadingData ? (
            <div className="text-center py-8 text-muted-foreground">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No events yet</h3>
              <p className="text-muted-foreground mb-4">Create your first event to get started!</p>
              <Button onClick={() => setIsCreateModalOpen(true)} className="glow-blue">
                <Plus className="h-4 w-4 mr-2" />
                Create First Event
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => {
                const StatusIcon = getStatusIcon(event.status)
                const teamsEvent = registeredTeams[event.id];
                const progressPercentage = (teamsEvent.length / event.max_participants) * 100 || 0

                return (
                  <div
                    key={event.id}
                    className={`p-6 rounded-lg border transition-all ${
                      event.is_tournament
                        ? "border-yellow-500/30 bg-yellow-500/5 glow-yellow"
                        : "border-border bg-muted/20"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-semibold text-foreground">{event.title}</h3>
                        {event.is_tournament && (
                          <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                            <Trophy className="h-3 w-3 mr-1" />
                            Tournament
                          </Badge>
                        )}
                        <Badge variant="outline" className={`text-xs ${getStatusColor(event.status)}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {event.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        {event.type === "team" ? <Users className="h-4 w-4" /> : <User className="h-4 w-4" />}
                        <span className="text-sm capitalize">{event.type}</span>
                        {event.type === "team" && <span className="text-sm">({event.team_size} members)</span>}
                      </div>
                    </div>

                    <p className="text-foreground leading-relaxed mb-4">{event.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <span className="text-muted-foreground">Registration: </span>
                          <span className="font-medium">
                            {new Date(event.registration_deadline).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <span className="text-muted-foreground">Start: </span>
                          <span className="font-medium">{new Date(event.start_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Participants: </span>
                        <span className="font-medium">
                          {teamsEvent.length || 0}/{event.max_participants}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Progress: </span>
                        <span className="font-medium">{Math.round(progressPercentage)}%</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-muted rounded-full h-2 mb-4">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300 glow-blue"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>

                    {/* Action Buttons */}
                    {!isManagementMode && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleManageRounds(event)}
                          className="text-xs"
                        >
                          Manage Rounds
                        </Button>
                        {
                          event.status !== "upcoming" &&
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs bg-transparent"
                              onClick={() => router.push(`/core/events/${event.id}/registrations`)}
                            >
                              View Registrations
                            </Button>
                        }
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Management Section */}
      {isManagementMode && (
        <>
          <Separator className="my-6" />
          <Card className="bg-dark-surface border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Manage All Events
              </CardTitle>
              <p className="text-sm text-muted-foreground">Edit and delete all events. Total: {events.length} events</p>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No events to manage.</div>
              ) : (
                <div className="space-y-3">
                  {events.map((event) => {
                    const StatusIcon = getStatusIcon(event.status)
                    return (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/10 hover:bg-muted/20 transition-colors group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-foreground truncate">{event.title}</h4>
                            {event.is_tournament && (
                              <Badge
                                variant="outline"
                                className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs"
                              >
                                <Trophy className="h-3 w-3 mr-1" />
                                Tournament
                              </Badge>
                            )}
                            <Badge variant="outline" className={`text-xs ${getStatusColor(event.status)}`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {event.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{event.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(event.start_date).toLocaleDateString()}
                            </div>
                            <div>
                              {event.registered_count}/{event.max_participants} registered
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleManageRounds(event)}
                            className="h-8 px-3 text-xs"
                          >
                            Rounds
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditEvent(event)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteEvent(event)}
                            className="h-8 w-8 p-0"
                            disabled={event.status === "ongoing"}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
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
