"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Users, User, Trophy, Clock, MapPin, Edit, Trash2, Settings, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { EditEventModal } from "@/app/(dashboard)/core/events/components/edit-event-modal"

interface EventCardCoreProps {
  event: any
  registeredTeams?: any[]
  isManagementMode?: boolean
  onDelete?: (event: any) => void
  onManageRounds?: (event: any) => void
  onViewRegistrations?: (eventId: string) => void
  onViewLive?: (eventId: string) => void
  onViewResults?: (eventId: string) => void
  onSuccess?: () => void
  compact?: boolean
}

export function EventCardCore({ 
  event, 
  registeredTeams = [],
  isManagementMode = false,
  onDelete,
  onManageRounds,
  onViewRegistrations,
  onViewLive,
  onViewResults,
  onSuccess,
  compact = false
}: EventCardCoreProps) {
  const [isHovered, setIsHovered] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "registration_open":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "upcoming":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
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
      case "registration_open":
        return Users
      case "upcoming":
        return Clock
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

  const StatusIcon = getStatusIcon(event.status)
  const progressPercentage = registeredTeams.length 
    ? (registeredTeams.length / (event.max_participants / event.team_size)) * 100 
    : 0

  if (compact) {
    return (
      <div 
        className="rounded-xl border bg-card p-4 shadow-sm bg-radial-gradient hover:shadow-md transition-all group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg">{event.title}</h3>
              {event.is_tournament && (
                <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                  <Trophy className="h-3 w-3 mr-1" />
                  Tournament
                </Badge>
              )}
            </div>
            <Badge variant="outline" className={`text-xs ${getStatusColor(event.status)}`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {event.status.replace("_", " ")}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            {event.type === "team" ? <Users className="h-4 w-4" /> : <User className="h-4 w-4" />}
            <span className="text-sm capitalize">{event.type}</span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{event.description}</p>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{new Date(event.start_date).toLocaleDateString()}</span>
          </div>
          
          {isManagementMode && (
            <div className={cn(
              "flex items-center gap-2 transition-opacity",
              isHovered ? "opacity-100" : "opacity-0"
            )}>
              <EditEventModal event={event} onSuccess={onSuccess || (() => {})}>
                <Button size="sm" variant="outline" className="h-7 w-7 p-0">
                  <Edit className="h-3 w-3" />
                </Button>
              </EditEventModal>
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={() => onDelete?.(event)} 
                className="h-7 w-7 p-0"
                disabled={event.status === "ongoing"}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "rounded-xl border p-6 shadow-sm transition-all bg-radial-gradient h-full flex flex-col",
        event.is_tournament ? "border-yellow-500/30 bg-yellow-500/5" : "bg-card",
        "group"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-wrap">
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
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            {event.type === "team" ? <Users className="h-4 w-4" /> : <User className="h-4 w-4" />}
            <span className="text-sm capitalize">{event.type}</span>
            {event.type === "team" && <span className="text-sm">({event.team_size} members)</span>}
          </div>
          
          {/* Inline Edit/Delete Buttons - Always visible in management mode */}
          {isManagementMode && (
            <div className={cn(
              "flex items-center gap-2 ml-4 transition-opacity",
              isHovered ? "opacity-100" : "opacity-50"
            )}>
              <EditEventModal event={event} onSuccess={onSuccess || (() => {})}>
                <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                  <Edit className="h-4 w-4" />
                </Button>
              </EditEventModal>
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={() => onDelete?.(event)} 
                className="h-8 w-8 p-0"
                disabled={event.status === "ongoing"}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <p className="text-foreground leading-relaxed mb-4 grow">{event.description}</p>

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
            {registeredTeams.length || 0}/{event.max_participants / event.team_size}
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
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap mt-auto pt-4 border-t border-dashed">
        {isManagementMode ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onManageRounds?.(event)}
            className="text-xs"
          >
            <Settings className="h-3 w-3 mr-1" />
            Manage Rounds
          </Button>
        ) : (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onManageRounds?.(event)}
              className="text-xs"
            >
              <Settings className="h-3 w-3 mr-1" />
              Manage Rounds
            </Button>
            {event.status !== "upcoming" && (
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs"
                onClick={() => onViewRegistrations?.(event.id)}
              >
                View Registrations
              </Button>
            )}
            {event.status === "ongoing" && (
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs"
                onClick={() => onViewLive?.(event.id)}
              >
                Live Event
              </Button>
            )}
            {event.status === "completed" && (
              <>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs"
                  onClick={() => onViewLive?.(event.id)}
                >
                  Live Event
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs"
                  onClick={() => onViewResults?.(event.id)}
                >
                  Event Results
                </Button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
