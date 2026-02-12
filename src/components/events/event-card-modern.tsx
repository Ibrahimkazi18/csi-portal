"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Users, User, Trophy, Clock, MapPin, UserPlus, Eye } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface EventCardModernProps {
  event: any
  showRegisterButton?: boolean
  compact?: boolean
}

export function EventCardModern({ event, showRegisterButton = false, compact = false }: EventCardModernProps) {
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
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "registration_open":
        return UserPlus
      case "upcoming":
        return Clock
      case "ongoing":
        return MapPin
      case "completed":
        return Trophy
      default:
        return Clock
    }
  }

  const isRegistrationDeadlinePassed = (deadline: string) => {
    return new Date(deadline) < new Date()
  }

  const StatusIcon = getStatusIcon(event.status)
  const deadlinePassed = isRegistrationDeadlinePassed(event.registration_deadline)

  if (compact) {
    return (
      <div className="rounded-xl border bg-card p-4 shadow-sm bg-radial-gradient hover:shadow-md transition-all">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-lg">{event.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={`text-xs ${getStatusColor(event.status)}`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {event.status.replace("_", " ")}
              </Badge>
              {event.is_tournament && (
                <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                  <Trophy className="h-3 w-3 mr-1" />
                  Tournament
                </Badge>
              )}
            </div>
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
          
          <Link href={`/member/events/${event.id}`}>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "rounded-xl border p-6 shadow-sm transition-all bg-radial-gradient h-full flex flex-col",
        event.is_tournament ? "border-yellow-500/30 bg-yellow-500/5" : "bg-card"
      )}
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
          {showRegisterButton && deadlinePassed && (
            <Badge variant="destructive" className="text-xs">
              Registration Closed
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          {event.type === "team" ? <Users className="h-4 w-4" /> : <User className="h-4 w-4" />}
          <span className="text-sm capitalize">{event.type}</span>
          {event.type === "team" && <span className="text-sm">({event.team_size} members)</span>}
        </div>
      </div>

      <p className="text-foreground leading-relaxed mb-4 flex-grow">{event.description}</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <span className="text-muted-foreground">
              {showRegisterButton ? "Registration Deadline: " : "Event Date: "}
            </span>
            <span className={`font-medium ${deadlinePassed && showRegisterButton ? "text-red-400" : ""}`}>
              {new Date(showRegisterButton ? event.registration_deadline : event.start_date).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <div>
            <span className="text-muted-foreground">
              {event.status === "completed" ? "Completed: " : "Start Date: "}
            </span>
            <span className="font-medium">
              {new Date(event.status === "completed" ? event.end_date : event.start_date).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div>
          <span className="text-muted-foreground">Max Participants: </span>
          <span className="font-medium">{event.max_participants}</span>
        </div>
      </div>

      {/* Event Banner */}
      {event.banner_url && (
        <div className="mb-4">
          <img
            src={event.banner_url || "/placeholder.svg"}
            alt={event.title}
            className="w-full h-32 object-cover rounded-lg"
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center mt-auto pt-4 border-t border-dashed">
        <div className="text-sm text-muted-foreground">
          {event.category && (
            <span className="inline-flex items-center gap-1">
              Category: <Badge variant="secondary">{event.category}</Badge>
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {event.status === "registration_open" && (
            <Link href={`/member/events/${event.id}`}>
              <Button variant="default" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </Link>
          )}

          {event.status === "upcoming" && (
            <Link href={`/member/events/${event.id}`}>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </Link>
          )}

          {event.status === "ongoing" && (
            <Link href={`/member/events/${event.id}/live`}>
              <Button variant="default" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Live
              </Button>
            </Link>
          )}

          {event.status === "completed" && (
            <Link href={`/member/events/${event.id}/result`}>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View Results
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
