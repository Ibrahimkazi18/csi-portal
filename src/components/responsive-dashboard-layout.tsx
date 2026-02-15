"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu } from 'lucide-react'
import CoreTeamSidebar from "@/components/core-team-sidebar"
import MemberSidebar from "@/components/member-sidebar"
import { cn } from "@/lib/utils"

interface ResponsiveDashboardLayoutProps {
  children: React.ReactNode
  role: string
}

export default function ResponsiveDashboardLayout({ children, role }: ResponsiveDashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const SidebarComponent = role === "core" ? CoreTeamSidebar : MemberSidebar

  return (
    <div className="flex h-screen bg-background scrollbar-hide">
      {/* Mobile sidebar overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/80 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar - Desktop: always visible, Mobile: slide in/out */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col">
        <SidebarComponent />
      </div>

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-out lg:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarComponent onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 lg:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="h-9 w-9 p-0"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open sidebar</span>
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
              <span className="text-xs font-semibold text-white">CSI</span>
            </div>
            <h1 className="text-sm font-semibold">Dashboard</h1>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-auto">
          <div className="container max-w-7xl mx-auto p-6">{children}</div>
        </div>
      </main>
    </div>
  )
}
