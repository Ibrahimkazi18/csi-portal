import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users, Trophy, Megaphone, ArrowRight } from "lucide-react"
import Link from "next/link"

interface QuickAction {
  title: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

interface QuickActionsProps {
  role: 'core' | 'member'
}

export function QuickActions({ role }: QuickActionsProps) {
  const coreActions: QuickAction[] = [
    {
      title: "Create Event",
      description: "Add a new event for members to join",
      href: "/core/events/create",
      icon: Calendar
    },
    {
      title: "Manage Members",
      description: "View and manage member profiles",
      href: "/core/members",
      icon: Users
    },
    {
      title: "Post Announcement",
      description: "Share updates with the community",
      href: "/core/announcements/create",
      icon: Megaphone
    },
    {
      title: "Tournament Setup",
      description: "Create or manage tournaments",
      href: "/core/tournament",
      icon: Trophy
    }
  ]

  const memberActions: QuickAction[] = [
    {
      title: "Browse Events",
      description: "Find and register for upcoming events",
      href: "/member/events",
      icon: Calendar
    },
    {
      title: "View Profile",
      description: "Update your profile information",
      href: "/member/profile",
      icon: Users
    },
    {
      title: "Check Tournament",
      description: "See tournament standings and results",
      href: "/member/tournament",
      icon: Trophy
    },
    {
      title: "Read Announcements",
      description: "Stay updated with latest news",
      href: "/member/announcements",
      icon: Megaphone
    }
  ]

  const actions = role === 'core' ? coreActions : memberActions

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {role === 'core' 
            ? "Manage your organization efficiently" 
            : "Get started with these common tasks"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group block"
            >
              <div className="flex items-center gap-4 p-4 rounded-lg border border-border/40 bg-card/50 hover:bg-accent/50 hover:border-border transition-all duration-200">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                  <action.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-foreground group-hover:text-foreground transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 break-words">
                    {action.description}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}