"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, GraduationCap, RefreshCcw, X, Calendar, Users, CheckCircle } from "lucide-react"
import { getWorkshops } from "./actions"
import { CreateWorkshopModal } from "@/components/workshops/create-workshop-modal"
import { toast } from "sonner"
import { MorphingCardStack } from "@/components/ui/morphing-card-stack"
import { WorkshopCardCore } from "@/components/workshops/workshop-card-core"
import { CtaCard, CtaCardContent } from "@/components/ui/cta-card"
import { BentoGrid, BentoCard, BentoCardHeader, BentoCardTitle, BentoCardContent } from "@/components/ui/bento-grid"
import Preloader from "@/components/ui/preloader"

export default function WorkshopsPage() {
  const [showPreloader, setShowPreloader] = useState(true)
  const [workshops, setWorkshops] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showCreateModal, setShowCreateModal] = useState(false)

  const loadWorkshops = async () => {
    setLoading(true)
    const response = await getWorkshops()
    
    if (response.success && response.data) {
      setWorkshops(response.data.workshops)
    } else {
      toast.error("Failed to load workshops")
    }
    
    setLoading(false)
  }

  useEffect(() => {
    loadWorkshops()
  }, [])

  const handlePreloaderComplete = useCallback(() => {
    setShowPreloader(false)
  }, [])

  if (showPreloader) {
    return (
      <div className="relative w-full h-screen">
        <Preloader onComplete={handlePreloaderComplete} />
      </div>
    )
  }

  const filteredWorkshops = workshops.filter(w => {
    const matchesSearch = w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || w.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const upcomingWorkshops = filteredWorkshops.filter(w => 
    w.status === "upcoming" || w.status === "registration_open"
  )
  const ongoingWorkshops = filteredWorkshops.filter(w => w.status === "ongoing")
  const completedWorkshops = filteredWorkshops.filter(w => w.status === "completed")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "secondary"
      case "ongoing": return "default"
      case "registration_open": return "default"
      case "upcoming": return "outline"
      default: return "outline"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workshops & Seminars</h1>
          <p className="text-muted-foreground">
            Manage all workshops and educational sessions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadWorkshops}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Link href="/core/workshops/manual">
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Manual Entry
            </Button>
          </Link>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Workshop
          </Button>
        </div>
      </div>

      {/* Stats Cards - Bento Grid */}
      <BentoGrid>
        <BentoCard delay={0}>
          <BentoCardHeader>
            <BentoCardTitle className="text-sm font-medium">Total Workshops</BentoCardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </BentoCardHeader>
          <BentoCardContent>
            <div className="text-2xl font-bold">{workshops.length}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </BentoCardContent>
        </BentoCard>

        <BentoCard delay={0.05}>
          <BentoCardHeader>
            <BentoCardTitle className="text-sm font-medium">Upcoming</BentoCardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </BentoCardHeader>
          <BentoCardContent>
            <div className="text-2xl font-bold">
              {workshops.filter(w => w.status === "upcoming" || w.status === "registration_open").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Scheduled</p>
          </BentoCardContent>
        </BentoCard>

        <BentoCard delay={0.1}>
          <BentoCardHeader>
            <BentoCardTitle className="text-sm font-medium">Ongoing</BentoCardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </BentoCardHeader>
          <BentoCardContent>
            <div className="text-2xl font-bold">
              {workshops.filter(w => w.status === "ongoing").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">In progress</p>
          </BentoCardContent>
        </BentoCard>

        <BentoCard delay={0.15}>
          <BentoCardHeader>
            <BentoCardTitle className="text-sm font-medium">Completed</BentoCardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </BentoCardHeader>
          <BentoCardContent>
            <div className="text-2xl font-bold">
              {workshops.filter(w => w.status === "completed").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Finished</p>
          </BentoCardContent>
        </BentoCard>
      </BentoGrid>

      {/* Modern Search Bar */}
      <CtaCard variant="accent">
        <CtaCardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search workshops by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-12 text-base"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-background border border-border rounded-lg h-12 min-w-[180px]"
            >
              <option value="all">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="registration_open">Registration Open</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          {searchQuery && (
            <p className="text-sm text-muted-foreground mt-2">
              Found {filteredWorkshops.length} workshop(s) matching "{searchQuery}"
            </p>
          )}
        </CtaCardContent>
      </CtaCard>

      {/* Upcoming & Registration Open Workshops */}
      {upcomingWorkshops.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Upcoming Workshops</h2>
            <Badge variant="secondary">{upcomingWorkshops.length}</Badge>
          </div>
          <MorphingCardStack
            cards={upcomingWorkshops.map((w: any) => ({
              id: w.id,
              title: w.title,
              description: w.description || "",
              content: <WorkshopCardCore workshop={w} />
            }))}
            defaultLayout="grid"
          />
        </div>
      )}

      {/* Ongoing Workshops */}
      {ongoingWorkshops.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-green-500" />
            <h2 className="text-xl font-semibold">Ongoing Workshops</h2>
            <Badge variant="default">{ongoingWorkshops.length}</Badge>
          </div>
          <MorphingCardStack
            cards={ongoingWorkshops.map((w: any) => ({
              id: w.id,
              title: w.title,
              description: w.description || "",
              content: <WorkshopCardCore workshop={w} />
            }))}
            defaultLayout="grid"
          />
        </div>
      )}

      {/* Completed Workshops */}
      {completedWorkshops.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Completed Workshops</h2>
            <Badge variant="secondary">{completedWorkshops.length}</Badge>
          </div>
          <MorphingCardStack
            cards={completedWorkshops.map((w: any) => ({
              id: w.id,
              title: w.title,
              description: w.description || "",
              content: <WorkshopCardCore workshop={w} />
            }))}
            defaultLayout="list"
          />
        </div>
      )}

      {/* Empty State */}
      {filteredWorkshops.length === 0 && !loading && (
        <CtaCard>
          <CtaCardContent className="text-center py-12">
            <GraduationCap className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No workshops found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by creating your first workshop"}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Workshop
              </Button>
            )}
          </CtaCardContent>
        </CtaCard>
      )}

      {/* Create Workshop Modal */}
      <CreateWorkshopModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadWorkshops}
      />
    </div>
  )
}