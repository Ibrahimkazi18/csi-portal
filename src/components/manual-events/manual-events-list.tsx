"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Users, MapPin, Clock, ExternalLink, Edit, Trash2 } from "lucide-react"
import { getManualEvents, deleteManualEvent } from "@/app/actions/manual-events"
import Link from "next/link"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { ManualEventCreator } from "./manual-event-creator"
import { ComprehensiveManualEventFlow } from "./comprehensive-manual-event-flow"

export function ManualEventsList() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null)
  const [useComprehensiveFlow, setUseComprehensiveFlow] = useState(true) // Default to new flow

  const loadEvents = async () => {
    setLoading(true)
    const result = await getManualEvents()
    if (result.success) {
      setEvents(result.events || [])
    } else {
      toast.error(result.error || 'Failed to load events')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadEvents()
  }, [])

  const handleEdit = (eventId: string) => {
    setEditingEventId(eventId)
  }

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return
    }

    setDeletingEventId(eventId)
    const result = await deleteManualEvent(eventId)
    
    if (result.success) {
      toast.success('Event deleted successfully')
      loadEvents() // Refresh the list
    } else {
      toast.error(result.error || 'Failed to delete event')
    }
    setDeletingEventId(null)
  }

  const handleEditComplete = () => {
    setEditingEventId(null)
    loadEvents() // Refresh the list
  }

  if (editingEventId) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Edit Manual Event</h3>
          <Button variant="outline" onClick={() => setEditingEventId(null)}>
            Back to List
          </Button>
        </div>
        {useComprehensiveFlow ? (
          <ComprehensiveManualEventFlow 
            eventId={editingEventId} 
            onComplete={handleEditComplete}
          />
        ) : (
          <ManualEventCreator 
            eventId={editingEventId} 
            onComplete={handleEditComplete}
          />
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">Loading events...</p>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">No manual events created yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {events.map((event: any) => (
        <Card key={event.id} className="border-border/40">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base font-semibold">{event.title}</CardTitle>
                <CardDescription className="text-sm">
                  {event.description.length > 100 
                    ? `${event.description.substring(0, 100)}...` 
                    : event.description
                  }
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={event.manual_status === 'finalized' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {event.manual_status || 'draft'}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {event.mode}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{new Date(event.start_date).toLocaleDateString()}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>
                  {(() => {
                    // Count participants based on event type and data structure
                    if (event.type === 'team') {
                      // For team events, count teams from event_registrations
                      const teamCount = event.event_registrations?.filter((reg: any) => reg.registration_type === 'team').length || 0
                      return `${teamCount} teams`
                    } else {
                      // For individual events, count from event_registrations first, then event_participants as fallback
                      const individualFromRegistrations = event.event_registrations?.filter((reg: any) => reg.registration_type === 'individual').length || 0
                      const individualFromParticipants = event.event_participants?.length || 0
                      
                      // Use the higher count (in case both exist) or fallback to 0
                      const totalIndividuals = Math.max(individualFromRegistrations, individualFromParticipants)
                      return `${totalIndividuals} participants`
                    }
                  })()}
                </span>
              </div>

              {event.venue && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">{event.venue}</span>
                </div>
              )}

              {event.duration && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{event.duration} minutes</span>
                </div>
              )}
            </div>

            {event.workshop_hosts && event.workshop_hosts.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/40">
                <p className="text-xs text-muted-foreground mb-2">Hosts:</p>
                <div className="flex flex-wrap gap-2">
                  {event.workshop_hosts.map((host: any, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {host.name}
                      {host.designation && ` (${host.designation})`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {event.category}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {event.type}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Created {new Date(event.created_at).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {event.manual_status === 'draft' && (
                  <>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEdit(event.id)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDelete(event.id)}
                      disabled={deletingEventId === event.id}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {deletingEventId === event.id ? 'Deleting...' : 'Delete'}
                    </Button>
                  </>
                )}
                
                {event.manual_status === 'finalized' && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/core/events/${event.id}/result`}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Event
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}