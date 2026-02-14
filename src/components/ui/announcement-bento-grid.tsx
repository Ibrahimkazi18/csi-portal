"use client"

import { cn } from "@/lib/utils"
import { Calendar, Users, Shield, Edit, Trash2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EditAnnouncementModal } from "@/app/(dashboard)/core/announcements/components/edit-announcement-modal"

export interface AnnouncementBentoItem {
  id: string
  title: string
  content: string
  target_audience: string
  is_important: boolean
  created_at: string
  colSpan?: number
  hasPersistentHover?: boolean
}

interface AnnouncementBentoGridProps {
  items: AnnouncementBentoItem[]
  onDelete?: (item: AnnouncementBentoItem) => void
  onSuccess?: () => void
  showActions?: boolean
}

const getAudienceIcon = (audience: string) => {
  switch (audience) {
    case "all":
      return Users
    case "core-team":
      return Shield
    case "members":
      return Users
    default:
      return Users
  }
}

const getAudienceColor = (audience: string) => {
  switch (audience) {
    case "all":
      return "text-blue-500"
    case "core-team":
      return "text-purple-500"
    case "members":
      return "text-green-500"
    default:
      return "text-gray-500"
  }
}

function AnnouncementBentoGrid({ 
  items, 
  onDelete,
  onSuccess,
  showActions = false 
}: AnnouncementBentoGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-7xl mx-auto">
      {items.map((item, index) => {
        const AudienceIcon = getAudienceIcon(item.target_audience)
        const audienceColor = getAudienceColor(item.target_audience)
        
        return (
          <div
            key={item.id}
            className={cn(
              "group relative p-4 rounded-xl overflow-hidden transition-all duration-300",
              "border bg-card",
              item.is_important 
                ? "border-red-500/30 bg-red-500/5" 
                : "border-border/80",
              "hover:shadow-lg hover:-translate-y-0.5 will-change-transform",
              item.colSpan || "col-span-1",
              item.colSpan === 2 ? "md:col-span-2" : "",
              {
                "shadow-lg -translate-y-0.5": item.hasPersistentHover,
              }
            )}
          >
            {/* Dot pattern background */}
            <div
              className={`absolute inset-0 ${
                item.hasPersistentHover
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100"
              } transition-opacity duration-300`}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[4px_4px]" />
            </div>

            {/* Action buttons */}
            {showActions && (onSuccess || onDelete) && (
              <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                {onSuccess && (
                  <EditAnnouncementModal announcement={item} onSuccess={onSuccess}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </EditAnnouncementModal>
                )}
                {onDelete && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDelete(item)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}

            <div className="relative flex flex-col space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300",
                  item.is_important 
                    ? "bg-red-500/20" 
                    : "bg-black/5 dark:bg-white/10"
                )}>
                  <AudienceIcon className={cn("w-4 h-4", audienceColor)} />
                </div>
                <div className="flex items-center gap-2">
                  {item.is_important && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Important
                    </Badge>
                  )}
                  <span
                    className={cn(
                      "text-xs font-medium px-2 py-1 rounded-lg backdrop-blur-sm",
                      "bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300",
                      "transition-colors duration-300 group-hover:bg-black/10 dark:group-hover:bg-white/20"
                    )}
                  >
                    {item.target_audience.replace("-", " ")}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 tracking-tight text-[15px]">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-snug font-[425] line-clamp-3">
                  {item.content}
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Calendar className="h-3 w-3" />
                  {new Date(item.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
              </div>
            </div>

            {/* Gradient border */}
            <div
              className={`absolute inset-0 -z-10 rounded-xl p-px bg-linear-to-br from-transparent via-gray-100/50 to-transparent dark:via-white/10 ${
                item.hasPersistentHover
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100"
              } transition-opacity duration-300`}
            />
          </div>
        )
      })}
    </div>
  )
}

export { AnnouncementBentoGrid }
