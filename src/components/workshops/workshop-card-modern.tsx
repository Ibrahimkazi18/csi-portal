"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Users, CheckCircle, Clock, MapPin, AlertCircle } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { toast } from "sonner"
import { registerForWorkshop } from "@/app/(dashboard)/member/workshops/actions"

interface WorkshopCardModernProps {
  workshop: any
  isRegistered?: boolean
  onRegister?: () => void
  compact?: boolean
}

export function WorkshopCardModern({ 
  workshop, 
  isRegistered = false,
  onRegister,
  compact = false 
}: WorkshopCardModernProps) {
  const [registering, setRegistering] = useState(false)

  const spotsLeft = workshop.max_participants - (workshop.registration_count || 0)
  const isFull = spotsLeft <= 0
  const isPastDeadline = new Date(workshop.registration_deadline) < new Date()
  const canRegister = !isFull && !isPastDeadline && !workshop.is_registered && !isRegistered

  const handleRegister = async () => {
    setRegistering(true)
    const response = await registerForWorkshop(workshop.id)
    
    if (response.success) {
      toast.success("Registration successful!")
      onRegister?.()
    } else {
      toast.error(response.error || "Failed to register")
    }
    
    setRegistering(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "ongoing":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "completed":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  if (compact) {
    return (
      <div className="rounded-xl border bg-card p-4 shadow-sm bg-radial-gradient hover:shadow-md transition-all">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-lg mb-1">{workshop.title}</h3>
            <div className="flex items-center gap-2">
              {workshop.status && (
                <Badge variant="outline" className={`text-xs ${getStatusColor(workshop.status)}`}>
                  {workshop.status}
                </Badge>
              )}
              {(workshop.is_registered || isRegistered) && (
                <Badge variant="default" className="bg-green-500 text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Registered
                </Badge>
              )}
              {workshop.attended && (
                <Badge variant="default" className="bg-blue-500 text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Attended
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{new Date(workshop.start_date).toLocaleDateString()}</span>
          </div>
          
          <Link href={`/member/workshops/${workshop.id}`}>
            <Button variant="outline" size="sm">
              View Details
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
        "bg-card hover:shadow-md"
      )}
    >
      {/* Banner Image */}
      {workshop.banner_url && (
        <div className="mb-4 -mx-6 -mt-6">
          <img
            src={workshop.banner_url}
            alt={workshop.title}
            className="w-full h-40 object-cover rounded-t-xl"
          />
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-foreground mb-2">{workshop.title}</h3>
          <div className="flex items-center gap-2 flex-wrap">
            {workshop.status && (
              <Badge variant="outline" className={`text-xs ${getStatusColor(workshop.status)}`}>
                {workshop.status}
              </Badge>
            )}
            {(workshop.is_registered || isRegistered) && (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Registered
              </Badge>
            )}
            {workshop.attended && (
              <Badge variant="default" className="bg-blue-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Attended
              </Badge>
            )}
            {isFull && !workshop.is_registered && !isRegistered && (
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                Full
              </Badge>
            )}
          </div>
        </div>
      </div>

      <p className="text-foreground leading-relaxed mb-4 flex-grow line-clamp-3">
        {workshop.description}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <span className="text-muted-foreground">Date: </span>
            <span className="font-medium">
              {new Date(workshop.start_date).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <div>
            <span className="text-muted-foreground">Time: </span>
            <span className="font-medium">
              {new Date(workshop.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <div>
            <span className="text-muted-foreground">Participants: </span>
            <span className="font-medium">
              {workshop.registration_count || 0} / {workshop.max_participants}
            </span>
          </div>
        </div>

        {workshop.location && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium truncate">{workshop.location}</span>
          </div>
        )}
      </div>

      {/* Spots Warning */}
      {spotsLeft > 0 && spotsLeft <= 10 && !workshop.is_registered && !isRegistered && (
        <div className="mb-4 p-2 rounded-lg bg-orange-500/10 border border-orange-500/30">
          <p className="text-orange-500 text-xs text-center">
            <AlertCircle className="h-3 w-3 inline mr-1" />
            Only {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left!
          </p>
        </div>
      )}

      {/* Progress Bar */}
      <div className="w-full bg-muted rounded-full h-2 mb-4">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${((workshop.registration_count || 0) / workshop.max_participants) * 100}%` }}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-auto pt-4 border-t border-dashed">
        <Link href={`/member/workshops/${workshop.id}`} className="flex-1">
          <Button variant="outline" className="w-full">
            View Details
          </Button>
        </Link>
        {canRegister && (
          <Button
            onClick={handleRegister}
            disabled={registering}
            className="flex-1"
          >
            {registering ? "Registering..." : "Register"}
          </Button>
        )}
      </div>

      {/* Registration Info for My Workshops */}
      {(workshop.is_registered || isRegistered) && workshop.registered_at && (
        <div className="mt-4 pt-4 border-t border-dashed">
          <p className="text-xs text-muted-foreground">
            Registered on {new Date(workshop.registered_at).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  )
}
