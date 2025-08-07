"use client"

import { Users, Calendar, Trophy, BarChart3, MessageSquare, BookOpen, Shield, Computer, LogOut, Megaphone, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { getLastSeenAnnoucementAll, getLastSeenAnnoucementCore, getProfileUser, logOut } from "./actions"
import { toast } from "sonner"
import { ThemeToggle } from "./ui/theme-toggler"

const sidebarItems = [
  {
    title: "Members",
    icon: Users,
    path: "/core/members",
  },
  {
    title: "Events",
    icon: Calendar,
    path: "/core/events",
  },
  {
    title: "Tournament",
    icon: Trophy,
    path: "/core/tournament",
  },
  {
    title: "Announcements",
    icon: Megaphone,
    path: "/core/announcements",
    hasNotification: true,
  },
  {
    title: "Guide",
    icon: BookOpen,
    path: "/core/guide",
  },
  {
    title: "Roles",
    icon: Shield,
    path: "/core/roles",
  },
]

interface CoreTeamSidebarProps {
  onClose?: () => void
}

export default function CoreTeamSidebar({ onClose }: CoreTeamSidebarProps) {
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [unseenCount, setUnseenCount] = useState(0)

  const fetchUserProfile = useCallback(async () => {
    setLoadingData(true)
    try {
      console.log("Fetching user profile and unseen announcements...")
      const [resposne, allResponse, coreResponse] = await Promise.all([
        getProfileUser(),
        getLastSeenAnnoucementAll(),
        getLastSeenAnnoucementCore(),
      ])
      if (resposne.error) {
        throw new Error(resposne.error)
      } else if (resposne.success) {
        setUser(resposne.user)
      }
      if (allResponse.error) {
        throw new Error(allResponse.error)
      } else if (allResponse.unseenCount) {
        setUnseenCount(allResponse.unseenCount)
        console.log("All unseen count:", allResponse.unseenCount)
      }
      if (coreResponse.error) {
        throw new Error(coreResponse.error)
      } else if (coreResponse.unseenCount) {
        setUnseenCount((prev) => prev + coreResponse.unseenCount)
        console.log("Core unseen count:", coreResponse.unseenCount)
      }
      if (coreResponse.unseenCount === 0 && allResponse.unseenCount === 0) {
        setUnseenCount(0)
      }
    } catch (error) {
      console.error("Failed to fetch members:", error)
      toast.error("Error", {
        description: "Failed to load members. Please try again.",
      })
    } finally {
      setLoadingData(false)
    }
  }, [])

  useEffect(() => {
    fetchUserProfile()
  }, [fetchUserProfile])

  const handleLogOut = async () => {
    try {
      setLoading(true)
      const response = await logOut()
      if (!response.success) {
        throw new Error(response.error || "logout Failed")
      }
      toast.success("Logged out successfully", {
        description: "Hope to see you again soon!",
      })
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLinkClick = () => {
    fetchUserProfile()
    // Close sidebar on mobile when a link is clicked
    if (onClose) {
      onClose()
    }
  }

  return (
    <div className="h-screen bg-dark-surface w-64 border-r border-border flex flex-col">
      {/* Mobile close button */}
      {onClose && (
        <div className="flex justify-end p-4 lg:hidden">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
            <span className="sr-only">Close sidebar</span>
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="p-6 border-b border-border">  
        <div className="flex items-center gap-3">
          <Computer className="h-8 w-8 text-neon-blue glow-blue" />
          <div>
            <h2 className="text-lg font-bold text-neon">CSI Core Team</h2>
            <p className="text-sm text-muted-foreground">Admin Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {sidebarItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.includes(item.path)
          const showNotification = item.hasNotification && unseenCount > 0

          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 relative ${
                isActive
                  ? "bg-primary text-primary-foreground glow-blue"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="flex-1">{item.title}</span>
              {showNotification && (
                <div className="relative">
                  <div className="absolute -top-[10px] -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                    <span className="text-xs font-bold text-white">{unseenCount > 99 ? "99+" : unseenCount}</span>
                  </div>
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-border space-y-3">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
            <span className="text-sm font-medium text-secondary-foreground">
              {user?.full_name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.full_name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <ThemeToggle />
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogOut}
          disabled={loading}
          className="w-full justify-center bg-transparent"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {loading ? "Signing Out..." : "Sign Out"}
        </Button>
      </div>
    </div>
  )
}
