import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, Trophy, Megaphone } from "lucide-react"

interface ActivityItem {
  id: string
  type: 'event' | 'member' | 'tournament' | 'announcement'
  title: string
  description: string
  timestamp: string
  status?: string
}

interface RecentActivityProps {
  role: 'core' | 'member'
}

export function RecentActivity({ role }: RecentActivityProps) {
  // Mock data - replace with real data from your API
  const coreActivities: ActivityItem[] = [
    {
      id: '1',
      type: 'member',
      title: 'New Member Joined',
      description: 'John Doe registered as a Developer',
      timestamp: '2 hours ago',
      status: 'new'
    },
    {
      id: '2',
      type: 'event',
      title: 'Hackathon 2024',
      description: '15 new registrations today',
      timestamp: '4 hours ago',
      status: 'active'
    },
    {
      id: '3',
      type: 'announcement',
      title: 'Weekly Update Posted',
      description: 'Announcement sent to all members',
      timestamp: '1 day ago',
      status: 'sent'
    }
  ]

  const memberActivities: ActivityItem[] = [
    {
      id: '1',
      type: 'event',
      title: 'Registered for Hackathon',
      description: 'Successfully registered for Hackathon 2024',
      timestamp: '1 hour ago',
      status: 'registered'
    },
    {
      id: '2',
      type: 'tournament',
      title: 'Tournament Update',
      description: 'Your team moved up to 3rd place',
      timestamp: '3 hours ago',
      status: 'updated'
    },
    {
      id: '3',
      type: 'announcement',
      title: 'New Announcement',
      description: 'Weekly update from the core team',
      timestamp: '1 day ago',
      status: 'unread'
    }
  ]

  const activities = role === 'core' ? coreActivities : memberActivities

  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'event': return Calendar
      case 'member': return Users
      case 'tournament': return Trophy
      case 'announcement': return Megaphone
      default: return Calendar
    }
  }

  const getStatusVariant = (status?: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'new': return 'default'
      case 'active': return 'default'
      case 'registered': return 'secondary'
      case 'unread': return 'destructive'
      default: return 'outline'
    }
  }

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {role === 'core' 
            ? "Latest updates from your organization" 
            : "Your recent activities and updates"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = getIcon(activity.type)
            return (
              <div key={activity.id} className="flex items-start gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-medium text-foreground line-clamp-1">
                      {activity.title}
                    </h4>
                    {activity.status && (
                      <Badge variant={getStatusVariant(activity.status)} className="text-xs shrink-0">
                        {activity.status}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 break-words">
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activity.timestamp}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}