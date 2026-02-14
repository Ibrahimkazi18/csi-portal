"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Users, MapPin, Clock, Edit, Trash2, Trophy, User, AlertCircle } from "lucide-react"
import { getManualEvents, deleteManualEvent } from "@/app/actions/manual-events"
import Link from "next/link"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { SimpleManualEventForm } from "./simple-manual-event-form"
import { cn } from "@/lib/utils"

function ManualEventCard({ event, onEdit, onDelete, deletingEventId }: any) {
  const [isHovered, setIsHovered] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "finalized":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "draft":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const participantCount = (() => {
    if (event.type === 'team') {
      return event.event_registrations?.filter((reg: any) => reg.registration_type === 'team').length || 0
    } else {
      const individualFromRegistrations = event.event_registrations?.filter((reg: any) => reg.registration_type === 'individual').length || 0
      const individualFromParticipants = event.event_participants?.length || 0
      return Math.max(individualFromRegistrations, individualFromParticipants)
    }
  })()

  return (
    <div 
      className="rounded-xl border bg-card shadow-sm transition-all duration-300 overflow-hidden group hover:shadow-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.03)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg line-clamp-1">{event.title}</h3>
              {event.is_tournament && (
                <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                  <Trophy className="h-3 w-3 mr-1" />
                  Tournament
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
          </div>
        </div>

        {/* Status and Type Badges */}
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="outline" className={cn("text-xs", getStatusColor(event.manual_status || 'draft'))}>
            {event.manual_status === 'finalized' ? 'Finalized' : 'Draft'}
          </Badge>
          <Badge variant="outline" className="text-xs capitalize">
            {event.mode}
          </Badge>
          <Badge variant="outline" className="text-xs capitalize">
            {event.category}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {event.type === "team" ? <Users className="h-3 w-3" /> : <User className="h-3 w-3" />}
            <span className="capitalize">{event.type}</span>
          </div>
        </div>

        {/* Event Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{new Date(event.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {event.type === 'team' ? <Users className="h-4 w-4" /> : <User className="h-4 w-4" />}
            <span>{participantCount} {event.type === 'team' ? 'teams' : 'participants'}</span>
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
              <span>{event.duration} min</span>
            </div>
          )}
        </div>

        {/* Hosts */}
        {event.workshop_hosts && event.workshop_hosts.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-xs font-medium text-muted-foreground mb-2">Hosts:</p>
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

        {/* Actions */}
        <div className={cn(
          "flex items-center justify-between pt-4 border-t border-border/50 transition-opacity duration-200",
          isHovered ? "opacity-100" : "opacity-70"
        )}>
          <span className="text-xs text-muted-foreground">
            Created {new Date(event.created_at).toLocaleDateString()}
          </span>
          
          <div className="flex items-center gap-2">
            {event.manual_status === 'draft' && (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onEdit(event.id)}
                  className="h-8"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onDelete(event.id)}
                  disabled={deletingEventId === event.id}
                  className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  {deletingEventId === event.id ? 'Deleting...' : 'Delete'}
                </Button>
              </>
            )}
            
            {event.manual_status === 'finalized' && (
              <Button variant="default" size="sm" asChild className="h-8">
                <Link href={`/core/events/${event.id}/result`}>
                  View Results
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ManualEventsList() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null)

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
      loadEvents()
    } else {
      toast.error(result.error || 'Failed to delete event')
    }
    setDeletingEventId(null)
  }

  const handleEditComplete = () => {
    setEditingEventId(null)
    loadEvents()
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
        <SimpleManualEventForm 
          eventId={editingEventId} 
          onComplete={handleEditComplete}
        />
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
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <p className="text-sm text-muted-foreground">No manual events created yet</p>
        <p className="text-xs text-muted-foreground mt-1">Create your first manual event above</p>
      </div>
    )
  }

  // Separate events by status
  const finalizedEvents = events.filter(e => e.manual_status === 'finalized')
  const draftEvents = events.filter(e => e.manual_status !== 'finalized')

  return (
    <div className="space-y-6">
      {/* Finalized Events */}
      {finalizedEvents.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Finalized Events ({finalizedEvents.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {finalizedEvents.map((event) => (
              <ManualEventCard
                key={event.id}
                event={event}
                onEdit={handleEdit}
                onDelete={handleDelete}
                deletingEventId={deletingEventId}
              />
            ))}
          </div>
        </div>
      )}

      {/* Draft Events */}
      {draftEvents.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Draft Events ({draftEvents.length})
          </h3>
          <div className="space-y-4">
            {draftEvents.map((event) => (
              <ManualEventCard
                key={event.id}
                event={event}
                onEdit={handleEdit}
                onDelete={handleDelete}
                deletingEventId={deletingEventId}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}