"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Users, Edit, Trash2, Eye, MapPin } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface WorkshopCardCoreProps {
  workshop: any
  mode?: "full" | "compact"
  onEdit?: () => void
  onDelete?: () => void
}

export function WorkshopCardCore({ workshop, mode = "full", onEdit, onDelete }: WorkshopCardCoreProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "secondary"
      case "ongoing": return "default"
      case "registration_open": return "default"
      case "upcoming": return "outline"
      default: return "outline"
    }
  }

  const registrationPercentage = workshop.max_participants > 0
    ? (workshop.registration_count / workshop.max_participants) * 100
    : 0

  if (mode === "compact") {
    return (
      <div className="group relative p-4 rounded-lg border bg-card hover:shadow-md transition-all">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold truncate">{workshop.title}</h3>
              <Badge variant={getStatusColor(workshop.status)} className="shrink-0">
                {workshop.status}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(workshop.start_date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{workshop.registration_count || 0}/{workshop.max_participants}</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Link href={`/core/workshops/${workshop.id}`}>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
            {workshop.status !== "completed" && onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button variant="destructive" size="sm" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="group relative rounded-xl border bg-card overflow-hidden hover:shadow-lg transition-all">
      {/* Banner Image */}
      {workshop.banner_url && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={workshop.banner_url}
            alt={workshop.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
          <div className="absolute top-3 right-3 flex gap-2">
            <Badge variant={getStatusColor(workshop.status)} className="shadow-lg">
              {workshop.status}
            </Badge>
            {workshop.source === "manual" && (
              <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
                Manual
              </Badge>
            )}
          </div>
        </div>
      )}

      <div className="p-6 space-y-4">
        {/* Title */}
        <div>
          <h3 className="text-xl font-bold mb-2 line-clamp-2">{workshop.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {workshop.description}
          </p>
        </div>

        {/* Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              {new Date(workshop.start_date).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>
          
          {workshop.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{workshop.location}</span>
            </div>
          )}

          {/* Registration Progress */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>
                  {workshop.registration_count || 0} / {workshop.max_participants} registered
                </span>
              </div>
              <span className="text-muted-foreground">
                {Math.round(registrationPercentage)}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-300",
                  registrationPercentage >= 90 ? "bg-red-500" :
                  registrationPercentage >= 70 ? "bg-yellow-500" :
                  "bg-primary"
                )}
                style={{ width: `${Math.min(registrationPercentage, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Link href={`/core/workshops/${workshop.id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </Link>
          {workshop.status !== "completed" && onEdit && (
            <Button variant="outline" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button variant="destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
