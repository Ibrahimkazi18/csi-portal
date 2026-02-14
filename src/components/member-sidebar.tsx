"use client"

import { User, Calendar, BookOpen, LogOut, Megaphone, Trophy, X, GraduationCap, Home, Bell, Users } from 'lucide-react'
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { toast } from "sonner"
import { getDashboardData, logOut } from "./actions"
import { useCallback, useEffect, useState } from "react"
import { ThemeToggle } from "./ui/theme-toggler"
import { cn } from "@/lib/utils"

const sidebarItems = [
  {
    title: "Dashboard",
    icon: Home,
    path: "/member/dashboard",
  },
  {
    title: "My Profile",
    icon: User,
    path: "/member/profile",
  },
  {
    title: "Events",
    icon: Calendar,
    path: "/member/events",
  },
  {
    title: "Workshops",
    icon: GraduationCap,
    path: "/member/workshops",
  },
  {
    title: "Tournament",
    icon: Trophy,
    path: "/member/tournament",
  },
  {
    title: "CSI Guide",
    icon: BookOpen,
    path: "/member/guide",
  },
  {
    title: "Announcements",
    icon: Megaphone,
    path: "/member/announcements",
    hasNotification: true,
  },
  {
    title: "Notifications",
    icon: Bell,
    path: "/member/notifications",
    hasNotification: true,
  },
  {
    title: "My Teams",
    icon: Users,
    path: "/member/teams",
  },
]

interface MemberSidebarProps {
  onClose?: () => void
}

export default function MemberSidebar({ onClose }: MemberSidebarProps) {
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [unseenCount, setUnseenCount] = useState(0)

  const fetchData = useCallback(async () => {
    try {
      setLoadingData(true)
      const response = await getDashboardData()
      
      if (response.success) {
        setUser(response.user)
        setUnseenCount(response.unseenCount || 0)
      } else {
        console.error('Failed to fetch dashboard data:', response.error)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoadingData(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleLogout = async () => {
    setLoading(true)
    try {
      await logOut()
    } catch (error) {
      toast.error("Failed to logout")
      setLoading(false)
    }
  }

  const handleLinkClick = () => {
    onClose?.()
  }

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r border-border">
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-linear-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-sm">
            <span className="text-sm font-semibold text-white">CSI</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">Member Portal</span>
            <span className="text-xs text-muted-foreground">Dashboard</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0 lg:hidden"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <div className="space-y-2">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.path
            const showNotification = item.hasNotification && unseenCount > 0
            
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={handleLinkClick}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="truncate">{item.title}</span>
                {showNotification && (
                  <span className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                    {unseenCount > 9 ? '9+' : unseenCount}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 rounded-full bg-linear-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white text-sm font-medium">
            {loadingData ? '...' : user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {loadingData ? 'Loading...' : user?.full_name || 'User'}
            </p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        
        <ThemeToggle className='mb-3' />
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          disabled={loading}
          className="w-full h-9"
        >
          {loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <>
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </>
          )}
        </Button>
      </div>
    </div>
  )
}